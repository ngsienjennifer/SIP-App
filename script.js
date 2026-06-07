lucide.createIcons();

let seconds = 0;
let timer = null;

let breaks = 0;
let points = 0;              // redeemable wallet points
let dailyEarned = 0;         // points earned today
let dailyGoal = 600;         // daily target
let progress = 0;
let streak = 0;              // starts from 0
let dailyGoalCompleted = false;
let ringConnected = true;
let battery = 82;

let dndMode = "off";
let dndTimer = null;
let dndRemainingSeconds = 0;

let history = [];
let unlockedRewards = [];

let movementRequired = false;
let currentVerifiedGoal = "";
let currentVerifiedPoints = 0;

const timerDisplay = document.getElementById("timerDisplay");
const timerMode = document.getElementById("timerMode");
const hologramCard = document.getElementById("hologramCard");
const hologramTitle = document.getElementById("hologramTitle");
const hologramText = document.getElementById("hologramText");
const hologramIcon = document.getElementById("hologramIcon");

const breaksToday = document.getElementById("breaksToday");
const pointsToday = document.getElementById("pointsToday");
const streakDays = document.getElementById("streakDays");

const movementBreaks = document.getElementById("movementBreaks");
const totalPoints = document.getElementById("totalPoints");
const totalSitting = document.getElementById("totalSitting");

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");

const dailyGoalText = document.getElementById("dailyGoalText");
const dailyPointsEarned = document.getElementById("dailyPointsEarned");
const dailyPointsLeft = document.getElementById("dailyPointsLeft");

const dailyGoalInput = document.getElementById("dailyGoalInput");
const saveGoalBtn = document.getElementById("saveGoalBtn");
const resetDemoBtn = document.getElementById("resetDemoBtn");

const connectionText = document.getElementById("connectionText");
const connectionDot = document.getElementById("connectionDot");
const connectBtn = document.getElementById("connectBtn");
const ringStatusText = document.getElementById("ringStatusText");
const batteryText = document.getElementById("batteryText");
const batteryFill = document.getElementById("batteryFill");

const reminderInput = document.getElementById("reminderInput");
const goalSelect = document.getElementById("goalSelect");

const themeSelect = document.getElementById("themeSelect");
const dndSelect = document.getElementById("dndSelect");
const dndDuration = document.getElementById("dndDuration");
const dndBtn = document.getElementById("dndBtn");
const dndStatusText = document.getElementById("dndStatusText");

const historyList = document.getElementById("historyList");
const badgeList = document.getElementById("badgeList");

const rewardPointsDisplay = document.getElementById("rewardPointsDisplay");
const unlockedRewardsBox = document.getElementById("unlockedRewards");

const verifyMovementBtn = document.getElementById("verifyMovementBtn");
const simulateMovementBtn = document.getElementById("simulateMovementBtn");
const sensorStatusDot = document.getElementById("sensorStatusDot");
const sensorStatusTitle = document.getElementById("sensorStatusTitle");
const sensorStatusText = document.getElementById("sensorStatusText");

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateUI() {
  timerDisplay.textContent = formatTime(seconds);

  breaksToday.textContent = breaks;
  pointsToday.textContent = points;
  movementBreaks.textContent = breaks;
  totalPoints.textContent = points;
  totalSitting.textContent = `${Math.floor(seconds / 60)} min`;

  if (streakDays) {
    streakDays.textContent = streak;
  }

  progress = Math.min(100, Math.round((dailyEarned / dailyGoal) * 100));
  
  progressFill.style.width = `${progress}%`;
  progressPercent.textContent = `${progress}%`;
  
  if (dailyGoalText) {
    dailyGoalText.textContent = `Daily goal: earn ${dailyGoal} movement points today.`;
  }
  
  if (dailyPointsEarned) {
    dailyPointsEarned.textContent = dailyEarned;
  }
  
  if (dailyPointsLeft) {
    dailyPointsLeft.textContent = Math.max(0, dailyGoal - dailyEarned);
  }

  batteryText.textContent = ringConnected ? `${battery}%` : "--";
  batteryFill.style.width = ringConnected ? `${battery}%` : "0%";

  connectionText.textContent = ringConnected ? "Ring Connected" : "Ring Disconnected";
  connectBtn.textContent = ringConnected ? "Disconnect" : "Connect";

  ringStatusText.textContent = ringConnected
    ? `Ring is connected. Current mode: ${getModeLabel()}`
    : "Ring is disconnected. Connect to start monitoring.";

  connectionDot.classList.toggle("off", !ringConnected);

  if (rewardPointsDisplay) {
    rewardPointsDisplay.textContent = `${points} points`;
  }

  if (verifyMovementBtn) {
  verifyMovementBtn.disabled = !movementRequired;
  verifyMovementBtn.innerHTML = movementRequired
    ? `<i data-lucide="radar"></i> Ring Waiting for Movement`
    : `<i data-lucide="radar"></i> Waiting for Ring Verification`;
}

if (simulateMovementBtn) {
  simulateMovementBtn.disabled = !movementRequired;
}

if (sensorStatusTitle && sensorStatusText && sensorStatusDot) {
  if (movementRequired) {
    sensorStatusTitle.textContent = "Movement required";
    sensorStatusText.textContent = `Ring is checking for: ${currentVerifiedGoal}`;
    sensorStatusDot.className = "sensor-dot active";
  } else {
    sensorStatusTitle.textContent = "No movement required yet";
    sensorStatusText.textContent = "Start the timer and wait for the ring reminder.";
    sensorStatusDot.className = "sensor-dot idle";
  }
}

  updateDndText();
  updateHistory();
  updateBadges();
  updateRewards();
}

