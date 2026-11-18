# Installing and updating LeviLauncher on Windows

## A new LeviLamina client version has been released, but it still does not appear in LeviLauncher after refreshing. What should I do?

After a new version is released, you must first wait for the CI build to finish and for it to be written to the version database `levilamina-client-version-db`; only then can the launcher see it. The launcher reads this version database from GitHub (`raw.githubusercontent.com`); when "Use mirror source" is on, it goes through the `gh-proxy.org` / `gh.bibk.top` proxies first. All these sources are cached, so a new version usually takes a few minutes to appear. Wait a moment, then restart the launcher or refresh. The command line `LeviLauncher.exe loader versions` / `loader install` reads the same version database, so you cannot install the new version before the database is updated either.

*Applies to: LeviLauncher 1.1.x (Windows)*

## Downloading a Minecraft version in the PC version of LeviLauncher is very slow. Do I need a proxy?

No. When downloading, choose a download source in mainland China, xboxlive.cn (the launcher ranks xboxlive.cn mirrors first, and you can also let the launcher test speeds and choose a source automatically). If it is still slow, switch to another download source. For users in mainland China, "Use mirror source", which is on by default, also makes launcher updates, packages and version lists go through mirrors in mainland China / a GitHub proxy.

*Applies to: LeviLauncher (Windows) 1.0.x and later*

## Microsoft Store Minecraft was forcibly/automatically updated to a new version and I want to keep using the old version (such as the one matching LeviLamina). What should I do?

First turn off automatic updates in the Microsoft Store, then use LeviLauncher to download, install and start the specific Minecraft Bedrock version (GDK or UWP both work; you can turn on version isolation). The "Install LeviLamina" switch on the install page is on by default (it applies only to game versions supported by LeviLamina), so you can install the matching LeviLamina directly.

*Applies to: LeviLauncher (Windows) current version; requires licensed Minecraft Bedrock Edition*

## Older versions such as LeviLauncher 1.1.0-beta.3 cannot download the update package when updating automatically. Is it my computer or the launcher?

