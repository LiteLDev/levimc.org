# 安装 lip 与部署服务器

## 用 lip 安装的插件/模组怎么卸载？直接删掉插件文件夹为什么不行？

在服务器目录执行 `lip uninstall <包>`，包可以写 `lip list` 显示的身份（如 `lip uninstall github.com/LiteLDev/LegacyScriptEngine#lua`），也可以写安装时的来源（如 `./package.zip`）；可先加 `--dry-run` 查看会删除什么。lip 会运行卸载钩子、删除该包拥有的文件，并自动卸载不再被需要的依赖。不要手动删除文件夹：lip 在 `.lip/state.json` 中记录已安装的包，手动删除后 lip 仍认为它已安装，再执行 `lip install` 同一版本也不会重装。出现这种情况时，先 `lip uninstall` 再 `lip install`。若重装后仍异常，可在一个新的空目录里用 lip 纯净安装 LeviLamina 服务器来判断是服务端还是插件的问题。更多子命令见 `lip --help` 或界面（直接运行 `lip`）。

*适用版本：当前所有 lip 版本（状态文件路径为 lip v0.40+ 的 `.lip/state.json`）*

## 怎么用 lip 更新已安装的插件？能一键更新所有包吗？依赖会跟着更新吗？LeviLamina 本身怎么更新？

现在用 `lip update`（旧的 `lip install --upgrade` / `-U` 已不存在）。在服务器目录执行：

- `lip update` 不带参数会按安装时的来源重新请求所有显式安装的包（按 `<repo>` 安装的会升到最高版本标签，固定了 `@版本` 的保持不变）；
- `lip update github.com/user/repo` 只更新这一个包；
- `lip update github.com/user/repo@1.2.0` 换到指定版本（可升可降）。

可先加 `--dry-run` 预览。依赖只在新版本需要时才随之更新，能否变动由插件 `lip.toml` 中 `deps` 的版本范围决定。`lip update` 不会改动游戏（BDS）和加载器（LeviLamina），也不接受它们作为参数：要更换 LeviLamina 或游戏版本请用 `lip setup`。命令需在服务器（工作区）目录中执行（资源管理器中打开服务器目录后在地址栏输入 `cmd` 或 `powershell` 回车即可），也可以直接运行 `lip` 在界面的“模组”页更新。

*适用版本：lip v0.40 及以上*

## 用 lip 安装插件后提示缺少依赖（前置），为什么 lip 没自动装上？

lip 会自动安装包在 `lip.toml` 的 `deps` 中声明的依赖（`<包 ID>` 或 `<包 ID>#<变体>` = 版本范围）。没自动装上通常有两种原因：

1. 插件作者没在 `deps` 中声明该依赖，只能联系作者补上，或自己找到对应包手动 `lip install`（报错里一般写明了缺的包 ID 和版本范围，可在 <https://levimc.org/zh-Hans/mods/> 搜索）。
2. 缺的是游戏或 LeviLamina 本身：`lip install` 从不安装、卸载或替换游戏和加载器，若模组需要别的 LeviLamina 版本，命令会失败并提示 `lip setup`，需先用 `lip setup` 设置该模组支持的游戏和 LeviLamina 版本再装模组。

旧版 `tooth.json` 的 `prerequisites` 字段已不再存在。手动安装的插件请确认依赖插件确实在 `mods` 目录里。

*适用版本：lip v0.40 及以上；LeviLamina 1.x 及以上（模组目录为 `mods/`）*

## 如何用 lip 一次性装好 LeviLamina（含 BDS）以及 LSE、反作弊、优化、多维度等常用组件？

在一个新建的空文件夹中执行（可一条命令装多个包，作为一次操作完成）：

```shell
lip install LeviLamina github.com/LiteLDev/LegacyScriptEngine github.com/LiteLDev/LeviAntiCheat github.com/LiteLDev/LeviOptimize github.com/LiteLDev/MoreDimensions
```

安装 LeviLamina 时会自动装上它适配的 BDS（期间需输入 `yes` 同意 Minecraft EULA，脚本中可加 `--accept-eula`）。LSE 默认变体包含 QuickJS 与 Lua 引擎，其他引擎用变体安装：`github.com/LiteLDev/LegacyScriptEngine#nodejs`、`github.com/LiteLDev/LegacyScriptEngine#python`。之后在已有 BDS 的工作区里再装模组只需 `lip install <包>`。第三方包（如 GMLIB 等）同样用 `lip install github.com/<作者>/<仓库>` 安装，需确认其支持当前 LL 版本。

*适用版本：当前 lip（v0.41.x）与 LeviLamina 26.60.x*

## lip 默认装的是最新 LeviLamina 和对应的最新 BDS，客户端/存档/插件只支持旧版本，怎么用 lip 安装指定版本的 LeviLamina 或 BDS（以及指定版本的其他包）？

`lip install` 不带版本时安装最新版本，安装 LeviLamina 会连带安装它适配的 BDS（客户端版本须与服务端匹配，可在 BDS 控制台输入 `version` 查看）。指定版本的方法（在新建的空文件夹中执行）：

