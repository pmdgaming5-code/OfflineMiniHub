# OfflineMiniHub / BLOX HUB

BLOX HUB is a local Three.js mini-game hub packaged in an Android WebView. The APK contains the web assets and bundles Three.js at build time, so gameplay does not require an internet connection.

## Android build

The GitHub Actions workflow builds `app-debug.apk` and uploads it as `OfflineMiniHub-debug-apk`. The workflow also downloads Three.js r128 during the build and places it into the APK assets.
