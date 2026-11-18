# 构建 LeviLamina 模组：工具链

## 想用 C++ 开发 LeviLamina 原生 mod，开发环境怎么搭？LL/BDS 头文件和库从哪里来？能否自己建 VS 工程手动配置？写好后怎么放到服务器上运行？

不建议自己建 VS 工程手动配置头文件和库。推荐流程：安装 Git、Visual Studio（勾选“使用 C++ 的桌面开发”，提供 Windows SDK 和 C++ 库）、LLVM（安装时加入 PATH；当前模板用 `set_toolchains("clang-cl")` 以 clang-cl 编译）和 xmake；用 GitHub 上的 `LiteLDev/levilamina-mod-template` “Use this template”新建仓库，在 `xmake.lua` 中修改 target 名，并用 `add_requires("levilamina 26.60.*", ...)` 固定与服务器前两段版本号一致的 LeviLamina 版本；在项目目录执行 `xmake f -y -p windows -a x64 -m release` 和 `xmake`，头文件和库由 xmake 自动拉取并构建。拉依赖失败多半是网络问题，可为 xmake 配置 GitHub 镜像代理或 HTTP 代理；找不到指定 LeviLamina 版本时执行 `xmake repo -u`。编辑器任选，推荐 VS Code + C/C++、XMake、clangd 扩展；也可用 `xmake project -k vsxmake` 生成 VS 工程。头文件写法如 `#include "ll/api/command/CommandRegistrar.h"`、`#include "mc/world/actor/player/Player.h"`，不要套用 LSE 的 API 命名。构建产物在 `bin\<mod名>\` 下（包含 dll 和 `manifest.json`），把整个文件夹复制到服务器的 `mods` 目录，重启服务器后由 LeviLamina 加载。详见 <https://levimc.org/zh-Hans/tutorials/develop/first-levilamina-mod/>

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 服务端 mod 能直接给客户端（LeviLamina client）用吗？能否一个 DLL 双端通用？移植到客户端要做哪些适配？

不能通用，必须分别编译服务端版和客户端版两个 DLL：依赖 LeviLamina 的 mod 加载时会解析所有用到的 MC API 符号，缺失就加载失败；而客户端与 BDS 的符号差异很大（大量内联、客户端多了 client 相关内容），且 `Actor` 等类在两端的成员和虚表也不同。适配步骤：

1. 参考最新 levilamina-mod-template 更新 `xmake.lua`、`manifest.json` 和 GitHub Actions workflows；编译客户端版用 `xmake f --target_type=client` 再构建（默认 server），两端特有代码可分别放 `src-server`/`src-client`。
2. 包描述文件现为 `lip.toml`（format 4），在默认 variant 下分别声明 `side = "server"` 和 `side = "client"` 两个条目（旧的 `tooth.json` client label 已被取代），依赖统一写 `github.com/LiteLDev/LeviLamina`。
3. 命令注册用 `CommandRegistrar::getServerInstance()`（即 `getInstance(false)`）或 `getClientInstance()`。
4. 用到服务端特有的东西需改动（如 `PropertiesSettings`：`src-server` 下有完整成员与函数，`src-client` 下只是空壳结构体）；hook 等代码需要实际测试。

另外客户端每进一次世界相当于开一次服务端，mod 必须正确实现 disable/卸载逻辑。

*适用版本：LeviLamina 1.8 及以上（lip.toml 部分 26.60.8 及以上）*

## C++ mod 项目如何指定/更新/回退所依赖的 LeviLamina 版本？改了版本后构建仍报错怎么办？

在 mod 项目的 `xmake.lua` 里给 levilamina 包名后加版本号，例如 `add_requires("levilamina 26.60.8", {configs = {target_type = get_config("target_type")}})`（不写版本则选用包仓库 `versions.txt` 里的最新版本；也可写完整 40 位 commit hash 或分支名如 `levilamina main` 使用开发中版本，此时需自行处理 bdslibrary 等依赖。注意模板注释里写的 `levilamina develop` 已不可用——LeviLamina 仓库现在没有 develop 分支，开发分支是 main）。改完版本后依次执行：`xmake repo -u`（更新 levimc-repo 等包仓库，让本地知道新版本）、`xmake c -a`（清理全部构建缓存），必要时 `xmake f -c` 重新配置，再执行 `xmake` 构建；如用 VSCode/clangd 补全，再执行 `xmake project -k compile_commands` 重新生成。注意：写了包仓库中未收录的版本号时，xmake 会把它当作 git 分支去拉取，从而报 `Remote branch ... not found` 之类的错误。

## xmake 构建 mod 时指定 levilamina 某版本报 `Remote branch x.y.z not found in upstream origin`，或警告 `Unknown version: x_y_z, will use main branch dependencies`，怎么办？

原因是本地的 xmake 包仓库（LiteLDev/xmake-repo，项目中名为 levimc-repo）的 `versions.txt` 里没有这个版本：xmake 在版本列表里匹配不到时，会把写的版本号当成 git 分支名去拉取 LeviLamina 仓库，于是报 `Remote branch x.y.z not found`；而 `Unknown version: x_y_z, will use main branch dependencies` 是 levilamina 包脚本在找不到 `versions/<x_y_z>.lua` 时打印的警告（用 commit 或分支指定版本时也会出现，属正常，会回退使用 main 分支的依赖配置）。可能是本地仓库没更新，也可能是 LeviLamina 发版后 xmake-repo 尚未（或没有）收录该版本（例如目前 xmake-repo 就没有收录 v26.20.2、v1.6.2）。处理办法：

1. 执行 `xmake repo -u` 更新包仓库，必要时 `xmake c -a`（或删除项目下的 `.xmake` 目录）后重试。
2. 若 xmake-repo 中仍没有该版本，在 `add_requires` 里改用 LeviLamina 对应 tag 的完整 40 位 commit hash（短 hash 会被当作分支名而同样失败），或换用已收录的相邻版本。

版本号写不写 `v` 前缀都能匹配。下载失败时还需检查网络/代理。

## 用 xmake 构建 LeviLamina mod 时下载依赖包（levilamina、entt、expected-lite、libhat 等）或拉取包仓库一直失败/很慢，怎么办？

绝大多数是访问 GitHub 的网络问题。xmake 和 git 不一定走系统代理，可按以下方式处理：

1. 给 xmake 设代理：`xmake g --proxy=http://127.0.0.1:端口`；或在同一终端设环境变量后再构建（cmd：`set HTTP_PROXY=http://127.0.0.1:端口` 与 `set HTTPS_PROXY=http://127.0.0.1:端口`）；同时给 git 设代理：`git config --global http.proxy http://127.0.0.1:端口`。也可把代理软件开成 TUN（系统级透明代理）模式。Steam++ 之类不要用 hosts 加速模式。
2. 使用镜像：自行编写一个 pac 文件（如 `%LOCALAPPDATA%\.xmake\pac.lua` 或任意绝对路径），在其中定义 `function mirror(url) ... end` 把 github.com 地址改写为可用的镜像地址，然后 `xmake g --proxy_pac=<该文件>`。注意：旧教程（包括 LeviLamina 构建文档）中的 `xmake g --proxy_pac=github_mirror.lua` 依赖 xmake 内置的 `scripts/pac/github_mirror.lua`，该文件已在 xmake v2.9.8（2025-01）起被移除，新版 xmake 直接这样写无效。详见 xmake 文档“网络优化”：<https://xmake.io/zh/guide/package-management/network-optimization.html>
3. 如果项目或全局配置里设置了不适合你网络的代理/镜像（例如海外或开着代理却用了国内镜像），把它删掉或改回 GitHub 源。
4. 应急办法：从别人处拿到已下载好的包，放入 xmake 包缓存目录 `%LOCALAPPDATA%\.xmake\packages\<首字母>\<包名>`（如 levilamina 在 `packages\l\levilamina`）；或手动下载源码包后用 `xmake g --pkg_searchdirs=<绝对路径>` 指定本地搜索目录。
5. 若某个 git 仓库缓存拉取卡住，可进入 xmake 报错的那个仓库缓存目录手动 `git fetch` 后重试；也可先 `xmake repo -u`、`xmake c -a` 清理后重新构建。

