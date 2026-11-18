
// CHEMISTRY ADVENTURE 3D

const stages = [
  {
    name: "Kristall laboratoriyasi",
    description: "Birinchi laboratoriyadan chiqish yo‘lini toping.",
    time: 90,
    crystals: [
      { x: 3, y: 1, symbol: "H", name: "Vodorod" },
      { x: 6, y: 3, symbol: "O", name: "Kislorod" },
      { x: 2, y: 5, symbol: "C", name: "Uglerod" }
    ],
    quiz: {
      question: "Suvning kimyoviy formulasi qaysi?",
      options: ["CO₂", "H₂O", "NaCl", "O₂"],
      answer: "H₂O"
    },
    map: [
      "#########",
      "#.......#",
      "#.#.#...#",
      "#.......#",
      "#...#...#",
      "#.......#",
      "#########"
    ]
  },
  {
    name: "Molekulalar g‘ori",
    description: "G‘ordagi kerakli elementlarni yig‘ing.",
    time: 85,
    crystals: [
      { x: 2, y: 1, symbol: "Na", name: "Natriy" },
      { x: 6, y: 2, symbol: "Cl", name: "Xlor" },
      { x: 4, y: 5, symbol: "Mg", name: "Magniy" }
    ],
    quiz: {
      question: "Osh tuzining formulasi qaysi?",
      options: ["H₂O", "CO₂", "NaCl", "NH₃"],
      answer: "NaCl"
    },
    map: [
      "#########",
      "#.......#",
      "#..#....#",
      "#.......#",
      "#....#..#",
      "#.......#",
      "#########"
    ]
  },
  {
    name: "Elementlar vodiysi",
    description: "Oxirgi sinovdan o‘tib, sarguzashtni yakunlang.",
    time: 80,
    crystals: [
      { x: 5, y: 1, symbol: "Ca", name: "Kalsiy" },
      { x: 2, y: 3, symbol: "Fe", name: "Temir" },
      { x: 6, y: 5, symbol: "S", name: "Oltingugurt" }
    ],
    quiz: {
      question: "Karbonat angidrid formulasi qaysi?",
      options: ["CO₂", "HCl", "CaO", "H₂"],
      answer: "CO₂"
    },
    map: [
      "#########",
      "#.......#",
      "#.#.....#",
      "#.......#",
      "#.....#.#",
      "#.......#",
      "#########"
    ]
  }
];

const TOTAL_STAGES = stages.length;
const PLAYER_START = { x: 1, y: 1 };
const PORTAL = { x: 7, y: 5 };

let stageIndex = 0;
let player = { ...PLAYER_START };
let collected = [];
let score = 0;
let timeLeft = 90;
let timer = null;
let soundOn = true;
let quizAnswered = false;
let stageFinished = false;
let gameEnded = false;
let audioContext = null;

let record = Number(localStorage.getItem("chemAdventureRecord")) || 0;

const $ = id => document.getElementById(id);

function currentStage() {
  return stages[stageIndex];
}

// Ovoz effektlari
function playSound(frequency = 500, duration = 0.12, type = "sine") {
  if (!soundOn) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Ovoz ishlamasa ham o‘yin davom etadi.
  }
}

function playCollectSound() {
  playSound(700, 0.1);
  setTimeout(() => playSound(1000, 0.13), 90);
}

function playWrongSound() {
  playSound(180, 0.2, "triangle");
}

// Rekord va ball
function updateStats() {
  if (score > record) {
    record = score;
    localStorage.setItem("chemAdventureRecord", record);
  }

  $("score").textContent = score;
  $("record").textContent = record;
}

// Xarita kataklarini yaratish
function renderBoard() {
  const board = $("gameBoard");
  const stage = currentStage();

  board.innerHTML = "";

  stage.map.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const tile = document.createElement("div");
      tile.className = "tile";

      if (cell === "#") {
        tile.classList.add("wall");
        tile.textContent = "🪨";
      } else {
        const isPlayer = player.x === x && player.y === y;
        const crystal = stage.crystals.find(
          item => item.x === x && item.y === y
        );
        const isCollected = collected.some(
          item => item.x === x && item.y === y
        );
        const isPortal = PORTAL.x === x && PORTAL.y === y;

        if (isPlayer) {
          tile.classList.add("player");
          const avatar = document.createElement("span");
          avatar.textContent = "🧑‍🚀";
          tile.appendChild(avatar);
        } else if (crystal && !isCollected) {
          tile.classList.add("crystal");
          tile.textContent = "💎";
          tile.title = crystal.name;
        } else if (isPortal) {
          tile.classList.add("portal");

          if (!quizAnswered) {
            tile.classList.add("locked");
            tile.textContent = "🔒";
          } else {
            tile.textContent = "🌀";
          }
        } else {
          tile.textContent = "";
        }
      }

      board.appendChild(tile);
    });
  });
}

