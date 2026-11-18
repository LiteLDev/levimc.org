# LeviLauncher on Windows: errors and crashes

## After using BetterRenderDragon in LeviLauncher (PC), the game crashes, shows a white screen, has no effect, or looks wrong in a world. How do I troubleshoot?

BetterRenderDragon is a third-party preload-type mod (currently maintained in the QYCottage fork: <https://github.com/QYCottage/BetterRenderDragon/releases>). The launcher no longer bundles it, so you need to import it yourself as a mod. Troubleshoot in this order:

1. Make sure the BetterRenderDragon version matches the game version (the release notes list the supported game versions).
2. If it still crashes right at startup although the versions match, use the no-imgui build (no UI in the top-left corner); this solves most crashes. AMD GPUs and some NVIDIA devices have compatibility problems.
3. Conflicts with other mods: minimap mods, 4dskin, BetterResourcePackManager and others are known to crash or stop working when used together with it. Disable them one by one to find the culprit, and check the launcher log.
4. White screen or broken visuals: turn off frame generation / AI frame generation in the GPU driver, driver overlays and any other program that modifies the game picture.
5. Broken visuals in a world can also mean the shader pack does not support the current game version, or an Android shader pack was used by mistake. Switch to a Windows RenderDragon shader pack that supports the current version.

*Applies to: LeviLauncher 1.0.0 and later (PC). Not confirmed against the source code or the documentation: treat it as a pointer.*

## What is "Register to system" in LeviLauncher for, and how do I fix a registration failure (cannot register appx)?

Registering means registering the version installed by the launcher as the system's Minecraft app package (it replaces the currently registered Microsoft Store version). Some clients without custom version detection (such as Onix) need to run on the registered version, and double-clicking a `.mcpack` to import it also requires a registered version.

The most common cause of registration failure is that Windows Developer Mode is off (reported as `ERR_DEV_MODE_REQUIRED` / `ERR_UWP_DEVELOPER_MODE`, or `0x80073CFF`, etc.): turn on "Developer Mode" in Windows Settings > System > For developers and retry, or run `LeviLauncher.exe doctor --fix developer-mode`.

If `ERR_UWP_PACKAGE_CONFLICT` is reported, a Minecraft installation other than the launcher's (for example a version registered by another launcher) holds the registration; uninstall it or remove that registration first.

The newer registration failure dialog lists the possible causes and has a button to open the log folder; an already registered instance can be unregistered with `LeviLauncher.exe instance unregister`. Newer versions no longer require installing the Microsoft GDK. Do not double-click the installed game files directly; start the game through the launcher.

*Applies to: LeviLauncher (Windows) 1.1.0 and later*

## After installing the game with the Windows LeviLauncher (no mods installed), launching reports `ERR_LAUNCH_GAME` or cannot start, and other versions behave the same. What should I do, and which dependencies are needed?

This applies to the GDK edition of Bedrock Edition; the `doctor` / `self-update` commands are the current CLI of 1.1.0. Troubleshoot in this order:

1. Make sure LeviLauncher is up to date (the launcher updates itself, or run `LeviLauncher.exe self-update`). An outdated launcher does not need to be reinstalled; updating is enough.
2. Run `LeviLauncher.exe doctor` to check the dependencies: Visual C++ runtime, GameInput, Gaming Services (required for the GDK edition), and so on. `LeviLauncher.exe doctor --fix` can repair the VC runtime and GameInput automatically (administrator confirmation required). Gaming Services must be installed from the Microsoft Store (<ms-windows-store://pdp/?ProductId=9MWPM2CQNLHN>).
3. The most common fix: install the vanilla Bedrock Edition once through the Microsoft Store / Xbox app and launch it successfully once (the Store pulls in dependencies such as the Xbox app and Gaming Services automatically; you can uninstall the Store version afterwards), and update the Xbox app in the Store too. This problem is common after reinstalling the system.
4. LTSC or stripped-down systems may lack the Microsoft Store and Gaming Services. See <https://www.mcappx.com/help/gdk-install/#windows> to install Gaming Services manually, then go online and restart.
5. With a proxy on, the Microsoft Store may hang; turn the proxy off or set domains containing `microsoft` and `bing` to direct connection.
6. If it still fails, delete the instance and download and install it again; run `LeviLauncher.exe play -v` to see detailed logs and report to GitHub Issues with the log.

Installing only DirectX or .NET Framework does not fix this problem.

*Applies to: LeviLauncher (Windows) 1.x*

## LeviLauncher reports Gaming Services missing or detection failed when launching the GDK edition of Minecraft, and the Microsoft Store cannot install it or the system is LTSC without a Store. What should I do?

This applies to the GDK edition of Bedrock Edition.

1. Check whether it is installed: in PowerShell (not cmd), run `Get-AppxPackage -Name Microsoft.GamingServices`; any output means it is installed. You can also run `LeviLauncher.exe doctor` and look at the `gaming-services` check. The GDK edition needs the VC runtime + GameInput + the Xbox app + Gaming Services.
2. If it is not installed, follow the launcher's prompt, or install Gaming Services from the Microsoft Store (<ms-windows-store://pdp/?ProductId=9MWPM2CQNLHN>).
3. LTSC or stripped-down systems lack the Microsoft Store, App Installer and Xbox components: paste a Store app link at <https://store.rg-adguard.net/> to download the appx/msixbundle and install it with PowerShell's `Add-AppxPackage`; or download components such as Xbox Gaming Services from MCAPPX (<https://www.mcappx.com/download/xbox-gaming-services/>, tutorial <https://www.mcappx.com/help/gdk-install/#windows>), adding whatever is missing. On LTSC the Xbox-related services are disabled by default and must be set to automatic in "Services". Beginners are better off switching to a full edition of Windows.
4. If system components are broken, run `sfc /scannow`.
5. If it is installed but the launcher still reports it missing, choose to ignore the prompt and continue launching (this check no longer forces an exit). The launcher does not check Gaming Services when you only use UWP instances.

*Applies to: LeviLauncher (Windows) 1.x*

## The PC LeviLauncher crashes or does nothing after a double-click (it exits before any window appears and there is no process in Task Manager). How do I troubleshoot?

The log path changed starting with v1.1.0. Troubleshooting steps:

1. Runtimes: at startup the launcher checks for the Visual C++ 2015-2022 x64 runtime and the WebView2 Runtime and shows a prompt to download and install any that are missing. If it still crashes although the check passes, the runtime is usually damaged or too old: install the latest VC++ x64 (<https://aka.ms/vc14/vc_redist.x64.exe>) and download and install the Microsoft Edge WebView2 Runtime again (in one real case the WebView2 installer said "already installed" but only a registry leftover existed; reinstalling fixed it). Do not delete Edge/WebView2.
2. Log: when startup fails before the window appears, a log is written to `%LOCALAPPDATA%\LeviLauncher\Logs\startup.log` (versions before v1.1.0 use `%APPDATA%\levilauncher.exe\logs\startup.log`). When asking for help or filing an issue, send this file instead of a screenshot.
3. Debug output: run `LeviLauncher.exe --debug` on the command line (`/debug` and `-debug` are also accepted), or append ` /debug` to the shortcut's "Target", to see console output.
4. A command-line self-check that does not depend on WebView2 (since v1.1.0): `LeviLauncher.exe doctor` (checks the VC++ runtime, GameInput, Gaming Services, WebView2, etc.); `LeviLauncher.exe doctor --fix vcruntime` repairs the runtime.
5. If none of that works, some users fixed it by running "Detect and repair" on the runtime with a DirectX repair tool, or by setting the EventLog / Task Scheduler (schedule) services to automatic in an administrator CMD and restarting (isolated cases, for reference only).

*Applies to: LeviLauncher (Windows) 1.1.0*

## After LeviLauncher finishes downloading Minecraft, clicking "Install" crashes the launcher (the version folder was created but is empty). How do I fix it?

The system most likely lacks the Visual C++ 2015-2022 x64 runtime or it is damaged. Download and install the latest <https://aka.ms/vs/17/release/vc_redist.x64.exe> (or <https://aka.ms/vc14/vc_redist.x64.exe>) and try again.

Newer launchers check for the VC++ runtime at startup and prompt you to install it; since v1.1.0 you can also check with `LeviLauncher.exe doctor` and repair with `LeviLauncher.exe doctor --fix vcruntime`. When other error dialogs point to a similar problem, check the VC++ runtime first as well.

## After not playing for a long time, every MC version in LeviLauncher crashes immediately on launch (no log, the console flashes by), but launching the official way works. What should I do?

Launch Minecraft once through the Microsoft Store or the official way (if the Store cannot download it, install an official appx package and launch it once), then launch with LeviLauncher again and it recovers.

A developer's analysis: to stop the GDK edition from automatically migrating (and deleting) UWP data, the launcher intercepts the game's reads of LocalAppData. MC stores login-token-like data in LocalAppData; after a long time without signing in, it needs to refresh that data, cannot find it and crashes. This is independent of whether version isolation is on. The current version still intercepts LocalAppData.

If it still does not work, check whether Gaming Services is damaged: uninstall or delete Gaming Services, restart the computer, then reinstall it from the Microsoft Store; you can check its status with `LeviLauncher.exe doctor`. When such a problem leaves no log, you can attach a VS debugger to MC to investigate.

*Applies to: LeviLauncher (Windows) 0.3.x and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where do I find the crash logs after the game crashes in LeviLauncher (PC)?

This applies to the current LeviLamina client. For a game with LeviLamina installed, the crash logs are in `logs/crash` under that game version's (instance's) directory, named `trace_<time>.log` and `minidump_<time>.dmp`; the same `logs` directory also contains `latest.log`. This is not MC's own crash directory. When reporting a problem, send the latest trace and minidump.

The launcher's own logs are in `%LOCALAPPDATA%\LeviLauncher\Logs` (if the launcher exits before showing a window, look at `startup.log` there), and the error dialog also has a button to open the log folder.

*Applies to: LeviLauncher 1.1.0*

## The PC LeviLauncher reports an error when launching MC (it looks like it demands a licensed copy), or the game crashes right after launching. What should I do?

This applies to GDK instances. This is not a forced licence check. First check that system components such as Xbox Gaming Services, GameInput and the Visual C++ runtime are healthy: the GDK edition requires Gaming Services. If it is missing or damaged, follow the launcher's guidance to install or repair it from the Microsoft Store, and if necessary install the official MC once from the Xbox app / Microsoft Store and launch it once.

You can also run `LeviLauncher.exe doctor` for a combined check; `doctor --fix` can repair the VC runtime, GameInput and others (Gaming Services must be installed from the Store page as prompted). If all components are fine but the game crashes as soon as it starts, also check the graphics driver; some users reported that reinstalling the GPU driver fixed it.

*Applies to: LeviLauncher 1.x*

## LeviLauncher shows a missing dll / missing file error and still cannot start after updating vcredist. What should I do?

Usually the system lacks the Visual C++ runtime. The current launcher checks for the VC runtime and shows a prompt when it is missing; after you confirm, it downloads the installer from <https://aka.ms/vc14/vc_redist.x64.exe> and runs it. You can also install it manually, or run `LeviLauncher.exe doctor --fix vcruntime`.

If that is not enough, install the vanilla Minecraft from the Microsoft Store once; the Store fills in the system libraries the game needs. If even the Store version cannot run, the system itself is missing libraries or has damaged files (for example an unofficial stripped-down system image) and needs to be repaired or reinstalled.

*Applies to: LeviLauncher 1.x*

## After installing a mod in LeviLauncher (for example a mod that removes OreUI), the game crashes. What is going on?

Whether this happens depends on the specific third-party mod. First check the mod list: enabling several versions of the same mod at once causes crashes, so disable the old ones. Also make sure the launcher was downloaded from an official source (GitHub Releases / the official website) and is not a modified build from an unknown source.

If problems remain, attach the crash logs (`logs/crash` under the instance directory) and a reproduction video when reporting.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## After installing the game with LeviLauncher it reports insufficient storage, and worlds and mods are lost (version isolation is on). BedrockBoot was installed before. What is the cause?

This applies when you also use a third-party tool such as BedrockBoot that creates symbolic links. Check the Minecraft Bedrock directory under `%APPDATA%`. In this case, BedrockBoot had turned that directory into a symbolic link, which conflicts with LeviLauncher's version isolation.

You can turn off BedrockBoot's version isolation in its settings, or uninstall BedrockBoot and delete the symbolic link, then try again. Back up your worlds before making changes.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## The Bedrock Edition (GDK) installed through LeviLauncher cannot be started from the Start menu, a shortcut or the launcher, and the process hangs in Task Manager. What should I do?

This applies to GDK instances. The GDK edition of Bedrock Edition depends on Microsoft Gaming Services (Xbox gaming services) working properly, and it cannot start when Gaming Services is missing or damaged. Update or reinstall Gaming Services from the Microsoft Store and it recovers.

You can use the launcher's guided check, or run `LeviLauncher.exe doctor` on the command line to check Gaming Services, GameInput, the VC runtime and more (Gaming Services must be installed from the Store page as prompted).

*Applies to: all LeviLauncher versions*
