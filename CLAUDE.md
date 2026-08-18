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
- HTTPS: a Let's Encrypt cert is issued and working for the custom domain. "Enforce HTTPS" (repo Settings → Pages) is being turned on by Gabe manually — once it's on, all `http://` requests redirect to `https://`.

## Site structure

- `index.html` — the whole page (currently: the Snake game). Includes favicon links and Open Graph / Twitter Card meta tags. Loads `snake.js` with a `?v=N` cache-busting query string — **bump this number any time `snake.js` changes**. Without it, returning visitors' browsers can keep serving a stale cached copy of the JS against the new HTML, causing mismatched-version bugs (this happened once: an old cached JS referenced a removed leaderboard input field and threw mid-`init()`, leaving the board blank after clicking Start).
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
- The global keydown handler skips movement keys when `e.target.tagName === "INPUT"` — defensive leftover from when there was a name-entry field (see Leaderboard history below); harmless to keep, no INPUT elements exist on the page currently.
- Start screen requires clicking "Start Game" (doesn't auto-start on load). Shows a preview of both faces.
- Score + best score (best persisted in `localStorage`, per-device only). Speed ramps up slightly as score increases; mobile starts and caps slightly slower than desktop.

## Leaderboard — tried and removed, don't re-attempt the same approach

A shared high-score leaderboard was built using **dreamlo.com** (a free, no-account API for arcade-style leaderboards) and shipped briefly, then **removed** after proving unreliable. Context so this isn't re-attempted the same way:

- dreamlo's free tier only serves plain `http://`, not `https://` (confirmed by testing — the `https://` version of their endpoints returns `"ERROR:SSL not enabled for this leaderboard."` with a `200` status, so status code alone is misleading). Since gabepierce.com is HTTPS, calling `http://dreamlo.com` directly was blocked by browsers as mixed content.
- Worked around that by routing calls through `https://api.allorigins.win/get?url=...`, a free public CORS/HTTPS proxy. This worked in initial testing (both read and write), but **the proxy itself turned out to be unreliable** — it started intermittently returning Cloudflare `520`/`522` errors within the same day, breaking score submission and leaderboard viewing for the user with no code-level fix available (it's third-party infra we don't control).
- Rather than depend on a flaky free proxy (or pay dreamlo ~$5 for real SSL just to remove the proxy layer), the whole feature was pulled out. All leaderboard UI (score name-entry field, submit button, "View Leaderboard" buttons/modal) and JS (dreamlo calls, proxy wrapper) were removed from `index.html` and `snake.js`.
- **If a leaderboard is wanted again**, don't just re-add the same dreamlo+allorigins combo expecting it to hold up — either pay for dreamlo's SSL upfront (removes the proxy dependency entirely), pick a different backend with native HTTPS support (Firebase/Supabase — more setup but far more reliable), or accept a `localStorage`-only per-device leaderboard (no setup, but not shared across visitors).
- The dreamlo keys that were in use (public `6a8407818f40bb13506aaddf`, private `PFnobKwHlkeGIYXbaTkgmgDuRmmyqOaEabai_kAEXpKw`) still exist and still work if the dreamlo route is ever revisited — no need to regenerate them.

## Things intentionally decided against

- **Firebase/Supabase for the leaderboard** — real backends, more setup (account, project, security rules) than felt worth it at the time. Went with dreamlo instead, which then had to be removed (see above).
- **True background removal ("cutout") on the face photos** — no lightweight tool available for that (`rembg` needs a big ML model download). Used square-crop + circular canvas/CSS clipping instead, which achieves basically the same visual effect without the complexity.
- **On-screen D-pad for mobile** — replaced with swipe-only controls (see Game details above).
