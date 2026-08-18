const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const isMobile = window.matchMedia("(pointer: coarse)").matches;
const CELL = isMobile ? 70 : 50;
const COLS = isMobile ? 6 : 16;
const ROWS = isMobile ? 9 : 16;
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;
const MOVE_MS_START = 160;
const MOVE_MS_MIN = 90;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMsg = document.getElementById("overlay-msg");
const restartBtn = document.getElementById("restart-btn");
const startOverlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");

const faceImg = new Image();
faceImg.src = "assets/gabe.jpg";
let faceLoaded = false;
faceImg.onload = () => (faceLoaded = true);

const foodImg = new Image();
foodImg.src = "assets/lea.jpg";
let foodLoaded = false;
foodImg.onload = () => (foodLoaded = true);

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

let snake, direction, nextDirection, food, score, best, moveMs, timer, running;

function init() {
  const startX = Math.max(2, Math.floor(COLS / 2));
  const startY = Math.floor(ROWS / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = direction;
  score = 0;
  moveMs = MOVE_MS_START;
  best = Number(localStorage.getItem("snakeBest") || 0);
  scoreEl.textContent = score;
  bestEl.textContent = best;
  placeFood();
  overlay.classList.remove("show");
  running = true;
  clearInterval(timer);
  timer = setInterval(tick, moveMs);
  draw();
}

function placeFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function tick() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (
    head.x < 0 ||
    head.x >= COLS ||
    head.y < 0 ||
    head.y >= ROWS ||
    snake.some((s) => s.x === head.x && s.y === head.y)
  ) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreEl.textContent = score;
    placeFood();
    if (moveMs > MOVE_MS_MIN) {
      moveMs = Math.max(MOVE_MS_MIN, moveMs - 3);
      clearInterval(timer);
      timer = setInterval(tick, moveMs);
    }
  } else {
    snake.pop();
  }

  draw();
}

function gameOver() {
  running = false;
  clearInterval(timer);
  if (score > best) {
    best = score;
    localStorage.setItem("snakeBest", String(best));
    bestEl.textContent = best;
    overlayTitle.textContent = "New Best Score! 🎉";
  } else {
    overlayTitle.textContent = "Game Over";
  }
  overlayMsg.textContent = `You caught Lea ${score} time${score === 1 ? "" : "s"}.`;
  overlay.classList.add("show");
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // food
  const fcx = food.x * CELL + CELL / 2;
  const fcy = food.y * CELL + CELL / 2;
  const fr = CELL / 2 - 1;

  ctx.save();
  ctx.beginPath();
  ctx.arc(fcx, fcy, fr, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (foodLoaded) {
    ctx.drawImage(foodImg, fcx - fr, fcy - fr, fr * 2, fr * 2);
  } else {
    ctx.fillStyle = "#e63946";
    ctx.fillRect(fcx - fr, fcy - fr, fr * 2, fr * 2);
  }
  ctx.restore();

  // body
  for (let i = snake.length - 1; i >= 1; i--) {
    const seg = snake[i];
    const t = i / snake.length;
    ctx.fillStyle = `hsl(${140 - t * 40}, 65%, ${45 - t * 10}%)`;
    const pad = 2;
    ctx.beginPath();
    ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 6);
    ctx.fill();
  }

  // head
  const head = snake[0];
  const cx = head.x * CELL + CELL / 2;
  const cy = head.y * CELL + CELL / 2;
  const r = CELL / 2 - 1;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (faceLoaded) {
    ctx.save();
    ctx.translate(cx, cy);
    if (direction.x < 0) ctx.scale(-1, 1);
    ctx.drawImage(faceImg, -r, -r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#ffb703";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
}

function setDirection(dir) {
  if (!running) return;
  // prevent reversing directly into yourself
  if (dir.x === -direction.x && dir.y === -direction.y) return;
  nextDirection = dir;
}

window.addEventListener("keydown", (e) => {
  const dir = DIRS[e.key];
  if (!dir) return;
  e.preventDefault();
  setDirection(dir);
});

restartBtn.addEventListener("click", init);
startBtn.addEventListener("click", () => {
  startOverlay.classList.add("hide");
  init();
});

// swipe gestures
let touchStart = null;
canvas.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  },
  { passive: true }
);

canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);

canvas.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
  } else {
    setDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
  }
});
