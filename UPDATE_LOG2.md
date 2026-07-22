# SIP Move — Second Iteration Update Log

## Summary

This iteration corrects false phone connections and narrows the Bluetooth watch picker. The original First Iteration in `Downloads/SIP-App-main` was left unchanged.

## 1. Phone connection is now verified

### Before

`connectPhone()` treated the current browser as a connected phone whenever `DeviceMotionEvent` existed. Some desktop browsers expose that API even when no usable motion sensor is present.

```js
if (typeof DeviceMotionEvent !== "undefined") {
  motionSensorsAvailable = true;
  method = "Browser motion sensors";
}

setConnectedDevice("phone", "This Phone", method);
```

### After

The app now:

1. Checks whether the browser is likely running on a phone or tablet.
2. Requires HTTPS/localhost and the motion API.
3. Requests motion permission when the operating system requires it.
4. Waits up to five seconds for an actual motion-sensor event.
5. Marks the phone connected only after a real sample arrives.

```js
const connectionIssue = getPhoneConnectionIssue();
if (!connectionIssue.startsWith("Ready.")) {
  throw new Error(connectionIssue);
}

await waitForMotionSensorSample();
window.addEventListener("devicemotion", handleDeviceMotion);
setConnectedDevice("phone", "This Mobile Device", "Verified motion sensors");
```

The phone button is disabled on desktop browsers and the page explains that SIP Move must be opened directly on the mobile device.

## 2. Smart-watch discovery is filtered

### Before

The watch pairing request deliberately allowed every nearby Bluetooth device:

```js
const selectedDevice = await navigator.bluetooth.requestDevice({
  acceptAllDevices: true
});
```

### After

The unrestricted setting was removed. Pairing now requests devices that advertise the standard Bluetooth Heart Rate service or have a recognized watch/activity-band name prefix. Only the services used for compatibility checks are requested.

```js
const selectedDevice = await navigator.bluetooth.requestDevice({
  filters: SMART_WATCH_FILTERS,
  optionalServices: SMART_WATCH_OPTIONAL_SERVICES
});
```

This significantly reduces unrelated headphones, speakers, computers, and other nearby devices in the browser picker.

## 3. Connection guidance and accessibility

### Before

The interface did not explain browser/device requirements and status changes were not explicitly announced to assistive technology.

### After

- Added live compatibility text below the phone and watch buttons.
- Added an explanation of why a generic nearby phone cannot act as a Bluetooth motion sensor from a normal webpage.
- Added `aria-live`/status semantics for connection feedback.
- Added disabled-button styling and ready/warning status colors.
- Updated the wording from “This Phone” to “This Mobile Device” to avoid implying that a PC browser is a phone.

## 4. Explicit timer-button bindings

### Before

The timer controls relied on the browser's legacy behavior of creating global JavaScript variables from HTML element IDs (`startBtn`, `pauseBtn`, and `resetBtn`).

### After

The three controls are now obtained explicitly with `document.getElementById(...)`, matching the rest of the application. This was added after validation exposed the hidden dependency, and makes the script more reliable in stricter browsers and test environments.

## Hiccups and necessary limitations

### Nearby phone over Bluetooth

Web Bluetooth can connect only to devices that deliberately advertise a permitted Bluetooth GATT service. iPhones and Android phones do not expose their motion sensors as a generic browser-accessible Bluetooth service. A true PC-to-phone link therefore needs an additional companion phone app/page and a defined data channel (for example, a custom BLE service or a WebRTC/WebSocket connection). This was not simulated as a real connection because doing so would recreate the original false-positive problem.

### Watch compatibility

Smart-watch Bluetooth implementations are fragmented. Apple Watch and many Wear OS/Fitbit/Garmin devices may hide sensor services or permit them only through their official companion apps. The new picker is safer and more relevant, but a watch that does not advertise the standard Heart Rate service or a recognized name may not appear. Production support should be based on a confirmed list of target watch models and their documented services.

## Files changed

- `script.js` — device detection, live sensor verification, filtered watch pairing, connection availability messages.
- `index.html` — revised device labels, connection requirement notes, and accessibility status regions.
- `style.css` — compatibility notes, disabled states, and limitation notice styling.
- `README.md` — updated Second Iteration behavior and browser limitations.
- `UPDATE_LOG.md` — this before/after record.

## Validation completed

- JavaScript syntax check passed.
- Confirmed a desktop browser remains in the “No Device Connected” state and has the mobile-device control disabled.
- Confirmed the mobile flow does not connect until a live motion event is received.
- Confirmed the watch request contains filters and no unrestricted `acceptAllDevices` option.
- Confirmed a successfully selected mock watch updates the connected-device state.
- Confirmed all HTML IDs remain unique.

Physical Bluetooth and motion-sensor testing still needs to be performed over HTTPS on the intended phone and watch models, because this workspace has no access to that hardware.
