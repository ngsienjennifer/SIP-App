# SIP Move — First Iteration Change Log

Date: 21 July 2026

## Outcome

The dedicated ring dependency has been removed from the prototype. Users can now connect the current phone, pair a compatible smart watch through Web Bluetooth, or use a clearly labelled demo smart-watch connection. The Area QR scan simulation remains available for presentations.

## Files changed

### `index.html`

**Before**

```html
<h1>Holo Ring</h1>
<h3 id="connectionText">Ring Connected</h3>
<button class="tab" data-tab="ring">Ring</button>
```

**After**

```html
<h1>SIP Move</h1>
<h3 id="connectionText">No Device Connected</h3>
<button class="tab" data-tab="devices">Devices</button>
```

Changes:

- Rebranded ring-specific headings and copy to device-neutral SIP Move language.
- Replaced the Ring tab, ring artwork, simulated battery, and ring feature list with a Devices tab.
- Added controls for **Use This Phone**, **Pair Smart Watch**, **Demo Smart Watch**, and **Disconnect Device**.
- Added live device name and connection-method status fields.
- Renamed the QR card's ring-era `hologram*` IDs/classes to `qr*` names while preserving the simulated scan interaction.
- Updated movement, activity, history, settings, and DND copy to refer to the connected phone or smart watch.

### `script.js`

**Before**

```js
let ringConnected = true;
let battery = 82;

function toggleConnection() {
  ringConnected = !ringConnected;
}

function verifyMovementFromRing() { /* ... */ }
```

**After**

```js
let deviceConnected = false;
let connectedDeviceType = null;
let connectedDeviceName = "";
let connectionMethod = "";
let bluetoothDevice = null;

async function connectPhone() { /* requests/uses browser motion sensors */ }
async function connectWatch() { /* opens the Web Bluetooth picker */ }
function connectDemoWatch() { /* hardware-free presentation fallback */ }
function verifyMovementFromDevice() { /* device-neutral verification */ }
```

Changes:

- Removed the default always-connected ring state and fake ring battery drain.
- Added a shared connected-device model for phones and smart watches.
- Added phone connection through the browser Device Motion API, including iOS-style motion-permission handling.
- Added live phone-motion sampling; three strong motion samples can verify an active movement task.
- Added smart-watch selection and GATT connection through Web Bluetooth.
- Added automatic handling for unexpected Bluetooth disconnection.
- Added a demo smart-watch connection so presentations do not depend on available hardware or browser support.
- Replaced ring-specific connection, tracking, reminder, verification, history, and DND logic with device-neutral equivalents.
- Changed the saved theme key from `holoRingTheme` to `sipMoveTheme`.
- Kept the QR scan simulation: it still selects a sample campus area, verifies an active break when present, and otherwise awards the existing scan-demo points.

### `style.css`

**Before**

```css
.ring-orb { /* ... */ }
.big-ring { /* ... */ }
.ring-light { /* ... */ }
.hologram-card { /* ... */ }
```

**After**

```css
.device-orb { /* ... */ }
.connected-device-visual { /* ... */ }
.device-signal { /* ... */ }
.qr-card { /* ... */ }
```

Changes:

- Removed ring-specific artwork selectors and styles.
- Added phone/watch device status artwork, connection details, device-option buttons, and disconnect-button styles.
- Renamed the preserved QR interaction card styles to device-neutral QR names.
- Added matching dark-theme rules for the new device components.

### `README.md`

**Before**

```text
Quick and simple "Application" for UDE2222 Design Innovation Group Project
```

**After**

```text
SIP Move Prototype
Device connections: This Phone, Smart Watch, and Demo Smart Watch
```

Changes:

- Added setup and usage notes for phone sensors, Web Bluetooth, the demo watch, QR simulation, HTTPS, and browser compatibility.

## Additional repairs

- **Daily goal mismatch:** JavaScript previously started with a 150-point daily goal while the interface displayed and saved 600 points. The starting value is now 600 so the progress calculation matches the visible setting.
- **Legacy naming cleanup:** ring/hologram variable names, element IDs, CSS selectors, status messages, and the old theme-storage key were removed to prevent the retired hardware model from remaining in the codebase.

## Hiccups and implementation limits

- **No watch vendor/service specification was supplied.** The first iteration therefore uses the browser's generic Web Bluetooth picker and GATT connection. Reading vendor-specific health data or sending watch-native notifications will require the target watch model, its exposed BLE service UUIDs or platform SDK, and usually a native/companion application.
- **Web Bluetooth availability varies.** It generally requires a secure HTTPS page and a supported browser; some watches do not expose a browser-connectable GATT service. A demo smart-watch connection was added so the prototype remains presentable.
- **Phone motion access varies.** Some mobile browsers require an explicit permission prompt and some desktop browsers have no motion sensor. The app reports a demo-sensor connection in that case, and the existing manual movement simulation remains available.
- **The QR scanner remains intentionally simulated.** It does not request camera access or decode a physical QR code, matching the demo requirement.

## Verification performed

- JavaScript syntax check passed.
- All 54 JavaScript-referenced element IDs exist in `index.html`.
- HTML parsed successfully.
- CSS opening and closing brace counts match (136/136).
- No dedicated ring/hologram terms or legacy identifiers remain in the edited project.
