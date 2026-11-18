# Installing LeviLauncher on Android

## Does LeviLauncher have an Android version? The website only shows an exe; where do I download the Android APK? Where do I report problems?

Yes. The exe on the website/docs is the Windows version (repository `LiteLDev/LeviLauncher`); the Android version is a separate repository, `LiteLDev/LeviLauncher-Android` (formerly LeviLaunchroid; old links redirect automatically). Download the APK from GitHub Releases: <https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>. Both versions share one set of documentation: <https://levimc.org/LeviLauncher/?platform=android> (choose the Android tab on the download page). Report Android problems at <https://github.com/LiteLDev/LeviLauncher-Android/issues> and include the Android version, device model and launch log. Requirements: an ARM64 device running Android 9.0+ with a licensed Minecraft Bedrock Edition 1.21.80 or later installed from Google Play.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## The version list in Android LeviLauncher is empty / it says license verification is required / it cannot find any game version. What is going on?

LeviLauncher on Android requires license verification: you must buy Minecraft on Google Play and install it from Google Play (1.21.80 or later); purchases on other platforms such as the Microsoft Store do not work. After installing, it is best to launch the game once before opening the launcher. Cracked MC and modified launchers downloaded from cloud drives are not supported; download the official version from <https://github.com/LiteLDev/LeviLauncher-Android/releases>.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## How do I import a .so mod in LeviLauncher Android?

There are two ways:

1. Find the `.so` (or a `.levipack` / `.mcmod` mod pack) in a file manager, choose "Open with" and select LeviLauncher to import it;
2. On the launcher's "Mods" page, tap "Add mod" and pick the file with the file picker (you can also put the file in the phone's `Download` folder, tap "Scan", and then add it).

Note that it must be a native mod compiled for Android (`arm64-v8a`); you cannot rename a Windows `.dll` to `.so`.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## Can LeviLauncher on Android import apk/apks packages through the system "Share" function? When using MC from a third-party source, after I sign in and tap "Next" it goes straight back to the launcher's home page. What should I do?

LeviLauncher only supports the licensed Minecraft installed from the Google Play Store. It checks the installation source of MC on the device; a non-Play source (cracked/re-signed package) triggers a "Play Store version required" message, or problems such as being unable to sign in or being returned to the home page after tapping Next. apk/apks files cannot be imported through system sharing. On the launcher's "Download" page, tap "Import APK" (APK/APKS are supported), or sign in with a Google account that owns MC and download directly from Google Play. An apks file is a split package; merging it into a single apk yourself changes the signature, so it cannot be treated as licensed. The licensed MC downloaded from the Play Store must still be installed on the device.

*Applies to: LeviLauncher-Android current version (v1.7.x)*

## On Android, a LeviLauncher or MC package downloaded from an unofficial source (cloud drive / QQ group / forum / version library) gives a black screen, crashes on launch (for example producing `tombstone_xxx_org.levimc.launcher...xcrash`), or fails to import. What should I do?

1. Download the launcher only from the official GitHub Release: <https://github.com/LiteLDev/LeviLauncher-Android/releases/latest> (download `LeviLauncher-vX.Y.Z-release.apk`; the repository was formerly named LeviLaunchroid and old links redirect; after installation the app is named LeviLauncher with package name `org.levimc.launcher`). Launchers from unofficial sources are not guaranteed to work and receive no support.
2. MC must be the licensed Minecraft Bedrock Edition bought on Google Play (1.21.80 or later, `arm64-v8a` 64-bit), and the Google Play version of Minecraft must be installed on the device. Problems with packages from forums, version libraries or cloud drives, or with cracked or verification-free builds, are not supported. The Google Play version must be bought separately; purchases on other platforms do not carry over.
3. Since v1.7.0 you can sign in on the launcher's "Download" page with a Google account that owns the game and download Minecraft directly from Google Play, with no need to find a package yourself.
4. Imported versions usually need "Version isolation" enabled in the instance settings before they can launch.

*Applies to: LeviLauncher-Android current version (v1.7.x); the Google Play download feature requires v1.7.0+*

## Updating LeviLauncher on Android from inside the launcher fails, or it says "signature mismatch" and cannot install. What should I do?

The in-launcher update fetches the latest Release through the GitHub API, downloads the APK and hands it to the system to install, so it fails when your network cannot reach GitHub. In that case, download the new APK yourself from GitHub Releases (<https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>) or from a working mirror and install it over the existing app. If it says "signature mismatch", the installed app is not an official build (for example, it was repackaged and re-signed by someone else), and the system does not allow overwriting it with the officially signed APK. Back up your data first (export your worlds, etc.), uninstall, and then install the APK from the official Release.

*Applies to: LeviLauncher-Android all current versions*

## When I update LeviLauncher on Android, is old data (including in-game data) kept?

Yes. Install the new version over the old one without uninstalling (or use the in-launcher update) and your data is kept, provided that both old and new versions are officially signed builds (otherwise you get a signature mismatch and must uninstall and reinstall, which erases the launcher's data). For important worlds, back them up outside the app's storage first (you can use the launcher's export function).

*Applies to: LeviLauncher-Android all current versions*

## Where do I download .so client mods for LeviLauncher on Android?

Download inside the launcher first: the home page has "LeviMC Mods" (from the levimc.org mod catalog; it lists only mods that have an Android arm64 client build, provided the author has uploaded it to that platform) and "External Mods" (the community-maintained LeviModHub catalog; downloads go through a GitHub proxy, `gh-proxy.org` by default). For mods that are not in the launcher, use the Discord button on the "External Mods" page to join the community Discord and get them from the plugin section; some mods are also published on CurseForge as mcpack files (containing a `.so`). Install mods only from trusted sources, and pick the arm64 build that matches your MC version.

*Applies to: LeviLauncher-Android v1.7.0 and later (built-in mod catalog)*

## After importing a mod pack in LeviLauncher on Android there are no mod features and the Download page shows no downloadable versions, although it used to work. What is going on?

First update the launcher to the latest version at <https://github.com/LiteLDev/LeviLauncher-Android/releases> (the old repository name LeviLaunchroid has been renamed to LeviLauncher-Android). The root cause is that the launcher only supports licensed Minecraft: the official Minecraft installed from Google Play (`com.mojang.minecraftpe`) must be present on the system, otherwise launching is refused. Since v1.7.0 the "Download" page downloads directly from Google Play by signing in with a Google account that owns Minecraft; if you are not signed in or the account has not bought the game, the list is empty (the page explains why). It usually worked before because an unlicensed copy was being used. Do not use launchers or games from unknown sources.

*Applies to: LeviLauncher-Android v1.7.0 and later (Download page notice); license verification applies to all current versions*

## Can I delete the Minecraft installed on the phone's home screen and keep it only inside LeviLauncher on Android? What if launching fails after I delete it?

No. The launcher requires a licensed Minecraft installed from Google Play (package name `com.mojang.minecraftpe`, 1.21.80 or later) to always be installed on the system, and it checks its installation source at launch. Other imported version APKs can run inside the launcher without being installed to the system one by one, but they cannot replace this system installation. If you changed the package name to run side by side and things now misbehave, delete the current Minecraft, reinstall the version with the normal package name from Google Play, and launch from the launcher; after that you can import packages of other versions in the launcher, and delete versions from the instance's settings.

*Applies to: LeviLauncher-Android all current versions (v1.7.1)*
