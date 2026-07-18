lucide.createIcons();

let seconds = 0;
let timer = null;

let breaks = 0;
let points = 0;
let dailyEarned = 0;
let dailyGoal = 150;
let progress = 0;
let streak = 0;
let dailyGoalCompleted = false;

let ringConnected = true;
let battery = 82;

let dndMode = "off";
let dndTimer = null;
let dndRemainingSeconds = 0;

let movementRequired = false;
let currentVerifiedGoal = "";
let currentVerifiedPoints = 0;

let passiveActivityCount = 0;
let passiveActivityPointsToday = 0;
let passiveActivityDailyCap = 60;

let history = [];
let unlockedRewards = [];

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
const currentBadge = document.getElementById("currentBadge");

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

const simulatePassiveActivityBtn = document.getElementById("simulatePassiveActivityBtn");
const activityStatusDot = document.getElementById("activityStatusDot");
const activityStatusTitle = document.getElementById("activityStatusTitle");
const activityStatusText = document.getElementById("activityStatusText");

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getModeLabel() {
  if (dndMode === "class") return "Class Mode";
  if (dndMode === "exam") return "Exam Mode";
  if (dndMode === "focus") return "Focus Mode";
  return "Normal";
}

function setHologram(state, title, text, iconName) {
  hologramCard.className = `hologram-card ${state} qr-scanner-btn`;
  hologramTitle.textContent = title;
  hologramText.textContent = text;
  hologramIcon.setAttribute("data-lucide", iconName);
  lucide.createIcons();
}

function updateUI() {
  timerDisplay.textContent = formatTime(seconds);

  breaksToday.textContent = breaks;
  pointsToday.textContent = points;
  streakDays.textContent = streak;

  movementBreaks.textContent = breaks;
  totalPoints.textContent = points;
  totalSitting.textContent = `${Math.floor(seconds / 60)} min`;

  progress = Math.min(100, Math.round((dailyEarned / dailyGoal) * 100));
  progressFill.style.width = `${progress}%`;
  progressPercent.textContent = `${progress}%`;

  dailyGoalText.textContent = `Daily goal: earn ${dailyGoal} verified movement points today.`;
  dailyPointsEarned.textContent = dailyEarned;
  dailyPointsLeft.textContent = Math.max(0, dailyGoal - dailyEarned);

  connectionText.textContent = ringConnected ? "Ring Connected" : "Ring Disconnected";
  connectBtn.textContent = ringConnected ? "Disconnect" : "Connect";
  connectionDot.classList.toggle("off", !ringConnected);

  ringStatusText.textContent = ringConnected
    ? `Ring is connected. Current mode: ${getModeLabel()}.`
    : "Ring is disconnected. Connect to start monitoring.";

  batteryText.textContent = ringConnected ? `${battery}%` : "--";
  batteryFill.style.width = ringConnected ? `${battery}%` : "0%";

  rewardPointsDisplay.textContent = `${points} points`;

  if (verifyMovementBtn) {
    verifyMovementBtn.disabled = !movementRequired;
    verifyMovementBtn.innerHTML = movementRequired
      ? `<i data-lucide="radar"></i> Ring Waiting for Movement`
      : `<i data-lucide="radar"></i> Waiting for Ring Verification`;
  }

  if (simulateMovementBtn) {
    simulateMovementBtn.disabled = !movementRequired;
  }

  if (movementRequired) {
    sensorStatusTitle.textContent = "Movement required";
    sensorStatusText.textContent = `Ring is checking for: ${currentVerifiedGoal}`;
    sensorStatusDot.className = "sensor-dot active";
  } else {
    sensorStatusTitle.textContent = "No movement required yet";
    sensorStatusText.textContent = "Start the timer and wait for the ring reminder.";
    sensorStatusDot.className = "sensor-dot idle";
  }

  if (activityStatusTitle && activityStatusText && activityStatusDot) {
    activityStatusTitle.textContent =
      passiveActivityCount > 0 ? "Passive activity detected" : "Passive tracking active";

    activityStatusText.textContent =
      `Passive points today: ${passiveActivityPointsToday}/${passiveActivityDailyCap}`;

    activityStatusDot.className =
      passiveActivityCount > 0 ? "sensor-dot active" : "sensor-dot idle";
  }

  updateDndText();
  updateHistory();
  updateBadges();
  updateRewards();
  updateCurrentBadge();
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
    `The ring is checking for prolonged sitting. Mode: ${getModeLabel()}.`,
    "radar"
  );

  timer = setInterval(() => {
    seconds++;

    if (seconds % 60 === 0 && battery > 0) {
      battery -= 1;
    }

    const reminderMinutes = Number(reminderInput.value);
    const reminderSeconds = reminderMinutes * 60;

    if (seconds >= reminderSeconds) {
      triggerReminder();
    }

    updateUI();
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
  movementRequired = false;
  currentVerifiedGoal = "";
  currentVerifiedPoints = 0;
  timerMode.textContent = "Ready";

  setHologram(
    "idle",
    "Scan Area QR",
    "Tap here to scan a QR code at your desk or study area.",
    "qr-code"
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
    movementRequired = false;
    timerMode.textContent = "DND active";

    setHologram(
      "idle",
      "Exam Mode active",
      "No prompts or vibrations. Reminder muted to avoid interrupting your exam.",
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
      "Class Mode: Break Pending",
      `Tap to scan a QR code to verify task: ${goal}`,
      "qr-code"
    );

    addHistory("Silent hologram shown", goal);
    updateUI();
    return;
  }

  if (dndMode === "focus") {
    timerMode.textContent = "Soft prompt";

    setHologram(
      "active",
      "Soft reminder",
      `Focus Mode: Complete when ready. Ring is waiting to verify: ${goal}.`,
      "sparkles"
    );

    addHistory("Soft reminder shown", goal);
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
    `Task: ${goal}. Walk and tap here to scan an Area QR to verify!`,
    "qr-code"
  );

  addHistory("Hologram task shown", goal);
  updateUI();
}

function calculatePoints() {
  const goal = goalSelect.value;

  let basePoints = 0;

  if (goal === "Stretch for 2 minutes") {
    basePoints = 20;
  } else if (goal === "Walk 100 steps") {
    basePoints = 35;
  } else if (goal === "Stand for 3 minutes") {
    basePoints = 15;
  } else if (goal === "Hydrate and walk") {
    basePoints = 25;
  } else if (goal === "Shoulder roll + posture reset") {
    basePoints = 10;
  } else {
    basePoints = 15;
  }

  if (dndMode === "class") {
    return Math.round(basePoints * 0.8);
  }

  if (dndMode === "focus") {
    return Math.round(basePoints * 0.9);
  }

  if (dndMode === "exam") {
    return 0;
  }

  return basePoints;
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
      `You reached ${dailyGoal} points today. Your streak is now ${streak} day(s)!`,
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
    "Goal accomplished!",
    `Ring verified: ${currentVerifiedGoal}. +${earned} points earned.`,
    "badge-check"
  );

  addHistory("Ring verified movement", `${currentVerifiedGoal} · +${earned} points`);

  setTimeout(() => {
    if (!movementRequired) {
      setHologram(
        "idle",
        "Scan Area QR",
        "Tap here to scan a QR code at your desk or study area.",
        "qr-code"
      );
      updateUI();
    }
  }, 3500);

  currentVerifiedGoal = "";
  currentVerifiedPoints = 0;

  updateUI();
}

