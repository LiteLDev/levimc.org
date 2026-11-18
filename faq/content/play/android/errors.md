# LeviLauncher on Android: errors and crashes

## LeviLauncher on Android says Minecraft is not installed / cannot be found (or the main program cannot be found after switching to a modified APK). How do I fix it?

The launcher only loads the official Minecraft already installed on the phone (package name `com.mojang.minecraftpe`). When you see a message such as "Minecraft is not installed... please install it from the Google Play Store first" or "Not licensed MC":

1. Make sure the official Minecraft is installed or updated to 1.21.80 or later from Google Play, then reopen LeviLauncher;
2. Do not replace the original app with a modified APK that has shaders/MBL2 and the like injected. A modified MC, or one installed from a non-Google-Play source, cannot pass verification; uninstall it, reinstall the original from Google Play and launch it once, and update the launcher to the latest version. For the features you need, import native mods (`.so` / `.levipack`) through the launcher; modifying the package is not necessary;
3. If you really have the Google Play version installed and it is still not detected, check whether the system restricts LeviLauncher from reading the installed app list (some Chinese ROMs have a permission switch such as "Get app list"), enable it and try again.

*Applies to: LeviLauncher-Android all current versions (latest v1.7.1)*

## After the Flarial client was removed from and later re-listed on Google Play, importing its .so into LeviLauncher on Android crashes when I enable certain modules. Why?

The newer Flarial checks the package name; when it runs inside LeviLauncher the check fails and causes a crash. The package-name check must be modified or removed (or use a `.so` extracted from an older Flarial). This is behavior of the third-party client and is not officially supported by LeviLauncher.

*Applies to: Flarial versions after it was re-listed; LeviLauncher-Android current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After using the BedrockTools mod in LeviLauncher on Android, the game crashes when I place or open functional blocks with a UI such as shulker boxes, anvils, crafting tables and chests. What should I do?

The cause is that the mod's signature no longer matches (it appeared with MC 26.50). The mod author has released a fixed version, so update BedrockTools. A temporary workaround before the fix: change the touch control mode to "Joystick + crosshair".

*Applies to: Older BedrockTools from the MC 26.50 period. Not confirmed against the source code or the documentation: treat it as a pointer.*

## When LeviLauncher on Android (formerly LeviLaunchroid) downloads the game, the progress hangs (for example at 15%). What should I do?

This is usually a network problem; the download works normally once you use a proxy. Also make sure you downloaded the latest launcher from the official GitHub (<https://github.com/LiteLDev/LeviLauncher-Android/releases>). Note that since v1.7.0 game downloads go through Google Play (you must sign in with a Google account that owns Minecraft), so on networks that cannot reach Google directly you must use a proxy. Downloads support resuming; after an interruption, tap "Retry" to continue.

*Applies to: LeviLauncher-Android; since v1.7.0 the download source is Google Play. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where are the crash logs (tombstone xcrash files) after the game crashes in LeviLauncher on Android?

They are in `/storage/emulated/0/Android/media/org.levimc.launcher/crash_logs/`, with file names like `tombstone_xxx__org.levimc.launcher.native.xcrash`. You can jump to that path with a file manager such as MT Manager and take the file out, then send it to the developers or attach it to an issue at <https://github.com/LiteLDev/LeviLauncher-Android/issues> for investigation (the crash screen also offers a share function). If that directory is not writable, the launcher falls back to `Android/data/org.levimc.launcher/files/crash_logs/`.

*Applies to: LeviLauncher-Android current version (v1.7.1)*