1. 按 LeviLamina 版本：`lip install LeviLamina@<版本号>`（即 `github.com/LiteLDev/LeviLamina@<版本号>`），会装上该 LL 支持的最新 BDS。版本号到 LeviLamina GitHub Releases 查。
2. 按 BDS 版本：`lip setup --game <BDS版本>`（如 `--game 1.21.60`，会自动选择适配的最新 LeviLamina，也可加 `--loader levilamina@<版本号>` 指定 LL），或者把两者写在同一条命令里：`lip install github.com/LiteLDev/bds@<BDS版本> LeviLamina`。注意不要分两条命令先装 bds 再装 LeviLamina，后一条会按 LL 重新选择游戏版本。
3. 已有服务器想换版本：在该文件夹再次运行 `lip setup --game <版本>`，`worlds`、`server.properties` 等会保留，其他模组会被换成兼容的版本。降级前务必备份存档，高版本存档降级可能损坏。
4. 其他包同样在包名后加 `@版本号`，可带变体，例如 `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs@0.22.4`，并选择与所装 LL 版本兼容的版本。

GitHub 访问慢时可先执行 `lip config set github_proxy <代理URL>`；`lip cache clean` 可清理下载缓存。

*适用版本：当前 lip（v0.41.x）；版本号以 LeviLamina/LSE Releases 为准*

## 国内网络（或云服务器、校园网）下用 lip 安装 LeviLamina、LegacyScriptEngine 等包时下载很慢、卡住或报网络错误，怎么配置镜像/代理？

这是访问 GitHub 的网络问题。lip 的大多数包都从 GitHub 下载，可以给 lip 设置 GitHub 代理（URL 前缀式的 GitHub 镜像）：

```shell
lip config set github_proxy https://v4.gh-proxy.org/https://github.com/
```

镜像地址可换成其他可用的、你信任的 GitHub 前缀代理；有些服务需要在地址后带完整的 `https://github.com/`。

要点：

