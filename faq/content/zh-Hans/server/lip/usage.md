# lip 的使用与配置

## 配置

### 模组已被目录收录，之后修改了仓库里的包描述文件（`tooth.json` / `lip.toml`），为什么目录上的信息一直不更新？

目录读取的是每个版本标签（`v<版本>`）处的包文件（`lip.toml`，没有时才读 `tooth.json`），列表中的名字、描述、标签等取自最新版本的包文件，而不是默认分支上的最新文件。只改仓库内容不发新标签，目录不会变。

正确做法：先改好 `lip.toml`（把 `version` 改高），再用新标签（如 `v0.2.0`）发布新版本；目录每小时构建一次，新标签会在下一次构建中出现。

详情页的 README 同样取自该版本标签处的仓库文件（`raw.githubusercontent.com/<作者>/<仓库>/v<版本>/README.md`），只改默认分支上的 README 也不会更新；只有 Gallery（默认分支上的 `docs/showcase/showcase.json`）在下一次构建中直接生效。

*适用版本：当前 LeviMC 模组目录（levimc.org/mods）*

### 发布给 lip 的插件需要把编译好的二进制提交到源码仓库或单独开仓库存放吗？

不需要。在 `lip.toml` 中给变体条目加一个 `type = "mcmod"`（LeviLamina 模组 ZIP）或 `type = "zip"` 的资源，`urls` 指向 GitHub Release 的附件即可，例如 `https://github.com/<you>/my-mod/releases/download/v{{version}}/my-mod-server-windows-x64.zip`。

- `zip` 资源需再用 `place` 指定把 ZIP 中哪些文件放到哪里，例如 `place = [{ src = "my-mod/", dest = "mods/my-mod/" }]`。
- `mcmod` 则要求 ZIP 根部有 `manifest.json`，整体放入 `mods/<模组名>/`。
- LeviLamina、LSE 及 levilamina-mod-template 都用 `zip` + Release 附件的方式，模板的发布工作流会自动构建并上传 `<仓库名>-server-windows-x64.zip` 等 ZIP。

国内用户访问 GitHub 慢时，可用 `lip config set github_proxy <URL>` 设置 GitHub 代理，或使用 `HTTPS_PROXY` 等系统代理环境变量。

*适用版本：lip 0.40 及以上（lip.toml）*

### 新版 lip 的配置文件和缓存存放在哪里？能放到当前目录吗？

lip 的用户级配置和缓存放在各平台的标准用户目录，不放在当前目录：

- 配置（`config.toml`）：Windows `%APPDATA%\lip`，Linux/macOS `$XDG_CONFIG_HOME/lip`（默认 `~/.config/lip`）
- 缓存：Windows `%LOCALAPPDATA%\lip\Cache`，Linux/macOS `$XDG_CACHE_HOME/lip`（默认 `~/.cache/lip`）
- 数据（如 Wine）：Windows `%LOCALAPPDATA%\lip\Data`，Linux/macOS 默认 `~/.local/share/lip`
- 状态（界面的工作区列表）：Windows `%LOCALAPPDATA%\lip\State`，Linux/macOS 默认 `~/.local/state/lip`

每个服务器目录（工作区）里另有 `.lip/` 目录，存放 `state.json`、工作区配置 `.lip/config.toml`、日志等。旧版的 `liprc.json` 会被自动转换为 `config.toml`，`tooth_lock.json` 会被转换为 `.lip/state.json`。如果下载的文件似乎损坏、同一个安装一再失败，可以执行 `lip cache clean` 清理缓存后重试，这不会丢失任何东西。

*适用版本：lip 0.40 及以上（当前 0.41.1）*

### 用 lip 安装新的服务端（BDS）时无论输入什么版本号都报错，怎么解决？

多半是网络/代理配置问题。用 `lip config list` 检查 lip 的 GitHub 代理设置 `github_proxy`：代理不可用或不支持 git 仓库时，用 `lip config delete github_proxy` 删除（或 `lip config set github_proxy ""` 直连），或换一个可用的代理 `lip config set github_proxy https://代理地址/`。

