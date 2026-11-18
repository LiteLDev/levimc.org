# LeviStone

## Can LeviLamina and Endstone be used together? Can I run Endstone plugins on LeviLamina, or LL/LSE plugins on Endstone?

Don't install the two loaders side by side directly (they conflict). Use LiteLDev's LeviStone (<https://github.com/LiteLDev/LeviStone>, with Chinese documentation in `README.zh.md`) instead: it is a LeviLamina mod (mod name `EndstoneRuntime`) that runs the Endstone runtime as an LL mod, so you can load Endstone's Python plugins on LeviLamina while LL mods and LSE plugins keep working as usual. The reverse does not work: Endstone cannot load native LeviLamina mods (LL depends on the full BDS headers and symbols), and there is no ready-made compatibility layer for loading LSE plugins.

*Applies to: LeviStone v0.11.15-post.1; LeviLamina `>=26.60.4 <26.70.0`*

## Can LeviStone (the Endstone runtime) be installed together with LSE's Python engine (`legacy-script-engine-python`)? What is the difference between them?

The maintainers say the Python runtimes of the two cannot coexist; installing both makes LSE Python fail to load or crash, so you can only use one of them. If you don't use any LSE Python plugins, just uninstall the LSE Python engine. The difference: LeviStone runs Endstone plugins (`.whl` packages, which can conveniently depend on third-party Python libraries), while LSE Python runs plugins written in the LSE API style. Also, the more script engines are loaded, the more overhead the server has. No fix has been reported for the current version.

*Applies to: LeviStone 0.10.x and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Which Endstone plugins does LeviStone support? Can it run Endstone's C++ (native) plugins? How do I install Endstone plugins, and can I use lip?

LeviStone only supports Endstone plugins written in Python. It does not support Endstone's native (C++) plugins: the two differ in things such as the memory allocator (memory operator), and native plugins often contain hooks, so forcing them to load easily crashes the server. If you really need one, it is better to make it an LL mod. LeviStone itself is installed with pip (`pip install levistone --target mods/EndstoneRuntime`), not with lip. For an Endstone plugin, put the `.whl` file for the matching platform and Python version into the server's `plugins/` folder (you can also install it with pip).

*Applies to: LeviStone 0.11.x*

## How are LeviStone, Endstone and Endweave related? Does installing LeviStone let LeviLamina support newer clients?

Endstone is another BDS plugin loader (it provides a stable, Bukkit-style wrapper API). LeviStone is a LeviLamina mod (`EndstoneRuntime`) that runs the Endstone runtime on LL, so Endstone's Python plugins run on LL (Endstone's C++ plugins are not supported) and LL mods keep working as usual. Endweave is an Endstone plugin that rewrites packets at the network layer so clients of different protocol versions can join the server (similar to ViaVersion/Glacie); the server version itself doesn't change. So the setup is LL + LeviStone + Endweave. Docker users can use <https://github.com/LiteLDev/docker-levistone-server>. Note that Endweave only translates between the protocols listed in the table in its README (currently 26.40–26.60), and the LeviStone version must match the LeviLamina version.

*Applies to: LeviStone 0.11.15; LeviLamina 26.60.x; Endweave 0.5.0 and later*

## How do I install LeviStone on LeviLamina to run Endstone plugins? Where do Endstone plugins go? What are the limitations?

In the BDS directory where LeviLamina is installed, run:

```shell
pip install levistone --target mods/EndstoneRuntime
```

To pick a specific version, use `pip install levistone==0.11.15 --target mods/EndstoneRuntime` (see PyPI for the version list). Versions before 0.11.15 must be installed to `plugins/EndstoneRuntime`. The LeviStone version must match the LeviLamina version (see the CHANGELOG for the LeviLamina version of each release). Put the `.whl` files of Endstone plugins into the server's `plugins/` directory (since 0.11.15, LeviStone automatically creates a directory link `plugins` pointing to `mods` when it loads; if a folder named `plugins` already exists in the server directory, no link is created and an error is logged, so move the existing `plugins` folder away first). Only Endstone's Python plugins are supported, not C++ (native) plugins.

*Applies to: LeviStone 0.11.15 and later; LeviLamina `>=26.60.4 <26.70.0`; earlier versions install to `plugins/EndstoneRuntime`*

## To run Endstone plugins on LeviLamina, do I still need to install Endstone itself after installing LeviStone? The server crashes right at startup after installing it. What do I do?

You don't need to install Endstone itself separately: LeviStone is itself an Endstone-based runtime (loaded as the LeviLamina mod `EndstoneRuntime`), and once installed it can run Endstone's Python plugins (Endstone native/C++ plugins are not supported). Startup crashes are mostly Python environment problems: LeviStone's wheels are built separately for each Python version, and at runtime it needs the `pythonXY.dll` that matches the pip used for the installation. Make sure the Python you used to install levistone is the same version as the Python found on the system PATH (Python 3.11~3.15 stable releases are currently supported). If you have several Pythons installed, specify the version explicitly with `py -3.x -m pip install levistone --target mods/EndstoneRuntime`, or remove the conflicting versions, and then make sure the installation directory of that version is on PATH.