1. 当前版本的 lip 只有 `github_proxy` 这一项网络配置。旧版的 `GoModuleProxyURL` / `GitHubMirrorURL` / `ProxyURL`、`go_module_proxy` / `go_module_proxies` / `github_proxies` 都已不存在，`goproxy.cn` 之类的 Go 模块代理也不再用到，设置它们没有作用。
2. 只有发往 `github.com` 的请求走 `github_proxy`；BDS 本体从 minecraft.net 下载，不受它影响。
3. 通过代理的请求失败时，lip 会回退到直连 GitHub，所以命令成功不代表代理可用。可以这样测试代理：`curl.exe -s -o NUL -w "%{http_code}" "<代理地址>LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"`，返回 `200` 说明代理可用。镜像失效（被墙）时换一个；如果报错说代理不支持 git 仓库，也要换掉。
4. 如果有普通的 HTTP 代理（例如 Clash 本地端口 `http://127.0.0.1:7890`，注意端口要填对），不需要设置 `github_proxy`。在运行 lip 的终端里设置 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` / `NO_PROXY` 即可（PowerShell：`$env:HTTPS_PROXY = "http://127.0.0.1:7890"`）；没有这些环境变量时，lip 会使用系统代理。也可以开启代理软件的 TUN 模式。
5. 移除代理：`lip config delete github_proxy`；明确表示直连：`lip config set github_proxy ""`（PowerShell 里写 `lip config set github_proxy --% ""`）。用 `lip config list` 查看当前配置。
6. 如果之前下载失败留下了残缺的缓存，执行 `lip cache clean` 后重试。也建议先把 lip 更新到最新版。
7. 实在不行，可以在网络好的机器上装好后打包上传到服务器。

*适用版本：lip v0.41.x（当前最新）；旧版配置键仅适用于早期 Go 版 lip*

## Windows 上安装 lip 后，命令行提示找不到 lip 命令（或提示缺少 .NET 运行时），怎么办？

推荐从 <https://github.com/LiteLDev/lip/releases/latest> 下载 `lip-<版本>-win-x64.msi`（ARM 设备用 `win-arm64`）安装，安装程序会自动把安装目录加入系统 PATH。安装后必须关闭原来的 cmd/PowerShell 窗口重新打开，新的 PATH 才生效。如果用的是 zip 便携版，需要自己把 `lip.exe` 所在目录（不带文件名）加入“编辑系统环境变量 → 环境变量 → Path”，同样要重开终端；可以用 `echo %PATH%` 检查。也可以不配 PATH，直接用 `lip.exe` 的完整路径（含空格时加引号），或把 `lip.exe` 放在当前目录下运行（cmd 中直接输入 `lip`，PowerShell 中需写 `.\lip`）。当前版本 lip 是单个自包含可执行文件，不需要另外安装 .NET 运行时。

*适用版本：当前 lip（v0.41.x），Windows*

## lip 的 Release 页面有很多文件（x64/arm64、msi/zip 等），Intel/AMD 的 Windows 电脑或 Windows Server、面板服应该下载哪个？

x64/amd64 与 arm64 指 CPU 架构而不是品牌：普通 Intel 和 AMD 电脑、Windows Server 2022 等都是 x64；arm64 只给 ARM 设备用，下错会提示与系统不匹配。当前 lip 发布页（<https://github.com/LiteLDev/lip/releases/latest>）的文件为：`lip-<版本>-win-x64.msi` / `win-x64.zip`（Windows x64）、`win-arm64.msi` / `win-arm64.zip`（Windows ARM）、`linux-x64.tar.xz`（x64 Linux）、`osx-x64.zip` / `osx-arm64.zip`（macOS）。Windows 一般下载 `win-x64.msi` 安装即可（自动加入 PATH）；面板服或无法运行 msi 的环境下载 `win-x64.zip` 解压使用。所有版本都是自包含的单文件，无需额外装 .NET。lip 本身跨平台，在 Linux/macOS 上会通过自己下载的 Wine 运行带 LeviLamina 的 Windows 服务器；没有 arm64 Linux 版。

*适用版本：当前 lip（v0.41.x）*

## lip 包管理器在哪里下载、怎么安装？有没有 winget 安装方式？能否自更新？有没有 Linux 版？

lip 的仓库现为 <https://github.com/LiteLDev/lip>（原 `futrime/lip`），文档在 <https://levimc.org/zh-Hans/lip/>。Windows 从 <https://github.com/LiteLDev/lip/releases/latest> 下载 `lip-<版本>-win-x64.msi`（ARM 用 `win-arm64.msi`）运行安装，会自动加入 PATH；也可下载 zip 解压后自行把目录加入 PATH。Linux（x64）和 macOS 下载对应压缩包，解压出 `lip` 文件放到 PATH 中的目录。lip 是单个可执行文件，无需另装 .NET、git 或 Wine。官方文档已不再提供 winget 安装方式（旧的 `futrime.lip` winget 包已不可用）；更新 lip 用 `lip self-update`（`lip self-update --check` 只检查）。安装后在服务器文件夹打开终端输入 `lip` 即可使用界面，或用 `lip install LeviLamina` 等命令。

*适用版本：当前 lip（v0.41.x）*

## 在 x64 的 Windows（Win10/Win11/Windows Server）上下载的 lip 无法运行，是什么原因？

最常见的原因是下错了架构：x64 电脑应下载 Release 中的 `win-x64` 版本（`lip-<版本>-win-x64.zip` 或 `lip-<版本>-win-x64.msi`），而不是 `win-arm64` 版本。旧版 lip 的文件名用 `amd64`/`arm64`，现在改为 `win-x64`/`win-arm64`。若架构正确仍无法启动，且使用的是精简/魔改版 Windows 10，可能与 .NET 9 起默认启用的 CET（控制流强制技术）兼容性有关（参考 <https://learn.microsoft.com/zh-cn/dotnet/core/compatibility/interop/9.0/cet-support>），建议换用正常的官方系统镜像。

*适用版本：lip 当前版本（v0.41.x；win-x64/win-arm64 命名自 C# 版 v0.33 起即已使用）*

## 在 Windows Server（如 2022 数据中心版）上 lip 安装器报错 `lip Setup Wizard ended prematurely because of an error` 或 lip 无法使用，怎么办？

Windows Server 本身是支持的。先确认下载的是 `win-x64` 版本（服务器不是 ARM 架构时不要下 `win-arm64`）。如果 msi 安装器出错，可以不用安装器：下载 `lip-<版本>-win-x64.zip`，解压出 `lip.exe`，并把其所在目录加入 PATH 环境变量即可（msi 安装器主要也是把 lip 放到 `Program Files\lip` 并把该目录写入 PATH）。当前 lip 是自包含发布，不需要另外安装 .NET 运行时；便携版之后也可用 `lip self-update` 升级。

*适用版本：lip 当前版本（v0.41.x，自包含发布，无需 .NET）*

## 用 lip 安装某个包失败（换版本号也不行、像是包没上传完，或依赖无法满足），是什么原因？

常见原因是本地 lip 版本太旧，读不了新格式的包（新包使用 `lip.toml`，旧版 lip 只认 `tooth.json`）。先执行 `lip self-update` 把 lip 更新到最新版再安装。如果是依赖确实无法满足（作者未发布满足要求的依赖版本或写错版本号），当前 lip 没有跳过依赖检查的选项，只能安装其他版本的包、用 `lip setup` 换匹配的游戏/LeviLamina 版本，或等作者修正。

*适用版本：lip 当前版本（v0.41.x；`lip self-update` 可用）*

## LeviLamina/BDS 是手动安装（或 exe 安装）的，之后用 lip 安装 LegacyScriptEngine、LeviAntiCheat 等依赖 LeviLamina 的模组时提示缺少依赖、识别不到 LeviLamina，怎么办？lip 命令应该在哪里执行？

lip 只认识它自己安装并记录在服务器文件夹 `.lip/`（状态文件）里的包，手动解压的 BDS/LeviLamina 在 lip 看来不存在，所以要么全部用 lip，要么全部手动，不要混用。在没有游戏记录的文件夹里安装模组，lip 会失败并提示先用 `lip setup`。推荐做法：新建一个空文件夹，在该文件夹里执行 `lip install LeviLamina`（或连同模组一起：`lip install LeviLamina LegacyScriptEngine`），装好后再用 `lip install <模组>` 安装其他模组，最后把旧服务器的 `worlds/`、`server.properties`、`allowlist.json`、`permissions.json` 和模组配置复制过去。lip 命令必须在服务器根目录（工作区）里执行，lip 用 MSI 安装后已在 PATH 中，`cd` 到服务器目录直接运行即可。若坚持全手动安装，可参考各包仓库里的 `lip.toml`（旧包为 `tooth.json`），里面写明了依赖、下载地址和文件放置位置。

*适用版本：lip v0.40+（当前 v0.41.1），LeviLamina 当前版本*

## 在 BDS 控制台里输入 `lip install ...`（如更新 LeviLamina）提示 Unknown command / 无效，lip 命令应该在哪里执行？LeviLamina 会自动更新吗？

lip 是独立的命令行程序，不是 BDS 控制台命令。要在系统终端（cmd/PowerShell）里执行，并先切换到服务器根目录（`盘符:` 然后 `cd 路径`；也可以在资源管理器打开服务器目录，在地址栏输入 `cmd` 回车）。只输入 `lip` 不带参数会打开 lip 的终端界面，可在里面创建服务器、安装模组、启动服务器。LeviLamina 不会自动更新：更换 LeviLamina/游戏版本用 `lip setup --game <游戏版本> --loader levilamina@<版本>`（或在界面的工作区页面操作），更新其他模组用 `lip update`。面板服无法使用终端时只能手动替换文件或联系服务商。

*适用版本：lip v0.40+（当前 v0.41.1）*

## 用 `lip install` 升级 LeviLamina 或已装的包时提示“已经安装”或版本没变，应该怎么正确升级/安装指定版本？

1. `lip install` 只用于安装尚未安装的包；对已经安装的包再 install 会被拒绝，并提示改用 `lip update`。
2. 普通模组：`lip update` 更新全部，`lip update <包>` 更新指定包，`lip update <包>@<版本>` 换到指定版本（升降级都行）。
3. LeviLamina 和 BDS 不能用 install/update 更换，要用 `lip setup --game <游戏版本> --loader levilamina@<版本>`，会保留世界和配置并把模组换成兼容版本；在全新文件夹安装指定版本可用 `lip install LeviLamina@<版本>`。
4. 所有 lip 命令都必须在服务器根目录执行，不要在 Win+R 打开的默认目录（如 `C:\Windows\System32`）里运行。
5. 如果 `lip -v` 显示的版本很老，请到 <https://github.com/LiteLDev/lip/releases> 安装最新版，之后可用 `lip self-update` 更新 lip 本身。

*适用版本：lip 0.40 及以上*

## 用 lip 安装 LeviLamina/服务器时文件装到了别的地方（如用户目录）或和其他文件混在一起，lip 把服务器装在哪里？怎么指定安装位置？

lip 把服务器和包安装到执行命令时的当前工作目录（这个目录就是 lip 的“工作区”）。先新建一个空文件夹，用 `cd <该文件夹路径>` 进入（或在资源管理器地址栏输入 `cmd` 打开命令行），再执行 `lip install LeviLamina`、`lip setup ...`、`lip install <包>` 等命令。之后对这个服务器的所有 lip 操作也都要在该文件夹里执行。

## 面板服/云服务器上没有 lip、无法运行 lip，或联网安装失败，怎么安装 LeviLamina 及其模组？

lip 是单个可执行文件，不需要安装其他运行环境，可以直接把 lip 放到服务器上（任意目录或 PATH 中）使用；Linux 版只有 x64，需要 glibc 2.27 以上（不支持 Alpine）；Linux/macOS 上 lip 通过自动下载配置的 Wine 运行 Windows 版服务端，Wine 还需要系统有 GnuTLS（装了 FreeType 时还需 Fontconfig），缺少时 lip 会给出名称和安装命令。

如果面板服完全不能运行 lip：在本地电脑上用 lip 装好整个服务器（或某个模组），再把文件上传到面板服；搬整个服务器时连同 `.lip` 文件夹一起上传。也可以查看对应包的清单文件（新包为仓库根目录的 `lip.toml`，旧包为 `tooth.json`），里面写有各资源的下载链接（assets 的 `urls`）和放置路径（`place` / `placements`），手动下载后按其中的路径放置。

若只是 GitHub 连不上，可用 `lip config set github_proxy <代理地址>` 设置 GitHub 代理。

*适用版本：lip 0.40 及以上*

## 用 lip 安装 GMLIB 报 404 / 下载不了，怎么办？

GMLIB 已更换仓库，旧地址 `github.com/GroupMountain/GMLIB` 已不存在，应改用新仓库：`lip install github.com/GroupMountain/GMLIB-Release`。GMLIB 的包声明了对 LeviLamina 的依赖，lip 会选择与当前已安装 LeviLamina 兼容的版本；需要指定旧版本时可用 `lip install github.com/GroupMountain/GMLIB-Release@<版本>`。

## lip 的 msi 安装包和直接下载 lip 可执行文件（zip）有什么区别？安装后怎么用？

功能上没区别。msi 是规范安装：会自动把 lip 加入 PATH 环境变量，安装后可直接在命令行使用 `lip`，并可在“程序和功能”中卸载，适合不会改环境变量的用户；zip 为便携版，需自行解压并放到 PATH 中的目录。两者都可以用 `lip self-update` 更新（msi 安装的会通过 msiexec 静默更新）。安装后在服务器文件夹中输入 `lip` 即可打开界面。

*适用版本：lip 0.41.x（Windows）*

## GitHub 访问不了，如何下载安装 lip？

lip 的安装包在 GitHub Releases：<https://github.com/LiteLDev/lip/releases/latest>（旧地址 `futrime/lip` 会自动跳转）。Windows 下载 `lip-<版本>-win-x64.msi`（或 `-win-arm64.msi`，也有 `.zip` 便携版），例如 <https://github.com/LiteLDev/lip/releases/download/v0.41.1/lip-0.41.1-win-x64.msi>；Linux/macOS 下载对应的 `.tar.xz`/`.zip`。

如果无法访问 GitHub，可以通过第三方 GitHub 加速镜像下载（在链接前加镜像前缀，或把 `github.com` 换成镜像域名）。安装后可以执行 `lip config set github_proxy <代理URI>`，让 lip 之后对 GitHub 的下载都走代理。

## LeviLamina 更新支持新版游戏后，用 lip 安装 LL 本体和 BDS 正常，但安装 LegacyScriptEngine 的 quickjs/nodejs/lua 等版本一再失败，怎么办？

先执行 `lip cache clean` 清理 lip 缓存，再重新安装，例如 `lip install LegacyScriptEngine#lua`。清理缓存不会丢失任何东西，lip 会重新下载需要的文件；清理时不要同时运行其他 lip 命令。如果仍然失败，查看 `.lip/logs/` 里的失败报告；提示游戏或加载器版本不兼容时，说明该 LSE 版本还不支持当前 LeviLamina，需等 LSE 更新或用 `lip setup` 换到它支持的版本。

