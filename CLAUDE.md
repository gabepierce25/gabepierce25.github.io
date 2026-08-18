# gabepierce.com

Personal site for Gabe Pierce, hosted on GitHub Pages. **Currently the whole site is a Snake game** (`index.html` *is* the game — there's no separate homepage). This won't always be the case; the site may grow beyond the game later, so don't assume the game is permanent when making changes.

> **Keep this file updated.** Whenever a future session makes a meaningful change to the site (features, deploy setup, DNS, third-party services, etc.), update the relevant section below before finishing.

## Repo / deploy

- Local path: `/Users/gabepierce/Developer/gabepierce25.github.io`
- GitHub repo: `gabepierce25/gabepierce25.github.io` (this is a GitHub user-pages repo, so the repo name must stay exactly `<username>.github.io`). It was originally created as `gabepierce.github.io` and got renamed — the git remote here is already updated to the new URL, no action needed.
- Hosting: GitHub Pages, deployed straight from the `main` branch root (no build step, plain static files).
- Push workflow: `git add -A` → check `git status` for anything unexpected (a `.gitignore` already excludes `.DS_Store`) → commit → `git pull origin main --rebase` → `git push origin main`. Pages usually redeploys within 30-90s; confirm with `curl -s https://www.gabepierce.com | grep <something-new>` before telling the user it's live.
- Local testing: no build needed. `cd` into the repo and run `python3 -m http.server 8765`, then visit `http://localhost:8765/`.

## Domain / DNS — read before touching any of this

The domain `gabepierce.com` is registered with **Squarespace**, not GitHub or a "normal" DNS host. This caused a real headache — full context so nobody re-breaks it:

- DNS records (managed in Squarespace's DNS panel) are the standard GitHub Pages setup: four `A` records on `@` pointing to GitHub's IPs (`185.199.108-111.153`), and a `CNAME` on `www` pointing to `gabepierce25.github.io`.
- There used to be a Squarespace *website* ("Gabe Pierce") connected to this domain. That subscription is **canceled**, but Squarespace has a platform bug/limitation: you cannot fully disconnect a canceled site from a domain via their UI, and you can't delete the site while a domain is attached to it. Support could probably fix this manually, but we found a workaround instead.
- **The workaround (currently live, and load-bearing — don't undo it without understanding why):** Squarespace's servers still intercept requests to the bare apex domain (`gabepierce.com`) and 301-redirect to `https://www.gabepierce.com/`. Rather than fight that, the site's GitHub Pages `CNAME` file is set to `www.gabepierce.com` (**not** the apex). So: `gabepierce.com` → Squarespace redirect → `www.gabepierce.com` → GitHub Pages. Both URLs work correctly as a result.
- **If this ever breaks again** (e.g. Squarespace finally fully removes the connection and the apex redirect disappears, or starts behaving differently): `www.gabepierce.com` should still work regardless since that part doesn't depend on Squarespace at all. Diagnose with `curl -sIL https://gabepierce.com` and `curl -sIL https://www.gabepierce.com` and trace where the redirect chain breaks.
- HTTPS: a Let's Encrypt cert is issued and working for the custom domain. GitHub's "Enforce HTTPS" checkbox was still greyed out as of the last check (repo Settings → Pages) — worth rechecking occasionally and enabling once available, since right now plain `http://` requests are served without a redirect to HTTPS.

## Site structure

- `index.html` — the whole page (currently: the Snake game). Includes favicon links and Open Graph / Twitter Card meta tags.
- `snake.js` — all game logic.
- `assets/`
  - `gabe.jpg` — Gabe's face, square-cropped, used as the snake's head (circle-clipped in canvas) and in favicons/OG image.
  - `lea.jpg` — Lea's face, square-cropped, used as the food the snake eats (circle-clipped in canvas).
  - `favicon-16.png`, `favicon-32.png` — circular transparent-background crops of `gabe.jpg`, browser tab icon.
  - `apple-touch-icon.png` — square (no transparency, per Apple's guidance — iOS applies its own mask) crop of `gabe.jpg`.
  - `og-image.jpg` (1200×630) — link-preview image for iMessage/Slack/etc: Gabe's face + "gabepierce.com" text on the site's dark background. Regenerated with a small Python/Pillow script (not checked in) if it ever needs updating — same technique: `PIL.Image`, circular mask via `ImageDraw.ellipse`, composited onto a `#1a1a2e` background.
- `CNAME` — contains `www.gabepierce.com` (see DNS section above for why it's `www` not the apex).
- `.gitignore` — excludes `.DS_Store`.

## Game details

- Canvas-based, no dependencies/build step.
- Desktop: 16×16 grid, 50px cells, 800×800 square board.
- Mobile (`pointer: coarse` media query, checked in both CSS and JS via `matchMedia`): 8×12 grid, 60px cells, 480×720 portrait board — deliberately shaped and sized differently from desktop, tuned down a couple times from an initial "too zoomed in" 6×9 grid.
- Mobile controls: swipe gestures on the canvas only (an on-screen D-pad was tried and removed — it only responded once a game was already running, felt broken, and ate screen space). Desktop: arrow keys or WASD.
- Known fixed bug: the global keydown handler used to call `preventDefault()` on WASD regardless of focus, which blocked typing "w/a/s/d" into the leaderboard name field. Fixed by skipping the handler when `e.target.tagName === "INPUT"`.
- Start screen requires clicking "Start Game" (doesn't auto-start on load). Shows a preview of both faces.
- Score + best score (best persisted in `localStorage`, per-device only). Speed ramps up slightly as score increases; mobile starts and caps slightly slower than desktop.

## Leaderboard (dreamlo)

Shared global high-score leaderboard via **dreamlo.com** — a free, no-account API built for exactly this (arcade-style leaderboards).

- Public key (read leaderboard): `6a8407818f40bb13506aaddf`
- Private key (add/delete scores): `PFnobKwHlkeGIYXbaTkgmgDuRmmyqOaEabai_kAEXpKw`
- **These keys live directly in `snake.js` (client-side, publicly visible via View Source) because there is no backend to hide them behind — that's inherent to a static GitHub Pages site, not an oversight.** Anyone could theoretically use the private key to post fake scores or wipe the board (`.../clear`). Acceptable risk for a fun personal project; not worth standing up a real backend to fix unless it actually becomes a problem.
- **Important gotcha:** dreamlo's free tier only serves plain `http://`, not `https://` (confirmed by testing — the `https://` version of both the `/add` and `/json` endpoints returns `"ERROR:SSL not enabled for this leaderboard."` with a `200` status, so don't be fooled by the status code alone). Since gabepierce.com is HTTPS-only, calling `http://dreamlo.com` directly gets blocked by browsers as mixed content.
- **Fix in place:** all dreamlo calls are routed through `https://api.allorigins.win/get?url=<encoded dreamlo url>`, a free public CORS/HTTPS proxy. Use the `/get` endpoint, not `/raw` — `/raw` returned server errors (522) during testing. `/get` wraps the real response in `{"contents": "...", "status": {...}}`, so the actual dreamlo payload needs an extra unwrap/parse step (already handled in `snake.js`'s `dreamloProxyFetch`).
- This adds noticeable latency (~5-7s per leaderboard read/write) since it's a round-trip through a third-party proxy. There's a 15s client-side timeout (`fetchWithTimeout`) so the UI fails gracefully instead of hanging forever.
- **If allorigins.win ever goes down**, the leaderboard will stop working (rest of the game is unaffected). Options at that point: swap in a different CORS proxy, or pay dreamlo's one-time fee (~$5, per their site) to enable real SSL on the leaderboard and drop the proxy entirely.

## Things intentionally decided against

- **Firebase/Supabase for the leaderboard** — real backends, more setup (account, project, security rules) than this project needs. Went with dreamlo instead.
- **True background removal ("cutout") on the face photos** — no lightweight tool available for that (`rembg` needs a big ML model download). Used square-crop + circular canvas/CSS clipping instead, which achieves basically the same visual effect without the complexity.
- **On-screen D-pad for mobile** — replaced with swipe-only controls (see Game details above).