lip 的版本列表来自 `https://levimc.org/api/v4/mc/versions/`，服务端本体从 `www.minecraft.net` 下载，这两处也需能访问。建服命令为 `lip setup --game <版本>`（如 `1.26.60`）。失败时可查看 `.lip/logs/` 下的失败报告定位原因。

*适用版本：lip 0.38+（C# 重写后，配置键为 `github_proxy`；已在 0.41.1 核对）*

### 给 lip 配置了 GitHub 镜像/代理后报错，地址写成了 `https:/xxx`，问题在哪？

URL 协议头写错了，少了一个斜杠，应为 `https://xxx/` 这种完整的 URL 前缀。当前版本的 lip 用 `github_proxy` 配置项设置 GitHub 代理，改正方法：

```shell
lip config set github_proxy https://xxx/
```

也可以直接编辑 `%APPDATA%\lip\config.toml` 中的 `github_proxy`，或在 lip 界面的「设置」页面填写 GitHub 代理。设为空字符串（`lip config set github_proxy ""`）表示直连 GitHub，`lip config delete github_proxy` 恢复为未配置。

*适用版本：lip 0.40 及以上（`config.toml` / `github_proxy`）；旧版 lip 对应 `liprc.json` 中的镜像配置*

### lip 安装包时下载超时（多次重试、换电脑都不行），怎么办？lip 如何指定安装到哪个文件夹？

GitHub 慢或被屏蔽时，设置 GitHub 代理：`lip config set github_proxy <代理地址>`（地址后接 `<所有者>/<仓库>/…` 必须能得到 GitHub 上对应内容），或在终端设置 `HTTPS_PROXY` 等环境变量使用普通网络代理，然后重试。可用 `curl "<代理地址>/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"` 测试代理是否返回 200。

lip 的工作区就是当前工作目录，没有指定其他目录的选项：要装到哪个文件夹，就先 `cd` 到那个目录再执行 lip 命令。

*适用版本：lip 0.40 及以上*

### lip 设置过 GitHub 代理等配置后，怎么删除（remove）该配置？

用 `lip config delete <KEY>` 删除，使其回到默认值，例如 `lip config delete github_proxy`（不走代理，界面连不上 GitHub 时会重新询问）。如果想明确“直接连接、不再询问”，则设为空值：`lip config set github_proxy ""`（PowerShell 中写 `lip config set github_proxy --% ""`）。

*适用版本：lip 0.40 及以上（“界面重新询问”的区别自 0.41.0 界面起才有意义）*

### lip/启动器通过 GitHub 镜像克隆 LeviLamina 时失败（如 `fatal: unable to access 'https://github.bibk.top/LiteLDev/LeviLamina.git/': Recv failure: Connection was reset`），如何更换 GitHub 镜像（代理）？

旧的默认自建镜像 `github.bibk.top` 受网络干扰严重，可换用其他 GitHub 代理：

1. 独立版 lip：执行 `lip config set github_proxy https://v4.gh-proxy.org/https://github.com/`（gh-proxy 这类服务需要在地址后带完整的 `https://github.com/` 前缀）。可用 `curl.exe -s -o NUL -w "%{http_code}" "<代理>/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"` 测试代理，返回 200 即可用；不想用代理时 `lip config delete github_proxy`。lip 的终端界面设置页也可以设置并会先测试。
2. LeviLauncher：在设置的「Package Management（包管理）」页的 GitHub 代理一栏选择预设或手动填写（1.1.0 起默认已改为 <https://gh-proxy.org/https://github.com>，预设中还有 `v4.gh-proxy.org`、`gh.bibk.top` 等），改完不需要重装启动器。
3. 也可以直接用普通代理：lip 会读取 `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` 环境变量，没有时使用系统代理。

另外 lip 通过 `github_proxy` 请求失败时会回退为直连 GitHub。

*适用版本：lip 0.40+（独立版）；LeviLauncher 1.1.0 及以上（内置包管理器）*

### lip 配置 GitHub 代理后下载 `bedrock-runtime-data` 报 HTTP 404（`Failed to download from https://gh-proxy.com/LiteLDev/bedrock-runtime-data/releases/download/...`），如何正确设置代理？