*适用版本：lip 0.41.x*

## lip 的官方地址是什么？`github.com/lippkg/lip` 还能用吗？

lip 的仓库现在是 <https://github.com/LiteLDev/lip>，文档在 <https://levimc.org/zh-Hans/lip/>（英文 <https://levimc.org/lip/>）。旧的 `github.com/lippkg/lip`、`github.com/futrime/lip` 目前会被 GitHub 重定向到 LiteLDev/lip，旧文档域名 `lip.levimc.org` 等也只是指向新文档，请直接使用新地址。插件建议通过 lip 自行安装。

## winget 仓库里的 lipd 版本一直停在旧版本（如 0.33.1）没有更新，是怎么回事？

lipd 已经废弃，不再单独发布，它的功能（后台守护进程）已经内置在 lip 中，只需安装/更新 lip 即可（守护进程由第一条 lip 命令自动启动，可用 `lip daemon status` / `lip daemon stop` 查看和停止）。另外 winget 镜像源只镜像包清单信息，实际安装包仍从 GitHub Release 下载。

*适用版本：lip 0.34 及以后*

## 不小心在 plugins（或 mods）目录里执行了 lip 安装，结果下载了一大堆东西（甚至又下了一个服务端），该怎么办？

lip 把当前工作目录当作工作区（服务器文件夹），所有 lip 命令都应在服务器根目录执行，不要在 mods/plugins 等子目录里运行。在子目录里执行 `lip install LeviLamina` 之类的命令会在那里另建一个服务器。处理方法：把在子目录里误装的内容（包括其中的 `.lip` 文件夹）删除，或在该子目录里用 `lip uninstall` 卸载，然后回到服务器根目录重新执行。

