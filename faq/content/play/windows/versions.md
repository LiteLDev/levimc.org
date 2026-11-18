# LeviLauncher on Windows: versions and compatibility

## Does LeviLauncher (Windows) support the UWP edition and Minecraft versions older than 1.21.120? Can it import a local appx installer?

Yes. Early versions supported only the GDK edition (1.21.120+), but UWP support was added in LeviLauncher v1.0.0 (2026-09-13), and the current version is a launcher for both GDK and UWP. The version list on the download page shows both GDK builds and UWP (appx) builds, and you can also import a local `.msixvc` / `.appx` / `.msix` / `.appxbundle` / `.msixbundle` installer to create an instance (command line: `LeviLauncher.exe install <version|file>`).

Using a UWP instance requires Windows Developer Mode and the UWP framework dependencies required by the package manifest. A UWP instance is registered to the system automatically when launched (it takes the "installed Minecraft" slot of that channel). UWP x64 versions 1.19.70.2 and later support instance isolation; a UWP instance that is not isolated shares the channel's original `LocalState` data, so back up your worlds before you start.

The native DLL mod loader supports only x64 packages; automatic LeviLamina installation still applies only to supported GDK versions (the LeviLamina client itself supports only the few versions for which Mojang provides the required data).

*Applies to: LeviLauncher (Windows) 1.0.0 and later*

## Can LeviLauncher be used together with third-party injection clients such as Onix, Flarial, Latite and Oderso? Why do Flarial and others not detect a game launched with LeviLauncher?

Generally no. The game process launched directly by LeviLauncher has no package identity, so when third-party clients call WinRT interfaces they get `WinRT throwing: 0x80073D54 : The process has no package identity` and cannot detect it.

You can use "Register to system" (the option next to the launch button) for that version, launch from the system entry point after registering, and then let the third-party client inject; newer Flarial versions added dedicated compatibility, so it is worth trying. Some users tested Latite, Oderso and Onix and found they do not work together with it. Third-party client compatibility changes with their own versions.

Also do not put the dll of clients such as Onix into LeviLauncher's `mods` directory as a mod: injection and operation work differently and this causes crashes. Injecting together with the LeviLamina client also tends to conflict.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## I own a licensed copy, but LeviLauncher says I need to "unlock the full game", turns into a trial, or the Microsoft Store only shows the education edition when downloading or launching the Preview. What should I do?

The Preview requires the account to own a separate Preview licence. First check in the launcher's account info (or with `LeviLauncher.exe account status --refresh`) that the Preview entry is "owned" rather than "trial/not owned". If it is not, first obtain or download Minecraft Preview once through the Microsoft Store (or the Xbox app).

The Preview used to be region-locked for mainland China (the region lock is Microsoft Store behaviour): in Windows Settings under "Time & language -> Language & region", change "Country or region" to somewhere outside mainland China (for example Canada or the United States); the account itself does not need to change. The release version does not need a region change.

Also, one Microsoft account can sign in to the Store on at most 10 devices and the launcher counts as one device; exceeding the limit also produces an unauthorized state. Remove old devices at <https://account.microsoft.com/devices/content>.

*Applies to: LeviLauncher (Windows) 1.0.0 and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why is a mod, or the option to install LeviLamina, greyed out and unclickable in LeviLauncher?

Because the current instance's game version is outside the supported range of that mod or of LeviLamina (the UI shows "This game version does not support LeviLamina" or "No package matches this version and platform"). Switch to a game version that the mod or LeviLamina supports (for example, some mods support only 26.60).

*Applies to: LeviLauncher 1.1.0*

## LeviLauncher says Windows needs an update, but the system (for example a rented cloud PC) does not allow updates. What should I do?

The maintainers recommend upgrading the launcher (it was v1.1.0-beta.5 at the time; use the latest stable release v1.1.0 or later now).

If the message is "The current Windows version does not meet the minimum requirements of this UWP package" (`ERR_UWP_SYSTEM_VERSION`), shown when installing a UWP version, the only option is to choose a game version compatible with the system.

*Applies to: LeviLauncher 1.1.0-beta.5 and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Installing LeviLamina for a new game version (such as 26.51.3) with LeviLauncher says "unsupported version". Do I need to install it manually with lip?

Usually the table mapping LeviLamina to game versions does not include the new version yet. The maintainers keep this table in the remote repository `LiteLDev/levilamina-client-version-db`; once it is updated you can install without upgrading the launcher, so just wait for the maintainers to update it. If you are in a hurry, you can install the matching LeviLamina version manually with lip as a temporary workaround.

*Applies to: LeviLauncher 1.1.0*

## After loading a shader pack in LeviLauncher the UI turns into "logs" (wood textures), text disappears, or the game even crashes. What should I do?

Whether it works depends on the shader pack itself. The shader version must match the game version (for example, MC 26.50 needs a shader built for 26.50). You can open CurseForge from the content download entry on the launcher's home page, search for `newb`, and download the version whose name carries 26.50+ (matching the game version).

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## After loading the Glacie client with LeviLauncher the game crashes when joining a server. Can LeviLauncher use Glacie?

LeviLauncher can load Glacie, but Glacie is not a LeviLamina-based mod, and at the time it supported only up to 26.20 (the versions Glacie supports are defined by its own releases). Loading other non-LeviLamina dll mods in an instance that has LeviLamina loaded easily causes conflicts and crashes, so do not use the two in the same instance. To use Glacie, use an instance without LeviLamina and choose a game version that Glacie supports.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why does licensed-copy verification fail when I run an old UWP version of Bedrock Edition (such as 1.18.12) with the launcher, and how do I fix it?

Around 1.19.70, Microsoft changed the Xbox authentication public key. Old UWP builds still contain the old key, so licensed-copy verification fails. Since v1.0.2, LeviLauncher automatically replaces the old public key with the new one when it installs an old UWP version and before it launches an existing instance (a build that contains both the old and the new key is left untouched), so you don't need to do anything. If you use another launcher or install manually, you can patch the game executable yourself with KeyPatcher.

*Applies to: LeviLauncher v1.0.2 and later (UWP instances)*