代理地址写错了：gh-proxy 这类代理要求在其地址后接完整的 GitHub 地址（只写 `https://gh-proxy.com/` 或 `https://gh-proxy.org/` 会得到 404）。lip 会把 `<所有者>/<仓库>/...` 直接拼在 `github_proxy` 后面，所以应设置为：

```shell
lip config set github_proxy https://v4.gh-proxy.org/https://github.com/
```

设置前可用下面的命令测试，返回 200 说明可用：

```shell
curl.exe -s -o NUL -w "%{http_code}" "https://v4.gh-proxy.org/https://github.com/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"
```

*适用版本：lip 0.40 及以上*

### mod 迁移到新的 GitHub 仓库后，要被 lip/模组列表收录需要改什么？

包 ID 必须与仓库路径一致。现在的包使用 `lip.toml`，要把其中的 `id` 改为新仓库路径，例如仓库为 `https://github.com/user/repo` 时写 `id = "github.com/user/repo"`；否则该提交不被视为包，lip 不会安装（模组列表自然也无法正常安装它；收录方式见 levimc.org 的「用 lip 发布你的模组」教程）。

旧格式 `tooth.json` 中对应的是 `tooth` 字段（可用 `lip pkg migrate` 迁移到 `lip.toml`，`tooth` 会变为 `id`）。改完后打新的版本标签 `v<版本>` 发布，且 `version` 要等于标签版本。

*适用版本：lip.toml 格式 4（当前）；旧 tooth.json 包同理改 `tooth` 字段*

### 发布 LeviLamina mod 时，包文件中对 LeviLamina 的依赖版本能否锁定为一个具体版本？模组图标应写在哪里？

不建议锁死单一版本：不带运算符的完整版本（如 `"26.60.8"`）只匹配该版本，LeviLamina 一发新版本你的 mod 就无法通过 lip/启动器安装到新版本上，只能手动放入。建议写范围，例如：

```toml
[variants."".deps]
"github.com/LiteLDev/LeviLamina" = "26.60.*"
```

或 `">=26.60.0 <26.70.0"` 之类（语法同 Semver for .NET 的 `SemVersionRange`，支持 `^`、`~`、`*`、`>=…<…`、`||`）。

另外 `id` 要与实际仓库地址一致；模组图标写在 `[info]` 下的 `logo`（必须以 `https://` 开头），例如 `logo = "https://raw.githubusercontent.com/<owner>/<repo>/refs/heads/main/.../pack_icon.png"`。旧 `tooth.json` 中对应的是 `dependencies` 和 `info.avatar_url`，迁移时 `avatar_url` 会变为 `info.logo`。

补充：客户端条目（`side = "client"`）依赖的也是不带 `#client` 的 LeviLamina，官方模板写作 `">26.60.6 <26.61.0"`（因为 26.60.6 及以前的 `tooth.json` 版本默认变体是服务端构建）。

*适用版本：lip.toml 格式 4（当前）；LeviLauncher 1.1.0+ 内置包管理器；旧 tooth.json 包对应 `dependencies`/`avatar_url`*

## 功能与版本

### LeviLamina 的插件/模组去哪里找、去哪里发布？（旧论坛、lippkg、bedrinth 都打不开了）

LiteLDev 论坛早已关闭，`lippkg.com`、`bedrinth`、`pkg.levimc.org` 也都已弃用。现在的插件/模组目录是 LeviMC 模组：<https://levimc.org/zh-Hans/mods/>，每个模组页面都给出安装命令，可以用 lip（`lip install github.com/<作者>/<仓库>`，或在 lip 界面的「获取模组」页）安装，客户端模组也可在 LeviLauncher 里浏览安装。作者发布模组只需在 GitHub 上用 `lip.toml` 发版本标签，目录会自动或经 PR 收录；问题反馈请走各项目的 GitHub issue。

*适用版本：当前所有版本（lip 0.40 及以上、LeviLauncher）*

### 自己在 GitHub 发布了 LeviLamina 模组，怎样才能被 lip 的模组目录（LeviMC 模组 / LeviLauncher）收录？为什么一直搜不到？

