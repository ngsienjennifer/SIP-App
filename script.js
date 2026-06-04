lucide.createIcons();

let seconds = 0;
let timer = null;

let breaks = 0;
let points = 0;
let progress = 35;
let ringConnected = true;
let battery = 82;

let dndMode = "off";
let dndTimer = null;
let dndRemainingSeconds = 0;

let history = [];

const timerDisplay = document.getElementById("timerDisplay");
const timerMode = document.getElementById("timerMode");
const hologramCard = document.getElementById("hologramCard");
const hologramTitle = document.getElementById("hologramTitle");
const hologramText = document.getElementById("hologramText");
const hologramIcon = document.getElementById("hologramIcon");

const breaksToday = document.getElementById("breaksToday");
const pointsToday = document.getElementById("pointsToday");
const movementBreaks = document.getElementById("movementBreaks");
const totalPoints = document.getElementById("totalPoints");
const totalSitting = document.getElementById("totalSitting");

const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");

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

  progressFill.style.width = `${progress}%`;
  progressPercent.textContent = `${progress}%`;

  batteryText.textContent = ringConnected ? `${battery}%` : "--";
  batteryFill.style.width = ringConnected ? `${battery}%` : "0%";

  connectionText.textContent = ringConnected ? "Ring Connected" : "Ring Disconnected";
  connectBtn.textContent = ringConnected ? "Disconnect" : "Connect";
  ringStatusText.textContent = ringConnected
    ? `Ring is connected. Current mode: ${getModeLabel()}`
    : "Ring is disconnected. Connect to start monitoring.";

  connectionDot.classList.toggle("off", !ringConnected);

  updateDndText();
  updateHistory();
  updateBadges();
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
      "Please connect your Move Ring before starting a session.",
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

  if (dndMode === "exam") {
    timerMode.textContent = "DND active";

    setHologram(
      "idle",
      "Exam Mode active",
      "Reminder was muted to avoid interrupting your exam. Movement can be logged later.",
      "moon"
    );

    addHistory("Reminder muted", "Exam Mode");
    updateUI();
    return;
  }

  if (dndMode === "class") {
    timerMode.textContent = "Silent prompt";

    setHologram(
      "active",
      "Silent hologram",
      `Class Mode: No vibration. Suggested goal: ${goal}`,
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
      `Focus Mode: Take a light break when ready. Goal: ${goal}`,
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
    `You've been sitting for too long. Goal: ${goal}`,
    "projector"
  );

  addHistory("Reminder triggered", "Normal Mode");
  updateUI();
}

function completeGoal() {
  if (!ringConnected) {
    setHologram(
      "active",
      "Ring disconnected",
      "Connect your ring before logging a movement goal.",
      "wifi-off"
    );
    return;
  }

  breaks += 1;
  points += calculatePoints();
  progress = Math.min(100, progress + 15);
  seconds = 0;

  timerMode.textContent = "Goal done";

  setHologram(
    "success",
    "Goal achieved!",
    `+${calculatePoints()} points earned. Hologram powers down.`,
    "badge-check"
  );

  addHistory("Goal completed", goalSelect.value);
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
      "Reconnect the Move Ring to continue monitoring inactivity.",
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

  if (history.length > 5) {
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

  badgeList.innerHTML = `
    <div class="${firstMoveClass}">🌱 First Move</div>
    <div class="${threeBreaksClass}">🔥 3 Breaks</div>
    <div class="${pointsClass}">⭐ 500 Points</div>
  `;
}

function changeTheme() {
  const theme = themeSelect.value;
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("moveRingTheme", theme);
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("moveRingTheme") || "ocean";

  document.body.setAttribute("data-theme", savedTheme);

  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
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
document.getElementById("completeGoalBtn").addEventListener("click", completeGoal);
connectBtn.addEventListener("click", toggleConnection);

if (themeSelect) {
  themeSelect.addEventListener("change", changeTheme);
}

if (dndBtn) {
  dndBtn.addEventListener("click", activateDnd);
}

loadSavedTheme();
updateUI();
lucide.createIcons();
