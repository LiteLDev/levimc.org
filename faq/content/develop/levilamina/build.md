# Building LeviLamina mods: toolchain

## How do I set up a development environment for native LeviLamina mods in C++? Where do the LL/BDS headers and libraries come from? Can I create a Visual Studio project and configure it by hand? How do I run the result on a server?

Creating a Visual Studio project and configuring headers and libraries by hand is not recommended. The recommended workflow: install Git, Visual Studio (select "Desktop development with C++", which provides the Windows SDK and C++ libraries), LLVM (add it to PATH during installation; the current template compiles with clang-cl via `set_toolchains("clang-cl")`) and xmake. Create a repository from `LiteLDev/levilamina-mod-template` on GitHub with "Use this template", change the target name in `xmake.lua`, and pin the LeviLamina version with `add_requires("levilamina 26.60.*", ...)`, matching the first two segments of your server's version. In the project directory run `xmake f -y -p windows -a x64 -m release` and `xmake`; xmake fetches the headers and libraries automatically and builds. A failure to fetch dependencies is mostly a network problem; configure a GitHub mirror proxy or an HTTP proxy for xmake. If the specified LeviLamina version cannot be found, run `xmake repo -u`. Use any editor; VS Code with the C/C++, XMake and clangd extensions is recommended, and you can also generate a Visual Studio project with `xmake project -k vsxmake`. Headers are included like `#include "ll/api/command/CommandRegistrar.h"` and `#include "mc/world/actor/player/Player.h"`; do not reuse LSE's API naming. The build output is under `bin\<mod name>\` (containing the dll and `manifest.json`); copy the whole folder into the server's `mods` directory, and LeviLamina loads it after the server restarts. See <https://levimc.org/tutorials/develop/first-levilamina-mod/> for details.

*Applies to: LeviLamina 1.x and later*

## Can a LeviLamina server mod be used directly on the client (LeviLamina client)? Can one DLL work for both? What adaptations does porting to the client need?

No, one DLL cannot serve both: you must build a separate server DLL and client DLL. When a mod that depends on LeviLamina loads, all the MC API symbols it uses are resolved, and a missing symbol makes loading fail; the client's symbols differ greatly from BDS (a lot is inlined, and the client has extra client-related content), and classes such as `Actor` have different members and vtables on the two sides. Adaptation steps:

1. Follow the latest levilamina-mod-template to update `xmake.lua`, `manifest.json` and the GitHub Actions workflows. Build the client version with `xmake f --target_type=client` and then build (the default is server); code specific to one side can go in `src-server`/`src-client` respectively.
2. The package description file is now `lip.toml` (format 4): under the default variant, declare two entries, `side = "server"` and `side = "client"` (the old `tooth.json` client label has been superseded), and write the dependency uniformly as `github.com/LiteLDev/LeviLamina`.
3. Register commands with `CommandRegistrar::getServerInstance()` (that is, `getInstance(false)`) or `getClientInstance()`.
4. Code that uses server-only things needs changes (for example `PropertiesSettings`: `src-server` has the full members and functions, while `src-client` has only an empty shell struct); hooks and similar code need real testing.

Also, each time the client enters a world it effectively starts a server, so the mod must implement disable/unload logic correctly.

*Applies to: LeviLamina 1.8 and later (lip.toml part: 26.60.8 and later)*

## How do I specify, update or roll back the LeviLamina version a C++ mod project depends on? What if the build still fails after changing the version?

In the mod project's `xmake.lua`, add the version after the levilamina package name, for example `add_requires("levilamina 26.60.8", {configs = {target_type = get_config("target_type")}})` (without a version, the latest version in the package repository's `versions.txt` is used; you can also write a full 40-character commit hash or a branch name such as `levilamina main` to use the in-development version, in which case you must handle dependencies such as bdslibrary yourself. Note that the `levilamina develop` mentioned in the template comments no longer works: the LeviLamina repository now has no develop branch, and the development branch is main). After changing the version, run in order: `xmake repo -u` (updates package repositories such as levimc-repo so the local copy knows the new version), `xmake c -a` (clears all build caches), and if necessary `xmake f -c` to reconfigure, then `xmake` to build. If you use VSCode/clangd completion, also run `xmake project -k compile_commands` to regenerate. Note: if you write a version that the package repository does not list, xmake treats it as a git branch and tries to fetch it, which produces errors such as `Remote branch ... not found`.

## When building a mod with xmake and specifying a levilamina version, I get `Remote branch x.y.z not found in upstream origin` or the warning `Unknown version: x_y_z, will use main branch dependencies`. What should I do?

The cause is that `versions.txt` in the local xmake package repository (LiteLDev/xmake-repo, named levimc-repo in the project) does not contain that version. When xmake cannot match the version in the list, it treats the version you wrote as a git branch name and tries to fetch it from the LeviLamina repository, which produces `Remote branch x.y.z not found`. `Unknown version: x_y_z, will use main branch dependencies` is a warning the levilamina package script prints when it cannot find `versions/<x_y_z>.lua` (it also appears when you specify the version by commit or branch; this is normal and falls back to the main branch's dependency configuration). The local repository may be out of date, or xmake-repo may not (yet) include the version after a LeviLamina release (for example, xmake-repo currently does not include v26.20.2 or v1.6.2). To fix it:

1. Run `xmake repo -u` to update the package repository, and if necessary `xmake c -a` (or delete the project's `.xmake` directory) and retry.
2. If xmake-repo still lacks the version, in `add_requires` use the full 40-character commit hash of the corresponding LeviLamina tag (a short hash is treated as a branch name and fails the same way), or switch to an adjacent version that is included.

The version matches with or without the `v` prefix. If the download fails, also check your network/proxy.

## When building a LeviLamina mod with xmake, downloading dependency packages (levilamina, entt, expected-lite, libhat, etc.) or fetching the package repository keeps failing or is very slow. What should I do?

Almost always this is a network problem reaching GitHub. xmake and git do not necessarily use the system proxy; handle it as follows:

1. Set a proxy for xmake: `xmake g --proxy=http://127.0.0.1:port`; or set environment variables in the same terminal before building (cmd: `set HTTP_PROXY=http://127.0.0.1:port` and `set HTTPS_PROXY=http://127.0.0.1:port`); also set a proxy for git: `git config --global http.proxy http://127.0.0.1:port`. You can also run your proxy software in TUN (system-level transparent proxy) mode. Do not use the hosts acceleration mode of tools such as Steam++.
2. Use a mirror: write a pac file yourself (for example `%LOCALAPPDATA%\.xmake\pac.lua` or any absolute path), define `function mirror(url) ... end` in it to rewrite github.com addresses to a usable mirror address, then run `xmake g --proxy_pac=<file>`. Note: `xmake g --proxy_pac=github_mirror.lua` in older tutorials (including the LeviLamina build documentation) relies on xmake's built-in `scripts/pac/github_mirror.lua`, which was removed in xmake v2.9.8 (2025-01), so writing it that way no longer works with newer xmake. See the xmake documentation "Network optimization": <https://xmake.io/zh/guide/package-management/network-optimization.html>
3. If the project or global configuration sets a proxy/mirror that does not suit your network (for example you are overseas or have a proxy on but use a mirror in mainland China), delete it or change it back to the GitHub source.
4. Emergency option: get already-downloaded packages from someone else and put them in the xmake package cache directory `%LOCALAPPDATA%\.xmake\packages\<first letter>\<package name>` (for example levilamina is in `packages\l\levilamina`); or download the source package manually and use `xmake g --pkg_searchdirs=<absolute path>` to specify a local search directory.
5. If fetching a git repository cache hangs, go to the repository cache directory that xmake reports in the error, run `git fetch` manually and retry; you can also clean with `xmake repo -u` and `xmake c -a` first and rebuild.

