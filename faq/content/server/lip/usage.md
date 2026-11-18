# Using and configuring lip

## Configuration

### My mod is already listed in the catalog, but after I changed the package description file (`tooth.json` / `lip.toml`) in the repository, the catalog information never updates. Why?

The catalog reads the package file (`lip.toml`, or `tooth.json` only if there is none) at each version tag (`v<version>`). The name, description, tags and so on shown in the list come from the package file of the latest version, not from the latest file on the default branch. If you only change the repository content without publishing a new tag, the catalog does not change.

The correct approach is to update `lip.toml` first (raise `version`), then publish a new version with a new tag (such as `v0.2.0`). The catalog is built every hour, and the new tag appears in the next build.

The README on the detail page also comes from the repository file at that version tag (`raw.githubusercontent.com/<author>/<repo>/v<version>/README.md`), so changing only the README on the default branch does not update it either. Only the Gallery (`docs/showcase/showcase.json` on the default branch) takes effect directly in the next build.

*Applies to: current LeviMC mod catalog (levimc.org/mods)*

### Do I need to commit compiled binaries to the source repository, or keep them in a separate repository, for a plugin published for lip?

No. In `lip.toml`, add an asset with `type = "mcmod"` (a LeviLamina mod ZIP) or `type = "zip"` to the variant entry, and point `urls` to the attachment of a GitHub Release, for example `https://github.com/<you>/my-mod/releases/download/v{{version}}/my-mod-server-windows-x64.zip`.

- A `zip` asset additionally needs `place` to specify which files of the ZIP go where, for example `place = [{ src = "my-mod/", dest = "mods/my-mod/" }]`.
- An `mcmod` asset requires a `manifest.json` at the root of the ZIP and is placed as a whole into `mods/<mod-name>/`.
- LeviLamina, LSE and levilamina-mod-template all use `zip` + Release attachments; the template's release workflow automatically builds and uploads ZIPs such as `<repository-name>-server-windows-x64.zip`.

If GitHub is slow for you in mainland China, set a GitHub proxy with `lip config set github_proxy <URL>`, or use a system proxy environment variable such as `HTTPS_PROXY`.

*Applies to: lip 0.40 and later (lip.toml)*

### Where are the configuration file and cache of new lip stored? Can they be placed in the current directory?

lip's user-level configuration and cache live in the standard user directories of each platform, not in the current directory:

- Configuration (`config.toml`): Windows `%APPDATA%\lip`, Linux/macOS `$XDG_CONFIG_HOME/lip` (default `~/.config/lip`)
- Cache: Windows `%LOCALAPPDATA%\lip\Cache`, Linux/macOS `$XDG_CACHE_HOME/lip` (default `~/.cache/lip`)
- Data (such as Wine): Windows `%LOCALAPPDATA%\lip\Data`, Linux/macOS default `~/.local/share/lip`
- State (the workspace list of the interface): Windows `%LOCALAPPDATA%\lip\State`, Linux/macOS default `~/.local/state/lip`

Each server directory (workspace) also has a `.lip/` directory holding `state.json`, the workspace configuration `.lip/config.toml`, logs and so on. An old `liprc.json` is converted to `config.toml` automatically, and `tooth_lock.json` is converted to `.lip/state.json`. If downloaded files seem corrupted or the same installation keeps failing, run `lip cache clean` and retry; nothing is lost by doing so.

*Applies to: lip 0.40 and later (current 0.41.1)*

### Installing a new server (BDS) with lip fails no matter what version number I enter. How do I fix it?

It is most likely a network/proxy configuration problem. Check lip's GitHub proxy setting `github_proxy` with `lip config list`. If the proxy is unavailable or does not support git repositories, delete it with `lip config delete github_proxy` (or connect directly with `lip config set github_proxy ""`), or switch to a working proxy with `lip config set github_proxy https://<proxy-address>/`.

lip's version list comes from `https://levimc.org/api/v4/mc/versions/`, and the server itself is downloaded from `www.minecraft.net`; both must be reachable too. The command to create a server is `lip setup --game <version>` (such as `1.26.60`). On failure, check the failure report under `.lip/logs/` to find the cause.