## 用 xmake 构建 LeviLamina mod（levilamina-mod-template）时拉取仓库/下载依赖报 SSL 证书错误，例如 `fatal: unable to access 'https://github.com/LiteLDev/xmake-repo.git/': SSL certificate problem: unable to get local issuer certificate`（或 xmake-mirror/build-artifacts.git），怎么办？

这是本机访问 GitHub 时的网络/证书问题（本地缺少或不信任 GitHub 的证书链，常见于代理/加速器劫持 HTTPS），不是 xmake 或 LeviLamina 的问题。LeviLamina 的包仓库 levimc-repo（<https://github.com/LiteLDev/xmake-repo.git>）和大部分依赖都托管在 GitHub 上。处理方法：

1. 检查网络/代理环境，使用稳定可靠的代理正常访问 GitHub（Watt Toolkit 这类加速器会替换证书，效果不稳定）。
2. 如果确实是本机证书链缺失，可在浏览器访问 GitHub 导出站点证书，安装到“受信任的根证书颁发机构”。
3. 对 xmake 通过 curl 下载包时的证书校验失败，可执行全局配置 `xmake g --insecure-ssl=y` 跳过 SSL 校验（见 xmake FAQ“下载包提示证书校验失败怎么办”）。

构建本身：在项目目录先 `xmake repo -u`，再 `xmake f -y -p windows -a x64 -m release`（或 `-m debug`），最后 `xmake`，产物在 `bin/`；用 Visual Studio 的话需按 xmake 文档生成 vsxmake 工程后再构建。需事先安装 git；当前模板使用 clang-cl 工具链，还需安装 LLVM（模板 CI 使用 LLVM 22）。

## 执行 `xmake f -m debug` 等命令时提示 `note: the following packages were not found in any repository (check if they are spelled correctly): -> levilamina -> levibuildscript`，或找不到指定版本的 levilamina，怎么解决？

1. 确认 `xmake.lua` 中添加了 LiteLDev 的包仓库：`add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")`（旧模板遗留的过时配置可以删掉，以最新 levilamina-mod-template 的 `xmake.lua` 为准）。
2. 执行 `xmake repo -u` 更新包仓库。
3. 仍找不到时，清理缓存：删除项目目录下的 `.xmake` 文件夹（或 `xmake c -a`），再执行 `xmake repo -u`，然后重新 `xmake f -m debug`（或 release）并构建。
4. 如果 `xmake.lua` 中写死了 `add_requires("levilamina x.x.x")` 的版本，确认该版本存在于 xmake-repo 中，可改为最新版本、去掉版本号使用最新，或使用 `add_requires("levilamina develop")`（使用 develop 时需自行添加 bdslibrary）。

## 编译 levilamina-mod-template 时 xmake 安装 levilamina 依赖包（installing levilamina）卡几个小时，或报错 `error: unable to parse semver`，怎么解决？

levilamina 包在安装时会从源码在本地编译，并需从 GitHub 拉取 xmake-repo 和各依赖，本身就比较慢；长时间卡住或报 `unable to parse semver` 通常是网络问题：xmake-repo 没能拉取下来，导致找不到指定版本。解决：

1. 使用代理的 TUN（虚拟网卡）模式，或在 PowerShell 中为 xmake 设置代理环境变量（如 `$env:all_proxy="http://127.0.0.1:端口"`），或用 `xmake g --proxy="http://127.0.0.1:端口"` 为 xmake 全局设置代理。
2. 删除当前项目目录下的 `.xmake` 后重试。
3. 按标准流程：克隆模板后执行 `xmake repo -u`、`xmake f -m debug`（或 `xmake f -y -p windows -a x64 -m release`）、`xmake`。
4. 版本号处也可以写 commit hash 或 branch；必要时可手动下载卡住的包。

注意当前模板使用 clang-cl 工具链，需要先安装 LLVM（CI 使用 LLVM 22）。

## 用 VSCode 开发 LeviLamina C++ mod（levilamina-mod-template）时，xmake 能编译通过，但编辑器里头文件找不到、满屏红线、LL/BDS 的类和函数没有补全，怎么解决？

头文件不需要手动下载或拷到 `src` 下，也不要手动往 `includePath` 里填路径：LeviLamina 及其依赖由 xmake 包管理下载。编辑器缺的是编译数据库 `compile_commands.json`。

1. 用 VSCode 打开包含 `xmake.lua` 的项目根目录，先执行一次 `xmake f -y -p windows -a x64 -m release` 和 `xmake`，让依赖下载完成。
2. 生成编译数据库：在项目根目录执行 `xmake project -k compile_commands`（生成到根目录）；或安装 VSCode 的 XMake 扩展，Ctrl+Shift+P 执行“XMake: Update Intellisense”。注意 XMake 扩展默认把 `compile_commands.json` 生成到 `.vscode` 目录，而 clangd 默认只在项目根目录（及其父目录）找，所以要么改 XMake 扩展的输出目录，要么给 clangd 加参数 `--compile-commands-dir=.vscode`，要么直接用命令行生成到根目录。
3. 推荐用 clangd（需安装 LLVM，模板自带 `.clangd` 配置）；生成后重启 clangd / Reload Window 并等待索引完成。clangd 与微软 C/C++（cpptools）的 IntelliSense 冲突，用 clangd 时应关闭 cpptools 的 IntelliSense。若坚持用 cpptools，则把 `C_Cpp.default.compileCommands` 指向生成的 `compile_commands.json`。
4. 头文件或依赖版本更新后需重新生成 `compile_commands.json`；配置混乱时可删掉 `.vscode` 下的生成配置重来。只要 xmake 能编译通过，编辑器的误报不影响构建。

其他 IDE：Visual Studio 用 `xmake project -k vsxmake` 生成 sln；CLion 可直接导入根目录的 `compile_commands.json`，标准库标红时把工具链改为 Visual Studio。构建本身需要 Visual Studio（“使用 C++ 的桌面开发”工作负载，提供 Windows SDK）+ LLVM（模板用 clang-cl 编译），MinGW 不能用。

## 用 Visual Studio 开发 LeviLamina C++ mod，直接“打开文件夹”后没有补全、`#include` 报错或“转到定义”找不到头文件，生成的工程里也看不到头文件，怎么办？

不要用 VS 的“打开文件夹”方式打开 xmake 项目。头文件由 xmake 包管理下载，所以先在项目目录执行一次 `xmake f -y -p windows -a x64 -m release` 和 `xmake` 下载依赖并编译，再用 xmake 生成 VS 工程：

```powershell
xmake project -k vsxmake -m "debug,release"
```

然后打开生成的 `vsxmake` 目录里的 `.sln`，即可正常索引和补全。

注意：

- vsxmake 只把 `add_headerfiles` 声明的头文件放进工程，不会扫描 `add_includedirs`。当前模板的 `xmake.lua` 已有 `add_headerfiles("src/**.h")`；如果你用 `.hpp` 或其他目录，需要自己补上，例如 `add_headerfiles("src/**.h", "src/**.hpp")`。
- 在 vsxmake 生成的 sln 里新建文件时，文件可能被放到生成目录而不是 `src` 下，需要手动移到 `src` 并重新生成工程。
- 也可以用 xmake 生成 CMake 工程（`xmake project -k cmakelists`）后用 VS 的 CMake 支持打开，或使用 VS 的 xmake 扩展；VSCode 则按 compile_commands 方式配置。

## 开发 LeviLamina C++ mod 时怎么断点调试？为什么用 VS/VSCode 直接“启动”`bedrock_server_mod.exe` 调试不行？

用“先启动服务器、再附加调试器”的方式，不要用调试器直接启动 BDS（自 LeviLamina 1.2.0 起，PreLoader 的运行时保护会让在加载 Runtime Data 前就挂着调试器的启动失败，报“`Failed to load Runtime Data ... please attach it after Runtime Data is loaded`”）。

