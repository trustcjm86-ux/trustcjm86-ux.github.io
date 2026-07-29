const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.addEventListener('click', (event) => {
    if (event.target.matches('a')) {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const canvas = document.querySelector('#game-canvas');
const startButton = document.querySelector('#start-game');
const pauseButton = document.querySelector('#pause-game');
const restartButton = document.querySelector('#restart-game');
const scoreElement = document.querySelector('#score');
const highScoreElement = document.querySelector('#high-score');
const statusElement = document.querySelector('#game-status');
const directionButtons = document.querySelectorAll('[data-direction]');

if (canvas && startButton && pauseButton && restartButton && scoreElement && highScoreElement && statusElement) {
  const context = canvas.getContext('2d');
  const gridSize = 20;
  const cellSize = canvas.width / gridSize;
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  let snake;
  let food;
  let direction;
  let pendingDirection;
  let score;
  let highScore = readHighScore();
  let timerId = null;
  let isPaused = false;
  let isGameOver = false;

  function readHighScore() {
    try {
      return Number.parseInt(window.localStorage.getItem('snake-high-score') || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore() {
    try {
      window.localStorage.setItem('snake-high-score', String(highScore));
    } catch {
      // Storage is optional; the current score remains available in memory.
    }
  }

  function setStatus(message) {
    statusElement.textContent = message;
  }

  function resetGame() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = directions.right;
    pendingDirection = direction;
    score = 0;
    isPaused = false;
    isGameOver = false;
    scoreElement.textContent = String(score);
    highScoreElement.textContent = String(highScore);
    pauseButton.textContent = '일시정지';
    pauseButton.disabled = false;
    placeFood();
    draw();
  }

  function placeFood() {
    const openCells = [];
    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        if (!snake.some((segment) => segment.x === x && segment.y === y)) {
          openCells.push({ x, y });
        }
      }
    }
    food = openCells[Math.floor(Math.random() * openCells.length)];
  }

  function draw() {
    context.fillStyle = '#08100a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ff7b72';
    context.fillRect(food.x * cellSize, food.y * cellSize, cellSize, cellSize);
    snake.forEach((segment, index) => {
      context.fillStyle = index === 0 ? '#7ee787' : '#3fb950';
      context.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
  }

  function isOpposite(nextDirection) {
    return nextDirection.x + direction.x === 0 && nextDirection.y + direction.y === 0;
  }

  function requestDirection(name) {
    const nextDirection = directions[name];
    if (!nextDirection || isOpposite(nextDirection)) {
      return;
    }
    pendingDirection = nextDirection;
  }

  function tick() {
    direction = pendingDirection;
    const head = snake[0];
    const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
    const hitWall = nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize;
    const hitSelf = snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
    if (hitWall || hitSelf) {
      endGame();
      return;
    }

    snake.unshift(nextHead);
    if (nextHead.x === food.x && nextHead.y === food.y) {
      score += 10;
      highScore = Math.max(highScore, score);
      scoreElement.textContent = String(score);
      highScoreElement.textContent = String(highScore);
      saveHighScore();
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function startGame() {
    if (timerId !== null) {
      return;
    }
    if (isGameOver) {
      resetGame();
    }
    isPaused = false;
    pauseButton.disabled = false;
    pauseButton.textContent = '일시정지';
    setStatus('진행 중');
    timerId = window.setInterval(tick, 140);
  }

  function togglePause() {
    if (timerId === null || isGameOver) {
      return;
    }
    isPaused = !isPaused;
    if (isPaused) {
      window.clearInterval(timerId);
      timerId = null;
      pauseButton.textContent = '계속하기';
      setStatus('일시정지');
    } else {
      pauseButton.textContent = '일시정지';
      setStatus('진행 중');
      timerId = window.setInterval(tick, 140);
    }
  }

  function endGame() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    isGameOver = true;
    isPaused = false;
    pauseButton.disabled = true;
    setStatus('게임 오버');
  }

  function restartGame() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    resetGame();
    pauseButton.disabled = false;
    setStatus('시작 전');
  }

  window.addEventListener('keydown', (event) => {
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    const name = keyMap[event.key];
    if (name) {
      event.preventDefault();
      requestDirection(name);
    }
    if (event.key === ' ') {
      event.preventDefault();
      togglePause();
    }
  });

  directionButtons.forEach((button) => {
    button.addEventListener('click', () => requestDirection(button.dataset.direction));
  });
  startButton.addEventListener('click', startGame);
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', restartGame);

  resetGame();
  setStatus('시작 전');
}
