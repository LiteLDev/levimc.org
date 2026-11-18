# Installing lip and setting up a server

## How do I uninstall a plugin/mod installed with lip? Why does simply deleting the plugin folder not work?

Run `lip uninstall <package>` in the server directory. The package can be written as the identity shown by `lip list` (such as `lip uninstall github.com/LiteLDev/LegacyScriptEngine#lua`) or as the source you installed from (such as `./package.zip`); add `--dry-run` first to see what would be deleted. lip runs the uninstall hooks, deletes the files the package owns, and automatically uninstalls dependencies that are no longer needed. Do not delete folders by hand: lip records installed packages in `.lip/state.json`, so after a manual deletion lip still considers the package installed, and running `lip install` for the same version does not reinstall it. If that happens, run `lip uninstall` first and then `lip install`. If something is still wrong after reinstalling, you can do a clean install of a LeviLamina server with lip in a new empty directory to tell whether the server or the plugin is at fault. For more subcommands, see `lip --help` or the interface (run `lip` directly).

*Applies to: all current lip versions (the state file path `.lip/state.json` applies to lip v0.40+)*

## How do I update installed plugins with lip? Can I update all packages in one go? Are dependencies updated too? How do I update LeviLamina itself?

Use `lip update` now (the old `lip install --upgrade` / `-U` no longer exists). Run it in the server directory:

- `lip update` without arguments re-requests all explicitly installed packages from the source they were installed from (packages installed by `<repo>` are raised to the highest version tag, and ones pinned with `@version` stay unchanged);
- `lip update github.com/user/repo` updates just that package;
- `lip update github.com/user/repo@1.2.0` switches to the given version (upgrade or downgrade).

Add `--dry-run` first to preview. Dependencies are updated only when the new version needs it, and whether they can change is decided by the version ranges in `deps` in the plugin's `lip.toml`. `lip update` does not touch the game (BDS) or the loader (LeviLamina) and does not accept them as arguments: to change the LeviLamina or game version, use `lip setup`. Run the command in the server (workspace) directory (open the server directory in File Explorer, type `cmd` or `powershell` in the address bar and press Enter), or run `lip` directly and update on the "Mods" page of the interface.

*Applies to: lip v0.40 and later*

## After installing a plugin with lip, it reports a missing dependency (prerequisite). Why did lip not install it automatically?

lip automatically installs the dependencies a package declares in the `deps` of its `lip.toml` (`<package ID>` or `<package ID>#<variant>` = version range). There are usually two reasons it did not:

1. The plugin author did not declare the dependency in `deps`. You can only ask the author to add it, or find the package yourself and `lip install` it manually (the error usually states the missing package ID and version range, and you can search for it at <https://levimc.org/mods/>).
2. What is missing is the game or LeviLamina itself: `lip install` never installs, uninstalls or replaces the game and the loader. If a mod needs a different LeviLamina version, the command fails and points to `lip setup`; first use `lip setup` to set the game and LeviLamina versions the mod supports, and then install the mod.

The `prerequisites` field of the old `tooth.json` no longer exists. For manually installed plugins, make sure the dependency plugin is really in the `mods` directory.

*Applies to: lip v0.40 and later; LeviLamina 1.x and later (mod directory `mods/`)*

## How do I install LeviLamina (with BDS) and common components such as LSE, anti-cheat, optimization and multi-dimension support in one go with lip?

Run this in a newly created empty folder (one command can install several packages, done as a single operation):

```shell
lip install LeviLamina github.com/LiteLDev/LegacyScriptEngine github.com/LiteLDev/LeviAntiCheat github.com/LiteLDev/LeviOptimize github.com/LiteLDev/MoreDimensions
```

Installing LeviLamina automatically installs the BDS it is compatible with (you need to type `yes` to accept the Minecraft EULA; in scripts, add `--accept-eula`). The default variant of LSE contains the QuickJS and Lua engines; install other engines through variants: `github.com/LiteLDev/LegacyScriptEngine#nodejs`, `github.com/LiteLDev/LegacyScriptEngine#python`. Afterwards, to add mods to a workspace that already has BDS, you only need `lip install <package>`. Third-party packages (such as GMLIB) are installed the same way with `lip install github.com/<author>/<repo>`; make sure they support your current LL version.

*Applies to: current lip (v0.41.x) and LeviLamina 26.60.x*

## By default lip installs the latest LeviLamina and the matching latest BDS, but my client/world/plugins only support an older version. How do I install a specific version of LeviLamina or BDS (and specific versions of other packages) with lip?

Without a version, `lip install` installs the latest version, and installing LeviLamina also installs the BDS it is compatible with (the client version must match the server; type `version` in the BDS console to check). To pin a version (run these in a newly created empty folder):

1. By LeviLamina version: `lip install LeviLamina@<version number>` (that is, `github.com/LiteLDev/LeviLamina@<version number>`), which installs the latest BDS that LL supports. Look up version numbers in the LeviLamina GitHub Releases.
2. By BDS version: `lip setup --game <BDS version>` (such as `--game 1.21.60`, which automatically picks the latest compatible LeviLamina; you can also add `--loader levilamina@<version number>` to pin LL), or put both in one command: `lip install github.com/LiteLDev/bds@<BDS version> LeviLamina`. Do not install bds and LeviLamina in two separate commands: the second one chooses the game version again based on LL.
3. To change the version of an existing server: run `lip setup --game <version>` again in that folder. `worlds`, `server.properties` and so on are kept, and other mods are replaced with compatible versions. Back up your world before downgrading; downgrading a world from a newer version may corrupt it.
4. For other packages, likewise add `@version number` after the package name, optionally with a variant, for example `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs@0.22.4`, and choose a version compatible with the installed LL version.

If GitHub is slow to reach, first run `lip config set github_proxy <proxy URL>`; `lip cache clean` clears the download cache.

*Applies to: current lip (v0.41.x); version numbers as in the LeviLamina/LSE Releases*

## On a network in mainland China (or a cloud server or campus network), installing LeviLamina, LegacyScriptEngine and other packages with lip is very slow, hangs or fails with network errors. How do I configure a mirror/proxy?

This is a network problem reaching GitHub. Most lip packages are downloaded from GitHub, so you can set a GitHub proxy (a URL-prefix style GitHub mirror) for lip:

```shell
lip config set github_proxy https://v4.gh-proxy.org/https://github.com/
```

You can replace the mirror address with another working GitHub prefix proxy that you trust; some services need the full `https://github.com/` after the address.

Key points:

1. The current version of lip has only `github_proxy` as a network setting. The old `GoModuleProxyURL` / `GitHubMirrorURL` / `ProxyURL`, `go_module_proxy` / `go_module_proxies` / `github_proxies` no longer exist, and Go module proxies such as `goproxy.cn` are no longer used, so setting them has no effect.
2. Only requests to `github.com` go through `github_proxy`; BDS itself is downloaded from minecraft.net and is not affected.
3. When a request through the proxy fails, lip falls back to connecting to GitHub directly, so a successful command does not mean the proxy works. You can test a proxy like this: `curl.exe -s -o NUL -w "%{http_code}" "<proxy address>LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"`; a result of `200` means the proxy works. If a mirror stops working (blocked), switch to another; if an error says the proxy does not support git repositories, replace it as well.
4. If you have an ordinary HTTP proxy (for example a local Clash port `http://127.0.0.1:7890`; make sure the port is right), you do not need to set `github_proxy`. Set `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` / `NO_PROXY` in the terminal where you run lip (PowerShell: `$env:HTTPS_PROXY = "http://127.0.0.1:7890"`); without these environment variables, lip uses the system proxy. You can also turn on the TUN mode of your proxy software.
5. To remove the proxy: `lip config delete github_proxy`; to state explicitly that you connect directly: `lip config set github_proxy ""` (in PowerShell, write `lip config set github_proxy --% ""`). Use `lip config list` to view the current configuration.
6. If an earlier failed download left an incomplete cache, run `lip cache clean` and try again. It is also a good idea to update lip to the latest version first.
7. If nothing else works, install on a machine with a good network, then package the result and upload it to the server.

*Applies to: lip v0.41.x (current latest); the old configuration keys apply only to the early Go version of lip*

## After installing lip on Windows, the command line says the lip command cannot be found (or that the .NET runtime is missing). What should I do?

We recommend downloading `lip-<version>-win-x64.msi` (`win-arm64` for ARM devices) from <https://github.com/LiteLDev/lip/releases/latest> and installing it; the installer adds the install directory to the system PATH automatically. After installing, you must close the existing cmd/PowerShell windows and open new ones for the new PATH to take effect. If you use the portable zip, you need to add the directory containing `lip.exe` (without the file name) to "Edit the system environment variables → Environment Variables → Path" yourself, and again reopen the terminal; you can check with `echo %PATH%`. You can also skip PATH and use the full path of `lip.exe` (in quotes if it contains spaces), or put `lip.exe` in the current directory and run it (type `lip` in cmd; in PowerShell write `.\lip`). The current lip is a single self-contained executable and does not need a separate .NET runtime.

*Applies to: current lip (v0.41.x), Windows*

## The lip Release page has many files (x64/arm64, msi/zip and so on). Which one should I download for an Intel/AMD Windows PC, Windows Server or a panel-hosted server?

x64/amd64 and arm64 refer to the CPU architecture, not the brand: ordinary Intel and AMD PCs and Windows Server 2022 and so on are all x64; arm64 is only for ARM devices, and downloading the wrong one gives a message that it does not match the system. The files on the current lip release page (<https://github.com/LiteLDev/lip/releases/latest>) are: `lip-<version>-win-x64.msi` / `win-x64.zip` (Windows x64), `win-arm64.msi` / `win-arm64.zip` (Windows ARM), `linux-x64.tar.xz` (x64 Linux), and `osx-x64.zip` / `osx-arm64.zip` (macOS). On Windows, download and install `win-x64.msi` in most cases (it adds itself to PATH); for panel-hosted servers or environments that cannot run an msi, download `win-x64.zip` and extract it. All builds are self-contained single files and need no extra .NET. lip itself is cross-platform: on Linux/macOS it runs the Windows server with LeviLamina through a Wine that it downloads itself; there is no arm64 Linux build.

*Applies to: current lip (v0.41.x)*

## Where do I download the lip package manager and how do I install it? Is there a winget option? Can it update itself? Is there a Linux version?

The lip repository is now <https://github.com/LiteLDev/lip> (formerly `futrime/lip`), and the documentation is at <https://levimc.org/lip/>. On Windows, download `lip-<version>-win-x64.msi` (`win-arm64.msi` for ARM) from <https://github.com/LiteLDev/lip/releases/latest> and run it; it is added to PATH automatically. You can also download the zip, extract it and add the directory to PATH yourself. On Linux (x64) and macOS, download the matching archive, extract the `lip` file and put it in a directory on your PATH. lip is a single executable and needs no separate .NET, git or Wine. The official documentation no longer offers a winget install (the old `futrime.lip` winget package is no longer available); update lip with `lip self-update` (`lip self-update --check` only checks). After installing, open a terminal in the server folder and type `lip` to use the interface, or use commands such as `lip install LeviLamina`.

*Applies to: current lip (v0.41.x)*

## The lip I downloaded does not run on x64 Windows (Win10/Win11/Windows Server). What is the cause?

The most common cause is downloading the wrong architecture: an x64 computer should download the `win-x64` build from the Release (`lip-<version>-win-x64.zip` or `lip-<version>-win-x64.msi`), not the `win-arm64` build. Old lip versions named files `amd64`/`arm64`; now they are `win-x64`/`win-arm64`. If the architecture is right and it still does not start, and you are using a stripped-down or modified Windows 10, it may be a compatibility issue with CET (Control-flow Enforcement Technology), which is enabled by default since .NET 9 (see <https://learn.microsoft.com/zh-cn/dotnet/core/compatibility/interop/9.0/cet-support>). We recommend switching to a normal official system image.

*Applies to: current lip (v0.41.x; the win-x64/win-arm64 naming has been used since v0.33 of the C# version)*

## On Windows Server (such as 2022 Datacenter), the lip installer reports `lip Setup Wizard ended prematurely because of an error` or lip does not work. What should I do?

Windows Server itself is supported. First confirm that you downloaded the `win-x64` build (do not download `win-arm64` unless the server is ARM). If the msi installer fails, you can skip the installer: download `lip-<version>-win-x64.zip`, extract `lip.exe` and add its directory to the PATH environment variable (the msi installer mainly just puts lip in `Program Files\lip` and writes that directory to PATH as well). The current lip is a self-contained release and does not need a separate .NET runtime; the portable version can also be upgraded afterwards with `lip self-update`.

*Applies to: current lip (v0.41.x, self-contained, no .NET needed)*

## Installing a package with lip fails (even with a different version number, as if the package was not fully uploaded, or dependencies cannot be satisfied). What is the cause?

A common cause is that the local lip is too old to read packages in the new format (new packages use `lip.toml`, while old lip versions only understand `tooth.json`). Run `lip self-update` to update lip to the latest version first, then install again. If the dependencies really cannot be satisfied (the author has not published a dependency version that meets the requirement, or wrote a wrong version number), the current lip has no option to skip the dependency check. You can only install another version of the package, use `lip setup` to switch to a matching game/LeviLamina version, or wait for the author to fix it.

*Applies to: current lip (v0.41.x; `lip self-update` is available)*

## LeviLamina/BDS was installed manually (or with an exe), and when I later install mods that depend on LeviLamina, such as LegacyScriptEngine or LeviAntiCheat, with lip, it reports missing dependencies and cannot detect LeviLamina. What should I do? Where should lip commands be run?

lip only knows the packages it installed itself and recorded in the server folder's `.lip/` (state file); a manually extracted BDS/LeviLamina does not exist as far as lip is concerned. So use lip for everything or do everything manually, and do not mix them. Installing a mod in a folder with no game record makes lip fail and tell you to use `lip setup` first. The recommended approach: create a new empty folder and run `lip install LeviLamina` in it (or together with mods: `lip install LeviLamina LegacyScriptEngine`), then install other mods with `lip install <mod>`, and finally copy `worlds/`, `server.properties`, `allowlist.json`, `permissions.json` and the mod configs from the old server. lip commands must be run in the server root directory (the workspace); after an MSI install lip is already on PATH, so just `cd` to the server directory and run it. If you insist on a fully manual install, refer to the `lip.toml` in each package's repository (`tooth.json` for old packages), which states the dependencies, download addresses and where the files go.

*Applies to: lip v0.40+ (currently v0.41.1), current LeviLamina version*

## Typing `lip install ...` (for example to update LeviLamina) in the BDS console says Unknown command / does nothing. Where should lip commands be run? Does LeviLamina update automatically?

lip is a standalone command-line program, not a BDS console command. Run it in a system terminal (cmd/PowerShell) after switching to the server root directory (`drive letter:` then `cd path`; or open the server directory in File Explorer and type `cmd` in the address bar and press Enter). Typing just `lip` with no arguments opens lip's terminal interface, where you can create a server, install mods and start the server. LeviLamina does not update automatically: to change the LeviLamina/game version, use `lip setup --game <game version> --loader levilamina@<version>` (or use the workspace page of the interface), and update other mods with `lip update`. If a panel-hosted server gives you no terminal, you can only replace the files manually or contact the provider.

*Applies to: lip v0.40+ (currently v0.41.1)*

## When I upgrade LeviLamina or an installed package with `lip install`, lip says it is "already installed" or the version does not change. How do I upgrade correctly or install a specific version?

1. `lip install` is only for packages that are not installed yet. Running install on an installed package is refused, and lip tells you to use `lip update` instead.
2. Regular mods: `lip update` updates everything, `lip update <package>` updates one package, and `lip update <package>@<version>` switches to a specific version (upgrade or downgrade).
3. LeviLamina and BDS cannot be changed with install/update. Use `lip setup --game <game version> --loader levilamina@<version>`, which keeps your worlds and configuration and switches mods to compatible versions. To install a specific version in a fresh folder, use `lip install LeviLamina@<version>`.
4. Every lip command must be run in the server root directory. Do not run it in the default directory that Win+R opens (such as `C:\Windows\System32`).
5. If `lip -v` shows a very old version, install the latest one from <https://github.com/LiteLDev/lip/releases>. After that, you can update lip itself with `lip self-update`.

*Applies to: lip 0.40 and later*

## When I install LeviLamina or a server with lip, the files end up somewhere else (such as the user directory) or mixed with other files. Where does lip install the server, and how do I choose the location?

lip installs the server and packages into the current working directory of the command (this directory is lip's "workspace"). Create an empty folder, enter it with `cd <folder path>` (or type `cmd` in the File Explorer address bar to open a command line there), and then run `lip install LeviLamina`, `lip setup ...`, `lip install <package>` and so on. All later lip operations on this server must also be run in that folder.

## There is no lip on my panel server or cloud server, lip cannot run there, or the online installation fails. How do I install LeviLamina and its mods?

lip is a single executable and needs no other runtime. You can put it on the server (in any directory or in PATH) and use it directly. The Linux build is x64 only, needs glibc 2.27 or later, and does not support Alpine. On Linux/macOS, lip runs the Windows build of the server through a Wine that it downloads and configures automatically. Wine also needs GnuTLS on the system (and Fontconfig if FreeType is installed); if one is missing, lip tells you its name and the install command.

If the panel server cannot run lip at all: install the whole server (or a mod) with lip on your local computer, then upload the files to the panel server. When you move a whole server, upload the `.lip` folder with it. You can also read the package's manifest file (`lip.toml` in the repository root for new packages, `tooth.json` for old ones), which lists the download links of each asset (`urls` of the assets) and where to place them (`place` / `placements`). Download the files manually and place them at those paths.

If only GitHub is unreachable, set a GitHub proxy with `lip config set github_proxy <proxy address>`.

*Applies to: lip 0.40 and later*

## Installing GMLIB with lip fails with 404 or cannot download. What should I do?

GMLIB moved to a new repository. The old address `github.com/GroupMountain/GMLIB` no longer exists; use the new one: `lip install github.com/GroupMountain/GMLIB-Release`. The GMLIB package declares a dependency on LeviLamina, so lip picks a version compatible with the installed LeviLamina. To pin an older version, use `lip install github.com/GroupMountain/GMLIB-Release@<version>`.

## What is the difference between the lip msi installer and the downloadable lip executable (zip)? How do I use lip after installing?

There is no functional difference. The msi is a regular installation: it adds lip to the PATH environment variable automatically, so you can run `lip` in a command line right after installing, and you can uninstall it from "Programs and Features". It suits users who do not know how to edit environment variables. The zip is a portable build that you extract yourself and place in a directory in PATH. Both can be updated with `lip self-update` (an msi installation is updated silently through msiexec). After installing, type `lip` in the server folder to open the interface.

*Applies to: lip 0.41.x (Windows)*

## GitHub is not reachable. How do I download and install lip?

The lip installers are on GitHub Releases: <https://github.com/LiteLDev/lip/releases/latest> (the old address `futrime/lip` redirects automatically). On Windows, download `lip-<version>-win-x64.msi` (or `-win-arm64.msi`; a portable `.zip` is also available), for example <https://github.com/LiteLDev/lip/releases/download/v0.41.1/lip-0.41.1-win-x64.msi>. On Linux/macOS, download the matching `.tar.xz`/`.zip`.

If you cannot reach GitHub, download through a third-party GitHub acceleration mirror (add the mirror's prefix before the link, or replace `github.com` with the mirror's domain). After installing, run `lip config set github_proxy <proxy URI>` so that lip downloads from GitHub through the proxy from then on.

## After LeviLamina was updated for a new game version, installing LL and BDS with lip works, but installing the quickjs/nodejs/lua variants of LegacyScriptEngine keeps failing. What should I do?

Run `lip cache clean` to clear lip's cache, then install again, for example `lip install LegacyScriptEngine#lua`. Clearing the cache loses nothing; lip downloads the files it needs again. Do not run other lip commands while the cache is being cleared. If it still fails, check the failure report in `.lip/logs/`. If it says the game or loader version is incompatible, that LSE version does not support the current LeviLamina yet: wait for an LSE update, or use `lip setup` to switch to a version it supports.

*Applies to: lip 0.41.x*

## What is the official address of lip? Does `github.com/lippkg/lip` still work?

The lip repository is now <https://github.com/LiteLDev/lip>, and the documentation is at <https://levimc.org/lip/>. The old `github.com/lippkg/lip` and `github.com/futrime/lip` are currently redirected by GitHub to LiteLDev/lip, and the old documentation domains such as `lip.levimc.org` merely point to the new documentation. Use the new addresses directly. We recommend installing plugins through lip itself.

## The lipd version in the winget repository stays at an old version (such as 0.33.1) and is never updated. Why?

lipd is deprecated and no longer released separately. Its function (the background daemon) is built into lip, so you only need to install/update lip. The daemon is started automatically by the first lip command; check and stop it with `lip daemon status` / `lip daemon stop`. Also, the winget mirror source only mirrors the package manifest; the actual installer is still downloaded from GitHub Releases.

*Applies to: lip 0.34 and later*

## I ran a lip install in the plugins (or mods) directory by mistake, and it downloaded a lot of files (even another server). What should I do?

lip treats the current working directory as the workspace (the server folder), so all lip commands must be run in the server root directory, not in subdirectories such as mods/plugins. Running a command such as `lip install LeviLamina` in a subdirectory creates another server there. To fix it, delete what was installed by mistake in the subdirectory (including its `.lip` folder), or uninstall it there with `lip uninstall`, and then run the command again in the server root directory.

## Where can I download an older official BDS? The official website only has the latest one.

Use lip: in an empty folder, run `lip setup --game <version> --no-loader` (for example `--game 1.21.80`; write `1.21.80-patch.3` if you need a specific build) to get the vanilla server of that version. Without `--no-loader`, the matching LeviLamina is installed as well. lip downloads from the official minecraft.net address, based on the build list at `https://levimc.org/api/v4/mc/versions/`. You can also search for the version number on the Minecraft Wiki to find the official direct link.

## After installing LeviLamina 26.60.x and LSE 0.23.x with lip in a new empty directory, startup reports an incompatible resource pack version (the BDS version differs from the 1.26.60 that LeviLamina requires). What is the cause, and in what order should I install?

The cause is that LSE was installed first: the dependency resolution of an older lip pulled in only the BDS component and downloaded the latest BDS instead of the 1.26.60 that LeviLamina requires. The correct way is to set up the game and the loader first, then install plugins:

```shell
lip install LeviLamina          # install the latest LeviLamina and the latest BDS it supports (equivalent to one lip setup)
lip install LegacyScriptEngine  # then install LSE (QuickJS and Lua engines by default)
```

Or specify it explicitly: run `lip setup --game 1.26.60 --loader levilamina`, then `lip install LegacyScriptEngine#lua` and so on. Update to the latest lip first with `lip self-update`: when you install a mod directly in an empty workspace without a game, new lip reports an error and tells you to run `lip setup` first, so it no longer installs a wrong BDS version. The BDS version that LeviLamina requires is written in the dependency `github.com/LiteLDev/bds` in its `lip.toml` (`tooth.json` for old packages).

*Applies to: lip 0.41.x; LeviLamina 26.60.x; LegacyScriptEngine 0.23.x*

## How do I install the LSE Lua / QuickJS engines with lip? What if the installation fails?

Each language engine is now a variant of the LegacyScriptEngine package, chosen with `#`:

```shell
lip install LegacyScriptEngine#lua
lip install LegacyScriptEngine#quickjs
# #nodejs and #python also exist
```

Without a variant (`lip install LegacyScriptEngine`), the QuickJS and Lua engines are both installed. `LegacyScriptEngine` is short for `github.com/LiteLDev/LegacyScriptEngine`. Before installing, the workspace must already have a server and LeviLamina (`lip install LeviLamina` or `lip setup --game <version>`). If it fails: first update to the latest lip with `lip self-update`, then run `lip cache clean` and try again, and read the error/hint that lip prints and the failure report under `.lip/logs/`.

*Applies to: lip 0.41.x; LegacyScriptEngine 0.23.x*

## A manually downloaded LeviLamina mod reports missing dependencies or fails to load on startup. How do I install the matching mod version on older versions such as BDS 1.21.70?

A manually downloaded file may be incomplete or miss dependencies, so install with lip, which handles dependencies automatically. To use an older BDS: in the server folder, first set up the game and loader with `lip setup --game 1.21.70` (this also installs the latest LeviLamina that supports that version), and then run `lip install <package>`; lip automatically picks the latest version that works in the current workspace. You can also look up the version that supports that BDS version in the mod's GitHub Releases and pin it with `lip install <package address>@<version>` (for example `lip install github.com/user/repo@1.2.0`); add `--dry-run` first to see what would be installed. The mod must have a release that supports the target BDS version.

*Applies to: lip 0.41.x*

## When I run the lip install commands from the LeviLamina/LSE installation docs, the commands with `@version` fail. How should I write them?

In `<repo>@<version>` in the docs, version is only a placeholder; do not copy it literally. To install the latest version, remove the whole `@version`, for example `lip install github.com/LiteLDev/LegacyScriptEngine` (repositories of LiteLDev can also be shortened to `lip install LegacyScriptEngine`). To install a specific version, write the actual version number, for example `lip install github.com/LiteLDev/LegacyScriptEngine@0.23.1` (the `v0.23.1` tag of the repository). With a variant, write `#variant` before the `@`, such as `LegacyScriptEngine#lua@0.23.1`.

Note: in current lip, `lip install LeviLamina` / `lip install LeviLamina@<version>` also installs the matching BDS the way `lip setup` does (you must accept the EULA). To change the version of an installed LeviLamina, use `lip setup`.

## When I install with `lip install github.com/LiteLDev/LegacyScriptEngine@<version>`, are all four LSE language engines installed? Do I need to add `#` after the version?

No `#` is needed. Running `lip install github.com/LiteLDev/LegacyScriptEngine@<version>` (without a variant) installs only the QuickJS and Lua engines. The Node.js and Python engines need their variants installed separately, with the variant written before the `@`: `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs@<version>` and `lip install github.com/LiteLDev/LegacyScriptEngine#python@<version>` (without `@<version>`, the latest version is installed).

*Applies to: LegacyScriptEngine 0.17.x and later*

## After installing LeviLamina with lip there is no LegacyScriptEngine, and old JS/Lua plugins do not work. Why?

LeviLamina is modular, and LSE is not installed with LL automatically; install it separately. In the server root directory, run `lip install github.com/LiteLDev/LegacyScriptEngine` (short form `lip install LegacyScriptEngine`; without a variant it installs the QuickJS and Lua engines; for just one, write `#quickjs` or `#lua`, and use `#nodejs` or `#python` for Node.js/Python).

You can also download the matching `LegacyScriptEngine-server-<engine>-windows-x64.zip` from <https://github.com/LiteLDev/LegacyScriptEngine/releases> and extract it into the server manually (the engine is placed in `mods/legacy-script-engine-<engine>/`), but then you must handle dependencies such as LegacyRemoteCall, LegacyMoney and iListenAttentively yourself (the Node.js engine also needs the node runtime `node-prebuilt.zip` and `7-zip-tooth`). lip is recommended. After installing, put the script plugins in `plugins/` and restart the server.

*Applies to: LeviLamina 0.10 and later*

## Downloading or installing the LSE NodeJS engine with lip fails. What should I do?

1. Update lip to the latest version first: `lip self-update`.
2. Clear the cache and try again: `lip cache clean`.
3. If GitHub is slow or blocked, set a GitHub proxy: `lip config set github_proxy <proxy address>`; or set the system HTTP proxy environment variable in the terminal (for example, in PowerShell: `$env:HTTPS_PROXY = "http://127.0.0.1:port"`), which lip uses automatically.
4. Reinstall with the current package name: `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` (short form `lip install LegacyScriptEngine#nodejs`). Note that you must first set up the game and LeviLamina with `lip setup --game <version>`. If the package was already explicitly installed, `lip install` refuses; use `lip update` instead, or run `lip uninstall` first and then install again.

When it fails, check the hint in the terminal and the failure report under `.lip/logs/` to find the cause.

*Applies to: lip 0.41.x and later*

## Does installing BDS/LeviLamina with lip stop at a step that requires accepting the Minecraft EULA? Is there a parameter to skip the acceptance in a one-click install script?

Yes, it asks. When installing the game (BDS), current lip shows the Minecraft EULA and Microsoft privacy statement links and requires you to type `yes` to continue; in a non-interactive terminal such as a script, it fails immediately without the parameter. In a script, add `--accept-eula` to skip the prompt, for example:

```shell
lip setup --game 1.21.0 --loader levilamina@1.0.0 --accept-eula
```

or `lip install LeviLamina github.com/user/repo --accept-eula` (it takes effect when install runs as a setup). It asks again every time the game is installed, and your acceptance is not recorded.

*Applies to: lip 0.41.x and later*

## After installing LeviLamina with lip, starting BDS shows an error about a missing runtime library (it looks like vcredist is needed), but installing vcredist did not help. What should I do?

This is usually caused by an incomplete BDS download. BDS is downloaded from the official website by bdsdown, called from the install hook of the lip package `github.com/LiteLDev/bds`, and you can specify a download mirror through the environment variable `BDSDOWN_MIRROR_URL`. In PowerShell, set the mirror first and then reinstall in an empty folder:

```powershell
$env:BDSDOWN_MIRROR_URL="<mirror address>"
lip setup --game <version>
```

(or `lip install LeviLamina`). lip passes the environment variables of the current terminal to the installation process. One user downloaded successfully using <https://mcdl.bibk.top> as the mirror.

## Installing LeviLamina or plugins with lip fails. In which directory should lip run? Do I need to install the LSE dependencies one by one?

lip uses the current working directory as the workspace, so it must run in the server root directory (the directory containing `bedrock_server.exe`); there is no option to specify another directory. lip itself can be put in PATH. To create a new server, run `lip setup --game <version>` (or `lip install LeviLamina`) in an empty folder.

To install LegacyScriptEngine, you only install the package itself (for example `lip install LegacyScriptEngine#lua`); the other dependencies (such as LegacyRemoteCall) are resolved and installed automatically. However, `lip install` does not install or change the game and LeviLamina: first run `lip setup` to install a LeviLamina that satisfies the LSE version constraint, otherwise the command fails and points you to `lip setup`. Installing LeviLamina automatically runs PeEditor to generate `bedrock_server_mod.exe`. In scripts that need to be non-interactive, use `--accept-eula` (new lip no longer has the `-y` option).

*Applies to: lip 0.41.x and later*

## What is the package name when installing LeviLamina with lip? Where can I look up lip packages?

The package name of LeviLamina is `github.com/LiteLDev/LeviLamina`. Repositories under the LiteLDev organization can be shortened, such as `lip install LeviLamina` (equivalent to the full form; for a new server, `lip setup --game <version>` is recommended, which automatically selects a suitable LeviLamina). lip has no central repository: a package is the address of a public git repository. To find mods, run `lip` to open the Get mods page of the interactive interface, or browse levimc.org.

*Applies to: lip 0.41.x and later*

## Installing or upgrading LeviLamina with lip was interrupted (`bdsdown.exe` and other files remain in the directory), or the server cannot start after installing in a directory that already has old server files. How do I install and upgrade correctly?

New server: in an empty folder, run `lip setup --game <version>` (or `lip install LeviLamina`), then install the mods you need with `lip install`, and then copy over the old server's `worlds/`, `server.properties`, `allowlist.json`, `permissions.json` and the configuration of each mod. You do not need to keep the old `bedrock_server_mod.exe`; it is regenerated when LeviLamina is installed.

Upgrade: for a server already managed by lip, run `lip setup --game <new version>` in that directory. Worlds and the configuration files above are kept; mods that are incompatible with the new version are listed as left-out, and lip asks whether to uninstall them.

Interruption: installation in current lip is atomic. After an interruption, the next `lip setup/install/update/uninstall/run` automatically rolls back or completes the previous operation, so you do not need to delete leftover files manually (do not delete `.lip/journal` and `.*.bak`).

If the server does not start, first check the server output and `logs\latest.log` (typical causes are a port already in use or a mod failing to load).

*Applies to: lip 0.41.x; LeviLamina 26.x*

## After installing LeviLamina with lip, which file do I use to start the server?

A server with LeviLamina must run `bedrock_server_mod.exe` (generated from `bedrock_server.exe` by PeEditor during installation); do not run the vanilla `bedrock_server.exe`. New lip can also run `lip run` directly in the server directory (or click start on the server page of the lip interface); when a loader is installed, it runs `bedrock_server_mod.exe`.

## When I install a plugin with lip, it finishes immediately without any download, but the mods (plugins in older versions) directory has no such plugin (for example GMLIB) and reports missing dependencies. What should I do?

lip has a download cache, so it can finish without downloading. In addition, lip records installed packages in `.lip/state.json` in the workspace. If you manually deleted the files of an installed package earlier, lip still considers it installed and does not reinstall the same version, which leaves files missing. To fix it, run `lip uninstall <the package you explicitly installed>` and then `lip install <that package>` again (dependencies are uninstalled/installed along with it automatically). Note that `lip uninstall` only accepts explicitly installed packages: a package installed as a dependency, such as GMLIB, cannot be uninstalled directly; uninstall the mod that depends on it. If you suspect a corrupted cache, run `lip cache clean` to empty it (on Windows the cache is in `%LOCALAPPDATA%\lip\Cache`). Do not delete files installed by lip manually; use `lip uninstall` to uninstall.

*Applies to: lip 0.41.x*

## Can lip update only the BDS itself?

Yes. In lip, BDS is the package `github.com/LiteLDev/bds` (the "game" of the workspace). Run `lip setup --game <version>` in the server directory (for example `lip setup --game 1.26.60`) to switch to a specific BDS version. lip also selects the latest LeviLamina that supports that version (you can specify it with `--loader levilamina@<version>`, or install only the vanilla server with `--no-loader`) and switches the other mods to versions that work with it. Worlds, `server.properties`, `allowlist.json` and `permissions.json` are kept. Add `-n` (`--dry-run`) to preview the changes first. Note that `lip install`/`lip update` cannot update BDS directly and tell you to use `lip setup` instead.

*Applies to: lip 0.41.x*

## Can I use lip to update LeviLamina to the latest commit of the development branch?

You cannot get unreleased development builds. lip installs/switches LeviLamina (the loader) with `lip setup --loader levilamina@<released version>` (or with `lip install` without a ref or with a version number, which installs it as the loader). Although `lip install` supports `@branch:<name>`/`@rev:<commit>` references, the resource addresses in the `lip.toml` of LeviLamina point to the release packages on GitHub Releases, so a branch still yields the build of a released version. To use the build of the latest commit, the only way is to download the artifacts from GitHub Actions (the build workflow) of the LeviLamina repository and replace the files manually. Note that the default branch of LeviLamina is now `main` (there is no `develop` branch any more).

*Applies to: LeviLamina 26.x; lip 0.41.x*

## lip says its version is too old (shows 0.31 or so) although I have installed a new one. Why?

Two lip installations exist at the same time, and the PATH environment variable still points first to the directory of the old lip. Confirm the version that is actually running with `lip --version` (or `lip -v`), and check the actual path with `Get-Command lip` in PowerShell or `where lip` in cmd. Delete the old one, or change PATH to the installation path of the new lip (reopen the terminal after changing it). After that, you can update lip itself with `lip self-update`.

*Applies to: current version (Windows)*

## lip fails when I install the server directly in the root of a drive (such as `F:\`). What should I do?

Do not use the root of a drive as the server directory (workspace). Create a subfolder (such as `F:\server`) as the workspace, and then install in it with `lip setup` / `lip install`.

*Applies to: older lip (current version unconfirmed). Not confirmed against the source code or the documentation: treat it as a pointer.*

## A download or installation with lip is interrupted and says it was blocked by 360 Safe Guard. What should I do?

The antivirus software (360) blocked the download or file writes of lip. Right-click the 360 icon in the tray and exit it, or add lip and the server directory to the trusted whitelist, and then run the installation command again.

*Not confirmed against the source code or the documentation: treat it as a pointer.*
