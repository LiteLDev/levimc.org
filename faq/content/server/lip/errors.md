# lip errors

## Installing packages with lip keeps failing (interrupted downloads, corrupted cache and so on). How do I clear the lip cache, and where is it?

Run `lip cache clean` to delete lip's cache and then install again (the old command `lip cache purge` no longer exists). On Windows the cache directory is `%LOCALAPPDATA%\lip\Cache`; on other systems it is `$XDG_CACHE_HOME/lip` (default `~/.cache/lip`), regardless of which drive the server or lip is installed on. In lip's own interface, you can also click "Clear cache" on the settings page. The cache only holds content that can be downloaded again, so clearing it does not affect the server, installed packages or configuration; do not clear it while another lip command is downloading. New lip automatically replaces cache files that are not valid ZIPs, so manual cleanup is rarely needed now.

To find the cause of a failure, check the error/hint in the command output and the full report under `.lip/logs/` in the server directory. Set configuration options with `lip config set <key> <value>` and list them with `lip config list` (for example the GitHub proxy `github_proxy`).

*Applies to: lip 0.41.x*

## Installing or updating LeviLamina or a mod with lip (or the lip built into LeviLauncher) fails with a dependency resolution error (older versions print `Cannot find a valid state to satisfy all dependencies.`, the launcher shows `ERR_LIP_INSTALL_FAILED`). What causes it?

This is a dependency resolution failure: no set of versions satisfies the dependency ranges of all installed and to-be-installed packages at the same time. The most common cause is that some installed mods only declare support for an older LeviLamina/game version (for example, a mod that only matches LeviLamina 26.51.x) and have not been updated for the new version. Newer lip prints `Cannot find versions of the packages that work together:` and lists each conflict with its reason and hint; the details are in the failure report under `.lip/logs/` in the workspace.

To fix it, wait for the mods to release a version that supports the new version, or uninstall those mods (`lip uninstall <package>`) before upgrading. On the command line, change the game/LeviLamina version with `lip setup --game <version>`: it lists the mods that cannot work with the new version and asks whether to uninstall them. `lip install`/`lip update` never change the game or the loader; if they cannot satisfy the dependencies, they tell you to use `lip setup` instead.

*Applies to: lip 0.40 and later (including 0.41.1); lip built into LeviLauncher 1.1.x*

## Installing or updating LeviLamina or a plugin with lip fails (download/extract errors, progress stuck, cache read errors, unsatisfied dependencies, etc.). What should I do?

Most failures come from a corrupted lip cache, an outdated lip, or network problems reaching GitHub:

1. Run `lip cache clean` to empty the cache, then retry (make sure no other lip command is running). The cache directory is `%LOCALAPPDATA%\lip\Cache` on Windows and `~/.cache/lip` on Linux/macOS; cleaning the cache does not affect workspaces, installed packages or configuration.
2. Run `lip self-update` to update lip to the latest version; an old lip cannot install packages in the new format.
3. If GitHub is hard to reach, configure a GitHub proxy: `lip config set github_proxy <proxy-address>`; if the setting causes problems, reset it with `lip config delete github_proxy`. A regular HTTP proxy needs no special configuration: lip uses the `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` environment variables of the terminal, or the system proxy.
4. To install LeviLamina, use `lip install LeviLamina` (or `lip setup`) so that lip picks a game version LeviLamina supports automatically; do not specify a BDS version LeviLamina does not support yet. When creating a new server, do it in an empty folder.
5. On failure, lip writes a failure report under `.lip/logs/` in the workspace, which you can use for troubleshooting or when reporting the problem.

lipui has long been unmaintained; type `lip` (without arguments) in a terminal to open the interface built into lip.

*Applies to: lip 0.41.x (current version)*

## `lip install` fails when the package name has an `https://` prefix (such as `https://github.com/...`). What should I do?

Do not write a protocol prefix in the identifier of a Git repository package. Remove `https://` and check the case and spelling of the path, for example `lip install github.com/LiteLDev/LegacyScriptEngine`. In lip, an argument starting with `https://` is treated as "the download URL of a ZIP archive"; a repository web address is not a ZIP, so the installation fails.

## lip fails even though the environment variables are fine, and the server directory path contains a special character such as "×". What is the cause?

Special characters in the path can make lip (or a program it calls) fail. Move the server to a directory whose path contains no special characters (preferably no Chinese characters or spaces either), then run lip again.

*Applies to: reported on old lip versions; not confirmed on newer versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Right-click updating an installed mod in LeviLauncher (a new version is shown) fails with `ERR_NO_UPDATE_SOURCE` (no update source available). What should I do?

`ERR_NO_UPDATE_SOURCE` is an error raised by LeviLauncher itself: the launcher cannot map the installed mod to exactly one lip package in the mod catalog (no match, or several packages match by name), or there is no target version available, so it does not know where to update from. First update LeviLauncher to the latest version. As a workaround, find the mod on the launcher's LeviMC mods (mod catalog) page and reinstall the new version directly.

*Applies to: LeviLauncher (including the lip-compatible package manager built into 1.1.0)*

## Updating a mod (such as Lamium) in LeviLauncher fails with an error saying that lip cannot reach GitHub. What should I do?

The packages and files of mods are hosted on GitHub, so GitHub must be reachable. You can:

1. Turn on a system proxy and retry (on Windows, LeviLauncher reads the system/WinHTTP proxy settings).
2. Configure the "GitHub proxy" in the lip section of the launcher's Settings (a preset such as <https://gh-proxy.org/https://github.com> is available, or enter one manually; leave it empty to restore the default), or set lip's GitHub proxy with `lip config set github_proxy <URL>`. If none is set in the launcher, it reads `github_proxy` from lip's `config.toml`.

*Applies to: LeviLauncher 1.1.0; lip 0.40 and later*

## Installing LeviLamina with lip fails because dependencies cannot be fetched (for example the PreLoader package cannot be obtained). What should I do?

Most likely access to GitHub failed. First read the `error:`/`hint:` lines lip prints and the failure report under `.lip/logs/` to find the cause. If GitHub is slow or blocked, set a GitHub proxy with `lip config set github_proxy <proxy-address>` (the proxy must support git repositories), or use a network proxy: lip reads the `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` environment variables of the terminal and falls back to the system proxy when they are not set (for example, in PowerShell run `$env:HTTPS_PROXY = "http://127.0.0.1:7890"` and then `lip install`). If you suspect the download cache is corrupted, run `lip cache clean` and retry (do not clean the cache while another lip command is downloading).

*Applies to: lip 0.40 and later (the new C# lip)*

## Installing LeviLamina with lip fails when running `.\PeEditor.exe -mb`, with exit code `-1073741515` (for example, older versions report `CliWrap.Exceptions.CommandExecutionException ... Command: cmd.exe /c ".\PeEditor.exe -mb"`). How do I fix it?

Exit code `-1073741515` (`0xC0000135`) means a dependency DLL is missing, usually because the Microsoft Visual C++ Redistributable (x64) is not installed. When you run `lip setup` or install a Windows server, newer lip detects this and installs the VC++ runtime automatically (you must allow it to run as administrator in the UAC prompt). If you declined the UAC prompt or the automatic installation failed, download and install it manually from <https://aka.ms/vc14/vc_redist.x64.exe>, then run `lip install` again.

`PeEditor` is the `post_install` hook of the LeviLamina package. When it fails, newer lip reports "A hook command of a package failed"; see the failure report under `.lip/logs/` for the detailed output.

*Applies to: current version (Windows server)*