- Visual Studio：正常运行 `bedrock_server_mod.exe`，然后“调试 → 附加到进程”，选择 `bedrock_server_mod.exe`。
- VSCode：在 `.vscode/launch.json` 中使用 `"type": "cppvsdbg", "request": "attach"` 的配置后选择进程附加。当前 levilamina-mod-template 已自带 `.vscode/launch.json`，提供“BDS attach”/“GDK attach”配置：安装 VSCode 扩展 Tasks Shell Input，设置环境变量 `MC_BDS_DEBUG_PATH`（BDS 可执行文件完整路径，客户端用 `MC_GDK_DEBUG_PATH`），可选 `MC_SYMBOLS_PATH`（符号目录），即可一键启动并自动附加。
- 需要调试启动早期（如 `load()`/`enable()`）时：先在命令行 `set PL_DEBUG=1`，再运行 `bedrock_server_mod.exe`，PreLoader 会在 Runtime Data 加载后暂停等待调试器附加，附加后继续运行。
- 能否看到源码取决于 mod dll 对应的 pdb：模板 `xmake.lua` 中 `set_symbols("debug")` 会生成 pdb，有 pdb 才能看源码、下断点，否则只能看反汇编。更底层可用 x64dbg/WinDbg。
- LSE 的 JS 等脚本插件不能用这种方式调试。
- LeviLamina 在初始化 CrashLogger 时若检测到已有调试器（例如用 `PL_DEBUG=1` 在早期就附加），会提示“`Debugger detected, CrashLogger will not be enabled`”并不启用 CrashLogger；服务器启动后再附加时 CrashLogger 已启用，但调试器仍会先捕获异常。

*适用版本：LeviLamina 1.2.0 及以上*

## BDS 已从 MSVC 换成 clang 编译，LeviLamina 的 C++ mod 也必须跟着换编译器吗？还能用 MSVC 编译吗？

必须换。新版 BDS 改用 clang 编译，LeviLamina 被迫跟随改用 clang-cl。MSVC 和 clang 很多特性不同，同一份代码在两种编译器下 ABI 可能完全不同，继续用 MSVC 编译 mod 会出现事件监听异常、功能失效，甚至开服直接崩溃。请使用最新 levilamina-mod-template 的配置：`xmake.lua` 中 `set_toolchains("clang-cl")`（并保留模板里针对 clang_cl 的 cxflags），本地需安装 LLVM（模板 CI 使用 LLVM 22）。

*适用版本：LeviLamina 26.20.0 及以上*

## LeviLamina 及其 C++ mod 能用 CMake 构建吗（像 Endstone 插件那样）？

官方只支持 xmake（`levilamina-mod-template`）。如果确实要用 CMake，可以用 xmake 生成 CMake 工程：`xmake project -k cmakelists`，但生成的依赖库路径都指向 xrepo 目录；此外 mod 链接前需要 `levibuildscript` 的 linkrule 做 prelink（用 `prelink.exe` 和 `bedrock_runtime_data` 处理目标文件，并添加 `/DELAYLOAD:bedrock_runtime.dll`），在 CMake 中必须自己补上这一步才能正常链接。想彻底脱离 xmake 就需要自己编写 `CMakeLists.txt` 并补全所有依赖。

## 没有 Windows 环境（macOS、WSL/Linux、GitHub Codespaces）能编译 LeviLamina C++ mod 吗？

官方只支持在 Windows 上编译 mod：模板使用 `clang-cl` 工具链（需要 Windows SDK 与 MSVC STL 头文件/库），macOS/Linux 下没有官方支持，BDS 也不能在 mac 上运行。没有 Windows 环境时，推荐把源码推到 GitHub 仓库，用 GitHub Actions 的 `windows-latest` runner 构建（mod 模板自带 `.github/workflows/build.yml`），在 Actions 运行页的 Artifacts 下载产物（需登录 GitHub 才能下载）。若坚持在 Linux 下折腾，可尝试 msvc-wine（<https://github.com/mstorsjo/msvc-wine>）提供 Windows SDK/MSVC 环境，但无官方保证。

## 用 `levilamina-mod-template` 构建时 `manifest.json` 中版本号总是 `0.0.0`，或提示 `Failed to parse version tag, using 0.0.0`，版本号在哪里设置？

版本号不是取自 `tooth.json`，而是构建时由 `levibuildscript` 的 modpacker 通过 `git describe --tags --abbrev=0` 读取 git tag，并按 `vX.Y.Z` 格式解析；没有 tag 或格式不对就使用 `0.0.0`。因此：

1. 要用 `git clone` 获取仓库（直接下载 zip 不含 `.git`）；
2. 打一个带 `v` 前缀的标签，如 `git tag v0.1.0`，再构建。

也可以在 `xmake.lua` 中手动指定：`add_rules("@levibuildscript/modpacker", {modVersion = "1.0.0"})`。

*适用版本：使用 levibuildscript modpacker 的 mod 模板（当前版本）*

## mod 模板里的 `MemoryOperators.cpp` 有什么用？可以删掉吗？删掉后 mod 加载报错怎么办？

该文件内容为 `#define LL_MEMORY_OPERATORS` + `#include "ll/api/memory/MemoryOperators.h"`，让 mod 使用 LeviLamina 统一的全局 `operator new/delete`（BDS 自定义了内存分配，LL 使用 mimalloc，所有 mod 必须统一）。当前版本 LeviLamina 会检查 mod 是否导出 `ll_memory_operator_overrided`，否则直接拒绝加载并报 `<mod> will not be loaded because it isn't using the unified memory allocation operator`。所以不要删除它；删了就恢复该文件。如果想换个位置，也可以在 mod 的某一个（且只能一个）源文件中写上述两行来代替。若编译时出现 MemoryOperators 相关报错，先执行 `xmake repo -u` 更新 xmake-repo 后重新构建。

*适用版本：LeviLamina 1.0 及以上*

## mod 本地能编译，但在 GitHub Actions（或新克隆的仓库）上编译失败（头文件相关错误），怎么办？

LeviLamina 已改用 `clang-cl`，Actions 的 windows runner 自带的 LLVM 版本可能太旧，需要在 workflow 里安装新版 LLVM（与最新模板一致）：

```yaml
- name: Setup LLVM
  uses: ZhongRuoyu/setup-llvm@v0
  with:
    llvm-version: 22
```

并在构建前执行 `xmake repo -u` 更新 xmake-repo。最好直接对照最新 `levilamina-mod-template` 的 `.github/workflows/build.yml` 同步。如果是 LeviLamina 新版本依赖尚未就绪导致的失败，可在 `xmake.lua` 中固定版本，如 `add_requires("levilamina x.x.x")`。

*适用版本：LeviLamina 26.20.0 及以上*

## C++ mod 依赖的第三方 DLL（如放在 mod 目录下的库，或 `jvm.dll` 等不在 PATH 中的外部 DLL）找不到，mod 加载失败（连 `onLoad` 都没执行），怎么办？

mod DLL 被加载时系统会解析其导入表并加载依赖 DLL，找不到就加载失败（错误码 126/127，LeviLamina 会附带依赖诊断信息）。Windows 没有 rpath：LeviLamina 在加载 native mod 前会把该 mod 的目录追加到 `PATH`，所以放在 mod 目录（或 BDS 根目录）下的依赖 DLL 能被找到。对于位置不固定的外部 DLL（如 `jvm.dll`），要么把其目录加入系统 `PATH`，要么不要静态链接导入，改为运行时用 `LoadLibrary`/`GetProcAddress`（或 LeviLamina 的 `ll::sys_utils::DynamicLibrary` 封装）动态加载，这样可以按“配置文件 → 环境变量 → 注册表”的顺序查找 `JAVA_HOME`；也可使用链接器的 `/DELAYLOAD` 选项延迟加载（`levibuildscript` 的 linkrule 本身就用它延迟加载 `bedrock_runtime.dll`）。

## LeviLamina C++ mod（xmake 模板）如何引入第三方库（如 soci）？soci 运行时报 backend 找不到怎么办？

如果库在 xmake 官方仓库（xmake-repo）中，直接在 `xmake.lua` 里 `add_requires` 并在 target 中 `add_packages` 即可，soci 就有，可通过包配置开启后端，如 `add_requires("soci", {configs = {mysql = true}})`（其他后端同理）。官方仓库没有的，可用 xmake 引入 vcpkg 包，如 `add_requires("vcpkg::soci")`（参考 xmake 文档“添加 vcpkg 的依赖包”），否则只能自行编译出 dll/静态库再链接。soci 运行时会用 `LoadLibrary` 动态加载各 backend DLL，所以 backend DLL 需放在能被搜索到的位置（当前工作目录、`PATH`，或 mod 目录——LeviLamina 会把 mod 目录加入 `PATH`），或通过 backend 搜索路径指定，否则报 backend 找不到。另外 xmake-repo 的 soci 默认构建为静态库（`shared=false`），此时 backend 是静态链接进来的，不会去找 DLL，需要在使用前显式注册，如调用 `soci::register_factory_mysql()`，或直接以 `soci::mysql` 工厂对象创建 session。注意当前 mod 用 `clang-cl` 编译，第三方 C++ 库最好也由 xmake 用同一工具链构建。