## 去哪里下载旧版本的官方 BDS 服务端？官网只有最新版。

可以用 lip：在一个空文件夹里运行 `lip setup --game <版本> --no-loader`（例如 `--game 1.21.80`，需要特定构建写 `1.21.80-patch.3`）即可得到该版本的原版服务端；不加 `--no-loader` 则会同时装上适配的 LeviLamina。lip 根据 `https://levimc.org/api/v4/mc/versions/` 的构建列表从 minecraft.net 官方地址下载。也可以在 Minecraft Wiki 上搜索对应版本号找到官方直链。

## 在新建空目录中用 lip 安装 LeviLamina 26.60.x 和 LSE 0.23.x 后，启动时提示资源包版本不兼容（BDS 版本与 LeviLamina 要求的 1.26.60 不一致），原因是什么？该按什么顺序安装？

原因是先安装了 LSE，旧版 lip 的依赖解析只拉到了 BDS 组件并下载成了最新版 BDS，而不是 LeviLamina 要求的 1.26.60。正确做法是先搭好游戏和加载器，再装插件：

```shell
lip install LeviLamina          # 安装最新 LeviLamina 及其支持的最新 BDS（等同一次 lip setup）
lip install LegacyScriptEngine  # 再安装 LSE（默认同时装 QuickJS 和 Lua 引擎）
```

