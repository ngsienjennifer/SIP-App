lucide.createIcons();

let seconds = 0;
let timer = null;

let breaks = 0;
let points = 0;
let dailyEarned = 0;
let dailyGoal = 600;
let progress = 0;
let streak = 0;
let dailyGoalCompleted = false;

let deviceConnected = false;
let connectedDeviceType = null;
let connectedDeviceName = "";
let connectionMethod = "";
let bluetoothDevice = null;
let motionSampleCount = 0;

const MOBILE_USER_AGENT_PATTERN = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i;
const SMART_WATCH_FILTERS = [
  { services: ["heart_rate"] },
  { namePrefix: "Galaxy Watch" },
  { namePrefix: "Pixel Watch" },
  { namePrefix: "Apple Watch" },
  { namePrefix: "Garmin" },
  { namePrefix: "Fitbit" },
  { namePrefix: "Amazfit" },
  { namePrefix: "HUAWEI WATCH" },
  { namePrefix: "Huawei Watch" },
  { namePrefix: "Mi Band" },
  { namePrefix: "Xiaomi Smart Band" },
  { namePrefix: "WHOOP" },
  { namePrefix: "Smart Watch" },
  { namePrefix: "SmartWatch" },
  { namePrefix: "Watch" },
  { namePrefix: "Band" }
];
const SMART_WATCH_OPTIONAL_SERVICES = [
  "heart_rate",
  "battery_service",
  "device_information"
];

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
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const qrScanCard = document.getElementById("qrScanCard");
const qrCardTitle = document.getElementById("qrCardTitle");
const qrCardText = document.getElementById("qrCardText");
const qrCardIcon = document.getElementById("qrCardIcon");

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
const connectionSubtext = document.getElementById("connectionSubtext");
const connectionDot = document.getElementById("connectionDot");
const connectBtn = document.getElementById("connectBtn");

const deviceStatusText = document.getElementById("deviceStatusText");
const deviceTypeText = document.getElementById("deviceTypeText");
const connectionMethodText = document.getElementById("connectionMethodText");
const deviceStatusIcon = document.getElementById("deviceStatusIcon");
const connectPhoneBtn = document.getElementById("connectPhoneBtn");
const connectWatchBtn = document.getElementById("connectWatchBtn");
const demoWatchBtn = document.getElementById("demoWatchBtn");
const disconnectDeviceBtn = document.getElementById("disconnectDeviceBtn");
const phoneCompatibilityText = document.getElementById("phoneCompatibilityText");
const watchCompatibilityText = document.getElementById("watchCompatibilityText");

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

function setQrCard(state, title, text, iconName) {
  qrScanCard.className = `qr-card ${state} qr-scanner-btn`;
  qrCardTitle.textContent = title;
  qrCardText.textContent = text;
  qrCardIcon.setAttribute("data-lucide", iconName);
  lucide.createIcons();
}

function getConnectedDeviceLabel() {
  if (!deviceConnected) return "No Device";
  return connectedDeviceName || (connectedDeviceType === "watch" ? "Smart Watch" : "This Phone");
}

function isLikelyMobileDevice() {
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
    return navigator.userAgentData.mobile;
  }

  const isIPadDesktopMode = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent) || isIPadDesktopMode;
}

function getPhoneConnectionIssue() {
  if (!isLikelyMobileDevice()) {
    return "Unavailable on this computer. Open SIP Move directly on the phone or tablet you want to use.";
  }

  if (!window.isSecureContext) {
    return "Motion sensors require a secure HTTPS connection.";
  }

  if (typeof DeviceMotionEvent === "undefined") {
    return "This mobile browser does not provide motion sensor access.";
  }

  return "Ready. You will be asked for motion permission, then the app will verify a real sensor reading.";
}

function getWatchConnectionIssue() {
  if (!window.isSecureContext) {
    return "Bluetooth pairing requires HTTPS or localhost.";
  }

  if (!navigator.bluetooth) {
    return "Web Bluetooth is unavailable in this browser. Try Chrome or Edge on a supported device.";
  }

  return "Only watches and activity bands matching known names or an advertised heart-rate service will be shown.";
}