function simulatePassiveRingActivity() {
  if (!ringConnected) {
    setHologram(
      "active",
      "Ring disconnected",
      "Connect your ring before passive activity can be tracked.",
      "wifi-off"
    );
    return;
  }

  const activityTypes = [
    {
      label: "Light movement detected",
      detail: "Small movement around campus",
      points: 5,
      icon: "person-standing"
    },
    {
      label: "Walking detected",
      detail: "Ring detected walking motion",
      points: 8,
      icon: "footprints"
    },
    {
      label: "Active period detected",
      detail: "Consistent movement detected",
      points: 12,
      icon: "activity"
    }
  ];

  const selected = activityTypes[Math.floor(Math.random() * activityTypes.length)];

  if (passiveActivityPointsToday >= passiveActivityDailyCap) {
    setHologram(
      "idle",
      "Passive point limit reached",
      "The ring is still tracking activity, but passive points are capped for today.",
      "shield-check"
    );

    addHistory("Passive cap reached", "No extra points awarded");
    updateUI();
    return;
  }

  const remainingCap = passiveActivityDailyCap - passiveActivityPointsToday;
  const awardedPoints = Math.min(selected.points, remainingCap);

  passiveActivityCount += 1;
  passiveActivityPointsToday += awardedPoints;

  addMovementPoints(awardedPoints);

  setHologram(
    "idle",
    selected.label,
    `${selected.detail}. +${awardedPoints} passive points earned.`,
    selected.icon
  );

  if (activityStatusTitle && activityStatusText && activityStatusDot) {
    activityStatusTitle.textContent = selected.label;
    activityStatusText.textContent =
      `${selected.detail}. Passive points today: ${passiveActivityPointsToday}/${passiveActivityDailyCap}`;
    activityStatusDot.className = "sensor-dot active";
  }

  addHistory(selected.label, `+${awardedPoints} passive points`);
  updateUI();
}

function toggleConnection() {
  ringConnected = !ringConnected;

  if (!ringConnected) {
    clearInterval(timer);
    timer = null;
    movementRequired = false;
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
      "Scan Area QR",
      "Tap here to scan a QR code at your desk or study area.",
      "qr-code"
    );
  }

  updateUI();
}

function activateDnd() {
  dndMode = dndSelect.value;
  clearInterval(dndTimer);

  if (dndMode === "off") {
    dndRemainingSeconds = 0;

    setHologram(
      "idle",
      "Scan Area QR",
      "Tap here to scan a QR code at your desk or study area.",
      "qr-code"
    );

    updateUI();
    return;
  }

  dndRemainingSeconds = Number(dndDuration.value) * 60;

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

  history.unshift({ action, detail, time });

  if (history.length > 6) {
    history.pop();
  }
}