*Applies to: lip 0.38+ (after the C# rewrite, the config key is `github_proxy`; verified on 0.41.1)*

### After configuring a GitHub mirror/proxy for lip it fails, and the address was written as `https:/xxx`. What is wrong?

The URL scheme was written wrong, with one slash missing; it should be a complete URL prefix like `https://xxx/`. Current lip sets the GitHub proxy with the `github_proxy` option. To fix it:

```shell
lip config set github_proxy https://xxx/
```

You can also edit `github_proxy` in `%APPDATA%\lip\config.toml` directly, or enter the GitHub proxy on the Settings page of the lip interface. Setting it to an empty string (`lip config set github_proxy ""`) means connecting to GitHub directly, and `lip config delete github_proxy` restores the unconfigured state.

*Applies to: lip 0.40 and later (`config.toml` / `github_proxy`); older lip used the mirror setting in `liprc.json`*

### Downloads time out when lip installs a package (retrying many times and switching computers did not help). What should I do? How do I choose which folder lip installs into?

If GitHub is slow or blocked, set a GitHub proxy with `lip config set github_proxy <proxy-address>` (the address followed by `<owner>/<repo>/…` must return the corresponding content on GitHub), or set an environment variable such as `HTTPS_PROXY` in the terminal to use a regular network proxy, then retry. You can test whether the proxy returns 200 with `curl "<proxy-address>/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"`.

lip's workspace is the current working directory, and there is no option to specify another one: to install into a folder, `cd` to that directory first and then run the lip command.

*Applies to: lip 0.40 and later*

### After setting a GitHub proxy or another option for lip, how do I remove that setting?

Delete it with `lip config delete <KEY>` to restore the default, for example `lip config delete github_proxy` (no proxy; the interface asks again when it cannot reach GitHub). If you want to state explicitly "connect directly, do not ask again", set it to an empty value instead: `lip config set github_proxy ""` (in PowerShell write `lip config set github_proxy --% ""`).

*Applies to: lip 0.40 and later (the "interface asks again" distinction only matters since the 0.41.0 interface)*

### Cloning LeviLamina through a GitHub mirror fails in lip/the launcher (for example `fatal: unable to access 'https://github.bibk.top/LiteLDev/LeviLamina.git/': Recv failure: Connection was reset`). How do I change the GitHub mirror (proxy)?

The former default self-hosted mirror `github.bibk.top` suffers heavy network interference; switch to another GitHub proxy:

1. Standalone lip: run `lip config set github_proxy https://v4.gh-proxy.org/https://github.com/` (services like gh-proxy need the full `https://github.com/` prefix after the address). You can test a proxy with `curl.exe -s -o NUL -w "%{http_code}" "<proxy>/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"`; 200 means it works. If you do not want a proxy, run `lip config delete github_proxy`. The settings page of lip's terminal interface can also set it and tests it first.
2. LeviLauncher: on the "Package Management" page of Settings, choose a preset or enter one manually in the GitHub proxy field (since 1.1.0 the default is <https://gh-proxy.org/https://github.com>, and the presets also include `v4.gh-proxy.org`, `gh.bibk.top` and others). You do not need to reinstall the launcher after changing it.
3. You can also use a regular proxy: lip reads the `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` environment variables and uses the system proxy when they are not set.

In addition, when a request through `github_proxy` fails, lip falls back to connecting to GitHub directly.

*Applies to: lip 0.40+ (standalone); LeviLauncher 1.1.0 and later (built-in package manager)*

### After configuring a GitHub proxy for lip, downloading `bedrock-runtime-data` fails with HTTP 404 (`Failed to download from https://gh-proxy.com/LiteLDev/bedrock-runtime-data/releases/download/...`). How do I set the proxy correctly?

The proxy address is wrong: proxies like gh-proxy require the full GitHub address after their own address (writing only `https://gh-proxy.com/` or `https://gh-proxy.org/` gives a 404). lip appends `<owner>/<repo>/...` directly after `github_proxy`, so set it like this:

```shell
lip config set github_proxy https://v4.gh-proxy.org/https://github.com/
```

Before setting it, you can test with the following command; 200 means the proxy works:

```shell
curl.exe -s -o NUL -w "%{http_code}" "https://v4.gh-proxy.org/https://github.com/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"
```

*Applies to: lip 0.40 and later*

### After a mod moves to a new GitHub repository, what must change for lip/the mod list to include it?

The package ID must match the repository path. Current packages use `lip.toml`; change its `id` to the new repository path, for example `id = "github.com/user/repo"` for the repository `https://github.com/user/repo`. Otherwise the commit is not treated as a package and lip does not install it (so the mod list cannot install it properly either; for how a mod gets listed, see the "Publish your mod with lip" tutorial on levimc.org).

In the old `tooth.json` format the corresponding field is `tooth` (you can migrate to `lip.toml` with `lip pkg migrate`, and `tooth` becomes `id`). After the change, publish with a new version tag `v<version>`, and `version` must equal the tag's version.

*Applies to: lip.toml format 4 (current); for old tooth.json packages, change the `tooth` field likewise*

### When publishing a LeviLamina mod, can the LeviLamina dependency in the package file be pinned to one specific version? Where does the mod icon go?

Pinning a single version is not recommended: a full version without an operator (such as `"26.60.8"`) matches only that version, so as soon as LeviLamina releases a new version, your mod cannot be installed onto it through lip/the launcher and can only be added by hand. Write a range instead, for example:

```toml
[variants."".deps]
"github.com/LiteLDev/LeviLamina" = "26.60.*"
```

or something like `">=26.60.0 <26.70.0"` (the syntax is that of `SemVersionRange` from Semver for .NET, supporting `^`, `~`, `*`, `>=…<…` and `||`).

Also, `id` must match the actual repository address. The mod icon goes in `logo` under `[info]` (it must start with `https://`), for example `logo = "https://raw.githubusercontent.com/<owner>/<repo>/refs/heads/main/.../pack_icon.png"`. In the old `tooth.json` the counterparts are `dependencies` and `info.avatar_url`; when migrating, `avatar_url` becomes `info.logo`.

Additionally: a client entry (`side = "client"`) also depends on LeviLamina without `#client`; the official template writes `">26.60.6 <26.61.0"` (because for `tooth.json` versions up to 26.60.6 the default variant is the server build).

*Applies to: lip.toml format 4 (current); built-in package manager of LeviLauncher 1.1.0+; old tooth.json packages use `dependencies`/`avatar_url`*

## Features and versions

### Where do I find and publish plugins/mods for LeviLamina? (The old forum, lippkg and bedrinth no longer open)

The LiteLDev forum has been closed for a long time, and `lippkg.com`, `bedrinth` and `pkg.levimc.org` are deprecated as well. The current plugin/mod directory is LeviMC Mods: <https://levimc.org/mods/>. Every mod page shows its install command, and you can install with lip (`lip install github.com/<author>/<repo>`, or on the "Get mods" page of the lip interface). Client mods can also be browsed and installed in LeviLauncher. To publish a mod, an author only needs to tag a version on GitHub with a `lip.toml`; the directory picks it up automatically or through a PR. Report problems through the GitHub issues of each project.

*Applies to: all current versions (lip 0.40 and later, LeviLauncher)*

### I published a LeviLamina mod on GitHub. How do I get it listed in lip's mod directory (LeviMC Mods / LeviLauncher)? Why can't it be found?

The current directory is LeviMC Mods (<https://levimc.org/mods/>). The "Get mods" page of lip and LeviLauncher both read it, and it replaces the former lipr / bedrinth. It is built from the repository list in `mods/repos.txt` in the `LiteLDev/liteldev.github.io` repository:

1. Automatic discovery: every two hours a bot uses GitHub code search to find repositories that have a `lip.toml` (or the old `tooth.json`) in the root and a version tag lip can read, and then opens a PR adding the repository to `repos.txt`. After the maintainers merge it, the mod appears in the next hourly build. Forked repositories are not discovered. Because this relies on GitHub code search (whose quota is often exhausted, so some runs are skipped), a new repository may not be found until GitHub has built its code index. In that case, opening a PR yourself (step 2) is the fastest way.
2. To get listed faster: open a PR that edits `mods/repos.txt` and adds a line `<author>/<repo>`.
3. Requirements: the version tag must be `v` plus a full semantic version (such as `v1.0.0`, not `1.0.0` or `v1.0`), and the `version` in `lip.toml` at that tag must match it; the latest version must depend on LeviLamina (directly or indirectly); put the files in `mods/` (or `plugins/` and so on); the repository must not be a GitHub template, and its name must not end with `-template`, `-example`, `-demo`, `-sample` or `-test`.
4. Self-check: `lip pkg view github.com/<author>/<repo>` should list your version under `versions`; you can also run `lip install` on a test server (add `--dry-run` to leave files untouched).

If you do not want to be listed: close the PR the bot opened (it will not propose it again after that) or delete your line from `repos.txt`. Also, lip itself does not depend on the directory: a repository that is not listed can still be installed directly with `lip install github.com/<author>/<repo>`.

*Applies to: lip 0.40 and later (publishing a lip.toml package needs the `lip pkg` command of lip 0.41); current LeviMC Mods directory*

### I keep several mods/plugins in one repository and do not want to split it. Can I publish it to lip? Do I have to publish a GitHub Release to publish a lip package?

The package ID of lip is the repository path (such as `github.com/user/repo`), and one repository is one package. A package can have several variants, though, which lets you keep several mods in one repository: write one `[[variants."<name>"]]` entry per mod in `lip.toml` (the name matches `^[a-z0-9_]+(/[a-z0-9_]+)?$`), and users pick which one to install with `lip install github.com/user/repo#<name>` (this is how the `#lua` and `#nodejs` engines of LSE work). Note that all variants of one repository share the version tags. A version is a git tag named `v<SemVer>` (such as `v1.2.3`), and the `version` in `lip.toml` at that tag must match it. "Publishing" is essentially pushing that tag; a GitHub Release is only used to host the ZIP files that the `urls` in the assets point to. If you really want each mod to have its own version, you can also create a repository per mod that contains only a `lip.toml`, with the `urls` of its zip/mcmod assets pointing at files in the Releases of the large repository.

*Applies to: lip v0.40 and later (lip.toml format 4); in the old tooth.json, variants are distinguished by label*

### Does lipui (the graphical interface of lip) still work? Is there a graphical interface if I cannot use the command line? What if I want a specific version of BDS?

lipui is archived and no longer available. Its features are now part of lip itself: type just `lip` (with no arguments) in a terminal to open the lip interface. The home page guides you through creating a server, installing mods and starting the server, so you do not need to remember commands. To install a specific version of BDS, choose the version when you create the server in the interface, or use `lip setup --game <version>` (for example `lip setup --game 1.21.0`; it includes the latest compatible LeviLamina by default, which you can adjust with `--loader levilamina@<version>` or `--no-loader`). You can also run `lip install github.com/LiteLDev/bds@1.21.0 LeviLamina` (game 1.21.0 plus the latest LeviLamina compatible with it). If you only need to download the server files, you can use bdsdown too (`lip install github.com/LiteLDev/bdsdown`).

*Applies to: lip v0.40 and later (built-in interface)*

### Do I have to write a version number when installing a package with lip? Does it install the latest version automatically if I leave it out?

No. `lip install github.com/user/repo` installs the highest version tag (`v<SemVer>`) of the repository. To pin a version, write `github.com/user/repo@1.0.0` (the tag `v1.0.0`); `@branch:<name>`, `@tag:<name>` and `@rev:<full commit>` also work. Repositories of LiteLDev can omit the prefix, such as `lip install LeviLamina`. Installing does not need a `-y` confirmation argument. For usage, see <https://levimc.org/lip/>.

*Applies to: after lip 0.26 up to now (currently v0.41.1)*

### Can lip keep a dependency list in the current directory like npm, write to it on `lip install`, and so let people share a list as a "server pack"?

No. `lip install` only installs packages into the server folder and records them in `.lip/state.json`; it never writes to `lip.toml`, and lip has no workspace manifest like `package.json`. To install a set of packages at once (a server pack), you can make a package of your own: list all the packages you need in the `deps` of its `lip.toml` (like the default variant of LegacyScriptEngine, which depends on the quickjs and lua engine variants). After you publish it, others install everything with `lip install <your package>`. For the publishing tutorial, see <https://levimc.org/tutorials/develop/publish-a-package/>. Also, lip manages only the server; entries in `lip.toml` distinguish the two sides with `side = "server"`/`"client"`, and client mods are installed by launchers such as LeviLauncher reading the same packages.

*Applies to: current lip (the lip.toml era)*

### How does the mod download in LeviLauncher relate to lip? Are mods from overseas authors such as Lamium distributed through lip too?

Yes. LeviLauncher has lip's package management built in; downloading, installing and updating LeviLamina mods is in fact done with lip, and the mod directory comes from the lip mod index on levimc.org. Mods such as Lamium (`github.com/amatouhake/Lamium`) are distributed through lip as well, rather than hosted on CurseForge. On the launcher's mods page, "package-managed mods" are the mods managed by lip, and "regular mods" are the mods in the `mods` directory that lip does not manage (for example, ones you imported manually).

*Applies to: LeviLauncher v1.1.0 (current version)*

### Can lip be used to download BDS?

Yes. The game package of lip is `github.com/LiteLDev/bds`: `lip install github.com/LiteLDev/bds@<version>` installs the Windows server without a loader, and adding `#linux` gives the Linux version; you can also use `lip setup --game <version> --no-loader`. To get LeviLamina with it, just run `lip install LeviLamina`, which sets up the matching BDS automatically. If you only need to download the BDS files, you can also use the bdsdown tool (`lip install github.com/LiteLDev/bdsdown`).

*Applies to: lip v0.41.0 and later*

### What does lip do when a hook command run during package installation fails?

A hook command that exits with a non-zero exit code fails the whole operation (install/uninstall). lip rolls back the file changes of that operation but not what the hook command did itself, so hook commands should be safe to run repeatedly. The package description file is now `lip.toml`, and hooks are written in the `hooks` of an entry (`pre_install`, `post_install`, `pre_uninstall`, `post_uninstall`). Each entry corresponds to exactly one side and platform; for several platforms, write one entry per platform with its own commands. Commands for the Windows platform run with `cmd /s /c` (through Wine on Linux/macOS), and those for other platforms run with `sh -c`.

*Applies to: lip v0.40/v0.41 (lip.toml); scripts in the old tooth.json are converted to hooks*

### Can lip search the mod list and install from just a package name, like pacman (for example `lip -S levilamina`)?

The command line cannot search and install by package name. A lip package is uniquely identified by its source (the repository address), such as `github.com/LiteLDev/LegacyScriptEngine`, and there is no central repository, so third-party packages must be written with the full repository path. The exception: a name without `/` is treated as a repository under `github.com/LiteLDev/`, so official LiteLDev packages can be written in short form, such as `lip install LeviLamina` and `lip install LeviOptimize`. To search by name, type `lip` in a terminal to open the interface and search the mods listed on levimc.org on the "Get mods" page, or look them up at <https://levimc.org/mods/>.

*Applies to: lip v0.41.0 and later*

### Can lip install packages globally, like `npm -g`?

No. lip has no concept of a global install. The workspace of every command is the current working directory (the server folder), packages are installed into that workspace, and there is no option to choose another workspace, so you need to `cd` to the server directory before running a command.

*Applies to: all current versions of lip*

### After installing LeviLamina with lip, an extra package named loc (levilamina-loc) appeared. What is it? Do I need to install it manually?

This is `github.com/LiteLDev/levilamina-loc`, the language pack (localization) of LeviLamina; its content goes to `mods/LeviLamina/lang/`. It is a dependency declared by LeviLamina, so lip installs it automatically when you install LeviLamina, and you do not need to handle it manually.

*Applies to: all current LeviLamina versions (server and client)*

### Can new lip still install packages that use the old `tooth.json` format (`format_version` 1/2/3)? What should package authors do?

Yes. The package description file of current lip (stable releases since v0.40.0, latest v0.41.1; v0.37.0 and earlier used `tooth.json`) is `lip.toml` (`format = 4`), but lip still reads `tooth.json` from the lip v0.x era (format 1, 2, 3): format 1/2 is interpreted as format 3 first, then converted locally to the `lip.toml` structure and installed, just like a regular package. In old workspaces, `tooth_lock.json` and `liprc.json` are migrated automatically on first use to `.lip/state.json` and `config.toml`.

Package authors should switch to `lip.toml` in new versions. Run `lip pkg migrate` in the repository root to convert `tooth.json` to `lip.toml` (this deletes `tooth.json`; check the warnings before committing), then verify with `lip pkg view .`. You do not need to dig through old tags for the old format documentation: the "Earlier formats" section of the `lip.toml` page in the lip documentation describes how `tooth.json` is read.

Note: new lip has no central repository and no module proxy (it no longer uses goproxy/lipr) and fetches packages directly from git repositories; if GitHub is slow, set a proxy with `lip config set github_proxy <URL>`.

*Applies to: lip 0.40.0 and later (the lip.toml era, latest 0.41.1)*

### After installing Glacie (the multi-version compatibility mod) directly with lip, it errors out or does not work, the console shows that the installed version does not match the server, or installing a specific version fails. What should I do?

Glacie's package manifest does not declare a dependency on the LeviLamina/game version, so installing without a version number makes lip install the latest version, which does not necessarily match your server. Choose the Glacie version that matches your server version and specify it when installing: `lip install github.com/GlacieTeam/Glacie@<version>`, or download the matching version manually from the GitHub Releases. See Glacie's README and changelog for the version mapping; when something goes wrong, first check whether the actual version number printed in the console matches.

If the installation fails because lip cannot read the new package format, your lip is too old: update it with `lip self-update` or from <https://github.com/LiteLDev/lip/releases>.

*Applies to: lip 0.40 and later; Glacie 3.x (`tooth.json` `format_version` 3, no LeviLamina dependency declared)*

### After installing a plugin/LeviLamina with lip, I am told it is incompatible with the current LeviLamina (or BDS) version. What is going on?

The usual cause is that the install command has an old version number hard-coded (such as `lip install <repository>@x.y.z` given in a plugin's instructions), so an old version was installed that does not match the current LeviLamina. Remove `@x.y.z` from the command, and lip installs the latest stable version that works in the current workspace.

lip selects the game (BDS) and LeviLamina versions together: `lip install LeviLamina` installs the latest LeviLamina and the latest game version it supports. `lip install` does not replace the installed game/loader; if a mod needs a newer LeviLamina, the command fails and tells you to switch the game and loader version with `lip setup` first (for example `lip setup --game <version>`), and then install the mod. After starting the server, you can confirm the LeviLamina version with the `version` command.

The old problem where the one-click install of older lip pulled the latest BDS that LeviLamina did not support no longer occurs.

*Applies to: lip 0.41.x (current version)*

### Where is the lip source repository? Can the latest BDS downloaded from the official BDS site be used with LeviLamina directly?

The lip repository is at <https://github.com/LiteLDev/lip> (the old address `futrime/lip` redirects there). The latest BDS from the official site is often newer than the version LeviLamina supports and cannot be used directly; use the BDS version that matches LeviLamina. Using lip is recommended: `lip install LeviLamina` installs the latest LeviLamina and the latest game version it supports, or use `lip setup --game <version> --loader levilamina` to specify the game version and have the matching LeviLamina selected automatically.

### I want to deploy LeviLamina + LegacyScriptEngine on an old BDS version (such as 1.21.1). Is there a matching server pack?

There is no official server pack, but you can build one per version with lip (v0.41.0 and later).

Game and loader: in an empty server directory run `lip setup --game 1.21.1` (it automatically picks the latest LeviLamina that supports that game version; you can also specify one with `--loader levilamina@<version>`), or `lip install github.com/LiteLDev/bds@1.21.1 LeviLamina`.

LSE: since LSE v0.10.0 each engine is published as a variant, so you can install the version matching your LeviLamina with `lip install github.com/LiteLDev/LegacyScriptEngine#lua@<version>` (`#<variant>` goes before `@`).

However, the LSE repository for the 1.21.1 generation (LeviLamina 0.13.x, corresponding to LSE 0.8.x) has no variants such as `#lua`; the engine packages are hosted on `gitea.litebds.com` and currently cannot be installed through lip. In that case, download the matching `legacy-script-engine-<engine>-windows-x64.zip` from LSE's GitHub Releases and install it manually (dependencies such as LegacyMoney must also be installed manually in matching versions).

*Applies to: lip 0.41.0 and later (`lip setup` and the bare name `LeviLamina` exist only since 0.41.0); installing LSE variants only applies to LSE 0.10.0+. Not confirmed against the source code or the documentation: treat it as a pointer.*

### What format must GitHub version tags have when publishing a package for lip? What if a tag without `v` cannot be installed and does not appear in the catalog?

lip only treats a tag as a version if its name is exactly `v` followed by a SemVer 2.0.0 version, such as `v1.1.0-rc.1` or `v2.0.0`. Tags like `1.1.0-rc.1`, `2.0.0`, `v1.2` and `v01.2.3` are ignored, and lip, the LeviMC mod catalog and LeviLauncher all skip them. In addition, `version` in `lip.toml` at the tag must match the tag (without the `v`, e.g. `version = "2.0.0"`).

To fix it, publish an additional tag/Release with the `v` prefix. lip now queries the repository tags directly over the git protocol, without going through a Go module proxy and without caching the tag list, so a new tag takes effect immediately and you no longer need to change GOPROXY.

In `lip.toml` you can reference the version with `{{version}}` (for example in an asset URL) and the package ID with `{{id}}`. Use `lip pkg view github.com/<author>/<repo>` to confirm that the version is recognized.

*Applies to: lip 0.40 and later (lip.toml format 4); the same tag rules apply to old tooth.json packages*

### Can lip install a local package? Can I test my own package locally during development without publishing it?

Yes. Pass `lip install` the path of a ZIP file or a folder that has a `lip.toml` at its root, for example `lip install ./my-mod.zip` or `lip install ../MyTool` (a ZIP at an `https://` URL also works). A ZIP is recognized by its content only, so the extension does not matter and the old trick of renaming to `.tth` is no longer needed. You can pack with `lip pkg pack <directory> -o my-mod.zip` and check that `lip.toml` can be read with `lip pkg view .`.

You can also test before pushing a tag with `lip install github.com/user/repo@branch:main` or `@rev:<40-char-commit>`.

Prefer managing everything with lip (including LeviLamina itself): files you put in by hand are not in lip's state records, so lip cannot resolve dependencies from them.

*Applies to: lip 0.40 and later (the `lip pkg` commands require lip 0.41+)*

### I copied LeviLamina's package files for my own lip package, but it cannot be installed. What are the common causes?

1. The version tag must be exactly `v` + a full SemVer, such as `v1.2.3`; `v1.2`, `1.2.3` and `v01.2.3` do not count as versions (though you can install any tag with `lip install github.com/user/repo@tag:1.2.3`).
2. lip reads `lip.toml` (or `tooth.json` if there is none) from the commit the tag points to. After changing package files, commit and push a new tag; the content of an old tag does not change.
3. `id` in `lip.toml` must equal the repository path (such as `github.com/user/repo`), `version` must equal the tag's version, and the requested variant must have an entry matching the current environment (platform/side); otherwise that version is not considered a candidate.
4. The repository must be public.

Use `lip pkg view <repository or .>` to check whether lip can read it.

*Applies to: lip 0.40 and later*

### The old lip documentation sites (`lip.futrime.com`, `futrime.github.io/lip`, `lip.levimc.org`, etc.) no longer open. Where can I read the lip documentation now?

The lip documentation is now on the LeviMC website: <https://levimc.org/lip/> (also available in Traditional Chinese: <https://levimc.org/zh-Hant/lip/>). The documentation source is in the `docs/lip/` directory of the GitHub repository `LiteLDev/liteldev.github.io`. The lip repository itself has moved to <https://github.com/LiteLDev/lip>. In a terminal, use `lip --help` (or `lip -h`) to see the help, and `lip <command> --help` to see the help of a single command.

*Applies to: lip 0.40 and later*

### The lip package index sites (`lippkg.com` / `bedrinth.com` / `pkg.levimc.org`) don't open or have an expired certificate. Has lip been discontinued? Can I still install packages with lip?

lip has not been discontinued; the package directory site has just changed address several times: `lippkg.com` → `bedrinth.com` → `pkg.levimc.org`. These old addresses are all deprecated, so don't use them any more. The current directory is LeviMC mods: <https://levimc.org/mods/> (the "Get mods" page in lip's interface and the one shown in LeviLauncher are the same directory). Also, a directory site being down doesn't affect installing with lip: lip has no central repository and reads versions directly from a package's git repository, so `lip install github.com/<author>/<repository>` still works.

*Applies to: lip 0.40 and later*

### After packing a server configured with lip using Windows' built-in compression, the `.lip` folder is missing. Why?

The built-in compression in Windows 11 may skip folders (hidden folders) whose names start with `.`, which makes `.lip` go missing. Use a third-party tool such as 7-Zip instead, and when you pack or migrate a server, make sure to copy `.lip` along with it: `.lip` records the installed packages, workspace settings and so on, and is a hidden directory on Windows. The compression behavior depends on the Windows version.

*Not confirmed against the source code or the documentation: treat it as a pointer.*
