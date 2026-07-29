const translations = {
  ko: {
    title: '최종민 | 프로페셔널 포트폴리오', navLabel: '주요 메뉴', languageLabel: '언어 선택', canvasLabel: '지렁이 게임판', menu: '메뉴', about: '소개', experience: '경력', research: '연구', contact: '연락처', games: '게임',
    heroEyebrow: '프로페셔널 포트폴리오', heroTitle: '제품 경험을 만드는 엔지니어', heroCopy: '최종민 · 삼성 mobile hotspot 개발', heroCta: '경험 보기',
    aboutTitle: '기술과 사용자 경험', aboutText: '제품 문제를 이해하고 명확한 경험으로 연결합니다.', experienceTitle: '경험', mobileTitle: 'Mobile Hotspot', mobileText: '연결성과 사용성을 중심으로 제품을 개발합니다.',
    moreTitle: '추가 정보', moreText: '[사람 확인 필요] 경력과 기술 정보', researchTitle: '연구', researchText: '[사람 확인 필요] 연구·프로젝트 내용', contactTitle: '연락처', contactText: '[사람 확인 필요] 연락처 또는 소셜 링크',
    gamesTitle: '작은 실험 공간', gamesText: '키보드와 모바일 터치로 즐기는 지렁이 게임입니다.', score: '점수', highScore: '최고 점수', start: '시작', pause: '일시정지', resume: '계속하기', restart: '재시작',
    gameHelp: '방향키 또는 WASD로 이동하세요. 모바일에서는 방향 버튼을 사용합니다.', dirUp: '위로 이동', dirLeft: '왼쪽으로 이동', dirDown: '아래로 이동', dirRight: '오른쪽으로 이동', footer: '© 2026 최종민',
    status: { ready: '시작 전', running: '진행 중', paused: '일시정지', over: '게임 오버' },
  },
  en: {
    title: '최종민 | Professional Portfolio', navLabel: 'Main navigation', languageLabel: 'Language selection', canvasLabel: 'Snake game board', menu: 'Menu', about: 'About', experience: 'Experience', research: 'Research', contact: 'Contact', games: 'Games',
    heroEyebrow: 'Professional Portfolio', heroTitle: 'An engineer building product experiences', heroCopy: '최종민 · Mobile hotspot development at Samsung', heroCta: 'View experience',
    aboutTitle: 'Technology and user experience', aboutText: 'Understanding product problems and connecting them to clear experiences.', experienceTitle: 'Experience', mobileTitle: 'Mobile Hotspot', mobileText: 'Product development focused on connectivity and usability.',
    moreTitle: 'More information', moreText: '[Human confirmation required] Career and technical information', researchTitle: 'Research', researchText: '[Human confirmation required] Research and project details', contactTitle: 'Contact', contactText: '[Human confirmation required] Contact or social links',
    gamesTitle: 'A small space for experiments', gamesText: 'A snake game controlled by keyboard and mobile touch.', score: 'Score', highScore: 'High score', start: 'Start', pause: 'Pause', resume: 'Resume', restart: 'Restart',
    gameHelp: 'Use the arrow keys or WASD to move. On mobile, use the direction buttons.', dirUp: 'Move up', dirLeft: 'Move left', dirDown: 'Move down', dirRight: 'Move right', footer: '© 2026 최종민',
    status: { ready: 'Ready', running: 'Running', paused: 'Paused', over: 'Game over' },
  },
};
let currentLanguage = 'ko';
let currentStatusKey = 'ready';
let updateStatusText = () => {};
let updateGameControlsText = () => {};

function translated(key) {
  return key.split('.').reduce((value, part) => value?.[part], translations[currentLanguage]) || key;
}

function applyLanguage(language) {
  currentLanguage = translations[language] ? language : 'ko';
  document.documentElement.lang = currentLanguage;
  document.title = translations[currentLanguage].title;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = translated(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', translated(element.dataset.i18nAria));
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === currentLanguage));
  });
  updateStatusText(currentStatusKey);
  updateGameControlsText();
}

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language));
});

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
    currentStatusKey = message;
    statusElement.textContent = translated(`status.${message}`);
    statusElement.classList.toggle('is-active', message === 'running');
    statusElement.classList.toggle('is-paused', message === 'paused');
    statusElement.classList.toggle('is-over', message === 'over');
  }

  updateStatusText = setStatus;
  updateGameControlsText = () => {
    pauseButton.textContent = translated(isPaused ? 'resume' : 'pause');
  };

  function resetGame() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = directions.right;
    pendingDirection = direction;
    score = 0;
    isPaused = false;
    isGameOver = false;
    scoreElement.textContent = String(score);
    highScoreElement.textContent = String(highScore);
    pauseButton.textContent = translated('pause');
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
    setStatus('running');
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
      pauseButton.textContent = translated('resume');
      setStatus('paused');
    } else {
      pauseButton.textContent = translated('pause');
      setStatus('running');
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
    setStatus('over');
  }

  function restartGame() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    resetGame();
    pauseButton.disabled = false;
    setStatus('ready');
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
  startButton.addEventListener('pointerup', startGame);
  pauseButton.addEventListener('pointerup', togglePause);
  restartButton.addEventListener('pointerup', restartGame);

  resetGame();
  setStatus('ready');
}

applyLanguage(currentLanguage);
