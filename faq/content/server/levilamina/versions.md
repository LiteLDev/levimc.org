# LeviLamina versions and compatibility

## Can LeviLamina still support new versions now that Mojang no longer publishes the BDS PDB? What is the bedrock runtime data (magic blob) that LeviLamina provides?

Yes. Starting with the BDS 1.21 preview in June 2024, publicly released BDS builds no longer ship with a PDB, and for a while it was thought that LeviLamina would be stuck at 1.20.81/1.21.0. LiteLDev then negotiated with Mojang, and Mojang now provides the PDB and other debug information to LiteLDev privately. As a result, 1.21.10 was skipped, and internal work continued from 1.21.20. After 0.13.x, the next official release was 1.0.0-rc.1 in January 2025, which supports BDS 1.21.50.

LiteLDev packages this debug information as bedrock runtime data (commonly called the magic blob; essentially hashed symbol data) and distributes it publicly in place of the raw PDB. Both loading and developing mods depend on it, but the raw symbols are not published. For LeviLamina, the PDB is mainly used to generate the symbol table and headers automatically, so the time to support each new version depends on when Mojang hands the debug information to the team. Server owners who only install addons and run vanilla BDS are not affected.

LeviLamina currently keeps up with new versions (for example, v26.60.8 matches the Minecraft 26.60.6 server). At build time, the xmake package `bedrockdata` fetches the matching bedrock-runtime-data automatically.

*Applies to: LeviLamina 1.0.0 (BDS 1.21.50) and later; 0.13.x matches BDS 1.21.0x/1.21.3, which had a public PDB*

## Did the native mod directory change from `plugins` to `mods` in LeviLamina 26.60? Where do LSE script plugins go, and do existing LSE plugins that call native mod interfaces need to change paths?

Yes. Starting with 26.60, native server mods go in the `mods` directory (the same as on the client), and LeviLamina's own configuration is under `mods/LeviLamina/`. A mod migrates without trouble as long as it gets paths through the LL API instead of hardcoding `plugins`.

Starting with 0.23.0, LegacyScriptEngine creates the server's `plugins` folder as a directory link (junction) to `mods` at startup, so `plugins` and `mods` are effectively the same folder. This requires that the server directory has no `plugins` folder to begin with. If an ordinary `plugins` folder already exists, LSE only logs the error `Failed to create a link at …: a file or directory with the same name already exists` and does not create the link. In that case, move its contents into `mods/` and delete the old `plugins` folder.

Place LSE plugins under `mods/`, one folder per plugin with a `manifest.json`. Old scripts that hardcode `plugins/` paths still work. If you drop in a single old-style script, LSE generates a folder and manifest for it on the next startup, and you restart once more to load it. LSE plugins that call interfaces exported by other plugins through `ll.import` need no changes at all.

*Applies to: LeviLamina 26.60 and later; LegacyScriptEngine 0.23.0 and later*

## A dependency library such as GMLIB (or a plugin that depends on it) fails to load or reports an unsupported BDS version, or the dependency diagnostic shows missing symbols in `LeviLamina.dll`. What should I do?

The cause is that the library version does not match the current LeviLamina/BDS version: a native mod is compiled against a specific LeviLamina version, and after you change the LL version, the exported functions it calls may no longer exist. This is the situation when the dependency diagnostic in the log shows `|- LeviLamina.dll` under the `missing content:` section, with the missing function symbols listed under `|---- ` (older versions print `missing procedure:` / missing procedure symbols).

To fix it:

1. Install with lip (for example, `lip install github.com/GroupMountain/GMLIB`). Without a version, lip takes the highest version tag of the repository. `lip install` does not change the installed game or loader; if that version needs a different LL version, the command fails and prints the game/loader version and a `lip setup` hint. You can then specify a version that matches your LL with `lip install github.com/GroupMountain/GMLIB@<version>`, or first switch to a game/loader version the mod supports with `lip setup`.
2. For a manual install, download the release that matches your LL version from the GMLIB GitHub Releases (<https://github.com/GroupMountain/GMLIB/releases>). Re-uploads on forums are often out of date.
3. Plugins that depend on GMLIB must also be switched to matching versions. Do not downgrade LL casually; first upgrade the dependency to a version that matches your current LL, or upgrade LL/BDS as a whole and then use the new dependency version.

The "running on an unsupported BDS version" warning means some interfaces may not work. To avoid crashes or freezes, use a version it supports.

## Starting a LeviLamina server fails with FATAL `Couldn't find: MolangVariable::~MolangVariable(void)` / `Couldn't find: MolangDataDrivenGeometry::~MolangDataDrivenGeometry(void)` followed by `In module: BedrockServerClientInterface`, and the mod does not load. What should I do?

`Couldn't find: <symbol> / In module: <mod name>` means that a function symbol referenced by the mod (here BedrockServerClientInterface, or BSCI, a common dependency of mods related to simulated players and client interfaces) cannot be found in the current BDS. The mod version does not match the current LeviLamina/BDS version (usually an older mod).

Update BSCI to the version that matches your LeviLamina/BDS. BSCI version numbers now follow the game version (for example, v26.60.0 matches BDS 1.26.60). Download the matching version from <https://github.com/OEOTYAN/BedrockServerClientInterface/releases>, or install/upgrade it with lip. Conversely, if you must use an older mod, use the BDS/LeviLamina version it was compiled for.

## The client version does not match the LeviLamina server version (the message says the client is outdated or the host version is too low), or LeviLamina does not support the new version yet. How can clients of different versions join the same server (cross-version / multi-version play)?

Each LeviLamina version supports only one BDS version and has no cross-version feature. The client protocol number must match the server (minor versions with the same protocol number can join each other directly, for example 1.21.60 and 1.21.62). For cross-version play you can use third-party protocol translation:

1. Glacie (GlacieTeam; supports both LeviLamina and Endstone, with LeviLamina officially recommended): it depends on ProtocolLib, so install both. Install it with `lip install github.com/GlacieTeam/Glacie`, or download `Glacie-levilamina-windows-x86_64.zip` from <https://github.com/GlacieTeam/Glacie/releases>; get ProtocolLib from <https://github.com/GlacieTeam/ProtocolLib/releases>. GitHub Releases is the only official download source; copies on MineBBS and similar sites may be outdated. The Glacie version must match the server's BDS/LeviLamina version (for example, v3.10.3 matches BDS 1.26.60.x + LeviLamina 26.60.x); the wrong version crashes. For the range of supported client versions, see the protocol table in the ProtocolLib README.
2. Endweave (EndstoneMC/endweave, an Endstone plugin): on LeviLamina, first run Endstone plugins through LeviStone (`pip install levistone --target mods/EndstoneRuntime`), then install Endweave. It translates between the protocol versions in its support table (currently 26.40 to 26.60).
3. Alternatively, downgrade the client to the version that matches the server, or wait for LeviLamina to release support for the new version and then upgrade the server.

## Is there a LeviLamina version for BDS 26.0? How do I choose a BDS version?

No. LeviLamina jumped directly from 1.9.x (BDS 1.21.132) to 26.10.0 (supporting 26.10), and never supported 26.0. LL supports only specific BDS versions, and not every BDS version gets support (support requires data from Mojang, so progress depends on Mojang).

The right approach is to decide on the LeviLamina version first, then install the BDS version it matches. When you install LeviLamina with lip, the matching BDS is installed automatically through the dependency `github.com/LiteLDev/bds` (for example, current LeviLamina 26.60.x matches BDS 1.26.60). Chasing the newest version is not recommended.

## Why can't LeviLamina support a new version on the day BDS is released? How long does it take?

LeviLamina's progress depends on Mojang: Mojang must give the LL team the symbol data for that version (PDB and others, no longer public). From it, the team generates the data needed by bedrock-runtime-data and PreLoader, and then adapts LeviLamina itself. Work cannot start before the data arrives, and asking for updates does not help.

In addition, since 1.21.60 Mojang has raised the inlining level, so many functions are inlined, which makes support harder and slower (LeviLamina added implementations for, or restored, some inlined functions in versions such as 26.32.0 and 26.40.1).

*Applies to: LeviLamina 1.0 and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I look up which LeviLamina version matches which BDS (and LSE, etc.) version? If I want to install LeviLamina on a BDS version that is not the latest, which version do I choose and how do I install it?

Each LeviLamina version series supports exactly one specific BDS version. You can find the mapping in these places:

1. The official "Supported versions" documentation page: <https://levimc.org/LeviLamina/versions/> (for example, 26.60.x matches server 1.26.60.6 / client 1.26.60.5, 26.51.x matches 1.26.51.1, 1.9.x matches 1.21.132.3, 1.6.x matches 1.21.111.1, 1.5.x matches 1.21.102.1, and 0.12.x matches 1.20.8x).
2. The `Adapted to Minecraft ...` entries in the LeviLamina CHANGELOG / GitHub Release notes.
3. The dependency declarations in the package file: since v26.60.8 the package file is `lip.toml` instead of `tooth.json`, and `"github.com/LiteLDev/bds" = "1.26.60"` under `[variants."".deps]` is the required BDS version. The `lip.toml` of mods such as LSE also states the supported LeviLamina version range (for example, `"github.com/LiteLDev/LeviLamina" = "26.60.*"`).

Since 26.x, the first two segments of the LeviLamina version number match the BDS version (26.60.x ↔ 1.26.60). The `versions.txt` in the LiteLDev/bds repository is only a list of full BDS version numbers, not an LL mapping table.

Installing with lip is recommended; it handles the versions of dependencies such as BDS, PreLoader, PeEditor and bedrock-runtime-data together:

- `lip install github.com/LiteLDev/bds@1.26.60 LeviLamina`: installs the specified BDS version and automatically picks the latest LeviLamina that supports it;
- `lip install LeviLamina@<version>`: installs the specified LL version and the latest BDS it supports;
- to change the game/LL version of an existing server, use `lip setup --game <version> --loader levilamina@<version>`.

Mods from older versions must also be replaced with the versions for the matching LL version. LeviLamina goes back to 0.1.x (BDS 1.20.4x); earlier BDS versions can only use the archived LiteLoaderBDS.

## Must the last segment of the BDS version that LeviLamina supports (such as the x in 1.26.10.x, or 1.21.0 versus 1.21.2) also match exactly?

Yes, it must match exactly. Each LeviLamina version series supports exactly one full BDS version number (including the last segment). For example, 26.60.x supports only server 1.26.60.6 (client 1.26.60.5), and 26.10.x supports only 1.26.10.4. Even minor BDS versions released afterward, such as 1.26.61 and 1.26.62, cannot be used directly. When the versions differ, LL does not work correctly (typically BDS exits or crashes right after loading).

Use the BDS that the LL version requires. The easiest way is to install with lip (`lip install github.com/LiteLDev/bds@<version> LeviLamina` or `lip setup`), which picks matching versions automatically.

## Can a new LeviLamina (and LSE) be installed on an older BDS version? Which LL should I use for an older BDS, and where do I download it?

No. LeviLamina is not compatible downward or across BDS versions. Each LL version supports only the BDS version listed in its release notes / version table (for example, LL 1.7.7 matches BDS 1.21.124, 1.9.x matches 1.21.132.3, and an LL for 1.21.60 cannot be used on 1.21.50). Mods such as LSE also depend on a specific LL version, so to benefit from fixes in a new LL/LSE you must upgrade BDS. If the server runs an older BDS, go back to the older LeviLamina that supports it (see <https://levimc.org/LeviLamina/versions/>). Some BDS versions (such as 1.21.30) have no matching LL version, so you have to switch to a BDS that LL supports.

You do not need to edit download links by hand for an older BDS; install it directly with lip. `lip install github.com/LiteLDev/bds@<BDS version> LeviLamina` installs that BDS and automatically picks the latest LL that supports it, and `lip install LeviLamina@<LL version>` installs the specified LL and its matching BDS. lip downloads the server from the official source through bdsdown.

## Does LeviLamina support BDS preview (Preview/Beta) versions? Can I force it to run on a preview?

No. LeviLamina supports only specific release versions of BDS. For each version it regenerates the headers, symbols and bedrock-runtime-data against the release build. A preview has no matching support data, so with LeviLamina it either fails to start or crashes soon after. Download the release BDS that matches your LeviLamina version (installing with lip is recommended). If you only want to experiment on a preview, you can only use PreLoader to load your own code; LeviLamina itself cannot be used on a preview.

## After upgrading LeviLamina, do my existing plugins/mods still work? Do I need to update them too?

It depends on two cases:

1. A minor upgrade within the same LL version series (only the last segment changes, such as 1.7.3→1.7.4, 1.9.5→1.9.9, or 26.60.1→26.60.8) does not cross game versions. LeviLamina follows semantic versioning, so plugins generally keep working without updates.
2. An upgrade across BDS versions (such as 1.21.50→1.21.60, 1.4.x→1.5.x, or 1.9.x→26.10.x): native (dll) mods generally cannot be used as they are. Their authors must adapt, recompile and release a matching version for the new version (for example GMLIB and iListenAttentively), and when a new version comes out usually only LiteLDev's own mods are updated right away. LSE (LegacyScriptEngine) script plugins (JS/Lua, etc.) usually keep working as long as LSE itself is updated to support the new version. Before upgrading, check each mod you use to confirm that it has a release for the new LL version, based on its own changelog.

When you manage the server with lip, `lip setup` changes the game/LL version and re-resolves the installed mods, and dependencies such as PreLoader and bedrock-runtime-data are updated automatically according to LeviLamina's `lip.toml`. You can search for and download native mods on the LeviMC mod site at <https://levimc.org/mods/>. An old mod that is no longer maintained and cannot be found can simply be deleted if no other mod depends on it.

## After Minecraft switched to version numbers starting with 26, how did LeviLamina's version number change? What is the next version after 1.9.x?

Starting with support for BDS 1.26.10, LeviLamina's version number follows the MC version. The next version after 1.9.x (matching BDS 1.21.132) is 26.10.0 (then 26.10.1 and so on); there is no 26.0. After that come 26.20.x, 26.32.x, 26.40.x, 26.51.x and 26.60.x, where the major and minor numbers match the MC version supported (for example, LeviLamina 26.60.x matches BDS 1.26.60.6).

*Applies to: LeviLamina 26.10.0 and later*

## Is LeviLamina no longer tied to a specific version of Bedrock BDS? How do I get the matching BDS version?

Each LeviLamina version still matches a specific BDS version (for example, LeviLamina 26.60.8 matches BDS 1.26.60). When you install LeviLamina with lip, the matching BDS (package `github.com/LiteLDev/bds`) is downloaded and installed automatically, so you do not need to match it by hand: `lip install LeviLamina` installs the latest LeviLamina and the game version it supports, or `lip setup --game <version>` specifies the game version (lip picks the latest LeviLamina that supports it, and reports it if there is no match).

## A third-party server pack (such as a LeviLamina+LSE pack on MineBBS) does not start (the PeEditor step and others fail). Must the BDS version match? Can I install without lip?

The BDS version must match LeviLamina exactly; another version with the same protocol number does not work either (for example, LeviLamina 1.3.x works only with BDS 1.21.80, and current LeviLamina 26.60.8 matches BDS 1.26.60). Installing with lip is recommended (`lip install LeviLamina` or `lip setup --game <version>`); it downloads the matching BDS automatically and completes the PreLoader, PeEditor and runtime data (bedrock-runtime-data) steps. If lip fails to install or start, try turning off your antivirus software.

You can also install without lip, but you must prepare the matching BDS, PreLoader, PeEditor and bedrock-runtime-data yourself (versions as given in the deps of LeviLamina's `lip.toml`), extract them into the same directory, and run `.\PeEditor.exe -mb` to patch BDS. After installing, start the server with `bedrock_server_mod.exe` (or `lip run`).

## Right after updating LeviLamina to a new major version, the log fills with fatal/error messages when loading plugins and the server then crashes. What is going on?

This happens because the plugins or their dependency libraries do not yet support the new LeviLamina/BDS. If a fatal error appears during loading (such as `Couldn't find:` followed by a symbol), the server will basically crash once it runs. The errors fall into two kinds: the MC API/symbol a plugin uses does not exist in the new version, or a dependency it needs (such as GMLIB, LegacyRemoteCallApi or iListenAttentively) does not support it yet. The fix is to wait for the plugins and dependencies to be updated, or to keep using the older LeviLamina and matching BDS that they support.

## LeviLamina's startup log shows "Loading XXX (such as CustomMap) … ERROR [LeviLamina] Failed to load XXX". What should I do?

Usually this mod version does not support the current LeviLamina/BDS version (the log normally gives the specific cause afterward, such as a missing dependency or symbol). Wait for the mod author to update it, or downgrade BDS and LeviLamina together to a version the mod supports. Each LeviLamina version is tied to a specific BDS version, so downgrading LeviLamina alone does not work; use `lip setup` to switch the game and loader versions together. When posting logs, post the complete log file.

## The console says a mod does not support the current BDS version, but the mod still seems to run normally. Do I need to do anything?

Yes. The message means the mod does not match the current BDS version, and it simply has not yet executed the code that breaks (invalid symbols/offsets). Once that code runs, it may crash outright. Switch to a mod version that matches the current BDS/LeviLamina version.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## The server startup log stops after the PreLoader lines `Loading Reverse Lookup Table` / `Preloading: LeviLamina` / `LeviLamina Loaded.` and the server crashes immediately with an empty `latest.log`. What is the cause?

Usually the BDS version does not match the LeviLamina version. Use the BDS version that matches LeviLamina (you can also check that the BDS files are complete). Install LeviLamina with lip to match dependencies automatically, and run the server directly in a console to see the complete output (do not rely only on the panel or `latest.log`).

*Applies to: LeviLamina 1.x and later (versions that use PreLoader). Not confirmed against the source code or the documentation: treat it as a pointer.*

## The server reports errors or crashes when loading a mod (for example, a mod compiled for LeviLamina on BDS 1.21.80 installed on BDS 1.21.60). What is the cause?

The mod does not match the server/LeviLamina version. A mod must be compiled for the LeviLamina version you use (and the BDS version it is tied to). Switch to the matching mod version, or upgrade the server and LeviLamina together to the version the mod requires.

## After installing LeviLamina and mods such as iListenAttentively, the server crashes and the log says the LeviLamina version is too old or the data does not match. What is the cause?

The bedrock-runtime-data version does not match LeviLamina (or the LeviLamina version is too old and does not match BDS). LeviLamina, bedrock-runtime-data and BDS must match each other. Install/upgrade them together with lip (LeviLamina's `lip.toml` pins the exact bds and bedrock-runtime-data versions), and update the mods to matching versions too.

## Injecting Onix Client together with the LeviLamina client causes problems (even a shutdown). Can this be fixed?

The two conflict over hooks and the problem basically cannot be solved. Do not use the LeviLamina client together with an injected third-party client such as Onix.

*Applies to: LeviLamina client 1.8.x and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can a LeviLamina client mod made for one version (such as 26.30) be used on a nearby version (such as 26.33)?

Not necessarily. Nearby versions with the same protocol can play together, but the function/symbol addresses that a mod hooks may differ. Native mods must be adapted to the specific game version, and close version numbers do not mean the mod is compatible (for example, some mods released a separate 26.33 build). Use the mod build that matches your game version.

## Why can't iOS players join a BDS server that uses NetherNet by IP, while Android/Windows players can?

With RakNet, players on all platforms can join. The iOS problem is specific to NetherNet: Mojang has not changed the iOS app policy to allow plaintext HTTP access by IP (NetherNet signaling), so iOS cannot connect to a NetherNet server offered by IP. If you need iOS players to join, switch to RakNet.

*Applies to: BDS 26.x with NetherNet. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After upgrading only LegacyScriptEngine (or only LeviLamina), all plugins report errors (the console is full of red). Why?

The versions of BDS, LeviLamina, LegacyScriptEngine and native mods correspond one to one, and a mismatch in any of them causes errors. When upgrading, upgrade BDS, LeviLamina, LSE and all native mods together to versions that match each other (managing them with lip is recommended, as it resolves dependency versions automatically).

## How do I find out which BDS (game) version the current LeviLamina matches/runs on?

Enter the `version` command in the server console. The output looks like `Game version <game version> with LeviLamina-<LL version>.`, showing both the game (BDS) version and the LeviLamina version. The command is enabled by default; you can disable it or adjust its permission in `modules.command.versionCommand` in the LeviLamina configuration. BDS also prints the game version in its own startup log. In addition, the `github.com/LiteLDev/bds` dependency in LeviLamina's `lip.toml` states the BDS version that LL version supports (for example, LeviLamina 26.60.8 depends on bds 1.26.60).

## Can a world from a game with a different minor version (such as 26.52.3) still be used on a LeviLamina server? Do I need to downgrade?

You can put the world folder directly into the server's `worlds` directory (and specify it in `level-name` in `server.properties`). Worlds from different minor versions within the same major version can generally be loaded directly, with no need to downgrade. However, taking a world from a newer version to an older server still carries compatibility risks, so back it up first.

*Applies to: vanilla BDS world behavior, independent of the LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After upgrading the BDS version of a LeviLamina server (extracting the new version and copying the world over), all mods/plugins stopped working. Why?

Mods must match the game (BDS) and LeviLamina versions; a C++ mod runs only on the LL version it was compiled for. After upgrading the server, you must also update all mods to versions that support the new version; you cannot upgrade only the server and keep the old mods.

Managing with lip is recommended: `lip setup --game <game version> --loader levilamina` changes the game and LeviLamina version (other packages that can work together are kept and re-resolved), and then `lip update` updates the mods. `lip update` itself does not change the game or the loader.

## The server starts normally with `bedrock_server.exe`, but with `bedrock_server_mod.exe` it crashes while loading the world with no log, and LeviLamina seems not to have loaded. What is the cause?

Usually the BDS version does not match LeviLamina (a BDS that this LL version does not support is installed), so LL cannot load. Each LL version supports only a specific BDS version (see the bds dependency in LeviLamina's `lip.toml`). The simplest way is to set it up with lip in an empty directory: `lip install LeviLamina` (or `lip setup --game <game version> --loader levilamina`). lip installs the matching BDS and LeviLamina automatically and generates `bedrock_server_mod.exe`.

## Can I downgrade LeviLamina manually? After replacing only the LeviLamina files, the server (on a hosting panel) no longer loads LeviLamina. What should I do?

The LeviLamina version is tied to the BDS version, so downgrading LL requires switching to the matching BDS version at the same time; replacing only the LL files does not work. It is recommended to specify the versions with lip in a server directory (or an empty directory) on your local computer: `lip setup --game <BDS version> --loader levilamina@<LL version>`. lip installs the matching BDS and LeviLamina together and keeps other packages that are still compatible. Then upload the whole server to the panel. Note that `lip install` / `lip update` do not change the game and loader versions; you must use `lip setup`.

## After the LeviLamina server starts, no plugins are loaded at all. What is the cause?

Usually PreLoader does not match the LeviLamina/BDS version, or a data file that PreLoader needs is missing, so LeviLamina and the plugins are never injected.

Each LeviLamina version pins an exact PreLoader version and bedrock-runtime-data version (for example, LeviLamina 26.60.8 depends on PreLoader 1.16.8 and BDS 1.26.60), so do not mix component versions by hand. Install with `lip install github.com/LiteLDev/LeviLamina`; lip installs the matching PreLoader, PeEditor, bedrock-runtime-data and BDS according to the dependencies and runs `PeEditor.exe -mb` to generate `bedrock_server_mod.exe`. Also make sure you start `bedrock_server_mod.exe` rather than the vanilla exe.

*Applies to: LeviLamina 1.x and later (currently 26.60.x)*

## Can every Bedrock launcher load `.so` mods on Android?

Not necessarily. Android native mods developed with the Preloader SDK (`pl::` API, `LiteLDev/preloader-android`) are loaded by LeviLauncher for Android through `libpreloader.so`; other launchers cannot use them if they cannot load preloader. Some mods can only be loaded by LeviLauncher, and some ImGui mods also depend on touch/input support provided by a specific launcher.

A workaround is to extract `libpreloader.so` from the LeviLauncher package and load it together with the mod, but whether this works depends on the launcher.

*Applies to: LeviLauncher-Android (currently v1.7.1). Not confirmed against the source code or the documentation: treat it as a pointer.*