或者显式指定：`lip setup --game 1.26.60 --loader levilamina` 后再 `lip install LegacyScriptEngine#lua` 等。请先用 `lip self-update` 更新到最新 lip：新版 lip 在没有游戏的空工作区里直接安装 mod 会报错并提示先执行 `lip setup`，不会再装出错误版本的 BDS。LeviLamina 要求的 BDS 版本写在其 `lip.toml` 的依赖 `github.com/LiteLDev/bds` 中（旧包为 `tooth.json`）。

*适用版本：lip 0.41.x；LeviLamina 26.60.x；LegacyScriptEngine 0.23.x*

## 如何用 lip 安装 LSE 的 Lua / QuickJS 等引擎？执行安装报错怎么办？

现在各语言引擎是 LegacyScriptEngine 包的变体（variant），用 `#` 指定：

```shell
lip install LegacyScriptEngine#lua
lip install LegacyScriptEngine#quickjs
# 另有 #nodejs、#python
```

不带变体（`lip install LegacyScriptEngine`）会同时安装 QuickJS 和 Lua 引擎。`LegacyScriptEngine` 是 `github.com/LiteLDev/LegacyScriptEngine` 的简写。安装前工作区需要已有服务器和 LeviLamina（`lip install LeviLamina` 或 `lip setup --game <版本>`）。若报错：先 `lip self-update` 更新到最新 lip，再执行 `lip cache clean` 清理缓存后重试，并阅读 lip 输出的 error/hint 及 `.lip/logs/` 下的失败报告。

*适用版本：lip 0.41.x；LegacyScriptEngine 0.23.x*

## 手动下载的 LeviLamina mod 启动时报缺少依赖/加载失败，以及在 BDS 1.21.70 等旧版本上如何安装对应版本的 mod？

手动下载的文件可能不完整或缺依赖，建议使用 lip 安装（会自动处理依赖）。要用旧版 BDS：在服务器文件夹里先用 `lip setup --game 1.21.70`（会配上适配该版本的最新 LeviLamina）搭好游戏与加载器，然后 `lip install <包>`，lip 会自动选择能在当前工作区工作的最新版本。也可以到该 mod 的 GitHub Releases 查到适配该 BDS 版本的版本号，用 `lip install <包地址>@<版本号>` 精确指定（例如 `lip install github.com/user/repo@1.2.0`），可先加 `--dry-run` 查看会安装什么。该 mod 需有适配目标 BDS 版本的发布。

*适用版本：lip 0.41.x*

## 按 LeviLamina/LSE 安装文档执行 lip install 命令时，带 `@version` 的命令报错，该怎么写？

文档里 `<repo>@<version>` 中的 version 只是占位符，不能照抄。想装最新版就把 `@version` 整个去掉，例如 `lip install github.com/LiteLDev/LegacyScriptEngine`（LiteLDev 的仓库也可简写为 `lip install LegacyScriptEngine`）；需要特定版本时写具体版本号，例如 `lip install github.com/LiteLDev/LegacyScriptEngine@0.23.1`（对应仓库的 `v0.23.1` 标签）。有变体时 `#变体` 写在 `@` 之前，如 `LegacyScriptEngine#lua@0.23.1`。

注意：在当前 lip 中 `lip install LeviLamina` / `lip install LeviLamina@<版本>` 会按 `lip setup` 的方式一并装好匹配的 BDS（需同意 EULA），已安装的 LeviLamina 要换版本请用 `lip setup`。

## 用 `lip install github.com/LiteLDev/LegacyScriptEngine@版本号` 安装时，会不会把 LSE 的四个语言引擎都装上？版本号后需要带 `#` 吗？

不需要带 `#`。直接 `lip install github.com/LiteLDev/LegacyScriptEngine@版本号`（不带变体）只会安装 QuickJS 和 Lua 两个引擎。Node.js、Python 引擎需单独安装对应变体，变体写在 `@` 之前：`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs@版本号`、`lip install github.com/LiteLDev/LegacyScriptEngine#python@版本号`（不写 `@版本号` 则装最新版）。

*适用版本：LegacyScriptEngine 0.17.x 及以后*

## 用 lip 安装 LeviLamina 后没有 LegacyScriptEngine，旧 JS/Lua 插件不能用，怎么回事？

LeviLamina 是模块化的，LSE 不随 LL 自动安装，需要单独安装：在服务端根目录执行 `lip install github.com/LiteLDev/LegacyScriptEngine`（简写 `lip install LegacyScriptEngine`，不带变体会装 QuickJS 和 Lua 引擎；只要某一种可写 `#quickjs`、`#lua`，Node.js/Python 用 `#nodejs`、`#python`）。

也可以从 <https://github.com/LiteLDev/LegacyScriptEngine/releases> 下载对应的 `LegacyScriptEngine-server-<引擎>-windows-x64.zip` 手动解压到服务端（引擎位于 `mods/legacy-script-engine-<引擎>/`），但需自行处理 LegacyRemoteCall、LegacyMoney、iListenAttentively 等依赖（Node.js 引擎还需另装 node 运行时 `node-prebuilt.zip` 与 `7-zip-tooth`），推荐用 lip。安装后把脚本插件放进 `plugins/` 并重启服务器。

