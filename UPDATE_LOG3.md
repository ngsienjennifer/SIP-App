# Budge — Third Iteration Update Log

## Summary

The Third Iteration starts from the Second Iteration and preserves its desktop phone guard and default filtered watch discovery. This update expands watch discovery, separates “paired” from “movement data available,” applies the Budge branding, and replaces instant phone-motion rewards with sustained verification.

The First Iteration in `Downloads/SIP-App-main` and the Second Iteration output were left unchanged.

## 1. Expanded smart-watch discovery

### Before

The Second Iteration used one fixed list containing only brand-level prefixes such as `Fitbit`, `Galaxy Watch`, and `Garmin`:

```js
const selectedDevice = await navigator.bluetooth.requestDevice({
  filters: SMART_WATCH_FILTERS,
  optionalServices: SMART_WATCH_OPTIONAL_SERVICES
});
```

Fitbit devices may advertise a model-family name such as `Charge`, `Inspire`, `Versa`, or `Sense`, so a `Fitbit` prefix alone can omit them.

### After

The Devices screen now provides watch-family profiles. Each profile supplies appropriate advertised-name prefixes plus standard fitness-service filters:

```js
const watchProfile = getSelectedWatchProfile();
const requestOptions = watchProfile.acceptAllDevices
  ? { acceptAllDevices: true, optionalServices: SMART_WATCH_OPTIONAL_SERVICES }
  : { filters: watchProfile.filters, optionalServices: SMART_WATCH_OPTIONAL_SERVICES };

const selectedDevice = await navigator.bluetooth.requestDevice(requestOptions);
```

The Fitbit/fitness profile adds common families including Charge, Inspire, Versa, Sense, Luxe, Ace, Flex, Ionic, Blaze, and Surge. Samsung, Apple Watch, Garmin, and other-watch profiles are also available.

### Intentional compatibility fallback

A last-resort Compatibility scan was added for watches that advertise an unexpected name or only proprietary identifiers. It uses `acceptAllDevices: true`, but only after the user explicitly selects that warned option. The default remains filtered, avoiding the Second Iteration problem where every nearby device appeared without explanation.

## 2. Pairing no longer implies motion access

### Before

Any successful GATT connection was labelled as ready for movement monitoring:

```js
setConnectedDevice("watch", selectedDevice.name || "Smart Watch", "Web Bluetooth");
```

### After

Budge checks for permitted standard services after connecting and reports either the identified service or `paired only`:

```js
const gattServer = await selectedDevice.gatt.connect();
const accessibleFitnessService = await findAccessibleFitnessService(gattServer);
const connectionDetail = accessibleFitnessService
  ? `Web Bluetooth · ${accessibleFitnessService} service`
  : "Web Bluetooth · paired only";
```

This prevents a successful Bluetooth handshake from being presented as proof that accelerometer data is available.

## 3. Renamed the application to Budge

### Before

```html
<title>SIP Move</title>
<h1>SIP Move</h1>
```

### After

```html
<title>Budge — Movement Companion</title>
<h1>Budge</h1>
<link rel="icon" type="image/png" href="assets/budge-logo.png" />
```

The supplied logo was cleaned into a transparent PNG and added to the header, browser favicon, and Apple touch-icon metadata. The theme preference now writes to `budgeTheme`; it still reads the old `sipMoveTheme` key once for backward compatibility.

## 4. Sustained phone movement verification

### Before

Three accelerometer samples above a fixed magnitude immediately awarded points:

```js
if (magnitude > 12.5) {
  motionSampleCount += 1;
  if (movementRequired && motionSampleCount >= 3) {
    verifyMovementFromDevice();
  }
}
```

### After

Budge measures active movement time instead of counting a few spikes:

```js
if (movementIntensity >= MOVEMENT_ACCELERATION_THRESHOLD) {
  movementActiveDurationMs += eventGapMs;
}

if (movementActiveDurationMs >= MOVEMENT_REQUIRED_MS) {
  movementQualified = true;
  verifyMovementFromDevice({ source: "continuous-phone-motion" });
}
```

- Required active movement: 12 seconds.
- Maximum pause before reset: 1.6 seconds.
- Event time is capped so a delayed sensor event cannot add a large block of false progress.
- Linear acceleration is preferred; gravity-adjusted acceleration is the fallback.
- A visible progress bar shows verified seconds.
- Pressing the live verification control before completion only reports progress and awards no points.
- The separate simulation control explicitly passes `allowDemo: true`.

## Additional repairs and reasons

- **Theme-key migration:** `budgeTheme` replaces the old brand-specific key, while reading the previous value prevents an unnecessary theme reset for returning testers.
- **Brand-specific compatibility guidance:** each watch profile explains when the manufacturer's health platform may be required. This was necessary because broader Bluetooth discovery alone cannot expose private watch services.
- **Honest watch state:** the application now says `paired only` when no permitted standard fitness service is found. This avoids a false-positive connection state similar to the earlier phone issue.
- **Archived prior log:** the Second Iteration log is included as `SECOND_ITERATION_LOG.md` so the full change history remains available.

## Files changed or added

- `index.html` — Budge metadata/logo, watch-family selector, compatibility copy, and sustained-movement progress UI.
- `style.css` — brand logo, watch selector, and movement-progress styling.
- `script.js` — watch profiles, compatibility fallback, service inspection, sustained movement qualification, and theme-key migration.
- `assets/budge-logo.png` — cleaned transparent Budge logo generated from the supplied artwork.
- `README.md` — Third Iteration setup, behavior, limitations, and official references.
- `UPDATE_LOG.md` — this before/after record.
- `SECOND_ITERATION_LOG.md` — archived previous update log.

## Hiccups and limitations

1. **Fitbit:** the Fitbit Web API uses account authorization and synced data. A static page cannot silently replace that with direct BLE access. The expanded profile improves discovery, but some models will still require a real Fitbit OAuth integration and backend.
2. **Apple Watch:** Apple documents Apple Health/HealthKit as the route for health and activity data in Apple-platform apps. A normal static webpage cannot implement HealthKit.
3. **Samsung:** Galaxy Watch measurements normally sync into Samsung Health on a paired Android phone. Direct browser access depends on what the watch advertises.
4. **Proprietary services:** even when a watch appears and pairs, its motion service may be private, encrypted, or absent from browser permissions.
5. **Physical validation:** final Bluetooth and accelerometer calibration must be tested over HTTPS on the actual target models. The local workspace cannot access the user's watches or phone sensors.

## Validation completed

- JavaScript syntax check.
- HTML ID uniqueness and required asset checks.
- Logo transparency check confirming a real alpha channel with fully transparent and fully opaque pixels.
- Desktop false-phone guard and mobile availability checks.
- Sustained-motion simulation confirming one spike cannot award points.
- Sustained-motion simulation confirming the required active duration does award points.
- Watch-profile request checks, including Fitbit name prefixes and explicit compatibility-scan behavior.
- Pairing-state checks for both accessible standard services and paired-only devices.