function getModeLabel() {
  if (dndMode === "off") return "Normal";
  if (dndMode === "class") return "Class Mode";
  if (dndMode === "exam") return "Exam Mode";
  if (dndMode === "focus") return "Focus Mode";
  return "Normal";
}

function setHologram(state, title, text, iconName) {
  hologramCard.className = `hologram-card ${state}`;
  hologramTitle.textContent = title;
  hologramText.textContent = text;

  hologramIcon.setAttribute("data-lucide", iconName);
  lucide.createIcons();
}

function startTimer() {
  if (!ringConnected) {
    setHologram(
      "active",
      "Ring disconnected",
      "Please connect your Holo Ring before starting a session.",
      "wifi-off"
    );
    return;
  }

  if (timer) return;

  timerMode.textContent = dndMode === "off" ? "Active" : getModeLabel();

  setHologram(
    "idle",
    "Monitoring started",
    `The ring is checking for prolonged sitting. Mode: ${getModeLabel()}`,
    "radar"
  );

  timer = setInterval(() => {
    seconds++;

    if (seconds % 60 === 0 && battery > 0) {
      battery -= 1;
    }

    updateUI();

    const reminderMinutes = Number(reminderInput.value);
    const reminderSeconds = reminderMinutes * 60;

    if (seconds >= reminderSeconds) {
      triggerReminder();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
  timerMode.textContent = "Paused";
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  seconds = 0;
  timerMode.textContent = "Ready";

  setHologram(
    "idle",
    "Hologram inactive",
    "Start a study session. The ring will prompt you after long sitting.",
    "sparkles"
  );

  updateUI();
}

function triggerReminder() {
  clearInterval(timer);
  timer = null;

  const goal = goalSelect.value;

  currentVerifiedGoal = goal;
  currentVerifiedPoints = calculatePoints();

  if (dndMode === "exam") {
    timerMode.textContent = "DND active";

    movementRequired = false;

    setHologram(
      "idle",
      "Exam Mode active",
      "Reminder was muted to avoid interrupting your exam. Movement can be completed later.",
      "moon"
    );

    addHistory("Reminder muted", "Exam Mode");
    updateUI();
    return;
  }

  movementRequired = true;

  if (dndMode === "class") {
    timerMode.textContent = "Silent prompt";

    setHologram(
      "active",
      "Silent hologram",
      `Class Mode: No vibration. Ring is waiting to verify: ${goal}`,
      "projector"
    );

    addHistory("Silent reminder", "Class Mode");
    updateUI();
    return;
  }

  if (dndMode === "focus") {
    timerMode.textContent = "Soft prompt";

    setHologram(
      "active",
      "Soft reminder",
      `Focus Mode: Complete when ready. Ring is waiting to verify: ${goal}`,
      "sparkles"
    );

    addHistory("Soft reminder", "Focus Mode");
    updateUI();
    return;
  }

  timerMode.textContent = "Move now";

  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

  setHologram(
    "active",
    "Time to move!",
    `You've been sitting for too long. Hologram task: ${goal}. Points are awarded only after ring verification.`,
    "projector"
  );

  addHistory("Hologram task shown", goal);
  updateUI();
}

function addMovementPoints(earned) {
  points += earned;
  dailyEarned += earned;

  if (dailyEarned >= dailyGoal && !dailyGoalCompleted) {
    streak += 1;
    dailyGoalCompleted = true;

    setHologram(
      "success",
      "Daily goal completed!",
      `You reached ${dailyGoal} movement points today. Your streak is now ${streak} day(s)!`,
      "flame"
    );

    addHistory("Daily goal completed", `Streak: ${streak} day(s)`);
  }
}
function verifyMovementFromRing() {
  if (!ringConnected) {
    setHologram(
      "active",
      "Ring disconnected",
      "Connect your ring before movement can be verified.",
      "wifi-off"
    );
    return;
  }

  if (!movementRequired) {
    setHologram(
      "idle",
      "No active movement task",
      "The ring has not triggered a movement task yet.",
      "radar"
    );
    return;
  }

  const earned = currentVerifiedPoints;

  breaks += 1;
  addMovementPoints(earned);
  seconds = 0;
  movementRequired = false;

  timerMode.textContent = "Verified";

  setHologram(
    "success",
    "Movement verified!",
    `The ring detected movement for: ${currentVerifiedGoal}. +${earned} points earned.`,
    "badge-check"
  );

  addHistory("Ring verified movement", `${currentVerifiedGoal} · +${earned} points`);

  currentVerifiedGoal = "";
  currentVerifiedPoints = 0;

  updateUI();
}

function calculatePoints() {
  if (dndMode === "class") return 80;
  if (dndMode === "focus") return 90;
  if (dndMode === "exam") return 50;
  return 100;
}

function toggleConnection() {
  ringConnected = !ringConnected;

  if (!ringConnected) {
    clearInterval(timer);
    timer = null;
    timerMode.textContent = "Offline";

    setHologram(
      "active",
      "Ring disconnected",
      "Reconnect the Holo Ring to continue monitoring inactivity.",
      "wifi-off"
    );
  } else {
    timerMode.textContent = "Ready";

    setHologram(
      "idle",
      "Ring connected",
      "Haptic reminder and hologram projection are ready.",
      "sparkles"
    );
  }

  updateUI();
}

function activateDnd() {
  dndMode = dndSelect.value;

  clearInterval(dndTimer);

  if (dndMode === "off") {
    dndRemainingSeconds = 0;
    hologramCard.classList.remove("dnd-active-card");

    setHologram(
      "idle",
      "DND off",
      "Normal reminders are active again.",
      "bell"
    );

    updateUI();
    return;
  }

  dndRemainingSeconds = Number(dndDuration.value) * 60;
  hologramCard.classList.add("dnd-active-card");

  setHologram(
    "idle",
    `${getModeLabel()} activated`,
    getDndDescription(),
    "moon"
  );

  dndTimer = setInterval(() => {
    dndRemainingSeconds--;

    if (dndRemainingSeconds <= 0) {
      dndMode = "off";
      dndSelect.value = "off";
      clearInterval(dndTimer);

      hologramCard.classList.remove("dnd-active-card");

      setHologram(
        "idle",
        "DND ended",
        "Normal movement reminders are active again.",
        "bell"
      );
    }

    updateUI();
  }, 1000);

  updateUI();
}

function getDndDescription() {
  if (dndMode === "class") {
    return "Class Mode keeps the ring silent but still shows a subtle hologram reminder.";
  }

  if (dndMode === "exam") {
    return "Exam Mode mutes vibration and hologram prompts to prevent disruption.";
  }

  if (dndMode === "focus") {
    return "Focus Mode gives softer reminders so you can stay in your study flow.";
  }

  return "Normal reminders are active.";
}

function updateDndText() {
  if (!dndStatusText) return;

  if (dndMode === "off") {
    dndStatusText.textContent = "DND is currently off.";
    return;
  }

  dndStatusText.textContent =
    `${getModeLabel()} active. Time left: ${formatTime(dndRemainingSeconds)}.`;
}

function addHistory(action, detail) {
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  history.unshift({
    action,
    detail,
    time
  });

  if (history.length > 6) {
    history.pop();
  }
}

function updateHistory() {
  if (!historyList) return;

  if (history.length === 0) {
    historyList.innerHTML = `<p class="hint">No movement breaks logged yet.</p>`;
    return;
  }

  historyList.innerHTML = history
    .map(
      item => `
      <div class="history-item">
        <div>
          ${item.action}
          <br>
          <span>${item.detail}</span>
        </div>
        <span>${item.time}</span>
      </div>
    `
    )
    .join("");
}

function updateBadges() {
  if (!badgeList) return;

  const firstMoveClass = breaks >= 1 ? "badge" : "badge locked";
  const threeBreaksClass = breaks >= 3 ? "badge" : "badge locked";
  const pointsClass = points >= 500 ? "badge" : "badge locked";
  const focusClass = points >= 300 ? "badge" : "badge locked";

  badgeList.innerHTML = `
    <div class="${firstMoveClass}">🌱 First Move</div>
    <div class="${threeBreaksClass}">🔥 3 Breaks</div>
    <div class="${focusClass}">🧠 Focus Builder</div>
    <div class="${pointsClass}">⭐ 500 Points</div>
  `;
}

function redeemReward(cost, rewardName) {
  if (points < cost) {
    setHologram(
      "active",
      "Not enough points",
      `${rewardName} needs ${cost} points. Keep moving to unlock it.`,
      "lock"
    );
    return;
  }

  points -= cost;
  unlockedRewards.unshift(`${rewardName} - redeemed for ${cost} points`);

  setHologram(
    "success",
    "Reward redeemed!",
    `${rewardName} has been added to your reward wallet.`,
    "gift"
  );

  addHistory("Reward redeemed", rewardName);
  updateUI();
}

function updateRewards() {
  if (!unlockedRewardsBox) return;

  if (unlockedRewards.length === 0) {
    unlockedRewardsBox.innerHTML = `<p class="hint">No rewards redeemed yet.</p>`;
    return;
  }

  unlockedRewardsBox.innerHTML = unlockedRewards
    .map(reward => `<div class="unlocked-item">🎁 ${reward}</div>`)
    .join("");
}

function changeTheme() {
  const theme = themeSelect.value;

  document.body.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-theme", theme);

  localStorage.setItem("moveRingTheme", theme);

  setHologram(
    "idle",
    "Theme changed",
    `Your app theme is now ${themeSelect.options[themeSelect.selectedIndex].text}.`,
    "palette"
  );
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("moveRingTheme") || "ocean";

  document.body.setAttribute("data-theme", savedTheme);
  document.documentElement.setAttribute("data-theme", savedTheme);

  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
}

function saveDailyGoal() {
  const newGoal = Number(dailyGoalInput.value);

  if (!newGoal || newGoal < 100) {
    setHologram(
      "active",
      "Invalid goal",
      "Please set a daily goal of at least 100 points.",
      "alert-circle"
    );
    return;
  }

  dailyGoal = newGoal;

  setHologram(
    "idle",
    "Daily goal updated",
    `Your new daily movement goal is ${dailyGoal} points.`,
    "target"
  );

  updateUI();
}

function resetDemoProgress() {
  clearInterval(timer);
  timer = null;

  seconds = 0;
  breaks = 0;
  points = 0;
  dailyEarned = 0;
  progress = 0;
  streak = 0;
  dailyGoalCompleted = false;
  history = [];
  unlockedRewards = [];

  timerMode.textContent = "Ready";

  setHologram(
    "idle",
    "Demo progress reset",
    "Points, streak, breaks, rewards, and progress have been reset to 0.",
    "rotate-ccw"
  );

  updateUI();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-page").forEach((p) => p.classList.remove("active"));

    tab.classList.add("active");

    const pageId = tab.dataset.tab;
    document.getElementById(pageId).classList.add("active");

    lucide.createIcons();
  });
});

document.getElementById("startBtn").addEventListener("click", startTimer);
document.getElementById("pauseBtn").addEventListener("click", pauseTimer);
document.getElementById("resetBtn").addEventListener("click", resetTimer);

if (simulateMovementBtn) {
  simulateMovementBtn.addEventListener("click", verifyMovementFromRing);
}

if (verifyMovementBtn) {
  verifyMovementBtn.addEventListener("click", verifyMovementFromRing);
}

connectBtn.addEventListener("click", toggleConnection);

document.querySelectorAll(".reward-item").forEach(button => {
  button.addEventListener("click", () => {
    const cost = Number(button.dataset.cost);
    const rewardName = button.dataset.name;
    redeemReward(cost, rewardName);
  });
});

if (themeSelect) {
  themeSelect.addEventListener("change", changeTheme);
}

if (dndBtn) {
  dndBtn.addEventListener("click", activateDnd);
}

if (saveGoalBtn) {
  saveGoalBtn.addEventListener("click", saveDailyGoal);
}

if (resetDemoBtn) {
  resetDemoBtn.addEventListener("click", resetDemoProgress);
}

loadSavedTheme();
updateUI();
lucide.createIcons();