*适用版本：LeviLamina 0.10 及以上*

## 用 lip 下载/安装 LSE 的 NodeJS 引擎失败怎么办？

1. 先把 lip 更新到最新：`lip self-update`。
2. 清理缓存后重试：`lip cache clean`。
3. GitHub 访问慢或被墙时，设置 GitHub 代理：`lip config set github_proxy <代理地址>`；或在终端设置系统 HTTP 代理环境变量（如 PowerShell 中 `$env:HTTPS_PROXY = "http://127.0.0.1:端口"`），lip 会自动使用。
4. 用当前包名重新安装：`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs`（可简写为 `lip install LegacyScriptEngine#nodejs`）。注意需先用 `lip setup --game <版本>` 装好游戏与 LeviLamina；若该包已被显式安装，`lip install` 会拒绝，应改用 `lip update`，或先 `lip uninstall` 再安装。

失败时可查看终端里的 hint 以及 `.lip/logs/` 下的失败报告定位原因。

*适用版本：lip 0.41.x 及以上*

## 用 lip 安装 BDS/LeviLamina 时会卡在需要同意 Minecraft 用户协议（EULA）的步骤吗？写一键安装脚本时有没有跳过同意的参数？

会询问。当前 lip 在安装游戏（BDS）时会列出 Minecraft EULA 和 Microsoft 隐私政策链接并要求输入 `yes` 才继续；在脚本等非交互终端中不加参数会直接失败。写脚本时加 `--accept-eula` 即可跳过询问，例如：

```shell
lip setup --game 1.21.0 --loader levilamina@1.0.0 --accept-eula
```

或 `lip install LeviLamina github.com/user/repo --accept-eula`（当 install 以 setup 方式执行时生效）。每次安装游戏都会重新询问，同意结果不会被记录。

*适用版本：lip 0.41.x 及以上*

## 用 lip 安装 LeviLamina 后启动 BDS 弹出缺少运行库类错误（看起来像要装 vcredist），但已经装了 vcredist 仍然不行，怎么办？

这通常是 BDS 本体没下载完整导致的。BDS 由 lip 包 `github.com/LiteLDev/bds` 的安装钩子调用 bdsdown 从官网下载，可以通过环境变量 `BDSDOWN_MIRROR_URL` 指定下载镜像。在 PowerShell 中先设置镜像再在空文件夹中重新安装：

```powershell
$env:BDSDOWN_MIRROR_URL="<镜像地址>"
lip setup --game <版本>
```

（或 `lip install LeviLamina`）。lip 会把当前终端的环境变量传给安装过程。有用户用 <https://mcdl.bibk.top> 作为镜像并下载成功。

## 用 lip 安装 LeviLamina 或插件失败，lip 应该在哪个目录运行？安装 LSE 需要逐个装依赖吗？

lip 以当前工作目录作为工作区，必须在服务端根目录（`bedrock_server.exe` 所在目录）下运行，没有指定其他目录的选项；lip 本身可以放进 PATH。新建服务端时在空文件夹中执行 `lip setup --game <版本>`（或 `lip install LeviLamina`）。

安装 LegacyScriptEngine 只需安装本体（如 `lip install LegacyScriptEngine#lua`），其他依赖（如 LegacyRemoteCall）会自动解析安装；但 `lip install` 不会安装或更换游戏与 LeviLamina，需先用 `lip setup` 装好与 LSE 版本约束相符的 LeviLamina，否则命令会失败并提示 `lip setup`。安装 LeviLamina 时会自动运行 PeEditor 生成 `bedrock_server_mod.exe`。脚本中需要免交互时使用 `--accept-eula`（新版 lip 已无 `-y` 参数）。

*适用版本：lip 0.41.x 及以上*

## 用 lip 安装 LeviLamina 时包名是什么？去哪里查 lip 包？

LeviLamina 的包名是 `github.com/LiteLDev/LeviLamina`，LiteLDev 组织下的仓库可简写，如 `lip install LeviLamina`（等同完整写法；新建服务端更推荐 `lip setup --game <版本>`，会自动选配合适的 LeviLamina）。lip 没有中心化仓库，包就是公开 git 仓库的地址；想找 mod 可以运行 `lip` 打开交互界面的 Get mods 页面，或在 levimc.org 上浏览。

*适用版本：lip 0.41.x 及以上*

## 用 lip 安装/升级 LeviLamina 时中途中断（目录里残留 `bdsdown.exe` 等），或在已有旧服务端文件的目录安装后无法开服，应该怎么正确安装和升级？

新建服务端：在空文件夹中执行 `lip setup --game <版本>`（或 `lip install LeviLamina`），再用 `lip install` 装需要的 mod，然后把旧服的 `worlds/`、`server.properties`、`allowlist.json`、`permissions.json` 以及各 mod 的配置复制过来。旧的 `bedrock_server_mod.exe` 无需保留，安装 LeviLamina 时会重新生成。