现在的目录是 LeviMC 模组（<https://levimc.org/zh-Hans/mods/>），lip 的「获取模组」页和 LeviLauncher 都读它，原来的 lipr / bedrinth 已被替代。它由 `LiteLDev/liteldev.github.io` 仓库里的 `mods/repos.txt` 仓库列表构建：

1. 自动发现：每两小时有机器人用 GitHub 代码搜索查找根目录带 `lip.toml`（或旧的 `tooth.json`）、且有 lip 能读取的版本标签的仓库，然后发 PR 把它加入 `repos.txt`；维护者合并后，在下一次每小时构建中出现。fork 仓库不会被发现。因为依赖 GitHub 代码搜索（其配额也常被用尽而跳过某次运行），新仓库在 GitHub 建好代码索引之前可能搜不到，这时直接走第 2 步自己发 PR 最快。
2. 想更快上架：自己发 PR 编辑 `mods/repos.txt`，加一行 `<作者>/<仓库>`。
3. 收录条件：版本标签必须是 `v` 加完整语义化版本（如 `v1.0.0`，不能是 `1.0.0` 或 `v1.0`），且标签处 `lip.toml` 的 `version` 与之一致；最新版本依赖 LeviLamina（直接或间接）；把文件放到 `mods/`（或 `plugins/` 等）；仓库不是 GitHub 模板，名字不以 `-template`、`-example`、`-demo`、`-sample`、`-test` 结尾。
4. 自查：`lip pkg view github.com/<作者>/<仓库>` 应在 `versions` 中列出你的版本；也可在测试服务器上 `lip install`（加 `--dry-run` 可不改文件）。

不想被收录：关闭机器人发的 PR（关闭后不会再提议）或删除 `repos.txt` 中的那一行。另外，lip 本身不依赖目录，没被收录的仓库也能用 `lip install github.com/<作者>/<仓库>` 直接安装。

*适用版本：lip 0.40 及以上（发布 lip.toml 包需 lip 0.41 的 `lip pkg` 命令）；当前 LeviMC 模组目录*

### 一个仓库里放了多个 mod/插件，不想拆成多个仓库，能发布到 lip 吗？发布 lip 包必须发 GitHub Release 吗？

lip 的包 ID 就是仓库路径（如 `github.com/user/repo`），一个仓库对应一个包，但一个包可以有多个变体（variant），用来在同一仓库里放多个 mod：在 `lip.toml` 里为每个 mod 写一个 `[[variants."<名字>"]]` 条目（名字匹配 `^[a-z0-9_]+(/[a-z0-9_]+)?$`），用户用 `lip install github.com/user/repo#<名字>` 选择安装哪个（LSE 的 `#lua`、`#nodejs` 等引擎就是这样做的）。注意同一仓库的所有变体共用版本标签。版本就是名为 `v<SemVer>` 的 git 标签（如 `v1.2.3`），且该标签处 `lip.toml` 的 `version` 必须一致；“发布”本质上是推送这个标签，GitHub Release 只是用来托管 assets 里 `urls` 指向的 ZIP 文件。如果确实想让各 mod 独立版本，也可以为每个 mod 建一个只放 `lip.toml` 的仓库，让其 zip/mcmod 资源的 `urls` 指向大仓库 Release 里的文件。

*适用版本：lip v0.40 及以上（lip.toml 格式 4）；旧版 tooth.json 中以 label 区分变体*

### lipui（lip 的图形界面）还能用吗？不会用命令行有没有图形界面？想装指定版本的 BDS 怎么办？

lipui 已归档，不再可用。它的功能已并入 lip 本身：在终端里只输入 `lip`（不带参数）就会打开 lip 的界面，首页会引导你创建服务器、安装模组、启动服务器，无需记命令。安装指定版本的 BDS：界面中创建服务器时选择版本，或用命令 `lip setup --game <版本>`（如 `lip setup --game 1.21.0`，默认带适配的最新 LeviLamina，可用 `--loader levilamina@<版本>` 或 `--no-loader` 调整），也可以 `lip install github.com/LiteLDev/bds@1.21.0 LeviLamina`（游戏 1.21.0 加适配它的最新 LeviLamina）。只需下载服务端文件时也可用 bdsdown（`lip install github.com/LiteLDev/bdsdown`）。