*Applies to: LeviStone 0.11.15 and later; earlier versions install to `plugins/EndstoneRuntime`*

## After installing LeviStone (EndstoneRuntime), loading fails with `[0x0000007E:system] The specified module could not be found … module: endstone_runtime.dll missing module: python3XX.dll` (such as `python312.dll` / `python313.dll`), even though the C++ runtime is installed. How do I fix it?

The cause is that the Python dll (`pythonXY.dll`) matching LeviStone cannot be found. Usually the Python installation directory is not on PATH, or the pip used to install levistone and the Python on PATH are not the same version. To fix it:

1. Install Python (3.11~3.15 stable releases) and check "Add python.exe to PATH" during installation; if you didn't, add the Python installation directory to PATH manually, or reinstall. You can check with `where python313.dll` (replace it with your version number).
2. In the BDS root directory (the one containing `bedrock_server_mod.exe`), install with the pip of the same Python: `pip install levistone --target mods/EndstoneRuntime` (for versions before 0.11.15, use `--target plugins/EndstoneRuntime`).
3. As a temporary workaround, you can also copy the matching `pythonXY.dll` into the server root directory.
4. Under Docker/Wine, installing with a Linux Python's pip does not provide the Windows dll, but the server needs the dll of a Windows Python at runtime. Use the official image `ghcr.io/liteldev/levistone-server:latest-wine`, which installs Python into the Wine prefix and installs LeviStone automatically.

*Applies to: current version (native Windows / Wine)*

## When LeviStone starts, EndstoneRuntime hangs for a long time and then suddenly starts downloading, so the server starts very slowly or not at all. How do I fix it?

Both LeviStone itself and the dependencies of Endstone plugins (`.whl`) are downloaded from PyPI through pip (when Endstone loads a plugin, it calls `python -m pip install <plugin.whl>`). Without a configured mirror, connecting to PyPI directly is very slow and can even fail. Configure a mirror in mainland China first, then install manually in the BDS root directory:

```shell
pip config set global.index-url https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple
pip install levistone --target mods/EndstoneRuntime
```

To install a specific version, write `levistone==<version>` and make sure it matches the LeviLamina version; for versions before 0.11.15, change `mods` to `plugins`. Then run `bedrock_server_mod.exe`. With the Docker image, you can set the environment variable `PYPI_MIRROR_URL`.

*Applies to: LeviStone 0.11.15 and later*

## To run Endstone Python plugins (such as the `.whl` of endweave) on LeviLamina, do I need to install LSE Python (`legacy-script-engine-python`) first? What if installing LSE Python hangs?

No. LeviStone itself is not a Python plugin; it is a mod (`EndstoneRuntime`) that lets LeviLamina run Endstone Python plugins, and it does not depend on LSE Python. According to the maintainers, LeviStone and LSE Python also conflict, so you can only use one of them, and you need to remove LSE Python. After installing LeviStone, put the Endstone plugin (`.whl`) into the `plugins` directory (since 0.11.15, LeviStone automatically creates `plugins` as a directory link pointing to `mods`). Note that the Python version must match the one used when installing LeviStone (3.11~3.15 are currently supported).

## The server keeps crashing after installing both EndstoneRuntime (`endstone_runtime.dll`, LeviStone) and a floating-text mod, and both dlls appear in the crash stack. Do they conflict?

Not necessarily. In this case, the crash log shows that the actual crash was in ScriptAPI (an addon that uses the script API, SAPI). Endstone and that mod merely hook the tick, and any mod that hooks the tick shows up in the call stack, regardless of the crash itself. To troubleshoot, look at the module that actually fails in the crash trace, find and remove the addons that use SAPI (here, a farm-type addon), or report it to Mojang. This is general crash-troubleshooting experience and still applies to the current version.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can Endweave still be used on LeviStone after it was reimplemented in C++?

Yes. Endweave is currently a hybrid Python + C++ implementation that loads as a Python plugin (`.whl`) and runs on LeviStone. Note that you need LeviStone 0.11.15-post.1 or later: that version specifically fixes endweave not working. LeviStone does not support pure Endstone native (C++) plugins.

*Applies to: LeviStone 0.11.15-post.1 and later*

## I want to turn off a feature when using LeviStone, but the config file I found is actually endweave's. Where is LeviStone's (Endstone's) config file?

LeviStone's Endstone config file is `endstone.toml`, located in the BDS root directory (the server's working directory); on first load, LeviStone generates it by copying `mods/EndstoneRuntime/endstone/config/endstone.default.toml`. Change the corresponding feature switch in `endstone.toml`. endweave's config belongs to a different component and is not endstone's.

*Applies to: LeviStone v0.11.15-post.1*