## When building a LeviLamina mod with xmake (levilamina-mod-template), fetching a repository or downloading dependencies fails with an SSL certificate error, for example `fatal: unable to access 'https://github.com/LiteLDev/xmake-repo.git/': SSL certificate problem: unable to get local issuer certificate` (or xmake-mirror/build-artifacts.git). What should I do?

This is a network/certificate problem when your machine accesses GitHub (GitHub's certificate chain is missing or not trusted locally, commonly because a proxy/accelerator hijacks HTTPS); it is not a problem with xmake or LeviLamina. LeviLamina's package repository levimc-repo (<https://github.com/LiteLDev/xmake-repo.git>) and most dependencies are hosted on GitHub. To fix it:

1. Check your network/proxy environment and use a stable, reliable proxy to reach GitHub normally (accelerators such as Watt Toolkit replace certificates and are unreliable).
2. If the certificate chain really is missing locally, visit GitHub in a browser, export the site certificate, and install it into "Trusted Root Certification Authorities".
3. For certificate verification failures when xmake downloads packages through curl, you can run the global setting `xmake g --insecure-ssl=y` to skip SSL verification (see the xmake FAQ "What to do when downloading a package reports a certificate verification failure").

The build itself: in the project directory run `xmake repo -u` first, then `xmake f -y -p windows -a x64 -m release` (or `-m debug`), and finally `xmake`; the output is in `bin/`. With Visual Studio, generate a vsxmake project as described in the xmake documentation before building. Install git beforehand; the current template uses the clang-cl toolchain, so you also need LLVM (the template CI uses LLVM 22).

## Running `xmake f -m debug` or similar reports `note: the following packages were not found in any repository (check if they are spelled correctly): -> levilamina -> levibuildscript`, or the specified levilamina version cannot be found. How do I fix it?

1. Make sure `xmake.lua` adds LiteLDev's package repository: `add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")` (outdated configuration left over from old templates can be deleted; follow the `xmake.lua` of the latest levilamina-mod-template).
2. Run `xmake repo -u` to update the package repositories.
3. If it still cannot be found, clear the cache: delete the `.xmake` folder in the project directory (or run `xmake c -a`), run `xmake repo -u` again, then run `xmake f -m debug` (or release) again and build.
4. If `xmake.lua` hard-codes a version in `add_requires("levilamina x.x.x")`, make sure that version exists in xmake-repo; you can change it to the latest version, remove the version number to use the latest, or use `add_requires("levilamina develop")` (when using develop you must add bdslibrary yourself).

## When compiling levilamina-mod-template, xmake hangs for hours installing the levilamina dependency package (installing levilamina), or fails with `error: unable to parse semver`. How do I fix it?

The levilamina package is compiled locally from source during installation and must fetch xmake-repo and its dependencies from GitHub, so it is slow by nature. A long hang or `unable to parse semver` is usually a network problem: xmake-repo could not be fetched, so the specified version cannot be found. To fix it:

1. Use your proxy's TUN (virtual network adapter) mode, or set a proxy environment variable for xmake in PowerShell (for example `$env:all_proxy="http://127.0.0.1:port"`), or set a global proxy for xmake with `xmake g --proxy="http://127.0.0.1:port"`.
2. Delete `.xmake` in the current project directory and retry.
3. Follow the standard flow: after cloning the template, run `xmake repo -u`, `xmake f -m debug` (or `xmake f -y -p windows -a x64 -m release`), and `xmake`.
4. You can also write a commit hash or branch in place of the version number; if necessary, download the stuck package manually.

Note that the current template uses the clang-cl toolchain, so you need to install LLVM first (CI uses LLVM 22).

## When developing a LeviLamina C++ mod (levilamina-mod-template) in VSCode, xmake compiles fine but the editor cannot find headers, shows red squiggles everywhere, and has no completion for LL/BDS classes and functions. How do I fix it?

You do not need to download headers manually or copy them under `src`, and you should not fill in paths in `includePath` by hand: LeviLamina and its dependencies are downloaded by xmake package management. What the editor lacks is the compilation database `compile_commands.json`.

1. Open the project root containing `xmake.lua` in VSCode, and first run `xmake f -y -p windows -a x64 -m release` and `xmake` once so the dependencies finish downloading.
2. Generate the compilation database: in the project root run `xmake project -k compile_commands` (it generates into the root); or install the VSCode XMake extension and run "XMake: Update Intellisense" with Ctrl+Shift+P. Note that the XMake extension by default generates `compile_commands.json` into the `.vscode` directory, while clangd by default only looks in the project root (and its parent directories), so either change the XMake extension's output directory, or add the argument `--compile-commands-dir=.vscode` to clangd, or simply generate it into the root from the command line.
3. clangd is recommended (it requires LLVM; the template ships a `.clangd` configuration); after generating, restart clangd / Reload Window and wait for indexing to finish. clangd conflicts with the IntelliSense of Microsoft C/C++ (cpptools), so turn off cpptools' IntelliSense when using clangd. If you insist on cpptools, point `C_Cpp.default.compileCommands` at the generated `compile_commands.json`.
4. After headers or dependency versions are updated, regenerate `compile_commands.json`; if the configuration gets messy, delete the generated configuration under `.vscode` and start over. As long as xmake compiles, the editor's false reports do not affect the build.

Other IDEs: Visual Studio generates a sln with `xmake project -k vsxmake`; CLion can import the root `compile_commands.json` directly, and if the standard library is marked red, switch the toolchain to Visual Studio. The build itself needs Visual Studio (the "Desktop development with C++" workload, which provides the Windows SDK) plus LLVM (the template compiles with clang-cl); MinGW cannot be used.

## When developing a LeviLamina C++ mod in Visual Studio, after simply using "Open Folder" there is no completion, `#include` reports errors or "Go to Definition" cannot find headers, and the generated project does not show the headers either. What should I do?

Do not open an xmake project with VS's "Open Folder". Headers are downloaded by xmake package management, so first run `xmake f -y -p windows -a x64 -m release` and `xmake` once in the project directory to download the dependencies and build, then generate a VS project with xmake:

```powershell
xmake project -k vsxmake -m "debug,release"
```

Then open the `.sln` in the generated `vsxmake` directory, and indexing and completion work normally.

Notes:

- vsxmake only puts headers declared with `add_headerfiles` into the project; it does not scan `add_includedirs`. The current template's `xmake.lua` already has `add_headerfiles("src/**.h")`; if you use `.hpp` or other directories, add them yourself, for example `add_headerfiles("src/**.h", "src/**.hpp")`.
- When you create a new file in the sln generated by vsxmake, the file may be placed in the generated directory instead of under `src`; move it to `src` manually and regenerate the project.
- You can also generate a CMake project with xmake (`xmake project -k cmakelists`) and open it with VS's CMake support, or use VS's xmake extension; for VSCode, configure it through compile_commands.

## How do I debug a LeviLamina C++ mod with breakpoints? Why does "launching" `bedrock_server_mod.exe` directly from VS/VSCode for debugging not work?

Start the server first and then attach the debugger; do not launch BDS directly from the debugger (since LeviLamina 1.2.0, PreLoader's runtime protection makes a launch with a debugger attached before Runtime Data is loaded fail, reporting "`Failed to load Runtime Data ... please attach it after Runtime Data is loaded`").

- Visual Studio: run `bedrock_server_mod.exe` normally, then use "Debug → Attach to Process" and select `bedrock_server_mod.exe`.
- VSCode: use a configuration with `"type": "cppvsdbg", "request": "attach"` in `.vscode/launch.json` and then select the process to attach to. The current levilamina-mod-template already ships `.vscode/launch.json` with "BDS attach" / "GDK attach" configurations: install the VSCode extension Tasks Shell Input, set the environment variable `MC_BDS_DEBUG_PATH` (the full path to the BDS executable; for the client use `MC_GDK_DEBUG_PATH`), and optionally `MC_SYMBOLS_PATH` (the symbols directory), and it launches and attaches automatically in one click.
- To debug early startup (such as `load()`/`enable()`): first run `set PL_DEBUG=1` on the command line, then run `bedrock_server_mod.exe`; PreLoader pauses after Runtime Data is loaded and waits for a debugger to attach, then continues once attached.
- Whether you can see source code depends on the pdb that matches the mod dll: `set_symbols("debug")` in the template `xmake.lua` generates a pdb, and only with a pdb can you see source and set breakpoints; otherwise you only get disassembly. For lower-level debugging you can use x64dbg/WinDbg.
- Script plugins such as LSE's JS cannot be debugged this way.
- When LeviLamina initializes CrashLogger and detects an existing debugger (for example attached early with `PL_DEBUG=1`), it prints "`Debugger detected, CrashLogger will not be enabled`" and does not enable CrashLogger; when you attach after the server has started, CrashLogger is already enabled, but the debugger still catches exceptions first.

*Applies to: LeviLamina 1.2.0 and later*

## BDS has switched from MSVC to clang. Must LeviLamina C++ mods switch compilers too? Can I still compile with MSVC?

Yes, you must switch. The new BDS is compiled with clang, and LeviLamina had to follow by switching to clang-cl. MSVC and clang differ in many features, and the same code may have a completely different ABI under the two compilers; continuing to compile mods with MSVC causes event listener errors, broken features, or even a crash right when the server starts. Use the configuration of the latest levilamina-mod-template: `set_toolchains("clang-cl")` in `xmake.lua` (and keep the template's cxflags for clang_cl), and install LLVM locally (the template CI uses LLVM 22).

*Applies to: LeviLamina 26.20.0 and later*

## Can LeviLamina and its C++ mods be built with CMake (like Endstone plugins)?

Only xmake is officially supported (`levilamina-mod-template`). If you really need CMake, you can have xmake generate a CMake project with `xmake project -k cmakelists`, but the generated dependency paths all point into the xrepo directory. In addition, a mod needs the prelink step from the `levibuildscript` linkrule before linking (it processes the object files with `prelink.exe` and `bedrock_runtime_data`, and adds `/DELAYLOAD:bedrock_runtime.dll`). In CMake you must add this step yourself to link correctly. To get away from xmake completely, you have to write your own `CMakeLists.txt` and supply all the dependencies.

## Can I build LeviLamina C++ mods without a Windows environment (macOS, WSL/Linux, GitHub Codespaces)?

Only building mods on Windows is officially supported: the template uses the `clang-cl` toolchain (which needs the Windows SDK and the MSVC STL headers/libraries). There is no official support on macOS/Linux, and BDS cannot run on macOS either. Without a Windows environment, push the source to a GitHub repository and build it with the `windows-latest` runner of GitHub Actions (the mod template ships with `.github/workflows/build.yml`), then download the output from Artifacts on the Actions run page (you must be logged in to GitHub to download it). If you insist on working on Linux, you can try msvc-wine (<https://github.com/mstorsjo/msvc-wine>) to provide the Windows SDK/MSVC environment, but there is no official guarantee.

## When building with `levilamina-mod-template`, the version in `manifest.json` is always `0.0.0`, or I get `Failed to parse version tag, using 0.0.0`. Where do I set the version?

The version is not taken from `tooth.json`. At build time, the modpacker of `levibuildscript` reads the git tag with `git describe --tags --abbrev=0` and parses it in the `vX.Y.Z` format; with no tag, or a tag in the wrong format, it uses `0.0.0`. So:

1. Get the repository with `git clone` (a downloaded zip does not contain `.git`);
2. Create a tag with a `v` prefix, such as `git tag v0.1.0`, then build.

You can also set it manually in `xmake.lua`: `add_rules("@levibuildscript/modpacker", {modVersion = "1.0.0"})`.

*Applies to: mod templates using the levibuildscript modpacker (current version)*

## What is `MemoryOperators.cpp` in the mod template for? Can I delete it? What if the mod fails to load after I delete it?

The file contains `#define LL_MEMORY_OPERATORS` + `#include "ll/api/memory/MemoryOperators.h"`, which makes the mod use LeviLamina's unified global `operator new/delete` (BDS customizes memory allocation and LL uses mimalloc, so all mods must be consistent). The current LeviLamina checks whether the mod exports `ll_memory_operator_overrided`; if not, it refuses to load the mod and reports `<mod> will not be loaded because it isn't using the unified memory allocation operator`. So do not delete it; if you did, restore the file. If you want to put it elsewhere, you can instead write the two lines above in one (and only one) source file of the mod. If the build reports an error related to MemoryOperators, first run `xmake repo -u` to update xmake-repo, then rebuild.

*Applies to: LeviLamina 1.0 and later*

## My mod builds locally but fails on GitHub Actions (or in a freshly cloned repository) with header-related errors. What should I do?

LeviLamina now uses `clang-cl`, and the LLVM that ships with the Actions windows runner may be too old. Install a newer LLVM in the workflow (as in the latest template):

```yaml
- name: Setup LLVM
  uses: ZhongRuoyu/setup-llvm@v0
  with:
    llvm-version: 22
```

and run `xmake repo -u` before building to update xmake-repo. It is best to sync directly with `.github/workflows/build.yml` of the latest `levilamina-mod-template`. If the failure is caused by dependencies of a new LeviLamina version not being ready yet, you can pin the version in `xmake.lua`, for example `add_requires("levilamina x.x.x")`.

*Applies to: LeviLamina 26.20.0 and later*

## A third-party DLL that my C++ mod depends on (a library in the mod directory, or an external DLL such as `jvm.dll` that is not on PATH) is not found and the mod fails to load (even `onLoad` never runs). What should I do?

When a mod DLL is loaded, the system resolves its import table and loads the dependent DLLs; if one cannot be found, loading fails (error code 126/127, and LeviLamina adds dependency diagnostics). Windows has no rpath: before loading a native mod, LeviLamina appends that mod's directory to `PATH`, so dependent DLLs placed in the mod directory (or the BDS root directory) are found. For an external DLL whose location varies (such as `jvm.dll`), either add its directory to the system `PATH`, or do not link its imports statically and load it dynamically at runtime with `LoadLibrary`/`GetProcAddress` (or LeviLamina's `ll::sys_utils::DynamicLibrary` wrapper). That way you can look up `JAVA_HOME` in the order "config file → environment variable → registry". You can also use the linker's `/DELAYLOAD` option to delay loading (the `levibuildscript` linkrule itself uses it to delay-load `bedrock_runtime.dll`).

## How do I add a third-party library (such as soci) to a LeviLamina C++ mod (xmake template)? What if soci reports at runtime that the backend is not found?

If the library is in the official xmake repository (xmake-repo), just `add_requires` it in `xmake.lua` and `add_packages` it in the target. soci is there, and you can enable a backend through the package configs, for example `add_requires("soci", {configs = {mysql = true}})` (other backends work the same way). For libraries not in the official repository, you can use xmake to pull in a vcpkg package, such as `add_requires("vcpkg::soci")` (see the xmake documentation, "Add vcpkg dependency packages"); otherwise you have to build the dll/static library yourself and link it. At runtime soci loads each backend DLL dynamically with `LoadLibrary`, so the backend DLL must be in a place where it can be found (the current working directory, `PATH`, or the mod directory, since LeviLamina adds the mod directory to `PATH`), or be specified through the backend search path; otherwise it reports that the backend is not found. Also, the soci in xmake-repo is built as a static library by default (`shared=false`). In that case the backend is linked in statically and no DLL is searched for, so you must register it explicitly before use, for example by calling `soci::register_factory_mysql()`, or by creating the session directly with the `soci::mysql` factory object. Note that mods are now compiled with `clang-cl`, so third-party C++ libraries should preferably also be built by xmake with the same toolchain.

## Can the LeviLamina (LL3) mod template be used to write LiteLoaderBDS (LL2) plugins? Where is the LL2 C++ plugin template?

No. `levilamina-mod-template` only works with LeviLamina. The LL2 C++ plugin template is <https://github.com/LiteLDev/liteloaderbds-plugin-template>. That repository and LiteLoaderBDS itself are both archived and no longer maintained, so migrate to LeviLamina.

*Applies to: current version (LiteLoaderBDS is archived)*

## After creating a C++ mod project from `levilamina-mod-template` there is no `include` (header) folder. Where are the LeviLamina headers?

Nothing is missing: the template has no separate `include` directory (older tutorial screenshots are outdated). Use <https://github.com/LiteLDev/levilamina-mod-template> directly and run `xmake` (build) or `xmake f` (configure) once; xmake automatically pulls LeviLamina and other dependencies through levimc-repo. The headers are in xmake's package cache directory, which on Windows is `C:/Users/<username>/AppData/Local/.xmake/packages/l/levilamina/<version>/<hash>/include`.

## Now that BDS no longer ships a PDB, how do LeviLamina mods link symbols, and can they still hook?

Bedrock runtime data (the "magic blob", the xmake package `bedrockdata`) replaces the PDB. The blob contains no plain-text symbols, only a "symbol hash -> RVA" mapping. When you build a mod, the prelink tool is called before linking: it hashes the external symbols the mod uses, looks them up in the blob, and generates a fake lib for linking; at runtime they are resolved in the same way. `bedrockdata` and the matching prelink version are downloaded automatically by xmake as dependencies, so no manual handling is needed. Hook syntax is unchanged; see `src-test/client/jsonUITest.cpp` in the LeviLamina repository. PeEditor now only injects PreLoader into `bedrock_server.exe` to produce `bedrock_server_mod.exe`, and no longer involves the PDB.

*Applies to: BDS 1.21.20+ / LeviLamina 0.13+ to current*

## After a C++ mod subscribes to `ServerCommandRegisterEvent`, the event listener produces no output. What is wrong?

Most likely the compiler is wrong. New BDS/LeviLamina builds are compiled with `clang-cl`, so the mod must also be compiled with `clang-cl` (update to the latest `levilamina-mod-template`, whose `xmake.lua` already has `set_toolchains("clang-cl")`, and install LLVM). A mod compiled with MSVC compiles and loads, but its type names do not match those of BDS/LL, so event listening does not work.

*Applies to: LeviLamina 26.x (after BDS switched to clang-cl)*

## When a C++ mod includes the RemoteCall header, clangd shows errors everywhere and `compile_commands.json` has no information about the package. What should I do? Should a prerequisite mod meant for other C++ mods use RemoteCall?

First make sure `xmake.lua` has `add_requires` for the package and `add_packages` in the target (the xmake package name of RemoteCall is now `legacyremotecall`). Then in VS Code press Ctrl+Shift+P and run `UpdateIntellisense` from the xmake extension (or `xmake project -k compile_commands`) to regenerate `compile_commands.json`, and restart clangd. Also, a prerequisite mod meant for other C++ mods should not use RemoteCall; just export functions with `__declspec(dllexport)` (see the interface export guide in the official documentation).

## A mod build fails on GitHub Actions and the log has warnings related to cmake. How do I troubleshoot?

Look at the errors higher up in the log rather than at the warnings. In one case the runner environment lacked Python (needed when some dependency packages are built with cmake), and adding `actions/setup-python` to the workflow fixed it. Use the workflow of the latest `levilamina-mod-template` as the base (it must include steps such as `setup-xmake`, `setup-llvm` and `xmake repo -u`).

*Applies to: when building mods with GitHub Actions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How does a LeviLamina mod adapt to a new game version (such as 26.20) and handle versioning? Is the matching SDK downloaded automatically at build time?

The target LeviLamina/game version is specified in `xmake.lua` with `add_requires("levilamina x.x.x", ...)` (without a version, the latest is used), and at build time xmake fetches the matching LeviLamina package. The package metadata used for publishing is now in `lip.toml` (older templates use `tooth.json`); fill in the matching LeviLamina version range under its `deps`, for example `"github.com/LiteLDev/LeviLamina" = "26.60.*"` for the server variant (the client variant in the template's `lip.toml` uses `">26.60.6 <26.61.0"`, because 26.60.6 is the last `tooth.json` version). Also, `xmake.lua` no longer needs `add_requires` for nlohmann_json; the LeviLamina package already passes it on as a public dependency.

*Applies to: current levilamina-mod-template (lip.toml format)*

## Where should I run the xmake command that generates the VS Code configuration mentioned in the LeviLamina mod development docs?

You can run it in any terminal, as long as the current directory is the project root (the one containing `xmake.lua`). It is a built-in xmake feature (for example `xmake project -k compile_commands` generates `compile_commands.json`); see the xmake documentation for details. The xmake extension for VS Code can also generate and update these configurations automatically.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## When a LeviLamina mod uses events (such as `ServerStartedEvent`), linking reports unresolved symbols. How do I fix it?

xmake may have cached an old LeviLamina package, so the headers and the library do not match. Run `xmake repo -u`, delete `%LocalAppData%\.xmake` and the `.xmake` and `build` folders in the project directory, then run `xmake f` and `xmake` again. Also make sure you compile with the `clang-cl` toolchain.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Building a LeviLamina mod with xmake keeps failing. How do I troubleshoot?

1. Make sure the toolchain is up to date: the Visual Studio/MSVC build tools (which provide the Windows SDK and the STL) and LLVM (mods are compiled with `clang-cl`);
2. Run `xmake repo -u`;
3. Delete `%LocalAppData%\.xmake`, then delete caches such as `.xmake` and `build` in the project directory;
4. Run `xmake f -y -p windows -a x64 -m release` again and watch for errors in the configure stage, then build with `xmake`.

## Are the MC headers shipped with each Minecraft version update of LeviLamina (the headers under `src/mc`) written by hand or generated automatically?

They are now generated automatically by tools (only very early versions were written by hand), so the MC headers have almost no comments, and you can see markers such as `// auto generated inclusion list` and `// auto generated forward declare list` in them.

## Can a LeviLamina mod act as a dependency library for other mods, like a Java library mod? Will it create multiple copies of the data?

Yes. In the prerequisite mod, export functions/classes with `__declspec(dllexport)` (follow LeviLamina's LLAPI macro, for example as below, and add `add_defines("MOD_EXPORT")` in the prerequisite mod's `xmake.lua`):

```cpp
#ifdef MOD_EXPORT
#define MODAPI __declspec(dllexport)
#else
#define MODAPI __declspec(dllimport)
#endif
```

The consuming mod uses `dllimport` and links the import library, and declares the dependency in its `manifest.json`, for example `"dependencies": [{ "name": "RequiredMod", "version": "^1.2.3" }]` (`optionalDependencies` and `loadBefore` are also available). LeviLamina sorts mods by dependency and loads the dependencies first, so the consuming mod does not need to load the prerequisite dll itself. Windows reference-counts DLLs: a given dll is loaded only once and has only one copy of its global variables, so no multiple copies are created.

*Applies to: LeviLamina current version (Windows native mod)*

## In VSCode clangd, some code regions wrapped in macros (`#if`/`#ifdef` blocks) are greyed out with no completion. How do I get completion there?

The macro must be active in the compile arguments: add it with `add_defines` in `xmake.lua`, then in VSCode press Ctrl+Shift+P and run `XMake: UpdateIntellisense` to regenerate `compile_commands.json`, and then run `clangd: Restart language server`. Adding `-D` arguments directly in `.clangd` is unreliable. clangd provides no completion in macro branches that are not enabled.

*Applies to: mod development with xmake + VSCode clangd. Not confirmed against the source code or the documentation: treat it as a pointer.*

## When my Windows user name is in Chinese, xmake fails with garbled paths when building an LL mod or installing dependency packages. What should I do?

Non-ASCII paths break the paths of xmake's global cache/package directory. You can switch to a new account with an English user name, or move the xmake global directory to a pure-English path: set the environment variable `XMAKE_GLOBALDIR` to an English directory and rebuild.

*Applies to: building mods with xmake on Windows when the user directory contains non-ASCII characters. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In an xmake package description (for example when submitting a package to xmake-repo or writing a custom package), what is the hash in `add_versions` and how do I get it?

If the package uses a source archive download URL (`set_urls`/`add_urls` pointing to a zip/tar.gz), the hash is the SHA-256 of that version's archive, used to verify the download. If the package uses a git repository URL (such as `https://github.com/xxx/yyy.git`), enter the git commit hash of the corresponding version.

*Applies to: current xmake / LiteLDev xmake-repo*

## Every xmake build of a LeviLamina mod takes ten to twenty minutes and recompiles LeviLamina. Why?

The `levilamina` xmake package is compiled and installed from source. Usually a prerequisite dependency (such as gmlib or bsci) requires a LeviLamina version (or a configuration such as `target_type`) that differs from the one in the mod's own `add_requires`, so xmake has to build two different versions of LeviLamina. Make all dependencies use the same LeviLamina version/configuration to avoid the duplicate builds.

*Applies to: building mods that depend on the levilamina package with xmake*

## xmake builds of a mod show cache problems related to prelink/bedrockdata, and deleting the project files is undesirable. How do I clean up?

Delete the `prelink`, `bedrockdata` and `levilamina` packages under `packages` in the xmake global directory (on Windows by default `C:\Users\<username>\AppData\Local\.xmake`, that is `%LOCALAPPDATA%\.xmake`, not the project directory), then configure again with `xmake f` and build. You can also run `xmake c -a`, or delete the `.xmake` and `build` directories in the mod project directory. If nothing works, reinstall xmake.

*Applies to: LeviLamina current version (Windows, xmake build)*

## When building a LeviLamina mod, xmake reports that the header `#include "pl/Config.h"` is not found (or the LL SDK headers have strange content), and clearing caches does not help. How do I fix it?

This is usually a network problem that left the LeviLamina/preloader and other dependency packages downloaded by xmake incomplete (for example, an earlier download was interrupted and the broken package was used afterwards). `pl/Config.h` comes from the preloader package. To fix it, delete the package cache under `C:\Users\<username>\AppData\Local\.xmake` (or the whole directory) and download again, or copy the xmake `packages` folder from a computer that builds correctly. If your network is poor, you can configure a GitHub mirror for xmake, for example by creating `github_mirror.lua`:

```lua
function mirror(url)
    url = url:gsub("github.com", "<mirror-domain>")
    return url
end

function main(url, host)
    return true
end
```

then run `xmake g --proxy_pac=<absolute-path-of-the-file>` (the file must not be deleted afterwards).

*Applies to: building mods with xmake in environments with unreliable access to GitHub. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why does adding the LeviLamina dependency (`add_requires("levilamina")`) to an xmake project also pull in PreLoader?

This is normal. When the xmake `levilamina` package is installed, it builds LeviLamina from source, and LeviLamina's own `xmake.lua` has `add_requires("preloader ...")` (LeviLamina is loaded by PreLoader and also depends on PreLoader at runtime), so installing the `levilamina` package also pulls in the `preloader` package.

## Building a mod with a new LeviLamina version (such as 26.51.x and later) fails with `ll/api/reflection/Reflection.h: error: no member named 'to_underlying' in namespace 'std'`. What should I do?

You need to enable the C++23 library features of the MSVC STL: add the `_HAS_CXX23` macro to the target in the mod's `xmake.lua`, as in the latest `levilamina-mod-template`:

```lua
add_defines("NOMINMAX", "UNICODE", "_HAS_CXX23=1")
```

The template still uses `set_languages("c++20")` + `set_toolchains("clang-cl")`, and relies on `_HAS_CXX23=1` to enable C++23 library functions such as `std::to_underlying`.

*Applies to: LeviLamina 26.51 and later, mods using the levilamina-mod-template structure*

## When using `levilamina-mod-template`, how do I rename `MyMod` (the class name) and `my_mod` (the namespace) in the template?

Change the namespace `my_mod` to the name of your own mod; the class name `MyMod` can be changed freely (for example to `Entry` or your mod's name). Be sure to change these together: the class name and namespace in `src/mod/MyMod.h` and `MyMod.cpp`, and `LL_REGISTER_MOD(my_mod::MyMod, my_mod::MyMod::getInstance());` at the end of `MyMod.cpp`; otherwise the build fails. Also change `target("my-mod")` in `xmake.lua` to your mod's name (the `name` in `manifest.json` is filled in automatically by the build script from the target name).

*Applies to: current levilamina-mod-template*

## Building `levilamina-mod-template` (native mod) with xmake fails, or reports that the cxx program cannot be found (no C++ compiler). What should I do?

Usually the build environment is not fully installed. The current template uses the `clang-cl` toolchain on Windows, which needs:

1. Install Visual Studio 2022 or later with the "Desktop development with C++" workload (including MSVC and the latest Windows SDK; `clang-cl` depends on its standard library and SDK);
2. Install LLVM (the official CI currently uses LLVM 22) and make sure `clang-cl` is on `PATH`;
3. Install/update xmake to 3.0.0 or later.

After installing, clear the caches with `xmake c -a`, then reconfigure and build with `xmake f -c -y -p windows -a x64 -m release`.

*Applies to: current levilamina-mod-template / LeviLamina 26.x*

## With the latest LeviLamina version, my mod project's CI build keeps failing. Which toolchain should I use?

New LeviLamina versions must be compiled with `clang-cl` (LLVM). Update your CI according to the latest `levilamina-mod-template`: add this to the workflow

```yaml
- name: Setup LLVM
  uses: ZhongRuoyu/setup-llvm@v0
  with:
    llvm-version: 22
```

then run `xmake repo -u`, `xmake f -a x64 -m release -p windows -v --target_type=${{ matrix.target_type }} -y` and `xmake -v -y` in that order. `xmake.lua` must also be synced with the template (`set_toolchains("clang-cl")`, `_HAS_CXX23=1`, and so on).

*Applies to: LeviLamina 26.x (the official CI uses LLVM since 2026-08)*

## All dependencies are set to the latest versions, but building a mod gives LeviLamina header errors about the platform macros `LL_PLAT_S` / `LL_PLAT_C`. How do I fix it?

The cause is that no platform macro is defined. The `levilamina` xmake package in levimc-repo now adds `LL_PLAT_S` (server) or `LL_PLAT_C` (client) to the mod automatically based on `target_type`, so the template no longer needs them written by hand. To fix it:

1. Run `xmake repo -u` to update the package repository to the latest;
2. Write `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})` as in the latest template and declare `option("target_type")`;
3. If an older package repository that does not add them automatically is in use, add them manually in the target:

```lua
if is_config("target_type", "server") then
    add_defines("LL_PLAT_S")
else
    add_defines("LL_PLAT_C")
end
```

*Applies to: LeviLamina 26.x and later*

## When writing a LeviLamina C++ mod, the IDE (clangd) reports errors for constructs such as `overloaded` + `std::visit`. How do I make clangd use the right C++ standard and include paths?

The errors occur because clangd did not get the project's compile arguments (language standard, include paths, macros). Run this in the project directory:

```shell
xmake project -k compile_commands
```

It generates `compile_commands.json`, and clangd reads the compile arguments from it automatically (the template uses `set_languages("c++20")` and defines `_HAS_CXX23=1`). Regenerate it after changing `xmake.lua` or the dependencies.

## After upgrading LeviLamina or updating Visual Studio, building a mod with xmake gives inexplicable compile errors. What should I do?

First run `xmake c -a` to clear all build caches and rebuild. If that does not help, delete the `.xmake` and `build` folders in the project, then reconfigure and build with `xmake f -c -y`. Also update the package repository with `xmake repo -u`, and make sure `xmake.lua` / CI match the latest `levilamina-mod-template` (`clang-cl` toolchain, LLVM 22, `_HAS_CXX23=1`). There was a period when neither VS2026 nor VS2022 could compile; that was a problem on the Microsoft compiler side and has since been fixed, so updating VS is enough.

## After upgrading LeviLamina (such as 1.9.2 and later), my own mod fails to build both locally and on GitHub Actions. How do I fix it?

Update the mod's `xmake.lua` following the latest `levilamina-mod-template`: add the `target_type` option (`option("target_type")` defaults to `server`, with `server`/`client` as choices) and bring in the dependency with `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})`; at the end of the target, separate server and client sources with `is_config("target_type", "server")`. Sync the GitHub Actions `build.yml` with the template as well (a matrix builds server and client, with `xmake f ... --target_type=${{ matrix.target_type }}`).

*Applies to: LeviLamina 1.9.x and later (including 26.x)*

## After upgrading to a new LeviLamina version (from 26.20), clang crashes when building a mod. What should I do?

Sync the mod's `xmake.lua` and GitHub Actions workflow with the latest `levilamina-mod-template` (the template uses `set_toolchains("clang-cl")` with the matching `cxflags`, and CI installs LLVM 22 with `ZhongRuoyu/setup-llvm`), use the matching LLVM version locally as well, clear the xmake cache (`xmake f -c`), and rebuild.

*Applies to: LeviLamina 26.20 and later*

## The same mod code compiles against LeviLamina 26.40.1 but fails with compile errors inside LL headers (which the code does not include itself) on 26.40.4/26.40.5. What should I do?

Since LeviLamina 26.20 you must compile with `clang-cl`; MSVC (`cl.exe`) is no longer supported. In `xmake.lua`, set `set_toolchains("clang-cl")` as in `levilamina-mod-template`; for GitHub Actions, install LLVM 22 as the template does. After switching toolchain or version, clear the xmake cache: delete the `.xmake` directory, or run `xmake clean -a` and `xmake f -c` and reconfigure.

*Applies to: LeviLamina 26.20 and later*

## Using a vcpkg library in a LeviLamina mod's xmake project gives link errors (missing symbols from dependency libraries). How do I fix it?

When xmake pulls in a vcpkg package it may not handle its transitive dependencies correctly, so you have to fill them in by hand. The recommended fix is to switch to xmake's own packages (use `add_requires` to install the library and its dependencies, such as `zlib` and `libuv`, then `add_packages`). Alternatively, add the missing libraries manually with `add_links` in the target.

*Applies to: LeviLamina mods built with xmake. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I build and enable LeviLamina's own tests (such as EventTest)?

Enable the tests option when building LeviLamina: `xmake f --tests=y` (optionally with `--target_type=server/client`), then run `xmake`. This pulls in gtest and builds the `src-test` directory (the server event test is in `src-test/server/EventTest.cpp`). xmake configuration is sticky; if behavior is odd after switching configurations, delete the project's `.xmake` directory or reconfigure with `xmake f -c`.

*Applies to: LeviLamina 26.x*

## How do I build LeviLamina itself?

You need XMake 3.0.0+, LLVM/Clang (`clang-cl` must be in PATH), Visual Studio 2022 or its Build Tools (the C++ desktop development workload, which provides the Windows SDK and standard library that `clang-cl` depends on) and Git. Run `xmake` in the repository root to build the server (the default); run `xmake f --target_type=client` and then `xmake` to build the client, and add `--tests=y` to enable tests. The server can also be built for Linux x86_64 with `-p linux` (clang toolchain); the client can only be built on Windows. If the cache misbehaves, run `xmake c -a` and `xmake f -c`.

*Applies to: LeviLamina 26.20 and later*

## Which IDE should I use to develop LeviLamina C++ mods? Is VSCode fine?

Yes. VS Code with xmake (plus the xmake and clangd extensions) is the common choice, and the official mod template ships a `.clangd` and a `.vscode/launch.json` debug configuration. Visual Studio is large and not very convenient for writing LL mods directly (if you want it, generate a project with `xmake project -k vsxmake`). Whatever editor you use, you must install the toolchain: the current template and LeviLamina use the `clang-cl` toolchain on Windows (`set_toolchains("clang-cl")`), so install LLVM (with `clang-cl` in PATH) and also Visual Studio 2022 ("Desktop development with C++") or the VS 2022 Build Tools, which provide the MSVC standard library and the Windows SDK.

*Applies to: current version (LeviLamina 26.x, official levilamina-mod-template)*

## Compiling a LeviLamina C++ mod fails (member function declaration does not match definition, or a non-static member function is called incorrectly). How do I fix it?

There are two common causes:

1. The `const` qualifier differs between the header declaration and the `.cpp` definition. Either put `const` on both or on neither.
2. A non-static member function cannot be called through the class name; get an instance first, for example `MyMod::getInstance().getSelf()` in the template. (Inside a member function of the class itself you can call `getSelf()` directly, without `getInstance()`.)

These are general C++ rules; the examples are based on the official mod template.

## Compiling a LeviLamina mod with `/Wall` produces a lot of warnings. Should I enable `/Wall`?

Enabling `/Wall` is not recommended. It warns about things like struct alignment padding (for example a `bool` after a `void*` in a struct, reporting 7 bytes of unused padding) and is extremely noisy (with the `clang-cl` currently in use, `/Wall` is equivalent to `-Weverything`, which is even noisier). LeviLamina itself uses `/W4` (plus a few individual promotions such as `/w44265`, `/w44289`, `/w44296`, `/w45263` and `/w44738`), and the official mod template also defaults to `/W4`, so `/W4` is enough for a mod.

## When developing a LeviLamina mod, is there an easy way to browse the `ll` namespace hierarchy and the available functions/headers?

Use the official `levilamina-mod-template`: it brings in all LeviLamina headers through xmake's `add_packages("levilamina")`. In VS Code with clangd (the template ships a `.clangd`; the xmake extension or `xmake project -k compile_commands` generates `compile_commands.json`), typing `ll::` shows all namespaces and functions through completion, and hovering shows the header they live in. You can also browse the `src/ll/api` directory of the LeviLamina repository or the official API documentation (docs.levimc.org).

*Applies to: current version (LeviLamina, official mod template)*

## Can the xmake used for LeviLamina mods build with one click like Visual Studio? Which editor is recommended?

VS Code is recommended, with the xmake and clangd extensions for development and building (the xmake extension provides one-click build/debug). From the command line, run `xmake f -y -p windows -a x64 -m release` in the project root and then `xmake` to build; the output is under `bin/`.

*Applies to: current version (LeviLamina, official mod template)*

## A LeviLamina client mod crashes as soon as the game starts, before I can attach a debugger. How do I debug it?

In the mod's `DllMain` (or its load entry point), first delay for about 10 seconds, or loop until a debugger is attached (for example `while (!IsDebuggerPresent()) Sleep(100);`), which gives you time to attach the debugger to the game process. You can also launch the Minecraft process directly under the debugger. The official mod template's `.vscode/launch.json` also provides "GDK attach"/"BDS attach" configurations (install the Tasks Shell Input extension and set `MC_GDK_DEBUG_PATH` / `MC_BDS_DEBUG_PATH`), which start the process and attach the debugger automatically, but they attach only after the process has been stable for about 3 seconds, so a crash that happens earlier still needs the waiting approach above.

*Applies to: current version (Windows)*

## I want to build a native Android mod. After cloning LeviLamina on Termux/arm64 Linux, `xmake f -p linux -a arm64` fails with `` `arm64` is not a valid complation arch for this project, please use one of x86_64 ``. What should I do?

LeviLamina supports only x86_64: the client is `windows|x64` only, and the server is `windows|x64` and `linux|x86_64`, so it cannot be used to build Android mods. Native mods on Android use a separate system: they are loaded by the Android version of LeviLauncher through the Preloader SDK (`LiteLDev/preloader-android`, the `pl::` API). Follow the tutorial "Write Your First Android Native Mod" (<https://levimc.org/tutorials/develop/first-android-mod/>) and the API pages under `developer_guides/android` in the LeviLamina documentation, not LeviLamina.

## I want to set up a `vcxproj` by hand in Visual Studio to develop a LeviLamina plugin. Where do I find the lib exported by LL?

Developing with `levilamina-mod-template` (xmake) is officially recommended. LeviLamina no longer provides a ready-to-link SDK lib: xmake's `levilamina` package compiles LeviLamina and all its dependencies from source with `clang-cl`, so writing a `vcxproj` by hand means building LeviLamina yourself and configuring every dependency library, which is very cumbersome. If you want to use Visual Studio, run `xmake project -k vsxmake` in the template project to generate a VS project, and let xmake handle dependencies and linking.

*Applies to: LeviLamina 26.x*

## When packaging a LeviLamina mod, what happens if I do not change the LeviLamina version that the package description file depends on? Is it the latest version by default?

It does not pick the latest version automatically; you must change the dependency to the target version yourself. The current template uses `lip.toml` instead of `tooth.json`: under `[variants."".deps]`, set the version range of `"github.com/LiteLDev/LeviLamina"` (the template uses `"26.60.*"` for the server and `">26.60.6 <26.61.0"` for the client; the client dependency uses the bare id, not `"#client"`). Also change `add_requires("levilamina x.x.x")` in `xmake.lua` to the target version; otherwise the LL version you depend on is wrong.

*Applies to: lip.toml format (templates after LeviLamina 26.60.6); the old tooth.json works the same way*

## Building a client mod, xmake reports `error: Invalid option: --target_type=client`. What causes this?

`--target_type` is a configuration option declared in the project's `xmake.lua` with `option("target_type")` (values `server`/`client`, default `server`); you can pass it only if `xmake.lua` declares the option. This error means your `xmake.lua` is an older version or has been modified and has no `target_type` option. Use the `xmake.lua` from the latest `levilamina-mod-template` (it declares `option("target_type")` and passes it to the `levilamina` package with `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})`), make sure xmake is up to date (`xmake --version`), then run `xmake f -a x64 -m release -p windows --target_type=client -y`, followed by `xmake -v -y` to build.

*Applies to: LeviLamina 26.x, current levilamina-mod-template*

## Building LeviLamina itself with xmake fails locally (no LLVM version works) but CI is fine. How do I troubleshoot?

1. Run `xmake -v` to see which LLVM/`clang-cl` is actually invoked. If you have installed Visual Studio's LLVM (Clang) component, xmake may prefer the LLVM bundled with VS over the one you installed separately; uninstall it or avoid it.
2. Run `xmake repo -u` to update the package repository, then rebuild with `xmake -v -y`. Problems in a dependency's version description (such as `parallel-hashmap`) are fixed on the repository side, and the build keeps failing until your local repository is updated.

You can follow what CI does (install LLVM 22, then `xmake repo -u`, then `xmake f` / `xmake`).

*Applies to: LeviLamina 26.x*

## Building a mod fails while installing the levilamina package; the log shows `error STL1000: Unexpected compiler version, expected Clang 20 or newer` for dependencies such as glm (VS2026 / new MSVC STL). How do I fix it?

This means xmake detected and used a separately installed LLVM Clang older than version 20, which is incompatible with the new MSVC STL. After uninstalling the old Clang, either tick the "C++ Clang tools for Windows" (`clang-cl`) component in the Visual Studio Installer, or install a recent LLVM separately (the official template CI uses LLVM 22); otherwise you get `toolchain("clang-cl"): not found`. You can confirm which clang version is actually used with `xmake -v`. The detailed failure log is at `%LOCALAPPDATA%\.xmake\cache\packages\...\levilamina\<version>\installdir.failed\logs\install.txt`.

*Applies to: LeviLamina 26.x*

## The author of an open-source native LeviLamina mod has stopped updating it. How can I update it to a new LeviLamina version myself?

Fork the repository and replace its `xmake.lua` with the latest one from `levilamina-mod-template` (and change the mod name and LeviLamina version, syncing `lip.toml`/`manifest.json` if necessary). Adjust include paths and APIs to the new headers (Mojang may have removed or changed some functions, which you then have to rewrite), and once it compiles, open a PR to the original repository.

## When developing a mod with LeviLamina, do I still need to put BDS lib files into the project directory by hand, as with LL2?

No. xmake downloads the dependencies automatically: the `levilamina` package and its dependencies are all in LiteLDev's xmake-repo (added as `levimc-repo` in the template) and are fetched at build time. For the current version, the BDS/client link data comes from the `bedrockdata` package (`bedrock-runtime-data`, which distinguishes server/client by `target_type`); the old `bdslibrary` package is used only for older versions up to 1.21.3. With an unregistered version such as `levilamina develop`, the package is loaded with the dependencies of the main branch (a comment in the template notes that a development version may need you to add BDS library dependencies yourself).

*Applies to: LeviLamina 0.x and later*

## In a project created from levilamina-mod-template, Visual Studio keeps auto-formatting my code in a strange way as I type. How do I turn it off?

The mod template ships a `.clang-format` file in its root, and VS reads it first to format code. Edit or delete the `.clang-format` in the project root to suit your habits (or turn off format-on-type in VS).

*Applies to: current levilamina-mod-template*

## After levilamina-mod-template is updated, how do I sync the changes into a project created from it?

There is no automatic sync; you have to compare against the template and apply the changes by hand (mainly `xmake.lua`, plus `.github/workflows`, `lip.toml` and so on). A repository created with "Use this template" has no git history in common with the template, so even if you want to merge, you have to resolve the conflicts yourself.

## When developing a mod with levilamina-mod-template (xmake), CLion has no code completion. What can I do?

Run `xmake project -k cmakelists` in the project root to generate `CMakeLists.txt`, then open the generated CMake project in CLion. (You can also run `xmake project -k compile_commands` to generate `compile_commands.json` for clangd/CLion; the template already ships a `.clangd` configuration.)

## With levilamina-mod-template, after pinning LeviLamina in `add_requires` to an older version (such as 1.4.4), running `xmake project -k compile_commands -v -y` fails with "cannot open include file" (the latest version works). What should I do?

This is usually a network problem while downloading the preloader package, leaving the package xmake fetched incomplete or wrong. Delete the preloader package directory for that version and the xmake cache, then run again. For example:

1. Delete `%LOCALAPPDATA%\.xmake\packages\p\preloader\<version>` (such as `v1.15.3`).
2. Delete `%LOCALAPPDATA%\.xmake\cache`.
3. Run `xmake project -k compile_commands -v -y` again (or `xmake -y`).

*Applies to: all LeviLamina versions built with xmake + levimc-repo*

## When developing a LeviLamina C++ mod, Chinese/UTF-8 text in the console output is garbled. How do I set UTF-8 output?

Output through the mod's own Logger (such as `getSelf().getLogger()`) is recommended: on a Windows console LeviLamina writes through `WriteConsoleW`, so Chinese text is not garbled. If you must print directly with `printf`/`std::cout`, include `Windows.h` and run this at startup:

```cpp
SetConsoleCP(CP_UTF8);
SetConsoleOutputCP(CP_UTF8);
DWORD mode;
GetConsoleMode(GetStdHandle(STD_OUTPUT_HANDLE), &mode);
SetConsoleMode(GetStdHandle(STD_OUTPUT_HANDLE), mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
```

Also make sure the source is compiled as UTF-8 (the template already has `/utf-8`). You can also enable the Windows setting "Beta: Use Unicode UTF-8 for worldwide language support", but that may garble text in other programs.

*Applies to: LeviLamina mods / ordinary console programs on Windows*

## Building a LeviLamina mod with xmake fails with `error: package(bedrockdata): version(xxx) not found!` (for example 1.21.60.10-server). What should I do?

The local xmake package repository (`levimc-repo`) cache is too old. Run `xmake repo -u` to update the repository and rebuild. As a rule: if a package version has actually been published but xmake says it cannot be found, the repository cache needs updating.

*Applies to: all LeviLamina versions built with xmake + levimc-repo*

## Compiling a LeviLamina mod with xmake (for example a LegacyRemoteCall-related project) runs out of memory (OOM), reports insufficient compiler heap space, or even crashes VSCode. What should I do?

The cause is too many header includes (such as `include_all` and heavy `magic_enum` macro expansion), which makes each compiler process use a lot of memory. Reduce the number of parallel compile jobs with `xmake -j <num>` (for example `xmake -j 2`) and close other memory-hungry software; you can also cut unnecessary includes of large headers.

*Applies to: current version (depends on machine memory)*

## A project created from the latest levilamina-mod-template does not compile. What should I do?

You need to add the `_HAS_CXX23` define. The template added it in the commit <https://github.com/LiteLDev/levilamina-mod-template/commit/2d01125a7b8982d04019d1a006c0276d0006f5d6>:

```lua
add_defines("NOMINMAX", "UNICODE", "_HAS_CXX23=1")
```

Update the template or add this define to the target in `xmake.lua` by hand.

*Applies to: LeviLamina (26.x) and levilamina-mod-template after 2026-10*

## Building a mod for an older LeviLamina (such as 1.4.1) with the latest levilamina-mod-template, the GitHub Actions client build fails (the old version has no client build). How do I make the action build only the server?

LeviLamina officially supports the client only from 1.9.0. When targeting an older version, remove the `client` entry from `matrix.target_type` in `build.yml` and `release.yml` under `.github/workflows/` and keep only the `server` build. Also delete the variant with `side = "client"` in `lip.toml`, and change the LeviLamina dependency version to the one you actually use.

*Applies to: projects using the new template that target LeviLamina before 1.9.0*

## Compiling a LeviLamina C++ plugin fails with C4819: the file contains a character that cannot be represented in the current code page (936). How do I fix it?

Add the UTF-8 compile flag `/utf-8` to the compiler (`add_cxflags("/utf-8")` in `xmake.lua`). The official mod template's `xmake.lua` already includes it by default; if the error still appears, it may be caused by a wrong symbol in the code (such as Chinese punctuation) or a wrong header, so check the source and make sure the source files are saved as UTF-8.

## Compiling a LeviLamina mod, xmake reports an error related to the preloader package. How do I fix it?

Delete the xmake cache and the preloader package for that version, then rebuild:

1. Delete `C:\Users\%USERNAME%\AppData\Local\.xmake\cache`.
2. Delete `C:\Users\%USERNAME%\AppData\Local\.xmake\packages\p\preloader\<version>` (such as `v1.15.5`).
3. Run `xmake` again to build.

*Applies to: all LeviLamina versions built with xmake + levimc-repo*

## Compiling a LeviLamina mod fails with errors such as `"clear": 不是 "CompoundTag" 的成员` ("clear" is not a member of "CompoundTag"). How do I fix it?

`CompoundTag` currently has no `clear()` member function, but its inner `TagMap` member `mTags` is public, so you can clear it directly with `nbt.mTags.clear()`. Also, LeviLamina requires xmake 3.0.0 or later (`set_xmakever("3.0.0")` in `xmake.lua`); if your xmake is too old (such as 2.9.x), run `xmake update` before building. Dependencies such as `bedrockdata` are pulled in automatically by the `levilamina` package according to its version, so you do not need to `add_requires` an old version number by hand.

*Applies to: LeviLamina 1.x and later (currently v26.60.8)*

## Compiling a mod fails because a LeviLamina header is missing other headers it depends on (some types are undefined). How do I fix it?

LeviLamina's mc headers are generated by a tool, and some of them may lack required includes (only forward declarations). To fix it, `#include` the header that defines the missing type by hand in the source file of your mod that uses the header; if it is hard to locate, you can also open a PR to LeviLamina that adds the missing include to that header.

*Applies to: LeviLamina current version*

## Building LeviLamina myself (or building a mod with the template) fails, while older versions compiled fine. What should I do?

Check your LLVM/clang version. LeviLamina and the mod template use the `clang-cl` toolchain on Windows, and the clang/LLVM bundled with Visual Studio is often too old; install or update to a recent LLVM (official CI uses LLVM 22), make sure xmake is >= 3.0.0, and rebuild.

*Applies to: LeviLamina 26.x*

## When debugging a LeviLamina plugin crash, CrashLogger always grabs the exception before the VS debugger. How do I debug conveniently?

During development you can use the debug build of LeviLamina (releases also provide debug build packages for server and client), which gives more complete stack traces. CrashLogger does not enable itself if it detects a debugger (`IsDebuggerPresent`) at startup, so launching BDS directly under the debugger avoids the exception being grabbed. To attach a debugger after startup, set `modules.crashLogger.enabled` to `false` in the LeviLamina configuration file (`mods/LeviLamina/config/Config.json`) to turn CrashLogger off.

*Applies to: LeviLamina 1.x and later*