*适用版本：lip v0.40 及以上（内置界面）*

### 用 lip 安装包必须写版本号吗？不写能自动装最新版吗？

不需要写。`lip install github.com/user/repo` 会安装该仓库最高的版本标签（`v<SemVer>`）；需要指定版本时写 `github.com/user/repo@1.0.0`（对应标签 `v1.0.0`），也可用 `@branch:<名>`、`@tag:<名>`、`@rev:<完整提交>`。LiteLDev 的仓库可省略前缀，如 `lip install LeviLamina`。安装不需要 `-y` 确认参数。用法见 <https://levimc.org/zh-Hans/lip/>。

*适用版本：lip 0.26 之后至今（当前 v0.41.1）*

### lip 能否像 npm 一样在当前目录维护依赖清单，lip install 时自动写入，从而通过分享清单实现“整合包”？

不能。`lip install` 只把包安装进服务器文件夹并记录在 `.lip/state.json` 中，从不写入 `lip.toml`，lip 也没有类似 `package.json` 的工作区清单。想一次安装一组包（整合包），可以自己做一个包：在其 `lip.toml` 的 `deps` 里写上需要的所有包（类似 LegacyScriptEngine 默认变体依赖 quickjs 与 lua 两个引擎变体的做法），发布后别人 `lip install <你的包>` 即可一并装好。发布教程见 <https://levimc.org/tutorials/develop/publish-a-package/>。另外，lip 只管理服务端；`lip.toml` 的条目以 `side = "server"`/`"client"` 区分两端，客户端模组由 LeviLauncher 等启动器读取同样的包来安装。

*适用版本：当前 lip（lip.toml 时代）*

### LeviLauncher 的 mod 下载和 lip 是什么关系？Lamium 等外国作者的 mod 也是走 lip 吗？

是的。LeviLauncher 内置了 lip 的包管理，下载/安装/更新 LeviLamina 模组实际就是在用 lip，模组目录来自 levimc.org 的 lip 模组索引；Lamium（`github.com/amatouhake/Lamium`）等模组同样通过 lip 分发，而不是托管在 CurseForge。启动器模组页中“包管理模组”是由 lip 管理的模组，“普通模组”是 `mods` 目录中不由 lip 管理的模组（如手动导入的）。

*适用版本：LeviLauncher v1.1.0（当前版本）*

### lip 可以用来下载 BDS 吗？

可以。lip 的游戏包就是 `github.com/LiteLDev/bds`：`lip install github.com/LiteLDev/bds@<version>` 安装不带加载器的 Windows 版服务器，加 `#linux` 为 Linux 版；也可用 `lip setup --game <version> --no-loader`。若要带 LeviLamina，直接 `lip install LeviLamina` 即可自动配好对应 BDS。如果只是需要下载 BDS 文件，也可以使用 bdsdown 工具（`lip install github.com/LiteLDev/bdsdown`）。

*适用版本：lip v0.41.0 及以上*

### lip 安装软件包时执行的钩子命令如果失败，lip 会怎么处理？

钩子命令以非零退出码退出会使整个操作（安装/卸载）失败，lip 会撤销本次操作的文件改动，但不会撤销钩子命令自己做过的事，所以钩子命令应能安全地重复执行。现在包描述文件为 `lip.toml`，钩子写在条目的 `hooks` 中（`pre_install`、`post_install`、`pre_uninstall`、`post_uninstall`）。每个条目只对应一个运行端和平台，跨平台时为每个平台各写一个条目和各自的命令；Windows 平台的命令以 `cmd /s /c` 运行（在 Linux/macOS 上通过 Wine），其他平台以 `sh -c` 运行。

*适用版本：lip v0.40/v0.41（lip.toml）；旧 tooth.json 的 scripts 会被转换为 hooks*

### lip 能不能像 pacman 那样只输入包名（如 `lip -S levilamina`）就从模组列表搜索安装？