## LeviLamina（LL3）的 mod 模板能用来写 LiteLoaderBDS（LL2）的插件吗？LL2 的 C++ 插件模板在哪？

不能。`levilamina-mod-template` 只适用于 LeviLamina。LL2 的 C++ 插件模板是 <https://github.com/LiteLDev/liteloaderbds-plugin-template>，该仓库与 LiteLoaderBDS 本体均已归档，不再维护，建议迁移到 LeviLamina。

*适用版本：当前版本（LiteLoaderBDS 已归档）*

## 用 `levilamina-mod-template` 创建 C++ mod 项目后没有 `include`（头文件）文件夹，LeviLamina 的头文件在哪里？

不是缺文件，模板本身就没有单独的 `include` 目录（旧教程截图较老）。直接使用 <https://github.com/LiteLDev/levilamina-mod-template>，先执行一次 `xmake`（构建）或 `xmake f` 配置，xmake 会通过 levimc-repo 自动拉取 LeviLamina 等依赖。头文件位于 xmake 的包缓存目录中，Windows 下为 `C:/Users/<用户名>/AppData/Local/.xmake/packages/l/levilamina/<版本>/<哈希>/include`。

## BDS 不再提供 PDB 之后，LeviLamina 的 mod 怎么链接符号、还能不能 hook？

由 bedrock runtime data（“magic blob”，xmake 包 `bedrockdata`）取代 PDB。blob 不含明文符号，而是“符号 hash -> RVA”的映射。构建 mod 时在链接前调用 prelink 工具，把用到的外部符号 hash 后去 blob 中查找并生成用于链接的 fake lib；运行时也以同样方式解析。`bedrockdata` 和对应版本的 prelink 由 xmake 依赖自动下载，无需手动处理。hook 写法不变，可参考 LeviLamina 仓库 `src-test/client/jsonUITest.cpp`。PeEditor 目前只负责向 `bedrock_server.exe` 注入 PreLoader 生成 `bedrock_server_mod.exe`，不再涉及 PDB。

*适用版本：BDS 1.21.20+ / LeviLamina 0.13+ 至当前*

## C++ mod 订阅 `ServerCommandRegisterEvent` 后，事件监听器没有任何输出，怎么回事？

多半是编译器不对。新版 BDS/LeviLamina 使用 `clang-cl` 编译，mod 也必须用 `clang-cl` 编译（更新到最新的 `levilamina-mod-template`，其 `xmake.lua` 中已有 `set_toolchains("clang-cl")`，并安装 LLVM）。用 MSVC 编译的 mod 虽然能编译、能加载，但类型名称与 BDS/LL 不一致，事件监听会失效。

*适用版本：LeviLamina 26.x（BDS 改用 clang-cl 编译之后）*

## C++ mod 中引用 RemoteCall 头文件时 clangd 全红、`compile_commands.json` 里没有对应包的信息，怎么办？写给其他 C++ mod 用的前置应该用 RemoteCall 吗？

先确认 `xmake.lua` 中 `add_requires` 并在 target 中 `add_packages` 了对应包（RemoteCall 现在的 xmake 包名为 `legacyremotecall`）；然后在 VS Code 中 Ctrl+Shift+P 执行 xmake 插件的 `UpdateIntellisense`（或 `xmake project -k compile_commands`）重新生成 `compile_commands.json`，再 restart clangd。另外，给其他 C++ mod 用的前置不建议用 RemoteCall，直接用 `__declspec(dllexport)` 导出函数即可（参见官方文档接口导出指南）。

## GitHub Actions 上构建 mod 失败，日志里有与 cmake 相关的警告，如何排查？

看日志中更靠上的 error 而不是 warning。曾有案例是 runner 环境缺少 Python（某些依赖包用 cmake 构建时需要），在 workflow 中加入 `actions/setup-python` 后解决。建议以最新 `levilamina-mod-template` 的 workflow 为基础（需包含 `setup-xmake`、`setup-llvm`、`xmake repo -u` 等步骤）。

*适用版本：使用 GitHub Actions 构建 mod 时。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina mod 如何适配新的游戏版本（如 26.20）并做版本控制？构建时会自动下载对应 SDK 吗？

目标 LeviLamina/游戏版本在 `xmake.lua` 中通过 `add_requires("levilamina x.x.x", ...)` 指定（不写版本则用最新），构建时 xmake 会拉取对应版本的 LeviLamina 包。发布用的包元数据现在写在 `lip.toml` 中（旧版模板为 `tooth.json`），需在其 `deps` 中填写对应的 LeviLamina 版本范围，如服务端变体 `"github.com/LiteLDev/LeviLamina" = "26.60.*"`（模板 `lip.toml` 中客户端变体用 `">26.60.6 <26.61.0"`，因为 26.60.6 是最后一个 `tooth.json` 版本）。另外 `xmake.lua` 中不必再 `add_requires` nlohmann_json，LeviLamina 包已将其作为公开依赖传递。

*适用版本：当前 levilamina-mod-template（lip.toml 格式）*

## LeviLamina mod 开发文档里生成 VS Code 配置的 xmake 命令应该在哪里执行？

在任意终端执行都可以，只要当前目录是项目根目录（含 `xmake.lua`）。这是 xmake 自带的功能（如 `xmake project -k compile_commands` 生成 `compile_commands.json`），详细说明见 xmake 文档；VS Code 的 xmake 插件也能自动生成/更新这些配置。

*未能从源码或文档中直接证实，仅供参考。*

## LeviLamina mod 使用事件（如 `ServerStartedEvent`）时链接报找不到符号，怎么解决？

可能是 xmake 缓存了旧版 LeviLamina 包导致头文件与库不匹配。执行 `xmake repo -u`，删除 `%LocalAppData%\.xmake` 以及项目目录下的 `.xmake`、`build` 文件夹，再重新 `xmake f` 和 `xmake` 构建。同时确认使用 `clang-cl` 工具链编译。

*未能从源码或文档中直接证实，仅供参考。*

## LeviLamina mod 用 xmake 编译一直失败，怎么排查？

1. 确保工具链最新：Visual Studio/MSVC 生成工具（提供 Windows SDK 与 STL）及 LLVM（mod 用 `clang-cl` 编译）；
2. 执行 `xmake repo -u`；
3. 删除 `%LocalAppData%\.xmake`，再删除项目目录中的 `.xmake`、`build` 等缓存；
4. 重新执行 `xmake f -y -p windows -a x64 -m release` 并留意 configure 阶段的报错，然后 `xmake` 构建。

## LeviLamina 每次 MC 版本更新附带的 MC 头文件（`src/mc` 下的 header）是人工编写的还是自动生成的？

现在是工具自动生成的（只有很早期的版本是人工写的），因此 MC 头文件基本没有注释，头文件中能看到 `// auto generated inclusion list`、`// auto generated forward declare list` 之类的标记。

## LeviLamina 能否像 Java 的 library 前置 mod 那样，让一个 mod 作为依赖库给其他 mod 调用？会不会产生多份数据副本？

可以。在前置 mod 中用 `__declspec(dllexport)` 导出函数/类（参考 LeviLamina 的 LLAPI 宏，例如下面的写法，并在前置 mod 的 `xmake.lua` 中 `add_defines("MOD_EXPORT")`）：

```cpp
#ifdef MOD_EXPORT
#define MODAPI __declspec(dllexport)
#else
#define MODAPI __declspec(dllimport)
#endif
```

使用方 `dllimport` 并链接其导入库，同时在使用方 mod 的 `manifest.json` 中填写依赖，例如 `"dependencies": [{ "name": "RequiredMod", "version": "^1.2.3" }]`（也有 `optionalDependencies`、`loadBefore`）。LeviLamina 会按依赖关系排序，先加载依赖，使用方无需自己加载前置 dll。Windows 对 dll 有引用计数，同一个 dll 只加载一次，其全局变量也只有一份，不会产生多个副本。