function updateHistory() {
  if (history.length === 0) {
    historyList.innerHTML = `<p class="hint">No verified movement yet.</p>`;
    return;
  }

  historyList.innerHTML = history
    .map(item => `
      <div class="history-item">
        <div>
          ${item.action}
          <br>
          <span>${item.detail}</span>
        </div>
        <span>${item.time}</span>
      </div>
    `)
    .join("");
}

function updateBadges() {
  const firstMoveClass = breaks >= 1 ? "badge" : "badge locked";
  const threeBreaksClass = breaks >= 3 ? "badge" : "badge locked";
  const pointsClass = points >= 500 ? "badge" : "badge locked";
  const focusClass = dailyEarned >= 75 ? "badge" : "badge locked";

  badgeList.innerHTML = `
    <div class="${firstMoveClass}">🌱 First Verified Move</div>
    <div class="${threeBreaksClass}">🔥 3 Verified Breaks</div>
    <div class="${pointsClass}">⭐ 500 Points</div>
    <div class="${focusClass}">🧠 Focus Builder</div>
  `;
}

function updateCurrentBadge() {
  if (points >= 1000) {
    currentBadge.textContent = "Active Pro";
  } else if (points >= 500) {
    currentBadge.textContent = "Focus Builder";
  } else if (breaks >= 1) {
    currentBadge.textContent = "First Move";
  } else if (passiveActivityCount >= 1) {
    currentBadge.textContent = "Active Starter";
  } else {
    currentBadge.textContent = "Starter";
  }
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
  localStorage.setItem("holoRingTheme", theme);

  setHologram(
    "idle",
    "Theme changed",
    `Your app theme is now ${themeSelect.options[themeSelect.selectedIndex].text}.`,
    "palette"
  );
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("holoRingTheme") || "ocean";

  document.body.setAttribute("data-theme", savedTheme);
  document.documentElement.setAttribute("data-theme", savedTheme);

  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
}

function saveDailyGoal() {
  const newGoal = Number(dailyGoalInput.value);

  if (!newGoal || newGoal < 50) {
    setHologram(
      "active",
      "Invalid goal",
      "Please set a daily goal of at least 50 points.",
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

  passiveActivityCount = 0;
  passiveActivityPointsToday = 0;

  movementRequired = false;
  currentVerifiedGoal = "";
  currentVerifiedPoints = 0;

  history = [];
  unlockedRewards = [];

  timerMode.textContent = "Ready";

  setHologram(
    "idle",
    "Demo progress reset",
    "Points, streak, passive activity, verified breaks, rewards, and progress have been reset to 0.",
    "rotate-ccw"
  );

  updateUI();
}

// Add the interactive on-tap QR scanner action
if (hologramCard) {
  hologramCard.addEventListener("click", () => {
    const campusAreas = [
      "Library Silent Zone - Desk 42",
      "Campus Gym - Active Zone",
      "Student Union - Table 12",
      "Engineering Lab - Bench B",
      "Outdoor Park Bench - Zone C"
    ];
    const randomArea = campusAreas[Math.floor(Math.random() * campusAreas.length)];

    if (movementRequired) {
      const earned = currentVerifiedPoints || 20;
      breaks += 1;
      addMovementPoints(earned);
      seconds = 0;
      movementRequired = false;
      timerMode.textContent = "Verified";

      setHologram(
        "success",
        "Break Verified!",
        `Scanned at ${randomArea}. +${earned} points earned!`,
        "badge-check"
      );

      addHistory("Area QR Verified Break", `${randomArea} · +${earned} points`);
    } else {
      const scanPoints = 10;
      addMovementPoints(scanPoints);
      
      setHologram(
        "success",
        "Location Synced!",
        `Successfully scanned at: ${randomArea}. +${scanPoints} points earned!`,
        "map-pin"
      );
      
      addHistory("Area QR Scanned", `Checked in at ${randomArea} · +${scanPoints} points`);
    }

    updateUI();

    setTimeout(() => {
      if (!movementRequired) {
        setHologram(
          "idle",
          "Scan Area QR",
          "Tap here to scan a QR code at your desk or study area.",
          "qr-code"
        );
        updateUI();
      }
    }, 3500);
  });
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");

    lucide.createIcons();
  });
});

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
connectBtn.addEventListener("click", toggleConnection);

verifyMovementBtn.addEventListener("click", verifyMovementFromRing);
simulateMovementBtn.addEventListener("click", verifyMovementFromRing);

if (simulatePassiveActivityBtn) {
  simulatePassiveActivityBtn.addEventListener("click", simulatePassiveRingActivity);
}

document.querySelectorAll(".reward-item").forEach(button => {
  button.addEventListener("click", () => {
    const cost = Number(button.dataset.cost);
    const rewardName = button.dataset.name;
    redeemReward(cost, rewardName);
  });
});

themeSelect.addEventListener("change", changeTheme);
dndBtn.addEventListener("click", activateDnd);
saveGoalBtn.addEventListener("click", saveDailyGoal);
resetDemoBtn.addEventListener("click", resetDemoProgress);

loadSavedTheme();
updateUI();
lucide.createIcons();