It is a launcher problem: the update address used by old launchers (the GoProxy module mirror) does not have the new update package. Go to GitHub Releases (or the Lanzou mirror <https://levimc.lanzoue.com/b016ke39hc>, password `levi`) and download and install the latest version manually. The new launcher self-updates from `LeviLauncher.zip` in the GitHub Release (trying the `gh-proxy.org` mirror first when the mirror source is on), after which automatic updates work normally.

*Applies to: LeviLauncher versions before v1.1.0-beta.4 must be updated manually; self-update works from the v1.1.0 stable release*

## The GitHub Release of LeviLauncher for PC has several files. What are the differences and which should I download? What if the download is slow?

Download `LeviLauncher-amd64-installer.exe` (the installer) and follow the installer; choose a separate directory without Chinese characters (do not put it inside the Minecraft game directory). `LeviLauncher.exe` is the portable version: put it alone in a newly created folder with an English path and run it directly. `LeviLauncher.zip` is the update package used by the launcher's self-update and normally does not need to be downloaded manually. If the GitHub download is slow, use the official Lanzou mirror <https://levimc.lanzoue.com/b016ke39hc> (password `levi`).

*Applies to: LeviLauncher (Windows) v1.1.0*

## LeviLauncher (Windows) says "The current account has no license for this version" (`ERR_LICENSE_NOT_ENTITLED`) when downloading or installing a game version. What should I do?

LeviLauncher requires a license for licensed Minecraft Bedrock Edition: the Microsoft account signed in to the launcher must own Bedrock Edition (if it does not, buy it at <https://www.xbox.com/en-US/games/store/minecraft/9nblggh537bl>). Having only signed in to Xbox in the game without buying the PC Bedrock Edition is not enough. If the error persists after purchase: a Microsoft account can sign in to the Microsoft Store on at most 10 devices, and the launcher counts as a separate device. Go to <https://account.microsoft.com/devices/content>, remove devices you no longer need, confirm that the purchase is on the account currently signed in, and try again. For other installation or launch problems, see the official troubleshooting guide: <https://levimc.org/LeviLauncher/guide/update-troubleshooting>.

*Applies to: LeviLauncher (Windows) 1.0.0 and later (Microsoft account sign-in in the launcher)*

## Downloading game versions or other content in LeviLauncher keeps failing (network error), and changing networks or using a proxy does not help. How do I troubleshoot? Where is the launcher log?

It is almost always a network problem. Retry a few times; on the "Download" page switch mirrors or run a speed test, or import a local installation package instead; users in mainland China can turn on "Use mirror source" in the settings. If you use a proxy, the launcher reads the Windows system proxy (including PAC / auto-configuration scripts), so the proxy software must have its system proxy enabled. If it still fails, use the TUN (virtual network adapter) mode of the proxy software to take over all traffic (a user solved it this way). The launcher log is in `%LOCALAPPDATA%\LeviLauncher\Logs` (the startup-phase `startup.log` is also there), and the error dialog also has an "Open log folder" button. Attach the log when reporting a problem.

*Applies to: LeviLauncher (Windows) 1.1.0 and later (log path); the network advice applies to all current versions*

## Installing LeviLamina into an instance in LeviLauncher keeps failing or hangs on Resolving, with `ERR_LIP_INSTALL_FAILED` (`context deadline exceeded`, HTTP 404/500/504, connection to `127.0.0.1:443` failed, etc.). How do I fix it?

It is almost always a network problem reaching GitHub.

1. In the launcher settings under "Package management", turn on "Use mirror", then pick a preset under "GitHub proxy" (the default is <https://gh-proxy.org/https://github.com>; others include v4/v6/cdn/axisnow.gh-proxy.org, ghproxy.vip, gh.bibk.top, all in the form `https://<host>/https://github.com`), or choose "Custom" and enter another mirror. When entering such a mirror yourself, write the full prefix (for example <https://v6.gh-proxy.org/https://github.com>); if you enter only the host name, the launcher appends `/https://github.com` automatically. Mirror speed varies a lot between regions, so try several if one fails. Leave the field empty to restore the default.
2. After changing it, use "Clear cache" to delete the downloaded package files and retry. The installation takes a while (about a minute); it does not finish instantly.
3. Without a mirror, the launcher connects to GitHub directly and goes through the system proxy. If the log shows a connection to `127.0.0.1:xxx` but you are not running a proxy, a stale system proxy setting is left over: search for "proxy" in Windows Settings and turn it off, or start your proxy software once and then turn it off again. Conversely, if you need a proxy, enable the system proxy in your proxy software.
4. You can also retry a few times or switch DNS (for example Alibaba DoH).
5. If you only want to install the game first, turn off the "Install LeviLamina" switch on the install page and install it later.

*Applies to: LeviLauncher (Windows) 1.1.0 and later*

## LeviLauncher (Windows) reports missing components or cannot start when installing or launching a version. Is it an environment problem?

Mostly yes. LeviLauncher and LeviLamina both require a licensed Bedrock Edition; you also need:

- Microsoft Edge WebView2 Runtime;
- for the GDK edition, Microsoft Gaming Services and Microsoft GameInput;
- for the UWP edition, Windows Developer Mode;
- for LeviLamina or native mods, the Visual C++ runtime x64 (<https://aka.ms/vs/17/release/vc_redist.x64.exe>).

The launcher checks for missing components and prompts you to install them. You can also run `LeviLauncher.exe doctor` to check and `LeviLauncher.exe doctor --fix` to repair (`vcruntime`, `gameinput`, `developer-mode`, etc.).

*Applies to: LeviLauncher (Windows) 1.1.0 and later*

## How do I install a mod file in `.levipack` format? Can the PC LeviLauncher use the Android `.levipack`?

`.levipack` is the mod pack format of LeviLauncher-Android (the Android edition) and can only be imported there (open it with, or share it to, the Android launcher). PC and Android mods are not interchangeable: Android mods are arm64 `.so` files (the file name often contains `android-arm64`) and cannot be used on PC.

The PC (Windows) LeviLauncher uses `.mcmod` mod packs. It is also compatible with `.zip` packages that contain a `manifest.json`, and with standalone `.dll` files. On the instance's mods page, drag the file into the launcher window, or click import and choose "All files (*.*)" in the file dialog. On the command line, use `LeviLauncher.exe mod import <file>`.

*Applies to: LeviLauncher (Windows) 1.1.0; LeviLauncher-Android 1.7.x and current version*

## Is levilauncher.com the official website of LeviLauncher / LeviMC?

No. levilauncher.com is unrelated to LeviMC. It is an AI-generated phishing imitation, and the files it offers contain viruses. The only official LeviMC website is <https://levimc.org> (LeviLauncher documentation: <https://levimc.org/LeviLauncher/>).

Download LeviLauncher only from GitHub Releases (Windows: <https://github.com/LiteLDev/LeviLauncher/releases>, Android: <https://github.com/LiteLDev/LeviLauncher-Android/releases>) or from the Lanzou mirror listed on the official documentation's download page.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can LeviLauncher launch a Bedrock Edition that I installed earlier with the official Microsoft launcher or the Store?

Taking it over directly is not recommended. LeviLauncher manages its own installed "instances"; the recommended way is to reinstall the same version on LeviLauncher's "Download" page (or use `LeviLauncher.exe install <version or local installer file>`).

You can copy existing game data (worlds and settings) during installation, or afterwards merge the vanilla game data of the same channel (release/preview) from the system into the instance with `LeviLauncher.exe instance copy-data <instance> --from system` (files with the same name are overwritten; no files are deleted). This applies to GDK edition instances with independent data (isolation) enabled. Back up all your worlds before you do this.

*Applies to: LeviLauncher (Windows) 1.1.0*

## A Windows administrator (UAC) prompt appears when installing LeviLauncher. Should I allow it?

Yes. The LeviLauncher installer needs administrator rights (it installs to `Program Files` by default) and cannot install without them. This assumes the installer comes from an official source (GitHub Releases or the Lanzou mirror listed in the official documentation).

The launcher may also request administrator rights for self-update (when the install directory is not writable) and when `doctor --fix` installs components such as the VC runtime and GameInput. Allow it once you have confirmed it is trustworthy.

*Applies to: LeviLauncher (Windows) 1.x*

## Where can I find historical versions of the Windows Bedrock Edition (for example 1.26.23)?

LeviLauncher has a built-in library of historical versions: on the "Download" page you can choose historical release or preview versions (both GDK msixvc and UWP appx are available). On the command line, look them up with `LeviLauncher.exe installer search 1.26.2` (add `--channel preview` for previews), then install with `LeviLauncher.exe install 1.26.23`.

The version list comes from GitHub (`LiteLDev/minecraft-windows-gdk-version-db`); in mainland China you can turn on "Use mirror". The third-party site mcappx.com also provides historical Windows installers, which you can import as local packages after downloading.

*Applies to: LeviLauncher (Windows) 1.x*

## How do I install a Minecraft installer package (msixvc) downloaded with LeviLauncher?

Do not install the msixvc manually (methods such as `Add-AppxPackage` do not apply). Install it directly in LeviLauncher: pick a version on the "Download" page and start the install task. Already downloaded packages are reused, and unfinished downloads resume.

You can also use the command line: `LeviLauncher.exe install <version>`, or for a local file `LeviLauncher.exe install D:\xxx.msixvc` (supports `.msixvc`/`.appx`/`.msix`/`.appxbundle`/`.msixbundle`). `LeviLauncher.exe installer list` shows the installer packages already downloaded. Fetching the version list requires access to GitHub; in mainland China you can turn on "Use mirror".

*Applies to: LeviLauncher (Windows) 1.x*

## What is the password for the LeviLauncher Lanzou download link?

The password is `levi`. The official Lanzou mirror is <https://levimc.lanzoue.com/b016ke39hc> (use it when GitHub downloads are slow); you can also download directly from GitHub Releases.

## LeviLauncher fails to install the game, mod management clicks do nothing, or the game will not start after downloading, and a path or file name contains Chinese characters. How do I fix it?

Remove Chinese and other non-ASCII characters from the relevant paths (the launcher data directory, the instance directory, the instance name or file names) and try again. Some users recovered this way.

Note that v1.1.0 fixed the built-in package manager's handling of local paths containing `%`, `#` or non-ASCII characters. With version isolation enabled, problems also occur if the isolation directory cannot be represented in the system code page, so a pure-English path is the safest.

*Applies to: LeviLauncher (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*