// Vazifa va yig‘ilgan elementlar
function updateMission() {
  const stage = currentStage();
  const count = collected.length;
  const total = stage.crystals.length;

  $("collectionText").textContent = `${count} / ${total}`;
  $("progress").style.width = (count / total * 100) + "%";

  if (count < total) {
    $("worldStatus").textContent = "PORTAL YOPIQ 🔒";
    $("worldStatus").classList.remove("open");
    $("missionText").textContent =
      `${total - count} ta kristallni yana yig‘ing.`;
    $("missionHint").textContent =
      "Xaritada 💎 belgisi bilan ko‘rsatilgan elementlarni toping.";
  } else if (!quizAnswered) {
    $("worldStatus").textContent = "SAVOL KUTILMOQDA 🧠";
    $("worldStatus").classList.remove("open");
    $("missionText").textContent = "Barcha kristallar yig‘ildi!";
    $("missionHint").textContent =
      "Portalni ochish uchun kimyo savoliga javob bering.";
  } else {
    $("worldStatus").textContent = "PORTAL OCHILDI 🌀";
    $("worldStatus").classList.add("open");
    $("missionText").textContent = "Portal ochildi! Unga boring.";
    $("missionHint").textContent =
      "Xaritadagi 🌀 belgisiga yetib boring.";
  }

  if (collected.length === 0) {
    $("inventoryText").textContent = "Hali element yig‘ilmadi";
  } else {
    $("inventoryText").textContent = collected
      .map(item => `${item.symbol} — ${item.name}`)
      .join("  •  ");
  }
}

// Sahna ma’lumotlari
function updateStageInfo() {
  const stage = currentStage();

  $("levelTag").textContent = `${stageIndex + 1}-BOSQICH`;
  $("stageName").textContent = stage.name;
  $("stageDescription").textContent = stage.description;
}

// O‘yin xaritasidagi holatni yangilash
function updateWorld() {
  renderBoard();
  updateMission();
}

// Vaqt
function startTimer() {
  clearInterval(timer);

  timeLeft = currentStage().time;
  $("timer").textContent = timeLeft;
  $("timer").style.color = "#ffc857";

  timer = setInterval(() => {
    if (gameEnded || stageFinished) return;

    timeLeft--;
    $("timer").textContent = timeLeft;

    if (timeLeft <= 15) {
      $("timer").style.color = "#ff7777";
    }

    if (timeLeft <= 10 && timeLeft > 0) {
      playSound(280, 0.05, "square");
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      loseGame();
    }
  }, 1000);
}

// O‘yin boshlanishi
function startStage() {
  clearInterval(timer);

  player = { ...PLAYER_START };
  collected = [];
  quizAnswered = false;
  stageFinished = false;

  $("quizBox").classList.add("hidden");
  $("nextBtn").classList.add("hidden");
  $("message").classList.add("hidden");
  $("endScreen").classList.add("hidden");

  $("gameBoard").classList.remove("hidden");
  $("missionText").textContent = "Elementlarni yig‘ing!";
  $("missionHint").textContent = "Xaritada 💎 belgilarini toping.";

  updateStageInfo();
  updateWorld();
  startTimer();
}

// Harakatni tekshirish
function canMove(x, y) {
  const stage = currentStage();

  if (y < 0 || y >= stage.map.length) return false;
  if (x < 0 || x >= stage.map[y].length) return false;

  return stage.map[y][x] !== "#";
}

// Qahramon harakati
function movePlayer(direction) {
  if (gameEnded || stageFinished || !$("quizBox").classList.contains("hidden")) {
    return;
  }

  let newX = player.x;
  let newY = player.y;

  if (direction === "up") newY--;
  if (direction === "down") newY++;
  if (direction === "left") newX--;
  if (direction === "right") newX++;

  if (!canMove(newX, newY)) {
    playSound(130, 0.07, "square");
    return;
  }

  player.x = newX;
  player.y = newY;

  playSound(320, 0.04);

  checkCrystal();
  checkPortal();

  updateWorld();
}

// Kristall yig‘ish
function checkCrystal() {
  const crystal = currentStage().crystals.find(item =>
    item.x === player.x &&
    item.y === player.y &&
    !collected.some(
      saved => saved.x === item.x && saved.y === item.y
    )
  );

  if (!crystal) return;

  collected.push(crystal);
  score += 20;

  updateStats();
  playCollectSound();

  $("message").innerHTML =
    `💎 <b>${crystal.name}</b> elementi topildi! +20 ball`;
  $("message").classList.remove("hidden");

  updateMission();

  if (collected.length === currentStage().crystals.length) {
    setTimeout(showQuiz, 350);
  }
}

// Kimyo savoli
function showQuiz() {
  if (gameEnded || stageFinished) return;

  const quiz = currentStage().quiz;

  $("quizBox").classList.remove("hidden");
  $("quizQuestion").textContent = quiz.question;
  $("quizFeedback").textContent = "";

  const options = $("quizOptions");
  options.innerHTML = "";

  quiz.options.forEach(option => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.textContent = option;

    button.addEventListener("click", () => checkQuiz(option, button));

    options.appendChild(button);
  });

  $("quizBox").scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