升级：对已由 lip 管理的服务端，直接在该目录执行 `lip setup --game <新版本>`，世界与上述配置文件会保留；与新版本不兼容的 mod 会被列为 left-out 并询问是否卸载。

中断：当前 lip 的安装是原子操作，中途中断后下一次 `lip setup/install/update/uninstall/run` 会自动撤销或完成上次操作，无需手动删除残留文件（不要删除 `.lip/journal` 和 `.*.bak`）。

开不了服时先看服务端输出和 `logs\latest.log`（常见如端口被占用、mod 加载失败）。

*适用版本：lip 0.41.x；LeviLamina 26.x*

## 用 lip 安装完 LeviLamina 后，用哪个文件启动服务器？

带 LeviLamina 的服务器要运行 `bedrock_server_mod.exe`（安装时由 PeEditor 从 `bedrock_server.exe` 生成），不要运行原版 `bedrock_server.exe`。新版 lip 也可以直接在服务器目录执行 `lip run`（或在 lip 界面的服务器页面点击启动），有加载器时它运行的就是 `bedrock_server_mod.exe`。

## 用 lip 安装插件时没有下载过程直接显示完成，但 mods（旧版为 plugins）目录里却没有对应插件（例如 GMLIB），并提示缺少依赖，怎么办？

lip 有下载缓存，所以可能不下载直接完成；并且 lip 在工作区的 `.lip/state.json` 里记录已安装的包，若之前手动删除过已安装包的文件，lip 仍认为它已安装，不会对同一版本重新安装，就会出现文件缺失。解决：先 `lip uninstall <你显式安装的包>` 再 `lip install <该包>` 重新安装（依赖会自动一并卸载/安装）。注意 `lip uninstall` 只接受显式安装的包，像 GMLIB 这类作为依赖被装上的包不能直接卸载，要卸载依赖它的那个模组。如怀疑缓存损坏可执行 `lip cache clean` 清空缓存（Windows 下缓存位于 `%LOCALAPPDATA%\lip\Cache`）。不要手动删除 lip 安装的文件，卸载请用 `lip uninstall`。

*适用版本：lip 0.41.x*

## 能否用 lip 单独更新 BDS 本体？

可以。BDS 在 lip 中是包 `github.com/LiteLDev/bds`（即工作区的“游戏”）。在服务器目录执行 `lip setup --game <版本>`（例如 `lip setup --game 1.26.60`）即可换到指定 BDS 版本，lip 会同时选择适配该版本的最新 LeviLamina（也可用 `--loader levilamina@<版本>` 指定，或 `--no-loader` 只装原版），并把其他模组换成能配合的版本；世界、`server.properties`、`allowlist.json`、`permissions.json` 会保留。可加 `-n`（`--dry-run`）先预览会发生的变化。注意 `lip install`/`lip update` 不能直接更新 BDS，会提示改用 `lip setup`。

*适用版本：lip 0.41.x*

## 能用 lip 把 LeviLamina 更新到开发分支的最新 commit 吗？

不能得到未发布的开发构建。lip 安装/切换 LeviLamina（加载器）通过 `lip setup --loader levilamina@<已发布版本>`（或 `lip install` 不带 ref/带版本号时作为加载器安装）；虽然 `lip install` 支持 `@branch:<名>`/`@rev:<commit>` 引用，但 LeviLamina 的 `lip.toml` 资源地址指向 GitHub Release 的发布包，分支上取到的仍是已发布版本的构建。想用最新提交的构建，只能从 LeviLamina 仓库的 GitHub Actions（build 工作流）下载产物手动替换。注意 LeviLamina 默认分支现为 `main`（已无 `develop` 分支）。

*适用版本：LeviLamina 26.x；lip 0.41.x*

## 运行 lip 提示版本太老（显示 0.31 之类），但明明已经装了新版，怎么回事？

新旧两个 lip 同时存在，PATH 环境变量仍先指向旧 lip 的目录。用 `lip --version`（或 `lip -v`）确认当前实际运行的版本，在 PowerShell 中可用 `Get-Command lip`、cmd 中可用 `where lip` 查看实际路径；删除旧版或把 PATH 改为新 lip 的安装路径（修改后需重新打开终端）。之后可用 `lip self-update` 更新 lip 本身。

*适用版本：当前版本（Windows）*

## 把服务端直接装在磁盘根目录（如 `F:\`）时 lip 安装出错，怎么办？

不要把盘符根目录直接作为服务端目录（工作区）。请新建一个子文件夹（如 `F:\server`）作为工作区，再在其中用 `lip setup` / `lip install` 安装。

*适用版本：旧版 lip（当前版本未确认）。未能从源码或文档中直接证实，仅供参考。*

## 用 lip 下载/安装包时下载被中断，提示被 360 安全卫士拦截，怎么办？

这是杀毒软件（360）拦截了 lip 的下载或文件写入。右键托盘中的 360 图标退出，或将 lip / 服务端目录加入信任白名单后，重新执行一遍安装命令即可。

*未能从源码或文档中直接证实，仅供参考。*
