# LeviStone

## LeviLamina 和 Endstone 能同时使用吗？能在 LeviLamina 上运行 Endstone 插件，或在 Endstone 上运行 LL/LSE 插件吗？

不要把两个加载器直接一起装（会冲突）。应使用 LiteLDev 的 LeviStone（<https://github.com/LiteLDev/LeviStone>，中文说明见 `README.zh.md`）：它是一个 LeviLamina 模组（模组名 `EndstoneRuntime`），把 Endstone 运行时作为 LL 模组运行，从而在 LeviLamina 上加载 Endstone 的 Python 插件，LL 模组/LSE 插件照常运行。反过来不行：Endstone 无法加载 LeviLamina 原生模组（LL 依赖完整的 BDS 头文件/符号），也没有现成的加载 LSE 插件的兼容层。

*适用版本：LeviStone v0.11.15-post.1；LeviLamina `>=26.60.4 <26.70.0`*

## LeviStone（Endstone 运行时）能和 LSE 的 Python 引擎（`legacy-script-engine-python`）同时安装吗？两者有什么区别？

维护者表示两者的 Python 运行时不能共存，同时安装会导致 LSE Python 加载报错/崩溃，只能二选一；如果没用到 LSE Python 插件，直接卸载 LSE Python 引擎即可。区别：LeviStone 运行的是 Endstone 插件（`.whl` 包，可方便地依赖第三方 Python 库）；LSE Python 运行的是 LSE API 风格的插件。另外加载的脚本引擎越多，服务器开销越大。当前版本未见修复说明。

*适用版本：LeviStone 0.10.x 起。未能从源码或文档中直接证实，仅供参考。*

## LeviStone 支持哪些 Endstone 插件？能运行 Endstone 的 C++（native）插件吗？Endstone 插件怎么装，能用 lip 装吗？

LeviStone 只支持用 Python 编写的 Endstone 插件，不支持 Endstone 的原生（C++/native）插件——两者的内存分配器（memory operator）等不同，原生插件常带 hook，强行加载容易崩溃；真要用不如直接做成 LL 模组。LeviStone 本身用 pip 安装（`pip install levistone --target mods/EndstoneRuntime`），不是通过 lip。Endstone 插件把对应平台/Python 版本的 `.whl` 文件放进服务端 `plugins/` 文件夹即可（也可以 pip 安装）。

*适用版本：LeviStone 0.11.x*

## LeviStone、Endstone、Endweave 分别是什么关系？装 LeviStone 能让 LeviLamina 支持更新版本的客户端吗？

Endstone 是另一个 BDS 插件加载器（提供 Bukkit 式的稳定封装 API）。LeviStone 是 LeviLamina 模组（`EndstoneRuntime`），把 Endstone 运行时跑在 LL 上，让 Endstone 的 Python 插件在 LL 上运行（不支持 Endstone 的 C++ 插件），LL 模组照常运行。Endweave 是一个 Endstone 插件，在网络层改写数据包，让不同协议版本的客户端进入服务器（类似 ViaVersion/Glacie），服务端本身版本不变。所以思路是 LL + LeviStone + Endweave。Docker 用户可用 <https://github.com/LiteLDev/docker-levistone-server>。注意 Endweave 只在其 README 表格列出的协议之间转换（当前为 26.40–26.60），LeviStone 版本需与 LeviLamina 版本匹配。

*适用版本：LeviStone 0.11.15；LeviLamina 26.60.x；Endweave 0.5.0 及以上*

## 如何在 LeviLamina 上安装 LeviStone 来运行 Endstone 插件？Endstone 插件放在哪？有什么限制？

在已安装 LeviLamina 的 BDS 目录执行：

```shell
pip install levistone --target mods/EndstoneRuntime
```

指定版本可用 `pip install levistone==0.11.15 --target mods/EndstoneRuntime`（版本列表见 PyPI）。0.11.15 之前的旧版本要装到 `plugins/EndstoneRuntime`。LeviStone 版本需与 LeviLamina 版本匹配（参见 CHANGELOG 中每个版本对应的 LeviLamina 版本）。Endstone 插件的 `.whl` 文件放进服务端 `plugins/` 目录（0.11.15 起 LeviStone 加载时会自动创建 `plugins` 指向 `mods` 的目录链接；若服务端目录下已存在名为 `plugins` 的文件夹，则不会创建链接而是在日志报错，此时需先移走原有 `plugins` 文件夹）。只支持 Endstone 的 Python 插件，不支持 C++（native）插件。

*适用版本：LeviStone 0.11.15 及以上；LeviLamina `>=26.60.4 <26.70.0`；更早版本安装目录为 `plugins/EndstoneRuntime`*

## 想在 LeviLamina 上运行 Endstone 插件，装了 LeviStone 后还需要再装 Endstone 本体吗？装上后服务端一启动就闪退怎么办？

不需要另外安装 Endstone 本体：LeviStone 本身就是基于 Endstone 的运行时（以 LeviLamina 模组 `EndstoneRuntime` 的形式加载），装好即可运行 Endstone 的 Python 插件（不支持 Endstone 原生/C++ 插件）。启动闪退多数是 Python 环境问题：LeviStone 的 wheel 是按 Python 版本分别构建的，运行时需要与安装时所用 pip 对应版本的 `pythonXY.dll`。请确认安装 levistone 时用的 Python 与系统 PATH 中能找到的 Python 是同一版本（当前支持 Python 3.11~3.15 正式版）；如果装了多个 Python，用 `py -3.x -m pip install levistone --target mods/EndstoneRuntime` 明确指定版本，或者处理掉冲突的版本，再确保该版本的安装目录在 PATH 中。