function updateConnectionAvailability() {
  const phoneIssue = getPhoneConnectionIssue();
  const phoneReady = phoneIssue.startsWith("Ready.");
  connectPhoneBtn.disabled = !phoneReady;
  connectPhoneBtn.title = phoneReady ? "" : phoneIssue;
  phoneCompatibilityText.textContent = phoneIssue;
  phoneCompatibilityText.className = `connection-note ${phoneReady ? "ready" : "warning"}`;

  const watchIssue = getWatchConnectionIssue();
  const watchReady = watchIssue.startsWith("Only watches");
  connectWatchBtn.disabled = !watchReady;
  connectWatchBtn.title = watchReady ? "" : watchIssue;
  watchCompatibilityText.textContent = watchIssue;
  watchCompatibilityText.className = `connection-note ${watchReady ? "ready" : "warning"}`;
}

function waitForMotionSensorSample(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let timeoutId;

    const cleanup = () => {
      window.removeEventListener("devicemotion", handleSample);
      clearTimeout(timeoutId);
    };

    const handleSample = event => {
      const acceleration = event.accelerationIncludingGravity || event.acceleration;
      if (!acceleration) return;

      const values = [acceleration.x, acceleration.y, acceleration.z];
      if (!values.some(value => Number.isFinite(value))) return;

      cleanup();
      resolve();
    };

    window.addEventListener("devicemotion", handleSample);
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("No motion sensor data was received. Move the phone slightly and try again."));
    }, timeoutMs);
  });
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

  const deviceLabel = getConnectedDeviceLabel();
  connectionText.textContent = deviceConnected ? `${deviceLabel} Connected` : "No Device Connected";
  connectionSubtext.textContent = deviceConnected
    ? `${connectionMethod} · ${getModeLabel()}`
    : "Connect a supported mobile device or smart watch";
  connectBtn.textContent = deviceConnected ? "Manage" : "Connect";
  connectionDot.classList.toggle("off", !deviceConnected);

  deviceStatusText.textContent = deviceConnected
    ? `${deviceLabel} is ready to monitor movement. Current mode: ${getModeLabel()}.`
    : "Choose this mobile device or pair a compatible smart watch to begin.";
  deviceTypeText.textContent = deviceConnected ? deviceLabel : "None";
  connectionMethodText.textContent = deviceConnected ? connectionMethod : "Not connected";
  deviceStatusIcon.setAttribute("data-lucide", connectedDeviceType === "watch" ? "watch" : "smartphone");
  disconnectDeviceBtn.disabled = !deviceConnected;

  rewardPointsDisplay.textContent = `${points} points`;

  if (verifyMovementBtn) {
    verifyMovementBtn.disabled = !movementRequired || !deviceConnected;
    verifyMovementBtn.innerHTML = movementRequired
      ? `<i data-lucide="radar"></i> Device Waiting for Movement`
      : `<i data-lucide="radar"></i> Waiting for Device Verification`;
  }

  if (simulateMovementBtn) {
    simulateMovementBtn.disabled = !movementRequired || !deviceConnected;
  }

  if (movementRequired) {
    sensorStatusTitle.textContent = "Movement required";
    sensorStatusText.textContent = `${deviceLabel} is checking for: ${currentVerifiedGoal}`;
    sensorStatusDot.className = "sensor-dot active";
  } else {
    sensorStatusTitle.textContent = "No movement required yet";
    sensorStatusText.textContent = deviceConnected
      ? "Start the timer and wait for the device reminder."
      : "Connect a device, then start the timer.";
    sensorStatusDot.className = "sensor-dot idle";
  }

  if (activityStatusTitle && activityStatusText && activityStatusDot) {
    activityStatusTitle.textContent = !deviceConnected
      ? "Tracking unavailable"
      : passiveActivityCount > 0 ? "Passive activity detected" : "Passive tracking active";

    activityStatusText.textContent = deviceConnected
      ? `Passive points today: ${passiveActivityPointsToday}/${passiveActivityDailyCap}`
      : "Connect a phone or smart watch to monitor movement.";

    activityStatusDot.className =
      deviceConnected && passiveActivityCount > 0 ? "sensor-dot active" : "sensor-dot idle";
  }

  updateDndText();
  updateHistory();
  updateBadges();
  updateRewards();
  updateCurrentBadge();
  lucide.createIcons();
}