*适用版本：LeviLamina 当前版本（Windows native mod）*

## VSCode clangd 中某些被宏包裹的代码区域（`#if`/`#ifdef` 块）变灰没有补全，怎么让它显示补全？

需要让该宏在编译参数中生效：在 `xmake.lua` 中用 `add_defines` 添加该宏，然后在 VSCode 中 Ctrl+Shift+P 执行 `XMake: UpdateIntellisense` 重新生成 `compile_commands.json`，再执行 `clangd: Restart language server`。直接在 `.clangd` 里加 `-D` 参数效果不稳定。未启用的宏分支 clangd 不会提供补全。

*适用版本：使用 xmake + VSCode clangd 开发 mod 的环境。未能从源码或文档中直接证实，仅供参考。*

## Windows 用户名为中文时，xmake 编译 LL mod / 安装依赖包出现乱码路径失败，怎么办？

非 ASCII 路径会导致 xmake 全局缓存/包目录路径出错。可以改用英文用户名的新账户，或把 xmake 全局目录改到纯英文路径：设置环境变量 `XMAKE_GLOBALDIR` 指向一个英文目录后重新构建。

*适用版本：Windows 下使用 xmake 构建 mod，且用户目录含非 ASCII 字符。未能从源码或文档中直接证实，仅供参考。*

## xmake 包描述（如给 xmake-repo 提交包或写自定义包）里 `add_versions` 的哈希值是什么，怎么得到？

如果包用的是源码压缩包下载地址（`set_urls`/`add_urls` 指向 zip/tar.gz），哈希值是该版本压缩包的 SHA-256，用于校验下载内容；如果包用的是 git 仓库地址（如 `https://github.com/xxx/yyy.git`），则填对应版本的 git commit hash。

*适用版本：当前 xmake / LiteLDev xmake-repo*

## xmake 构建 LeviLamina mod 每次要编译十几到二十分钟，且会把 LeviLamina 重新编译，是什么原因？

`levilamina` xmake 包是从源码编译安装的。通常是前置依赖（如 gmlib、bsci 等）要求的 LeviLamina 版本（或 `target_type` 等配置）与 mod 本身 `add_requires` 的不一致，导致 xmake 需要编译两份不同版本的 LeviLamina。让所有依赖统一使用同一个 LeviLamina 版本/配置即可避免重复编译。

*适用版本：使用 xmake 构建依赖 levilamina 包的 mod*

## xmake 构建 mod 出现 prelink/bedrockdata 相关的缓存异常，删除项目文件也不好，如何清理？

删除 xmake 全局目录（Windows 默认 `C:\Users\<用户名>\AppData\Local\.xmake`，即 `%LOCALAPPDATA%\.xmake`，不是项目目录）的 `packages` 下的 `prelink`、`bedrockdata`、`levilamina` 包，然后重新 `xmake f` 配置并构建；也可执行 `xmake c -a`，或删除 mod 项目目录下的 `.xmake` 和 `build` 目录。实在不行重装 xmake。

*适用版本：LeviLamina 当前版本（Windows，xmake 构建）*

## xmake 编译 LeviLamina mod 时报错找不到头文件 `#include "pl/Config.h"`（或 LL SDK 头文件内容异常），清缓存也没用，怎么解决？

这通常是网络问题导致 xmake 下载的 LeviLamina/preloader 等依赖包不完整（例如以前下载中断过，之后直接使用了残缺的包）。`pl/Config.h` 来自 preloader 包。解决：删除 `C:\Users\<用户名>\AppData\Local\.xmake` 下的包缓存（或整个目录）后重新下载；或从能正常编译的电脑复制 xmake 的 `packages` 文件夹。网络不好时可给 xmake 配置 GitHub 镜像，例如新建 `github_mirror.lua`：

```lua
function mirror(url)
    url = url:gsub("github.com", "<镜像域名>")
    return url
end

function main(url, host)
    return true
end
```

然后执行 `xmake g --proxy_pac=<该文件绝对路径>`（该文件之后不能删除）。

*适用版本：使用 xmake 构建 mod、网络访问 GitHub 不稳定的环境。未能从源码或文档中直接证实，仅供参考。*

## 为什么在 xmake 项目里添加 LeviLamina 依赖（`add_requires("levilamina")`）时会连带拉取 PreLoader？

这是正常的。xmake 的 `levilamina` 包在安装时会从源码构建 LeviLamina，而 LeviLamina 自身的 `xmake.lua` 里 `add_requires("preloader ...")`（LeviLamina 由 PreLoader 负责加载，运行时也依赖 PreLoader），所以安装 `levilamina` 包时会一并拉取 `preloader` 包。

## 用新版 LeviLamina（如 26.51.x 及以后）编译 mod 时报错 `ll/api/reflection/Reflection.h: error: no member named 'to_underlying' in namespace 'std'`，怎么办？

需要开启 MSVC STL 的 C++23 库特性：在 mod 的 `xmake.lua` 的 target 中加入 `_HAS_CXX23` 宏，按最新 `levilamina-mod-template` 的写法：

```lua
add_defines("NOMINMAX", "UNICODE", "_HAS_CXX23=1")
```

模板仍是 `set_languages("c++20")` + `set_toolchains("clang-cl")`，靠 `_HAS_CXX23=1` 打开 `std::to_underlying` 等 C++23 库函数。

*适用版本：LeviLamina 26.51 及以上，使用 levilamina-mod-template 结构的 mod*

## 使用 `levilamina-mod-template` 时，模板里的 `MyMod`（类名）和 `my_mod`（命名空间）应该怎么改？

命名空间 `my_mod` 改成自己 mod 的名字；类名 `MyMod` 可以随意改（例如改为 `Entry` 或你的 mod 名）。注意要同步修改：`src/mod/MyMod.h` 与 `MyMod.cpp` 中的类名和命名空间、`MyMod.cpp` 末尾的 `LL_REGISTER_MOD(my_mod::MyMod, my_mod::MyMod::getInstance());`，否则会编译报错。另外 `xmake.lua` 中 `target("my-mod")` 也要改成你的 mod 名（`manifest.json` 中的 `name` 由构建脚本按 target 名自动填充）。

*适用版本：当前 levilamina-mod-template*

## 用 xmake 构建 `levilamina-mod-template`（native mod）时报错，或提示无法获取 cxx 程序（找不到 C++ 编译器），怎么办？

通常是编译环境没装全。当前模板在 Windows 上使用 `clang-cl` 工具链，需要：

1. 安装 Visual Studio 2022 及以上，勾选“使用 C++ 的桌面开发”工作负载（含 MSVC 与最新 Windows SDK，`clang-cl` 依赖其标准库与 SDK）；
2. 安装 LLVM（官方 CI 当前使用 LLVM 22），并确保 `clang-cl` 在 `PATH` 中；
3. 安装/更新 xmake 到 3.0.0 以上。

装好后用 `xmake c -a` 清理缓存，再 `xmake f -c -y -p windows -a x64 -m release` 重新配置并构建。

*适用版本：当前 levilamina-mod-template / LeviLamina 26.x*

## 使用最新 LeviLamina 版本时，mod 项目的 CI 构建一直失败，应该用什么工具链？

新版 LeviLamina 需要用 `clang-cl`（LLVM）编译。按最新 `levilamina-mod-template` 更新 CI：在 workflow 中加入

```yaml
- name: Setup LLVM
  uses: ZhongRuoyu/setup-llvm@v0
  with:
    llvm-version: 22
```

然后依次执行 `xmake repo -u`、`xmake f -a x64 -m release -p windows -v --target_type=${{ matrix.target_type }} -y`、`xmake -v -y`。`xmake.lua` 也要同步模板（`set_toolchains("clang-cl")`、`_HAS_CXX23=1` 等）。

*适用版本：LeviLamina 26.x（2026-08 起官方 CI 改用 LLVM）*

## 依赖都填了最新版本，但编译 mod 时 LeviLamina 头文件报错（提示平台宏 `LL_PLAT_S` / `LL_PLAT_C` 相关问题），怎么解决？