*适用版本：LeviStone 0.11.15 及以上；更早版本安装目录为 `plugins/EndstoneRuntime`*

## 安装 LeviStone（EndstoneRuntime）后加载失败，报 `[0x0000007E:system] The specified module could not be found … module: endstone_runtime.dll missing module: python3XX.dll`（如 `python312.dll` / `python313.dll`），已经装了 C++ 运行库，怎么解决？

原因是找不到与 LeviStone 对应版本的 Python dll（`pythonXY.dll`），通常是 Python 安装目录没加进 PATH，或者安装 levistone 时用的 pip 和 PATH 里的 Python 不是同一个版本。解决方法：

1. 安装 Python（3.11~3.15 正式版），安装时勾选 “Add python.exe to PATH”；没勾选的话手动把 Python 安装目录加入 PATH，或者重新安装。可以用 `where python313.dll`（换成你的版本号）检查。
2. 在 BDS 根目录（有 `bedrock_server_mod.exe` 的目录）里用同一个 Python 的 pip 安装：`pip install levistone --target mods/EndstoneRuntime`（0.11.15 之前的版本用 `--target plugins/EndstoneRuntime`）。
3. 也可以把对应的 `pythonXY.dll` 复制到服务器根目录作为临时办法。
4. 在 Docker/Wine 下，pip 用 Linux 版 Python 安装时不会有 Windows 版的 dll，服务器运行时需要 Windows 版 Python 的 dll；建议直接使用官方镜像 `ghcr.io/liteldev/levistone-server:latest-wine`，它会把 Python 装进 Wine 前缀并自动安装 LeviStone。

*适用版本：当前版本（Windows 原生 / Wine）*

## LeviStone 启动时 EndstoneRuntime 长时间卡住，之后突然开始下载，服务器启动很慢甚至起不来，怎么解决？

LeviStone 本身和 Endstone 插件（`.whl`）的依赖都是通过 pip 从 PyPI 下载的（Endstone 加载插件时会调用 `python -m pip install <插件.whl>`），没配置镜像时直连 PyPI 很慢，甚至会失败。可以先配置国内镜像，再在 BDS 根目录手动安装：

```shell
pip config set global.index-url https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple
pip install levistone --target mods/EndstoneRuntime
```

要装指定版本就写 `levistone==<版本>`，并与 LeviLamina 版本匹配；0.11.15 之前的版本要把 `mods` 改成 `plugins`。然后运行 `bedrock_server_mod.exe`。用 Docker 镜像的话，可以设置环境变量 `PYPI_MIRROR_URL`。

*适用版本：LeviStone 0.11.15 及以上*

## 想在 LeviLamina 上运行 Endstone 的 Python 插件（如 endweave 的 `.whl`），是否需要先安装 LSE Python（`legacy-script-engine-python`）？安装 LSE Python 卡住怎么办？

不需要。LeviStone 本身不是 Python 插件，而是让 LeviLamina 能运行 Endstone Python 插件的模组（`EndstoneRuntime`），不依赖 LSE Python。而且据维护者说明，LeviStone 和 LSE Python 冲突，只能二选一，需要删掉 LSE Python。安装 LeviStone 后，把 Endstone 插件（`.whl`）放到 `plugins` 目录即可（0.11.15 起 LeviStone 会自动把 `plugins` 创建为指向 `mods` 的目录链接）。注意 Python 版本要与安装 LeviStone 时所用的版本一致（当前支持 3.11~3.15）。

## 服务器同时安装 EndstoneRuntime（`endstone_runtime.dll`，LeviStone）和某个悬浮字 mod 后一直崩溃，崩溃堆栈里出现这两个 dll，是它们冲突吗？

不一定。本例从崩溃日志看，实际是 ScriptAPI（使用了脚本 API 的 addon，SAPI）崩溃。Endstone 和该 mod 只是 hook 了 tick，任何 hook 了 tick 的 mod 都会出现在调用栈中，与崩溃本身无关。排查方法：看崩溃 trace 中真正出错的模块，排查并移除使用了 SAPI 的 addon（本例是某个农场类 addon），或向 Mojang 反馈。这是通用的崩溃排查经验，当前版本仍可参考。

*未能从源码或文档中直接证实，仅供参考。*

## Endweave 改成 C++ 实现后，还能在 LeviStone 上使用吗？

可以。Endweave 目前是 Python+C++ 混合实现，以 Python 插件（`.whl`）的形式加载，能在 LeviStone 上运行。注意要用 LeviStone 0.11.15-post.1 及以上版本：该版本专门修复了 endweave 无法工作的问题。LeviStone 不支持纯 Endstone 原生（C++）插件。

*适用版本：LeviStone 0.11.15-post.1 及以上*

## 使用 LeviStone 时想关闭某个功能，找到的配置文件其实是 endweave 的配置，LeviStone（Endstone）的配置文件在哪里？

LeviStone 的 Endstone 配置文件是 `endstone.toml`，位于 BDS 根目录（服务端工作目录）下；首次加载时 LeviStone 会从 `mods/EndstoneRuntime/endstone/config/endstone.default.toml` 复制生成。在 `endstone.toml` 中修改对应功能开关即可。endweave 的配置是另一个组件的配置，不是 endstone 的。

*适用版本：LeviStone v0.11.15-post.1*