命令行不能按包名搜索安装。lip 包由来源（仓库地址）唯一标识，如 `github.com/LiteLDev/LegacyScriptEngine`，没有中央仓库，第三方包必须写完整仓库路径。例外：不含 `/` 的名字视为 `github.com/LiteLDev/` 下的仓库，所以 LiteLDev 官方包可以写简称，如 `lip install LeviLamina`、`lip install LeviOptimize`。想按名字搜索，可在终端输入 `lip` 打开界面，在“获取模组”页搜索 levimc.org 上收录的模组，或在 <https://levimc.org/mods/> 查找。

*适用版本：lip v0.41.0 及以上*

### lip 能否像 `npm -g` 那样把软件包安装到全局环境？

不能。lip 没有全局安装的概念，每个命令的工作区就是当前工作目录（服务器文件夹），包都安装到这个工作区中，也没有指定其他工作区的选项，需要先 `cd` 到服务器目录再执行命令。

*适用版本：当前所有版本 lip*

### 用 lip 安装 LeviLamina 后多出一个名为 loc 的包（levilamina-loc），这是什么？需要手动安装吗？

这是 `github.com/LiteLDev/levilamina-loc`，LeviLamina 的语言包（Localization），内容会放到 `mods/LeviLamina/lang/`。它是 LeviLamina 声明的依赖，安装 LeviLamina 时 lip 会自动装上，不需要手动处理。

*适用版本：当前所有 LeviLamina 版本（服务端和客户端）*

### 新版 lip 还能安装使用旧格式 `tooth.json`（`format_version` 1/2/3）的包吗？包作者该怎么处理？

能。当前 lip（v0.40.0 起的正式版，最新 v0.41.1；v0.37.0 及更早使用 `tooth.json`）的包描述文件已改为 `lip.toml`（`format = 4`），但仍会读取 lip v0.x 时代的 `tooth.json`（format 1、2、3）：format 1/2 先按 format 3 解读，再在本地转换成 `lip.toml` 的结构后安装，与普通包无异；旧工作区的 `tooth_lock.json`、`liprc.json` 也会在首次使用时自动迁移为 `.lip/state.json`、`config.toml`。

包作者应在新版本中改用 `lip.toml`，可在仓库根目录执行 `lip pkg migrate` 把 `tooth.json` 转换为 `lip.toml`（会删除 `tooth.json`，需检查警告后提交），再用 `lip pkg view .` 检查。旧格式文档不必再去翻旧 tag，lip 文档的 `lip.toml`「Earlier formats」一节说明了 `tooth.json` 的读取规则。

注意：新版 lip 没有中心仓库也没有模块代理（不再走 goproxy/lipr），直接从 git 仓库获取包；GitHub 慢时用 `lip config set github_proxy <URL>` 设置代理。

*适用版本：lip 0.40.0 及以上（lip.toml 时代，当前最新 0.41.1）*

### 用 lip 直接安装 Glacie（多版本互通模组）后报错/不工作，控制台显示装的版本与服务端不匹配，或指定版本安装失败，怎么办？

Glacie 的包清单没有声明对 LeviLamina/游戏版本的依赖，所以 lip 不带版本号安装时会装最新版，未必和你的服务端版本匹配。需要按服务端版本选对应的 Glacie 版本，安装时指定版本号：`lip install github.com/GlacieTeam/Glacie@<版本>`，或到 GitHub Release 手动下载对应版本；版本对应关系请看 Glacie 的 README 和更新日志，出问题时先看控制台输出的实际版本号是否匹配。

如果 lip 读不了新格式的包而安装失败，说明 lip 太旧，先用 `lip self-update` 或从 <https://github.com/LiteLDev/lip/releases> 更新 lip。

*适用版本：lip 0.40 及以上；Glacie 3.x（`tooth.json` `format_version` 3，无 LeviLamina 依赖声明）*

### 用 lip 安装插件/LeviLamina 后提示与当前 LeviLamina（或 BDS）版本不适配，是怎么回事？