原因是没有定义平台宏。现在 levimc-repo 的 `levilamina` xmake 包会根据 `target_type` 自动给 mod 加上 `LL_PLAT_S`（server）或 `LL_PLAT_C`（client），模板里不再需要手写。解决方法：

1. `xmake repo -u` 更新包仓库到最新；
2. 按最新模板写 `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})` 并声明 `option("target_type")`；
3. 若使用的旧版包仓库不会自动添加，可在 target 中手动加入：

```lua
if is_config("target_type", "server") then
    add_defines("LL_PLAT_S")
else
    add_defines("LL_PLAT_C")
end
```

*适用版本：LeviLamina 26.x 及以上*

## 写 LeviLamina C++ mod 时，`overloaded` + `std::visit` 等写法 IDE（clangd）报错，如何让 clangd 使用正确的 C++ 标准和 include 路径？

报错是 clangd 没拿到项目的编译参数（语言标准、include 路径、宏）导致的。在项目目录执行：

```shell
xmake project -k compile_commands
```

生成 `compile_commands.json`，clangd 会自动读取其中的编译参数（模板为 `set_languages("c++20")` 并定义 `_HAS_CXX23=1`）。修改 `xmake.lua` 或依赖后需重新生成。

## 升级 LeviLamina 版本或更新 Visual Studio 后，用 xmake 编译 mod 出现莫名其妙的编译错误，该怎么处理？

先执行 `xmake c -a` 清理全部构建缓存后重新编译；不行的话删除项目下的 `.xmake` 和 `build` 文件夹，再 `xmake f -c -y` 重新配置并编译。同时用 `xmake repo -u` 更新包仓库，并确认 `xmake.lua` / CI 与最新 `levilamina-mod-template` 一致（`clang-cl` 工具链、LLVM 22、`_HAS_CXX23=1`）。此前出现过 VS2026/2022 都编译不了的情况，属于微软编译器侧问题，后来已修复，更新 VS 即可。

## 升级 LeviLamina（如 1.9.2 及以后）后自己的 mod 本地和 GitHub Actions 构建都出错，怎么解决？

更新 mod 的 `xmake.lua`，参照 `levilamina-mod-template` 最新模板：加入 `target_type` 选项（`option("target_type")` 默认 `server`，可选 `server`/`client`），并用 `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})` 引入依赖；target 末尾按 `is_config("target_type", "server")` 区分服务端/客户端源码。GitHub Actions 同步模板的 `build.yml`（matrix 构建 server 和 client，`xmake f ... --target_type=${{ matrix.target_type }}`）。

*适用版本：LeviLamina 1.9.x 及以后（含 26.x）*

## 升级到新版 LeviLamina（26.20 起）后编译 mod 时 clang 崩溃，怎么办？

把 mod 的 `xmake.lua` 和 GitHub Actions workflow 同步为 `levilamina-mod-template` 最新版本（模板使用 `set_toolchains("clang-cl")` 及配套 `cxflags`，CI 用 `ZhongRuoyu/setup-llvm` 安装 LLVM 22），本地也使用对应版本的 LLVM，清理 xmake 缓存（`xmake f -c`）后重新构建。

*适用版本：LeviLamina 26.20 及以后*

## 同一份 mod 代码，依赖 LeviLamina 26.40.1 能编译通过，换到 26.40.4/26.40.5 后报 LL 头文件里的编译错误（代码本身没引用这些头文件），怎么办？

从 LeviLamina 26.20 开始必须使用 `clang-cl` 编译，不能再用 MSVC（`cl.exe`）。`xmake.lua` 参照 `levilamina-mod-template` 设置 `set_toolchains("clang-cl")`；GitHub Actions 参考模板安装 LLVM 22。切换工具链/版本后清理 xmake 缓存：删除 `.xmake` 目录，或执行 `xmake clean -a` 和 `xmake f -c` 后重新配置。

*适用版本：LeviLamina 26.20 及以后*

## 在 LeviLamina mod 的 xmake 工程中使用 vcpkg 提供的库时出现链接错误（缺少依赖库的符号），怎么解决？

xmake 引入 vcpkg 包时可能未正确处理其传递依赖，需要手动补齐。推荐直接改用 xmake 自身的包（`add_requires` 安装所需库及其依赖，如 `zlib`、`libuv`，再 `add_packages`）；也可以在 target 里手动 `add_links` 缺失的依赖库。

*适用版本：使用 xmake 构建的 LeviLamina mod。未能从源码或文档中直接证实，仅供参考。*

## 如何编译并启用 LeviLamina 自带的测试（如 EventTest）？

构建 LeviLamina 时启用 tests 选项：`xmake f --tests=y`（可加 `--target_type=server/client`），然后 `xmake`。会引入 gtest 并编译 `src-test` 目录（服务端事件测试在 `src-test/server/EventTest.cpp`）。xmake 配置是粘性的，切换配置后行为异常可删除项目下 `.xmake` 目录或 `xmake f -c` 重新配置。

*适用版本：LeviLamina 26.x 当前版本*

## 如何自己编译 LeviLamina 本体？

准备 XMake 3.0.0+、LLVM/Clang（`clang-cl` 需在 PATH 中）、Visual Studio 2022 或其生成工具（C++ 桌面开发工作负载，提供 `clang-cl` 依赖的 Windows SDK 与标准库）和 Git。在仓库根目录执行 `xmake` 即构建服务端（默认）；用 `xmake f --target_type=client` 后再 `xmake` 构建客户端，可加 `--tests=y` 启用测试。服务端也可用 `-p linux`（clang 工具链）面向 Linux x86_64 构建，客户端只能在 Windows 构建。缓存异常时执行 `xmake c -a` 和 `xmake f -c`。

*适用版本：LeviLamina 26.20 及以后*

## 开发 LeviLamina C++ mod 用什么 IDE 合适？用 VSCode 可以吗？

可以，常用 VS Code + xmake（配合 xmake 扩展、clangd 扩展）开发，官方 mod 模板自带 `.clangd` 和 `.vscode/launch.json` 调试配置。Visual Studio 体积大，直接用它写 LL mod 不太方便（如需可用 `xmake project -k vsxmake` 生成工程）。无论用什么编辑器都必须安装工具链：当前模板与 LeviLamina 在 Windows 上使用 `clang-cl` 工具链（`set_toolchains("clang-cl")`），需要安装 LLVM（`clang-cl` 在 PATH 中），同时安装 Visual Studio 2022（"使用 C++ 的桌面开发"）或 VS 2022 生成工具以提供 MSVC 标准库和 Windows SDK。

*适用版本：当前版本（LeviLamina 26.x，官方 levilamina-mod-template）*

## 开发 LeviLamina C++ mod 时编译报错（成员函数声明与定义不匹配、非静态成员函数调用错误），如何解决？

两个常见原因：

1. 头文件声明与 `.cpp` 定义的 `const` 修饰不一致——要么头文件和源文件都加 `const`，要么都不加；
2. 非静态成员函数不能直接用类名调用，需先获取实例，例如模板中的 `MyMod::getInstance().getSelf()`（在类自身的成员函数内部可直接调用 `getSelf()`，无需 `getInstance()`）。

这是通用的 C++ 规则，示例基于官方 mod 模板。

## 开发 LeviLamina mod 时用 `/Wall` 编译会出现大量警告，应该开 `/Wall` 吗？

不建议开 `/Wall`。`/Wall` 会对结构体对齐填充等情况报警告（例如 struct 中 `void*` 后跟 `bool`，提示 7 字节填充未使用），噪音极大（当前使用的 `clang-cl` 下 `/Wall` 等同 `-Weverything`，噪音更大）。LeviLamina 自身使用 `/W4`（外加 `/w44265`、`/w44289`、`/w44296`、`/w45263`、`/w44738` 等个别升级），官方 mod 模板也默认 `/W4`，mod 用 `/W4` 即可。

## 开发 LeviLamina mod 时，有没有方便查看 `ll` 命名空间层级和可用函数/头文件的方法？

使用官方 `levilamina-mod-template`：它通过 xmake 的 `add_packages("levilamina")` 引入 LeviLamina 全部头文件，在 VS Code 中配合 clangd（模板自带 `.clangd`，xmake 扩展或 `xmake project -k compile_commands` 生成 `compile_commands.json`）后，输入 `ll::` 即可通过补全看到所有命名空间和函数，悬停可看到所在头文件。也可以直接浏览 LeviLamina 仓库 `src/ll/api` 目录或官方 API 文档（docs.levimc.org）。

