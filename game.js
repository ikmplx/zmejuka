const canvas = document.querySelector("#board");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestElement = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const message = document.querySelector("#message");
const submessage = document.querySelector("#submessage");
const pauseButton = document.querySelector("#pause");

const GRID_SIZE = 20;
const CELL_SIZE = 30;
const INITIAL_TICK_INTERVAL_MS = 1000 / 3;
const APPLES_PER_SPEED_INCREASE = 3;
const SPEED_MULTIPLIER = 1.1;

let snake;
let direction;
let directionQueue;
let food;
let score = 0;
let best = 0;
let state = "ready";
let timer;
try {
  best = Number(localStorage.getItem("snake-best")) || 0;
} catch {
  // The game remains playable if browser storage is unavailable.
}
function updateScores() {
  scoreElement.textContent = String(score).padStart(2, "0");
  bestElement.textContent = String(best).padStart(2, "0");
}
function placeFood() {
  const freeCells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        freeCells.push({ x, y });
      }
    }
  }
  return freeCells.length
    ? freeCells[Math.floor(Math.random() * freeCells.length)]
    : null;
}
function reset() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  directionQueue = [];
  score = 0;
  food = placeFood();
  updateScores();
  draw();
}
function draw() {
  context.fillStyle = "#20392b";
  context.fillRect(0, 0, 600, 600);
  context.strokeStyle = "#294434";
  context.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    context.beginPath();
    context.moveTo(i * CELL_SIZE, 0);
    context.lineTo(i * CELL_SIZE, 600);
    context.moveTo(0, i * CELL_SIZE);
    context.lineTo(600, i * CELL_SIZE);
    context.stroke();
  }
  if (food) {
    context.fillStyle = "#f4b978";
    context.beginPath();
    context.arc(
      food.x * CELL_SIZE + 15,
      food.y * CELL_SIZE + 15,
      10,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.fillStyle = "#9acb79";
    context.fillRect(food.x * CELL_SIZE + 15, food.y * CELL_SIZE + 2, 4, 6);
  }
  snake.forEach((p, i) => {
    context.fillStyle = i ? "#9bcf78" : "#c2e79e";
    context.beginPath();
    context.roundRect(p.x * CELL_SIZE + 2, p.y * CELL_SIZE + 2, 26, 26, 7);
    context.fill();
    if (!i) {
      context.fillStyle = "#24422b";
      context.beginPath();
      context.arc(
        p.x * CELL_SIZE + 15 + direction.x * 6 + (direction.y ? 5 : 0),
        p.y * CELL_SIZE + 15 + direction.y * 6 + (direction.x ? 5 : 0),
        2,
        0,
        7,
      );
      context.arc(
        p.x * CELL_SIZE + 15 + direction.x * 6 - (direction.y ? 5 : 0),
        p.y * CELL_SIZE + 15 + direction.y * 6 - (direction.x ? 5 : 0),
        2,
        0,
        7,
      );
      context.fill();
    }
  });
}
function showOverlay(title, text) {
  message.textContent = title;
  submessage.textContent = text;
  overlay.classList.remove("hidden");
}
function restartTimer() {
  clearInterval(timer);
  const speedLevel = Math.floor(score / APPLES_PER_SPEED_INCREASE);
  const interval = INITIAL_TICK_INTERVAL_MS / SPEED_MULTIPLIER ** speedLevel;
  timer = setInterval(advanceGame, interval);
}
function startGame() {
  clearInterval(timer);
  reset();
  state = "playing";
  overlay.classList.add("hidden");
  pauseButton.textContent = "Пауза";
  restartTimer();
}
function finishGame(won = false) {
  clearInterval(timer);
  state = "over";
  showOverlay(
    won ? "Победа!" : "Игра окончена",
    "Коснись экрана, чтобы играть снова",
  );
}
function advanceGame() {
  if (directionQueue.length > 0) {
    direction = directionQueue.shift();
  }
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y },
    isEating = food && head.x === food.x && head.y === food.y;
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= GRID_SIZE ||
    head.y >= GRID_SIZE ||
    snake
      .slice(0, isEating ? undefined : -1)
      .some((p) => p.x === head.x && p.y === head.y)
  ) {
    finishGame();
    return;
  }
  snake.unshift(head);
  if (isEating) {
    score++;
    if (score > best) {
      best = score;
      try {
        localStorage.setItem("snake-best", best);
      } catch {
        // Keep the record in memory for the current session.
      }
    }
    updateScores();
    food = placeFood();
    if (!food) {
      draw();
      finishGame(true);
      return;
    }
    if (score % APPLES_PER_SPEED_INCREASE === 0) {
      restartTimer();
    }
  } else {
    snake.pop();
  }
  draw();
}
function turn(x, y) {
  if (state !== "playing") return;
  const previousDirection = directionQueue.at(-1) ?? direction;
  if (x === previousDirection.x && y === previousDirection.y) return;
  if (x === -previousDirection.x && y === -previousDirection.y) return;
  directionQueue.push({ x, y });
}
function togglePause() {
  if (state === "playing") {
    clearInterval(timer);
    state = "paused";
    showOverlay("Пауза", "Передохни немного");
    pauseButton.textContent = "Продолжить";
  } else if (state === "paused") {
    state = "playing";
    overlay.classList.add("hidden");
    pauseButton.textContent = "Пауза";
    restartTimer();
  }
}
pauseButton.addEventListener("click", togglePause);
const keyDirections = {
  ArrowUp: [0, -1],
  w: [0, -1],
  ц: [0, -1],
  ArrowDown: [0, 1],
  s: [0, 1],
  ы: [0, 1],
  ArrowLeft: [-1, 0],
  a: [-1, 0],
  ф: [-1, 0],
  ArrowRight: [1, 0],
  d: [1, 0],
  в: [1, 0],
};
document.addEventListener("keydown", (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (keyDirections[k]) {
    e.preventDefault();
    if (state === "ready" || state === "over") {
      startGame();
    }
    turn(...keyDirections[k]);
  } else if (e.code === "Space") {
    e.preventDefault();
    if (state === "ready" || state === "over") {
      startGame();
    } else {
      togglePause();
    }
  }
});
document.addEventListener("pointerdown", (event) => {
  if ((state === "ready" || state === "over") && !pauseButton.contains(event.target)) {
    startGame();
  }
});
canvas.addEventListener("pointerdown", (event) => {
  const bounds = canvas.getBoundingClientRect();
  const headX = bounds.left + ((snake[0].x + 0.5) / GRID_SIZE) * bounds.width;
  const headY = bounds.top + ((snake[0].y + 0.5) / GRID_SIZE) * bounds.height;
  const deltaX = event.clientX - headX;
  const deltaY = event.clientY - headY;

  if (deltaX === 0 && deltaY === 0) return;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    turn(Math.sign(deltaX), 0);
  } else {
    turn(0, Math.sign(deltaY));
  }
});
reset();
