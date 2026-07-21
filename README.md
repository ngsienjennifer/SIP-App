# SIP Move Prototype

A static movement-reminder prototype for the UDE2222 Design Innovation Group Project.

## Device connections

- **This Phone:** uses the browser's Device Motion API when permission and sensor access are available. A demo-sensor fallback keeps the prototype usable on desktop browsers.
- **Smart Watch:** opens the browser's Web Bluetooth device picker on supported secure browsers. Compatibility depends on whether the watch exposes a Bluetooth GATT connection to the browser.
- **Demo Smart Watch:** provides a hardware-free connection for presentations.

The Area QR button remains a simulated scan for demonstrations; it does not access the camera.

Open `index.html` in a browser to run the prototype. Web Bluetooth requires a supported browser and a secure HTTPS page.

Existing published demo: https://ngsienjennifer.github.io/SIP-App