*适用版本：当前版本（LeviLamina，官方 mod 模板）*

## 开发 LeviLamina mod 用的 xmake 能像 Visual Studio 一样一键构建吗？推荐用什么编辑器？

推荐使用 VS Code，安装 xmake 扩展和 clangd 扩展来开发和构建（xmake 扩展提供一键构建/调试）。命令行下在项目根目录执行 `xmake f -y -p windows -a x64 -m release` 后运行 `xmake` 即可构建，产物在 `bin/` 下。

*适用版本：当前版本（LeviLamina，官方 mod 模板）*

## 开发 LeviLamina 客户端 mod 时游戏一启动就闪退，来不及挂调试器，怎么调试？

可以在 mod 的 `DllMain`（或 mod 加载入口）里先延迟约 10 秒，或循环等待调试器附加（如 `while (!IsDebuggerPresent()) Sleep(100);`），这样就有时间把调试器挂到游戏进程上；也可以直接用调试器启动 Minecraft 进程。官方 mod 模板的 `.vscode/launch.json` 也提供了 "GDK attach"/"BDS attach" 配置（需安装 Tasks Shell Input 扩展并设置 `MC_GDK_DEBUG_PATH` / `MC_BDS_DEBUG_PATH`），可自动启动进程并附加调试器，但它在进程稳定约 3 秒后才附加，过早崩溃仍需配合上述等待方法。

*适用版本：当前版本（Windows）*

## 想做安卓原生 mod，在 Termux/arm64 Linux 上克隆 LeviLamina 后执行 `xmake f -p linux -a arm64` 报错 `` `arm64` is not a valid complation arch for this project, please use one of x86_64 ``，怎么办？

LeviLamina 只支持 x86_64：客户端仅 `windows|x64`，服务端为 `windows|x64` 和 `linux|x86_64`，不能用于编译安卓 mod。安卓端原生 mod 走另一套体系：由 Android 版 LeviLauncher 通过 Preloader SDK（`LiteLDev/preloader-android`，`pl::` API）加载，应参考教程“写你的第一个 Android 原生模组”（<https://levimc.org/zh-Hans/tutorials/develop/first-android-mod/>）及 LeviLamina 文档中 `developer_guides/android` 下的 API 页面，而不是 LeviLamina。

## 想用 Visual Studio 手动配置 `vcxproj` 开发 LeviLamina 插件，LL 导出的 lib 去哪找？

官方推荐使用 `levilamina-mod-template`（xmake）开发。LeviLamina 不再单独提供可直接链接的 SDK lib：xmake 的 `levilamina` 包会从源码用 `clang-cl` 编译 LeviLamina 及其全部依赖，手动写 `vcxproj` 需要自己编译一份 LeviLamina 并配置所有依赖库，非常麻烦。如果想用 Visual Studio，可以在模板项目中执行 `xmake project -k vsxmake` 生成 VS 工程，由 xmake 负责依赖与链接。

*适用版本：LeviLamina 26.x*

## 打包 LeviLamina mod 时，包描述文件里依赖的 LeviLamina 版本不改会怎样？是否默认为最新版？

不会自动取最新版，需要手动把依赖改成目标版本。当前模板已用 `lip.toml` 取代 `tooth.json`：在 `[variants."".deps]` 中设置 `"github.com/LiteLDev/LeviLamina"` 的版本范围（模板服务端为 `"26.60.*"`，客户端为 `">26.60.6 <26.61.0"`，客户端依赖使用裸 id 而非 `"#client"`），同时在 `xmake.lua` 中把 `add_requires("levilamina x.x.x")` 改为目标版本，否则依赖的 LL 版本不对。

*适用版本：lip.toml 格式（LeviLamina 26.60.6 之后的模板）；旧 tooth.json 同理*

## 构建客户端 mod 时 xmake 报错 `error: Invalid option: --target_type=client`，是什么原因？

`--target_type` 是项目 `xmake.lua` 里用 `option("target_type")` 声明的配置项（取值 `server`/`client`，默认 `server`），只有 `xmake.lua` 中声明了该选项才能传这个参数。报这个错说明你的 `xmake.lua` 是旧版或被改过、没有 `target_type` 选项。请用最新 `levilamina-mod-template` 中的 `xmake.lua`（其中 `option("target_type")` 并以 `add_requires("levilamina", {configs = {target_type = get_config("target_type")}})` 传给 `levilamina` 包），并确认 xmake 为最新版本（`xmake --version`），然后执行 `xmake f -a x64 -m release -p windows --target_type=client -y`，再 `xmake -v -y` 构建。

*适用版本：LeviLamina 26.x，当前 levilamina-mod-template*

## 本地用 xmake 构建 LeviLamina 本体失败（换了多个 LLVM 版本都不行），但 CI 正常，怎么排查？

1. 用 `xmake -v` 查看实际调用的是哪个 LLVM/`clang-cl`：如果装过 Visual Studio 的 LLVM（Clang）组件，xmake 可能优先用 VS 自带的 LLVM 而不是你单独安装的版本，需要卸载或避开。
2. 执行 `xmake repo -u` 更新包仓库后再 `xmake -v -y` 重新构建——依赖包（如 `parallel-hashmap`）版本描述的问题会在仓库侧修复，本地仓库不更新就会一直失败。

可参照 CI 的做法（安装 LLVM 22 后 `xmake repo -u`，再 `xmake f` / `xmake`）。

*适用版本：LeviLamina 26.x*

## 构建 mod 时安装 levilamina 包失败，日志中 glm 等依赖报 `error STL1000: Unexpected compiler version, expected Clang 20 or newer`（VS2026 / 新版 MSVC STL），怎么解决？

说明 xmake 检测到并使用了系统里另外安装的低于 20 版本的 LLVM Clang，与新版 MSVC STL 不兼容。卸载旧版 Clang 后，要么在 Visual Studio Installer 中勾选“适用于 Windows 的 C++ Clang 工具”（`clang-cl`）组件，要么单独安装新版 LLVM（官方模板 CI 使用 LLVM 22）；否则会报 `toolchain("clang-cl"): not found`。可用 `xmake -v` 确认实际使用的 clang 版本。详细失败日志位于 `%LOCALAPPDATA%\.xmake\cache\packages\...\levilamina\<版本>\installdir.failed\logs\install.txt`。

*适用版本：LeviLamina 26.x*

## 某个开源的 LeviLamina 原生 mod 作者已停更，如何自行更新到新版 LeviLamina？

自己 fork 该仓库，把 `xmake.lua` 换成 `levilamina-mod-template` 里最新的版本（并修改 mod 名、LeviLamina 版本，必要时同步 `lip.toml`/`manifest.json`），根据新头文件调整 include 路径和 API（Mojang 可能删除或改动了部分函数，需要改写），编译通过后给原仓库提 PR。

## 用 LeviLamina 开发 mod 时，还需要像 LL2 那样手动把 BDS 的 lib 文件放到项目目录吗？

不需要。依赖由 xmake 自动下载：`levilamina` 包及其依赖都在 LiteLDev 的 xmake-repo（模板中以 `levimc-repo` 添加）中，构建时自动拉取。当前版本 BDS/客户端的链接数据由 `bedrockdata` 包（`bedrock-runtime-data`，按 `target_type` 区分 server/client）提供，旧的 `bdslibrary` 包仅用于 1.21.3 以前的老版本。使用 `levilamina develop` 等未登记版本时，包会按 main 分支依赖加载（模板注释提示开发版可能需自行补充 BDS 库依赖）。

*适用版本：LeviLamina 0.x 及以上*

## 用 levilamina-mod-template 创建的项目在 Visual Studio 里输入代码时总被自动格式化成奇怪的样子，怎么关掉？

mod 模板根目录自带 `.clang-format` 配置文件，VS 会优先读取它来格式化代码。按自己的习惯修改或删除项目根目录下的 `.clang-format` 即可（或在 VS 中关闭键入时自动格式化）。

*适用版本：当前 levilamina-mod-template*

## 用 levilamina-mod-template 创建的项目，模板更新后如何同步到自己的项目？