常见原因是安装命令里写死了旧版本号（如插件说明中给出的 `lip install <仓库>@x.y.z`），装上的是旧版本，与当前 LeviLamina 不匹配。把命令中的 `@x.y.z` 去掉，lip 会安装能在当前工作区使用的最新正式版本。

游戏（BDS）与 LeviLamina 的版本由 lip 统一选择：`lip install LeviLamina` 会安装最新的 LeviLamina 以及它支持的最新游戏版本；`lip install` 不会替换已装的游戏/加载器，如果某个模组需要更新的 LeviLamina，命令会失败并提示用 `lip setup` 先切换游戏和加载器版本（例如 `lip setup --game <version>`），再安装模组。开服后可用 `version` 命令确认 LeviLamina 版本。

旧版 lip 一键安装拉取 LeviLamina 不支持的最新 BDS 的问题已不再出现。

*适用版本：lip 0.41.x（当前版本）*

### lip 的源码仓库在哪？从 BDS 官网下载的最新 BDS 能直接配 LeviLamina 用吗？

lip 仓库地址为 <https://github.com/LiteLDev/lip>（旧地址 `futrime/lip` 会重定向过去）。官网下载的最新 BDS 往往比 LeviLamina 支持的版本新，不能直接用；应使用 LeviLamina 对应的 BDS 版本。推荐直接用 lip：`lip install LeviLamina` 会安装最新 LeviLamina 及其支持的最新游戏版本，或用 `lip setup --game <版本> --loader levilamina` 指定游戏版本并自动选匹配的 LeviLamina。

### 想在旧版本 BDS（如 1.21.1）上部署 LeviLamina + LegacyScriptEngine，有没有对应整合包？

没有官方整合包，可用 lip（v0.41.0 及以上）按版本搭建。

游戏和加载器：在空的服务器目录中运行 `lip setup --game 1.21.1`（自动选适配该游戏版本的最新 LeviLamina，也可用 `--loader levilamina@<版本号>` 指定），或 `lip install github.com/LiteLDev/bds@1.21.1 LeviLamina`。

LSE：从 LSE v0.10.0 起各引擎以变体形式发布，可用 `lip install github.com/LiteLDev/LegacyScriptEngine#lua@<版本号>`（`#<变体>` 写在 `@` 之前）安装与所用 LeviLamina 匹配的版本。

但 1.21.1 这一代（LeviLamina 0.13.x，对应 LSE 0.8.x）的 LSE 仓库里没有 `#lua` 等变体，各引擎包托管在 `gitea.litebds.com` 上，目前无法通过 lip 安装；这种情况只能从 LSE 的 GitHub Releases 下载对应版本的 `legacy-script-engine-<引擎>-windows-x64.zip` 手动安装（LegacyMoney 等依赖也要自行装匹配版本）。

*适用版本：lip 0.41.0 及以上（`lip setup` 与裸名 `LeviLamina` 自 0.41.0 起才有）；LSE 变体安装仅适用于 LSE 0.10.0+。未能从源码或文档中直接证实，仅供参考。*

### 发布供 lip 安装的包时，GitHub 版本标签有什么格式要求？标签没带 `v` 导致装不上、目录搜不到怎么办？

lip 只把名字恰好为 `v` 加 SemVer 2.0.0 版本号的标签当作版本，例如 `v1.1.0-rc.1`、`v2.0.0`；`1.1.0-rc.1`、`2.0.0`、`v1.2`、`v01.2.3` 等都会被忽略，lip 和 LeviMC 模组目录、LeviLauncher 都会跳过。并且标签处 `lip.toml` 的 `version` 必须与标签一致（不带 `v`，如 `version = "2.0.0"`）。

修复方法：补发一个带 `v` 的标签/Release。lip 现在直接通过 git 协议查询仓库标签，不经过 Go 模块代理，也不缓存标签列表，新标签立刻生效，不需要再换 GOPROXY。

在 `lip.toml` 中可以用 `{{version}}` 引用版本号（例如在资源 URL 里），`{{id}}` 引用包 ID。可用 `lip pkg view github.com/<作者>/<仓库>` 确认版本是否被识别。

