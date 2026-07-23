# Budge Prototype — Third Iteration

Budge is a static movement-reminder prototype for the USI2001 Social Innovation Project.

## What changed in this iteration

- The application, page title, and browser icon now use the Budge name and supplied brand artwork.
- Watch pairing offers profiles for Fitbit/fitness bands, Samsung, Apple Watch, Garmin, other named watches, and a clearly warned compatibility scan.
- Fitbit discovery now includes common model-family names such as Charge, Inspire, Versa, Sense, Luxe, and Ace, alongside standard Bluetooth fitness services.
- A paired Bluetooth link is reported separately from access to fitness or motion data.
- Phone movement points require 12 seconds of sustained movement. A pause longer than 1.6 seconds resets the verification progress.
- The manual verification control cannot bypass the sustained-movement requirement. The separate demo control remains available and is labelled as a simulation.

## Watch compatibility

Web Bluetooth can connect only when the watch advertises a Bluetooth GATT service or discoverable name that the browser may request. Many consumer watches keep motion data inside their companion ecosystems:

- Fitbit provides account-authorized data through the Fitbit Web API.
- Apple Watch health and activity data is normally accessed through Apple Health/HealthKit in an Apple-platform app.
- Galaxy Watch data normally syncs to Samsung Health on Android.

The Compatibility scan can reveal watches with unexpected advertised names, but it will also show unrelated Bluetooth devices and does not guarantee that motion data is exposed.

## Running the prototype

Serve the folder over HTTPS or localhost and open `index.html` in a supported browser. Real phone motion and Web Bluetooth are unavailable on an insecure page. The Area QR and passive activity controls remain presentation simulations.

## Official technical references

- Chrome Web Bluetooth: https://developer.chrome.com/docs/capabilities/bluetooth
- Fitbit Web API: https://dev.fitbit.com/build/reference/web-api/explore/
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
- Samsung Health device manager: https://developer.samsung.com/health/data/guide/features/device-manager.html

## Access Application
- https://ngsienjennifer.github.io/SIP-App/