没有自动同步，只能手动对照模板修改（主要是 `xmake.lua`，以及 `.github/workflows`、`lip.toml` 等）。通过 "Use this template" 创建的仓库与模板没有 git 历史关联，即使想 merge 也需要自己处理冲突。

## 用 levilamina-mod-template（xmake）开发 mod 时 CLion 无法代码补全，怎么办？

在项目根目录执行 `xmake project -k cmakelists` 生成 `CMakeLists.txt`，然后用 CLion 打开生成的 CMake 工程。（也可执行 `xmake project -k compile_commands` 生成 `compile_commands.json` 供 clangd/CLion 使用，模板已自带 `.clangd` 配置。）

## 用 levilamina-mod-template，把 `add_requires` 里的 LeviLamina 指定为旧版本（如 1.4.4）后，执行 `xmake project -k compile_commands -v -y` 报“无法打开包括文件”，编译失败（用最新版就正常），怎么办？

通常是下载 preloader 包时网络出问题，xmake 拉下来的包内容不完整/不对。删除对应版本的 preloader 包目录和 xmake 缓存后重新执行即可，例如：

1. 删除 `%LOCALAPPDATA%\.xmake\packages\p\preloader\<版本号>`（如 `v1.15.3`）；
2. 删除 `%LOCALAPPDATA%\.xmake\cache`；
3. 重新执行 `xmake project -k compile_commands -v -y`（或 `xmake -y`）。

*适用版本：使用 xmake + levimc-repo 构建 LeviLamina mod 的所有版本*

## 开发 LeviLamina C++ mod 时，控制台输出中文/UTF-8 乱码，怎么设置 UTF-8 编码输出？

推荐使用 mod 自带的 Logger（如 `getSelf().getLogger()`）输出，LeviLamina 在 Windows 控制台下通过 `WriteConsoleW` 输出，中文不会乱码。若必须用 `printf`/`std::cout` 直接输出，可在启动时引入 `Windows.h` 并执行：

```cpp
SetConsoleCP(CP_UTF8);
SetConsoleOutputCP(CP_UTF8);
DWORD mode;
GetConsoleMode(GetStdHandle(STD_OUTPUT_HANDLE), &mode);
SetConsoleMode(GetStdHandle(STD_OUTPUT_HANDLE), mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
```

同时确保源码以 UTF-8 编译（模板已带 `/utf-8`）。也可开启 Windows 的“Beta: 使用 Unicode UTF-8 提供全球语言支持”，但可能导致其他程序乱码。

*适用版本：Windows 下的 LeviLamina mod / 普通控制台程序*

## 用 xmake 构建 LeviLamina mod 时报错 `error: package(bedrockdata): version(xxx) not found!`（例如 1.21.60.10-server），该怎么处理？

这是本地 xmake 包仓库（`levimc-repo`）缓存过旧导致的。执行 `xmake repo -u` 更新仓库后重新构建即可。规律：某个包版本实际已发布，但 xmake 提示找不到，就说明需要更新仓库缓存。

*适用版本：使用 xmake + levimc-repo 构建的所有 LeviLamina 版本*

## 用 xmake 编译 LeviLamina mod（如 LegacyRemoteCall 相关项目）时内存耗尽（OOM）、编译器堆空间不足甚至 VSCode 崩溃，怎么办？

原因是头文件 include 过多（如 `include_all`、大量 `magic_enum` 宏展开）导致每个编译进程占用大量内存。解决办法是降低并行编译数量：`xmake -j <num>`（例如 `xmake -j 2`），同时关闭其他占内存的软件；也可以减少不必要的大头文件包含。

*适用版本：当前版本（取决于机器内存）*

## 用最新的 levilamina-mod-template 创建的项目无法编译，怎么办？

需要加上 `_HAS_CXX23` 的 define。模板已在 commit <https://github.com/LiteLDev/levilamina-mod-template/commit/2d01125a7b8982d04019d1a006c0276d0006f5d6> 中加上：

```lua
add_defines("NOMINMAX", "UNICODE", "_HAS_CXX23=1")
```

更新模板或手动在 `xmake.lua` 的 target 中添加该 define 即可。

*适用版本：2026-10 之后的 LeviLamina（26.x）与 levilamina-mod-template*

## 用最新的 levilamina-mod-template 编译面向旧版 LeviLamina（如 1.4.1）的 mod，GitHub Actions 构建 client 版本失败（旧版没有 client 版），如何让 action 只构建服务端？

LeviLamina 从 1.9.0 才正式支持客户端。面向旧版本时，在 `.github/workflows/` 下的 `build.yml` 和 `release.yml` 中把 `matrix.target_type` 里的 `client` 项删除，只保留 `server` 构建即可。另外 `lip.toml` 中 `side = "client"` 的那个 variant 也应一并删除，并把 LeviLamina 依赖版本改成你实际使用的版本。

*适用版本：LeviLamina 1.9.0 之前版本，使用新版模板的项目*

## 编译 LeviLamina C++ 插件时报错 C4819：该文件包含不能在当前代码页(936)中表示的字符，如何解决？

给编译器加上 UTF-8 编译参数 `/utf-8`（`xmake.lua` 中 `add_cxflags("/utf-8")`）。官方 mod 模板的 `xmake.lua` 默认已带此参数；如果仍出现，也可能是代码里写错了符号（如中文标点）或头文件用错引起的，需检查源码，并确保源文件以 UTF-8 保存。

## 编译 LeviLamina mod 时 xmake 报错（与 preloader 包有关），怎么修复？

删除 xmake 缓存和对应版本的 preloader 包后重新编译：

1. 删除 `C:\Users\%USERNAME%\AppData\Local\.xmake\cache`；
2. 删除 `C:\Users\%USERNAME%\AppData\Local\.xmake\packages\p\preloader\<版本号>`（如 `v1.15.5`）；
3. 重新执行 `xmake` 编译。

*适用版本：使用 xmake + levimc-repo 构建的所有 LeviLamina 版本*

## 编译 LeviLamina mod 时报 `"clear": 不是 "CompoundTag" 的成员` 等编译错误，怎么解决？

当前 `CompoundTag` 没有 `clear()` 成员函数，但其内部的 `TagMap` 成员 `mTags` 是 public 的，可直接用 `nbt.mTags.clear()` 清空。另外 LeviLamina 要求 xmake 3.0.0 及以上（`xmake.lua` 中 `set_xmakever("3.0.0")`），xmake 版本过旧（如 2.9.x）时请先 `xmake update` 升级再构建；`bedrockdata` 等依赖由 `levilamina` 包按版本自动引入，无需手动 `add_requires` 旧版本号。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## 编译 mod 时报 LeviLamina 头文件缺少它所依赖的其他头文件（某些类型未定义），怎么解决？

LeviLamina 的 mc 头文件是工具自动生成的，部分头文件可能缺少所需的 include（只有前向声明）。解决方法：在 mod 中用到该头文件的源文件里，手动 `#include` 缺失类型所在的头文件即可；如果难以定位，也可以向 LeviLamina 提 PR 补全该头文件的 include。

*适用版本：LeviLamina 当前版本*

## 自行编译 LeviLamina（或用模板编译 mod）编译不通过，而旧版本能正常编译，怎么办？

检查 LLVM/clang 版本。LeviLamina 和 mod 模板在 Windows 上使用 `clang-cl` 工具链，Visual Studio 自带的 clang/LLVM 往往太旧；请安装/更新到较新的 LLVM（官方 CI 使用 LLVM 22），同时确保 xmake >= 3.0.0，再重新编译。

*适用版本：LeviLamina 26.x*

## 调试 LeviLamina 插件崩溃时，CrashLogger 总是比 VS 调试器先抢到异常，怎么方便地调试？

开发时可使用 debug 版的 LeviLamina（release 同时提供 server/client 的 debug 构建包），报错会有更完整的堆栈。CrashLogger 在启动时若检测到调试器（`IsDebuggerPresent`）会自动不启用，因此直接用调试器启动 BDS 即可避免抢异常；若要在启动后再附加调试器，可在 LeviLamina 配置文件（`mods/LeviLamina/config/Config.json`）中把 `modules.crashLogger.enabled` 设为 `false` 关闭 CrashLogger。

*适用版本：LeviLamina 1.x 及以上*