*适用版本：lip 0.40 及以上（lip.toml 格式 4）；旧 tooth.json 包的标签规则相同*

### lip 能安装本地的包吗？开发时能否不发布就在本地测试自己的包？

可以。把根目录带 `lip.toml` 的 ZIP 文件或文件夹路径交给 `lip install` 即可，例如 `lip install ./my-mod.zip` 或 `lip install ../MyTool`（也支持 `https://` 上的 ZIP）。ZIP 只按内容识别，扩展名无所谓，旧的 `.tth` 改名做法已不需要；可用 `lip pkg pack <目录> -o my-mod.zip` 打包，用 `lip pkg view .` 检查 `lip.toml` 能否被读取。

另外也可以在推送标签前用 `lip install github.com/user/repo@branch:main` 或 `@rev:<40位提交>` 测试。

建议尽量都用 lip 管理（包括 LeviLamina 本身），手动放进去的文件不在 lip 的状态记录中，lip 无法据此解析依赖关系。

*适用版本：lip 0.40 及以上（`lip pkg` 系列命令需 lip 0.41+）*

### 自己发布 lip 包时，照抄 LeviLamina 的包文件却无法安装，常见原因是什么？

1. 版本 tag 必须严格是 `v` + 完整 SemVer，例如 `v1.2.3`；`v1.2`、`1.2.3`、`v01.2.3` 之类不算版本（不过可以用 `lip install github.com/user/repo@tag:1.2.3` 安装任意 tag）。
2. lip 读取的是 tag 所指提交里的 `lip.toml`（没有时读 `tooth.json`），修改包文件后要提交并打新 tag 推送，旧 tag 内容不会变。
3. `lip.toml` 中的 `id` 必须等于仓库路径（如 `github.com/user/repo`），`version` 必须等于 tag 版本，且所请求的 variant 要有适配当前环境（平台/side）的条目，否则该版本不会被当作候选。
4. 仓库必须是公开的。

可用 `lip pkg view <仓库或 .>` 检查 lip 能否读取。

*适用版本：lip 0.40 及以上*

### lip 的旧文档网站（`lip.futrime.com`、`futrime.github.io/lip`、`lip.levimc.org` 等）打不开了，现在去哪里看 lip 文档？

lip 文档现在放在 LeviMC 官网：<https://levimc.org/zh-Hans/lip/>（英文 <https://levimc.org/lip/>，繁体 <https://levimc.org/zh-Hant/lip/>）。文档源码在 GitHub 仓库 `LiteLDev/liteldev.github.io` 的 `docs/lip/` 目录。lip 仓库本身已迁到 <https://github.com/LiteLDev/lip>。在终端里可以用 `lip --help`（或 `lip -h`）查看帮助，`lip <命令> --help` 查看单个命令的帮助。

*适用版本：lip 0.40 及以上*

### lip 的包索引网站（`lippkg.com` / `bedrinth.com` / `pkg.levimc.org`）打不开或证书过期，lip 是不是停了？还能用 lip 安装包吗？

lip 没有停，只是包目录网站多次换址：`lippkg.com` → `bedrinth.com` → `pkg.levimc.org`，这些旧地址都已弃用，不要再用。现在的目录是 LeviMC 模组：<https://levimc.org/zh-Hans/mods/>（lip 界面里的「获取模组」页和 LeviLauncher 显示的也是这个目录）。另外，目录网站挂了并不影响 lip 安装：lip 没有中央仓库，直接从包的 git 仓库读取版本，用 `lip install github.com/<作者>/<仓库>` 照样能装。

*适用版本：lip 0.40 及以上*

### 用 lip 配置好的服务端，用 Windows 自带压缩打包后 `.lip` 文件夹丢失，为什么？

Windows 11 自带的压缩功能可能会跳过以 `.` 开头的（隐藏）文件夹，导致 `.lip` 丢失。请改用 7-Zip 等第三方压缩工具，打包/迁移服务器时务必连同 `.lip` 一起复制——`.lip` 记录了已安装的包、工作区设置等，在 Windows 上是隐藏目录。压缩行为取决于 Windows 版本。

*未能从源码或文档中直接证实，仅供参考。*