// Javobni tekshirish
function checkQuiz(option, selectedButton) {
  if (quizAnswered) return;

  const quiz = currentStage().quiz;
  const buttons = document.querySelectorAll(".quiz-option");

  buttons.forEach(button => {
    button.disabled = true;

    if (button.textContent === quiz.answer) {
      button.classList.add("correct-answer");
    }
  });

  if (option === quiz.answer) {
    quizAnswered = true;
    score += 30;

    updateStats();
    playCollectSound();

    $("quizFeedback").textContent =
      "🎉 To‘g‘ri! +30 ball. Endi portalga boring!";

    $("message").innerHTML =
      "🌀 Portal ochildi! Xaritadagi portalga boring.";
    $("message").classList.remove("hidden");

    updateWorld();
  } else {
    selectedButton.classList.add("wrong-answer");
    playWrongSound();

    $("quizFeedback").textContent =
      `Bu safar noto‘g‘ri. To‘g‘ri javob: ${quiz.answer}.`;

    // Noto‘g‘ri javobdan keyin qayta urinish mumkin.
    setTimeout(() => {
      if (!quizAnswered && !gameEnded) {
        $("quizBox").classList.add("hidden");
        $("message").textContent =
          "Yana bir bor urinib ko‘ring. Elementlar sizda saqlanadi.";
        $("message").classList.remove("hidden");
      }
    }, 1200);
  }
}

// Portalga yetib borish
function checkPortal() {
  if (
    player.x === PORTAL.x &&
    player.y === PORTAL.y
  ) {
    if (!quizAnswered) {
      $("message").textContent =
        "🔒 Portal hali yopiq. Avval elementlarni yig‘ing va savolga javob bering.";
      $("message").classList.remove("hidden");
      return;
    }

    completeStage();
  }
}

// Bosqichni yakunlash
function completeStage() {
  if (stageFinished) return;

  stageFinished = true;
  clearInterval(timer);
  score += 50;

  updateStats();
  playSound(850, 0.3);

  $("message").innerHTML =
    "🏆 Bosqich muvaffaqiyatli yakunlandi! +50 qo‘shimcha ball.";
  $("message").classList.remove("hidden");

  if (stageIndex === TOTAL_STAGES - 1) {
    finishGame();
  } else {
    $("nextBtn").textContent =
      `KEYINGI DUNYO: ${stages[stageIndex + 1].name} ➜`;
    $("nextBtn").classList.remove("hidden");
  }
}

// Keyingi bosqich
function nextStage() {
  if (!stageFinished || gameEnded) return;

  stageIndex++;

  if (stageIndex >= TOTAL_STAGES) {
    finishGame();
    return;
  }

  startStage();
}

// O‘yin yutqazilishi
function loseGame() {
  if (gameEnded) return;

  gameEnded = true;
  clearInterval(timer);
  playWrongSound();

  $("gameBoard").classList.add("hidden");
  $("quizBox").classList.add("hidden");
  $("nextBtn").classList.add("hidden");
  $("endScreen").classList.remove("hidden");

  $("endIcon").textContent = "⏰";
  $("endTitle").textContent = "Vaqt tugadi!";
  $("endDescription").textContent =
    "Sarguzashtni qayta boshlang va yangi rekord o‘rnating.";

  showFinalScore();
}

// O‘yin tugashi
function finishGame() {
  gameEnded = true;
  clearInterval(timer);

  $("gameBoard").classList.add("hidden");
  $("quizBox").classList.add("hidden");
  $("nextBtn").classList.add("hidden");
  $("endScreen").classList.remove("hidden");

  $("endIcon").textContent = "🏆";
  $("endTitle").textContent = "Sarguzasht yakunlandi!";
  $("endDescription").textContent =
    "Tabriklaymiz! Siz uchala kimyoviy dunyoni zabt etdingiz.";

  playSound(1000, 0.4);
  showFinalScore();
}

function showFinalScore() {
  $("finalScore").textContent = score;
  $("record").textContent = record;
}

// Qayta boshlash
function restartGame() {
  clearInterval(timer);

  stageIndex = 0;
  score = 0;
  gameEnded = false;
  stageFinished = false;

  updateStats();
  startStage();
}

// Ovoz tugmasi
function toggleSound() {
  soundOn = !soundOn;

  $("soundBtn").textContent = soundOn
    ? "🔊 Ovoz yoqilgan"
    : "🔇 Ovoz o‘chirilgan";

  if (soundOn) playSound(650, 0.12);
}

// Klaviatura boshqaruvi
document.addEventListener("keydown", event => {
  const keys = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right"
  };

  const direction = keys[event.key];

  if (direction) {
    event.preventDefault();
    movePlayer(direction);
  }
});

// Telefon tugmalari
document.querySelectorAll("[data-move]").forEach(button => {
  button.addEventListener("click", () => {
    movePlayer(button.dataset.move);
  });
});

// Asosiy tugmalar
$("nextBtn").addEventListener("click", nextStage);
$("restartBtn").addEventListener("click", restartGame);
$("playAgainBtn").addEventListener("click", () => {
  gameEnded = false;
  restartGame();
});
$("soundBtn").addEventListener("click", toggleSound);

// O‘yinni ishga tushirish
updateStats();
startStage();