function startTimer() {
  if (!deviceConnected) {
    setQrCard(
      "active",
      "Device required",
      "Connect this phone or a smart watch before starting a session.",
      "wifi-off"
    );
    return;
  }

  if (timer) return;

  timerMode.textContent = dndMode === "off" ? "Active" : getModeLabel();

  setQrCard(
    "idle",
    "Monitoring started",
    `${getConnectedDeviceLabel()} is checking for prolonged sitting. Mode: ${getModeLabel()}.`,
    "radar"
  );

  timer = setInterval(() => {
    seconds++;

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

  setQrCard(
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

    setQrCard(
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

    setQrCard(
      "active",
      "Class Mode: Break Pending",
      `Tap to scan a QR code to verify task: ${goal}`,
      "qr-code"
    );

    addHistory("Silent app prompt shown", goal);
    updateUI();
    return;
  }

  if (dndMode === "focus") {
    timerMode.textContent = "Soft prompt";

    setQrCard(
      "active",
      "Soft reminder",
      `Focus Mode: Complete when ready. ${getConnectedDeviceLabel()} is waiting to verify: ${goal}.`,
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

  setQrCard(
    "active",
    "Time to move!",
    `Task: ${goal}. Walk and tap here to scan an Area QR to verify!`,
    "qr-code"
  );

  addHistory("Movement task shown", goal);
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

    setQrCard(
      "success",
      "Daily goal completed!",
      `You reached ${dailyGoal} points today. Your streak is now ${streak} day(s)!`,
      "flame"
    );

    addHistory("Daily goal completed", `Streak: ${streak} day(s)`);
  }
}

function verifyMovementFromDevice() {
  if (!deviceConnected) {
    setQrCard(
      "active",
      "Device disconnected",
      "Connect a phone or smart watch before movement can be verified.",
      "wifi-off"
    );
    return;
  }

  if (!movementRequired) {
    setQrCard(
      "idle",
      "No active movement task",
      "The connected device has not triggered a movement task yet.",
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

  setQrCard(
    "success",
    "Goal accomplished!",
    `${getConnectedDeviceLabel()} verified: ${currentVerifiedGoal}. +${earned} points earned.`,
    "badge-check"
  );

  addHistory("Device verified movement", `${currentVerifiedGoal} · +${earned} points`);

  setTimeout(() => {
    if (!movementRequired) {
      setQrCard(
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

function simulatePassiveDeviceActivity() {
  if (!deviceConnected) {
    setQrCard(
      "active",
      "Device disconnected",
      "Connect a phone or smart watch before passive activity can be tracked.",
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
      detail: `${getConnectedDeviceLabel()} detected walking motion`,
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
    setQrCard(
      "idle",
      "Passive point limit reached",
      "The connected device is still tracking activity, but passive points are capped for today.",
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

  setQrCard(
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

function showDevicesTab() {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-page").forEach(page => page.classList.remove("active"));

  const devicesTab = document.querySelector('[data-tab="devices"]');
  const devicesPage = document.getElementById("devices");
  devicesTab.classList.add("active");
  devicesPage.classList.add("active");
  lucide.createIcons();
}

function setConnectedDevice(type, name, method) {
  deviceConnected = true;
  connectedDeviceType = type;
  connectedDeviceName = name;
  connectionMethod = method;
  timerMode.textContent = "Ready";

  setQrCard(
    "success",
    `${name} connected`,
    "Movement monitoring is ready. The QR scan simulation is also available.",
    type === "watch" ? "watch" : "smartphone"
  );

  addHistory("Device connected", `${name} · ${method}`);
  updateUI();
}

function handleDeviceMotion(event) {
  if (!deviceConnected || connectedDeviceType !== "phone") return;

  const acceleration = event.accelerationIncludingGravity || event.acceleration;
  if (!acceleration) return;

  const x = acceleration.x || 0;
  const y = acceleration.y || 0;
  const z = acceleration.z || 0;
  const magnitude = Math.sqrt((x * x) + (y * y) + (z * z));

  if (magnitude > 12.5) {
    motionSampleCount += 1;
    activityStatusTitle.textContent = "Phone movement detected";
    activityStatusText.textContent = "Live phone sensor activity received.";
    activityStatusDot.className = "sensor-dot active";

    if (movementRequired && motionSampleCount >= 3) {
      motionSampleCount = 0;
      verifyMovementFromDevice();
    }
  } else {
    motionSampleCount = Math.max(0, motionSampleCount - 1);
  }
}

async function connectPhone() {
  try {
    const connectionIssue = getPhoneConnectionIssue();
    if (!connectionIssue.startsWith("Ready.")) {
      throw new Error(connectionIssue);
    }

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") {
        throw new Error("Motion sensor permission was not granted.");
      }
    }

    setQrCard(
      "active",
      "Checking this mobile device",
      "Move the phone slightly while SIP Move verifies a live motion sensor reading.",
      "smartphone"
    );

    await waitForMotionSensorSample();

    if (deviceConnected) disconnectDevice(false);
    window.addEventListener("devicemotion", handleDeviceMotion);
    setConnectedDevice("phone", "This Mobile Device", "Verified motion sensors");
  } catch (error) {
    setQrCard(
      "active",
      "Phone connection not completed",
      error.message || "Allow motion access to use this phone for verification.",
      "triangle-alert"
    );
  }
}

async function connectWatch() {
  const connectionIssue = getWatchConnectionIssue();
  if (!connectionIssue.startsWith("Only watches")) {
    setQrCard(
      "active",
      "Bluetooth pairing unavailable",
      connectionIssue,
      "bluetooth-off"
    );
    return;
  }

  try {
    const selectedDevice = await navigator.bluetooth.requestDevice({
      filters: SMART_WATCH_FILTERS,
      optionalServices: SMART_WATCH_OPTIONAL_SERVICES
    });

    if (!selectedDevice.gatt) {
      throw new Error("The selected device does not expose a Bluetooth data connection.");
    }

    await selectedDevice.gatt.connect();
    if (deviceConnected) disconnectDevice(false);
    bluetoothDevice = selectedDevice;
    bluetoothDevice.addEventListener("gattserverdisconnected", handleWatchDisconnected);

    setConnectedDevice("watch", selectedDevice.name || "Smart Watch", "Web Bluetooth");
  } catch (error) {
    const cancelled = error.name === "NotFoundError";
    setQrCard(
      cancelled ? "idle" : "active",
      cancelled ? "Pairing cancelled" : "Watch connection failed",
      cancelled
        ? "No compatible watch was selected. Watches that do not advertise a supported name or service may require a companion app."
        : (error.message || "The watch could not be connected."),
      cancelled ? "watch" : "triangle-alert"
    );
  }
}

function connectDemoWatch() {
  if (deviceConnected) disconnectDevice(false);
  setConnectedDevice("watch", "Demo Smart Watch", "Prototype simulation");
}

function handleWatchDisconnected(event) {
  if (event.target !== bluetoothDevice) return;
  bluetoothDevice = null;
  disconnectDevice(false);

  setQrCard(
    "active",
    "Smart watch disconnected",
    "Return to Devices to pair it again.",
    "bluetooth-off"
  );
}

function disconnectDevice(showMessage = true) {
  window.removeEventListener("devicemotion", handleDeviceMotion);

  const deviceToDisconnect = bluetoothDevice;
  bluetoothDevice = null;
  if (deviceToDisconnect?.gatt?.connected) {
    deviceToDisconnect.gatt.disconnect();
  }

  clearInterval(timer);
  timer = null;
  movementRequired = false;
  motionSampleCount = 0;
  deviceConnected = false;
  connectedDeviceType = null;
  connectedDeviceName = "";
  connectionMethod = "";
  timerMode.textContent = "Offline";

  if (showMessage) {
    setQrCard(
      "active",
      "Device disconnected",
      "Connect this phone or a smart watch to continue monitoring inactivity.",
      "wifi-off"
    );
    addHistory("Device disconnected", "Monitoring stopped");
  }

  updateUI();
}

function activateDnd() {
  dndMode = dndSelect.value;
  clearInterval(dndTimer);

  if (dndMode === "off") {
    dndRemainingSeconds = 0;

    setQrCard(
      "idle",
      "Scan Area QR",
      "Tap here to scan a QR code at your desk or study area.",
      "qr-code"
    );

    updateUI();
    return;
  }

  dndRemainingSeconds = Number(dndDuration.value) * 60;

  setQrCard(
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

      setQrCard(
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
    return "Class Mode keeps the connected device silent but still shows a subtle app reminder.";
  }

  if (dndMode === "exam") {
    return "Exam Mode mutes vibration and app prompts to prevent disruption.";
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
    setQrCard(
      "active",
      "Not enough points",
      `${rewardName} needs ${cost} points. Keep moving to unlock it.`,
      "lock"
    );
    return;
  }

  points -= cost;
  unlockedRewards.unshift(`${rewardName} - redeemed for ${cost} points`);

  setQrCard(
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
  localStorage.setItem("sipMoveTheme", theme);

  setQrCard(
    "idle",
    "Theme changed",
    `Your app theme is now ${themeSelect.options[themeSelect.selectedIndex].text}.`,
    "palette"
  );
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("sipMoveTheme") || "ocean";

  document.body.setAttribute("data-theme", savedTheme);
  document.documentElement.setAttribute("data-theme", savedTheme);

  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
}

function saveDailyGoal() {
  const newGoal = Number(dailyGoalInput.value);

  if (!newGoal || newGoal < 50) {
    setQrCard(
      "active",
      "Invalid goal",
      "Please set a daily goal of at least 50 points.",
      "alert-circle"
    );
    return;
  }

  dailyGoal = newGoal;

  setQrCard(
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

  setQrCard(
    "idle",
    "Demo progress reset",
    "Points, streak, passive activity, verified breaks, rewards, and progress have been reset to 0.",
    "rotate-ccw"
  );

  updateUI();
}

// Add the interactive on-tap QR scanner action
if (qrScanCard) {
  qrScanCard.addEventListener("click", () => {
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

      setQrCard(
        "success",
        "Break Verified!",
        `Scanned at ${randomArea}. +${earned} points earned!`,
        "badge-check"
      );

      addHistory("Area QR Verified Break", `${randomArea} · +${earned} points`);
    } else {
      const scanPoints = 10;
      addMovementPoints(scanPoints);
      
      setQrCard(
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
        setQrCard(
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
connectBtn.addEventListener("click", showDevicesTab);
connectPhoneBtn.addEventListener("click", connectPhone);
connectWatchBtn.addEventListener("click", connectWatch);
demoWatchBtn.addEventListener("click", connectDemoWatch);
disconnectDeviceBtn.addEventListener("click", () => disconnectDevice(true));

verifyMovementBtn.addEventListener("click", verifyMovementFromDevice);
simulateMovementBtn.addEventListener("click", verifyMovementFromDevice);

if (simulatePassiveActivityBtn) {
  simulatePassiveActivityBtn.addEventListener("click", simulatePassiveDeviceActivity);
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
updateConnectionAvailability();
updateUI();
lucide.createIcons();
