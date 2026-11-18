# LegacyScriptEngine 的安装、配置与版本

## 安装

### LSE 的 Node.js 引擎（`legacy-script-engine-nodejs`）加载失败，报 `C++ Exception: std::system_error ... [0x0000007E:system] 找不到指定的模块`，依赖诊断显示 `missing module: libnode.dll`（或提示缺少 node 运行库），怎么解决？

原因：Node.js 引擎依赖 LiteLDev 自行预编译的 Node 运行库（`libnode.dll` 及配套文件），它不是系统里安装的 Node.js 提供的，装了系统 Node.js 也没用。这个运行库不包含在 LSE 的 GitHub release zip 里，手动解压安装 LSE（或使用面板服/网上整合包）时最容易漏掉。

推荐做法：用 lip 安装 Node.js 引擎，lip 会自动下载 libnode 等全部依赖：

```shell
lip install github.com/LiteLDev/LegacyScriptEngine#nodejs
```

README 中也写作 `lip install LegacyScriptEngine#nodejs`。不带 `#nodejs` 时默认只装 QuickJS 和 Lua 引擎，不会装 Node.js 引擎。下载需要较好的网络，必要时配置代理/镜像；lip 建议更新到最新版以获得更清晰的错误提示。

手动安装（如面板服无法运行 lip）：下载 <https://github.com/LiteLDev/node/releases/download/v22.12.0/node-prebuilt.zip>，把压缩包里的内容直接解压到 `mods/legacy-script-engine-nodejs/` 目录下（文件直接放在该目录，不要多套一层文件夹）。依赖的确切下载地址和放置位置以 LSE 包的 `lip.toml`（旧版本为 `tooth.json`）为准。也可以先在本地电脑上用 lip 装好整个服务端再打包上传到面板。如果之前放过旧版 libnode，先把服务端各处残留的旧 `libnode.dll` 删掉，避免加载到错误版本。

另外注意：各 LSE 引擎（quickjs、nodejs 等）版本必须一致；新版 LSE 不再依赖已归档的 LegacyParticleAPI。

*适用版本：LegacyScriptEngine 当前版本（v0.23.1，LeviLamina 26.60.x）*

### LSE 的 Python 引擎（`legacy-script-engine-python`）启动时报红：找不到 `python312.dll` / `python3.dll`、缺少模块或直接加载失败，装了 Python 3.13 也不行，该怎么处理？

自 LSE 0.9.0 起 Python 引擎不再自带 Python 运行环境，需要在运行服务器的机器上自行安装对应版本的 Python：

- LSE >=0.16.2（含当前 0.23.x）需要 Python 3.12.10；
- 0.9.0~0.16.1 为 3.12.8；
- \<0.9.0 为 3.10.11。

版本必须匹配，装 3.13/3.14 不行（引擎找的是 `python312.dll`）。安装后确保 Python 3.12 所在目录已加入 `PATH` 环境变量（多个 Python 版本可以共存，关键是 `PATH` 能找到 3.12 的 dll）；也可以把 `python312.dll` 等放到 `bedrock_server.exe` 所在目录。若直接双击 exe 正常、用面板启动却报错，多半是面板改动了 `PATH`。

如果服务器上没有 Python 插件（Python 插件极少），最简单的做法是不安装/卸载 Python 引擎：`lip uninstall LegacyScriptEngine#python`，或手动删除 `mods/legacy-script-engine-python` 目录，不影响 QuickJS/Lua/NodeJS 引擎。LSE 各引擎是独立的 lip 包变体（`#quickjs`、`#lua`、`#nodejs`、`#python`），只装插件实际需要的即可，装得越多负载越大；不带变体执行 `lip install LegacyScriptEngine` 只会安装 QuickJS 和 Lua。另外若 Lua 等其他引擎同时报错且怀疑下载损坏，可 `lip cache clean` 后重装。

*适用版本：LSE 0.9.0 及以上（当前 0.23.1 需 Python 3.12.10）；Windows 服务端*

### 在 LeviLamina 服务器上怎么运行旧的 LLSE（LiteLoaderBDS 时期）JS/Lua 等脚本插件？把单个 `.js` 文件丢进 `plugins` 目录后为什么没有加载？

1. LeviLamina 本体不内置脚本引擎，只加载原生 mod。运行 LLSE 脚本插件必须先安装 LegacyScriptEngine（LSE，它本身是 LeviLamina 的一个 mod），且版本要与当前 LeviLamina 匹配（LeviLamina 新版本刚发布时需等待对应 LSE 版本）。推荐用 lip 安装，会自动处理依赖：`lip install LegacyScriptEngine#quickjs`（JS），或 `#lua`、`#nodejs`、`#python`；不写变体（`lip install LegacyScriptEngine`）时同时安装 QuickJS 和 Lua 引擎。也可从 <https://github.com/LiteLDev/LegacyScriptEngine/releases> 手动下载成品（不要放源码）。可用 `ll list` 查看已加载的 mod，确认 LSE 是否加载成功。Python 引擎需在本机安装匹配的 Python（LSE >=0.16.2 对应 Python 3.12.10）。
2. 安装方法：单文件插件（`.js` / `.lua` / `.py`，Node.js 插件为 `.llplugin` 包）直接放进服务端的 `plugins/` 根目录即可；第一次启动时 LSE 会把它迁移到 `plugins/<插件名>/` 文件夹并自动生成 `manifest.json`，同时警告 `Legacy plugins have been migrated, please restart the server to load them!`，此时尚未加载，需要再重启一次服务器（或在控制台执行 `ll load <插件名>`）。迁移后修改代码请改 `plugins/<插件名>/` 里的文件。如果下载的是已带 `manifest.json` 的插件文件夹，直接把整个文件夹放进 `plugins/` 重启一次即可。
3. 若装好引擎后个别插件仍不工作，多半是插件本身与新版本不兼容或依赖其他前置（如 GMLIB 等），请使用作者适配新版的版本；插件内部写死的旧路径也可能需要修改。LL2 时代的 `.dll` 原生插件与 LeviLamina 不兼容，无法加载。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本（LSE 0.23.x / LeviLamina 26.60.x）*

### 在 LeviLamina 服务器上怎么安装 LegacyScriptEngine（LSE）及各语言引擎？旧命令（`gitea.litebds.com/LiteLDev/legacy-script-engine-xxx`、不带变体的 `lip install github.com/LiteLDev/LegacyScriptEngine` 等）装不上怎么办？能否手动安装？

推荐用 lip 在服务器根目录安装。LSE 是一个包，每种语言引擎是它的一个变体：

```shell
lip install LegacyScriptEngine#quickjs
lip install LegacyScriptEngine#lua
lip install LegacyScriptEngine#nodejs
lip install LegacyScriptEngine#python
```

`LegacyScriptEngine` 等价于 `github.com/LiteLDev/LegacyScriptEngine`；不带变体时 lip 会同时安装 QuickJS 和 Lua 两个引擎。用哪种语言的插件就装哪个引擎，不必全装。

前提是服务器已用 lip 装好 LeviLamina（`lip setup` 或 `lip install LeviLamina`）：`lip install` 不会安装或替换游戏和 LeviLamina，若 LSE 需要的 LeviLamina 版本与已装的不符会直接失败并提示用 `lip setup`。其余依赖（LegacyRemoteCall、LegacyMoney、iListenAttentively，nodejs 引擎还会装 Node 运行时 `node-prebuilt` 和 `7-zip-tooth`）由 lip 自动安装。旧的 `gitea.litebds.com/LiteLDev/legacy-script-engine-xxx` 包名已废弃。

LSE 版本必须与 LeviLamina 版本匹配，需要旧版时用 `@<版本号>` 指定（变体写在 `@` 之前，如 `LegacyScriptEngine#quickjs@0.23.1`）。

手动安装：到 <https://github.com/LiteLDev/LegacyScriptEngine/releases> 下载 `LegacyScriptEngine-server-<引擎>-windows-x64.zip`，把其中的 `legacy-script-engine-<引擎>/` 文件夹放进服务端的 `mods/` 目录，并手动装好 LegacyRemoteCall、LegacyMoney、iListenAttentively 等依赖（版本要匹配）；nodejs 引擎还要额外解压 `node-prebuilt.zip` 到同一目录，所以 nodejs/python 更建议用 lip。需要放哪些文件、依赖哪些包可以参照该版本仓库里的 `lip.toml`（旧版本为 `tooth.json`）。不要用 GitHub Actions 的构建产物，容易缺组件。

LLSE 脚本插件放进 `plugins/`（0.23.0 起是启动时自动创建的指向 `mods/` 的链接）即可，启动后会自动迁移并生成 `manifest.json`，重启后加载，不用自己建文件夹。

文档见 <https://levimc.org/zh-Hans/LegacyScriptEngine/> 和教程「给服务器安装模组」。

*适用版本：LSE 0.10.0 及以上（变体式包名）；当前最新 LSE 0.23.1 / LeviLamina 26.60.x / lip 0.41.x*

### LSE 的 quickjs、nodejs、lua、python 四个引擎都要装吗？怎么判断一个插件需要哪个引擎？

不需要全装，用到哪种插件就装哪个引擎（`lip install LegacyScriptEngine#quickjs` / `#lua` / `#nodejs` / `#python`；不带变体时默认装 quickjs 和 lua）。

判断方法：

1. 看插件文件后缀（`.js` / `.lua` / `.py`）。
2. js 插件分 QuickJS 和 Node.js 两种，带 `package.json` 的（使用 npm 包的）一般是 Node.js 插件，否则大概率是 QuickJS。
3. 最准确的是看插件 `manifest.json` 中的 `type` 字段（`lse-quickjs`、`lse-nodejs`、`lse-lua`、`lse-python`）以及 `dependencies` 里依赖的引擎（如 `legacy-script-engine-quickjs`）。

装错或漏装时启动日志也会提示缺少哪个依赖。

注意 Python 引擎需要本机安装对应版本的 Python（LSE >=0.16.2 为 3.12.10）。

*适用版本：当前所有版本（LSE 0.10.0 起为变体式包名；最新 0.23.1）*

### LSE 加载 Node.js 插件时自动执行 npm 安装依赖卡住/失败，插件因缺少 `node_modules` 无法加载，怎么办？另外为什么插件里 `require`/`import` 相对插件目录，而 `fs`、`path.resolve` 却从 BDS 根目录开始？

LSE 的 Node.js 引擎在加载插件时，若 `package.json` 声明了 `dependencies` 且插件目录下没有 `node_modules`，会自动执行 `npm install --omit=dev --no-fund`（使用 `legacy-script-engine-nodejs` 目录下随 lip 安装的 `node_modules`/npm）。

若是 `legacy-script-engine-nodejs` 不是用 lip 安装（缺少 npm）或网络原因导致失败：

1. 进入出问题的插件目录（`mods/<插件名>/`，即 `package.json` 所在目录；新版 LSE 会在 BDS 根目录创建指向 `mods` 的 `plugins` 链接），自行安装 Node.js（<https://nodejs.org/> 或 `winget install OpenJS.NodeJS.LTS`）后执行 `npm i`，网络不好可换 npm 镜像源或用代理。
2. 若上次失败留下了不完整的 `node_modules`，删除后重启即可让 LSE 重新自动安装。
3. 也可以重新安装该插件。

关于路径：CommonJS 下 `__dirname` 被设置为插件目录，模块解析也会查找插件目录及其 `node_modules`；但进程工作目录是 BDS 根目录，所以 `fs` 读写、`path.resolve` 等基于 cwd 的操作都相对 BDS 根目录，访问插件内文件请基于 `__dirname`（ESM 用 `import.meta.url`）拼接绝对路径。

*适用版本：LSE nodejs 引擎当前版本（0.23.x）*

### LSE 文档里说的插件目录 `/path/to/bedrock_dedicated_server/plugins` 指的是哪里？

指 BDS 服务端根目录（与 `bedrock_server_mod.exe` 同一目录）下的 `plugins` 文件夹。当前 LeviLamina 的模组目录是根目录下的 `mods/`，LSE 0.23.0 起会在启动时自动创建指向 `mods/` 的 `plugins` 链接（junction），所以把 LLSE 插件放进 `plugins/` 或 `mods/` 都可以，启动后会被自动迁移到 `mods/<插件名>/` 并生成 `manifest.json`，重启后加载。

注意：若服务器根目录下已存在一个真实的 `plugins` 文件夹（如旧版遗留），LSE 不会创建链接而是报错 `a file or directory with the same name already exists`，此时应把其中插件移到 `mods/` 并删除该 `plugins` 文件夹。

*适用版本：LSE 0.23.0 及以上（当前 0.23.x）*

### LeviLamina + LegacyScriptEngine 服务器的 `plugins` 目录里应该放哪些文件？下载到的 .jar、.pdb、.dll、.js/.py/.lua、压缩包分别怎么处理？

按文件类型处理：

1. `.jar` 是 Java 版插件，不能用。
2. `.pdb` 是调试符号文件，普通使用者不需要。
3. 单独的 `.dll` 不能直接装，LeviLamina 原生模组需要作者提供的含 `manifest.json` 的完整文件夹/压缩包（或用 lip 安装）。
4. 单文件的 `.js` / `.lua` / `.py` 直接放进 `plugins/`（LSE 0.23.0 起它是指向 `mods/` 的链接，也可直接放 `mods/`），首次启动会被自动迁移到 `mods/<插件名>/` 并生成 `manifest.json`，重启后才会加载（对应语言的引擎需已安装）。
5. 压缩包看里面是否有带 `manifest.json` 的文件夹，有的话把该文件夹整体放进 `mods/`；Node.js 插件则是 `.llplugin` 包，直接放入即可自动解压。
6. LegacyMoney（原 LLMoney）是 LSE 的依赖，用 lip 安装 LSE 时会自动安装。
7. 插件文件名最好去掉如 `[minebbs]-` 之类的前缀，因为文件名会成为模组名。

*适用版本：LeviLamina 当前版本；LSE 0.23.x*

### LeviLamina 下如何安装 LSE 的 Python 引擎？

在服务器根目录用 lip 安装 LSE 的 python 变体：`lip install github.com/LiteLDev/LegacyScriptEngine#python`（客户端用 LeviLauncher 安装）。Python 引擎还要求本机安装对应版本的 Python（LSE >=0.16.2 需 Python 3.12.10）。Python 插件较少，非必要可不装。

*适用版本：LSE 0.16.2 及以上（当前 0.23.x）*

### 为 LSE 写的 Node.js 插件应该怎么打包发布？打包后安装/`npm install` 后加载报错怎么办？

有两种方式：

1. 官方 `.llplugin` 方式：把 `package.json` 和所有源码打成 zip，后缀改为 `.llplugin`（不要把 `node_modules` 打进去），放进 `plugins/` 目录（`plugins` 是指向 `mods` 的链接）；启动时 LSE 会将其解压到 `mods/<插件名>/` 并自动执行 `npm install --omit=dev`，若目录中没有 `manifest.json` 会按 `package.json` 的入口自动生成一个，重启后加载。
2. 作为模组目录/lip 包发布：`mods/<插件名>/` 下放 `manifest.json`（`entry` 指向入口 js，`name` 与目录名一致，`type` 为 `lse-nodejs`，`dependencies` 中写 `legacy-script-engine-nodejs`）以及源码；为避免用户连不上 npm，可把 `node_modules` 一并带上，并写 `lip.toml` 用 lip 安装。

加载报错时先检查 `manifest.json` 的 `entry` 是否指向正确的入口文件。

*适用版本：当前 LSE（0.23.x）nodejs 引擎*

### 为了使用 SimpleTPS 这类 LSE 插件安装 LSE 时，必须安装 Python 版 LSE（并要求特定 C++/Python 版本）吗？

不需要。LSE 按语言分为多个引擎变体（`#quickjs`、`#nodejs`、`#lua`、`#python`），只需安装插件实际使用的那个，例如 JS 插件装 `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs`。不带变体执行 `lip install github.com/LiteLDev/LegacyScriptEngine` 只会装 QuickJS 和 Lua 引擎，不会装 Python 引擎。只有 Python 引擎才要求本机安装 Python（LSE >=0.16.2 为 3.12.10）；用不到的 Python 版 LSE 可以 `lip uninstall` 掉。

*适用版本：当前所有 LSE 版本（`lip.toml` 变体）*

### 为什么 `legacy-script-engine-quickjs` 加载不了？

常见原因是手动解压时目录结构错误：出现了嵌套文件夹（`mods/legacy-script-engine-quickjs/legacy-script-engine-quickjs/...`），或者目录里缺少 `manifest.json` / 是空文件夹。发布包 zip 内自带 `legacy-script-engine-quickjs/` 顶层目录，应保证 `manifest.json` 直接位于 `mods/legacy-script-engine-quickjs/` 下；手动安装还需自行装好其依赖（LegacyRemoteCall、LegacyMoney、iListenAttentively 及匹配的 LeviLamina）。推荐直接用 `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs` 安装。

*适用版本：LeviLamina 1.x 及以上；当前 LSE*

### 使用 LegacyScriptEngine 的 nodejs 引擎需要单独安装 Node.js 吗？

运行不需要。`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` 会自动下载 `node-prebuilt.zip`（含 libnode）放到 `mods/legacy-script-engine-nodejs/`，并安装 7-zip 等依赖。只有在本机开发 Node.js 插件（`npm init` 等）时才需要自己装 Node.js。

*适用版本：当前 LSE nodejs 引擎*

### 想用 JS 写 LeviLamina 服务器插件，从零搭建环境的步骤是什么？需要 xmake/cmake/mingw 吗？

运行和写 JS 插件不需要 xmake/cmake/mingw（那些只用于 C++ 模组开发）。步骤：

1. 从 <https://github.com/LiteLDev/lip/releases/latest> 下载安装 lip（`lip-<version>-win-x64.msi`）。
2. 国内网络可设置 GitHub 代理：`lip config set github_proxy <代理地址>`。
3. 新建服务器目录并 `cd` 进去，执行 `lip install LeviLamina --accept-eula`（会一并安装匹配的 BDS）。
4. 安装引擎：`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs`（或 `#quickjs`）。
5. 用 `lip run` 或运行 `bedrock_server_mod.exe` 启动。

插件放在 `mods/<插件名>/`（`plugins/` 是指向 `mods/` 的链接），需要 `manifest.json`（`name` 与目录名一致，`entry` 为入口 js 文件，`type` 为 `lse-nodejs` 或 `lse-quickjs`，`dependencies` 中写 `legacy-script-engine-nodejs` / `legacy-script-engine-quickjs`）和入口文件；Node.js 下 `package.json` 设 `"type": "module"` 可用 ES 模块。API 文档：<https://levimc.org/zh-Hans/LegacyScriptEngine/>。

也可手动下载，但需自行补全依赖（LegacyRemoteCall、LegacyMoney、iListenAttentively、7-zip、node-prebuilt 等）。

*适用版本：lip 0.41.x；LeviLamina 26.x；LSE 0.23.x*

### 跳过 lip、手动安装 LSE 的 NodeJS 引擎后，加载（`.llplugin`）插件时提示解码/解压失败，怎么办？

缺少 `7za.exe`。LSE nodejs 引擎调用 `7za.exe` 解压 `.llplugin`，lip 安装 `#nodejs` 变体时会通过依赖 `github.com/LiteLDev/7-zip-tooth` 自动把 `7za.exe` 放到服务端根目录；手动安装时需自行从该仓库获取 `7za.exe` 放到服务端根目录（不需要运行它）。另外 libnode 应位于 `mods/legacy-script-engine-nodejs/`（来自 `node-prebuilt.zip`），不是服务端根目录。推荐直接用 `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` 安装。

*适用版本：当前 LSE nodejs 引擎（手动安装时）*

### LeviLamina 下安装 iLand 等 Lua 插件后完全不加载、控制台也没有任何报错，怎么解决？

通常是没装对应语言的脚本引擎或插件依赖的库，或者插件文件不完整。在服务器根目录用 lip 安装 Lua 引擎：`lip install LegacyScriptEngine#lua`（不带变体的 `lip install LegacyScriptEngine` 会同时安装 QuickJS 和 Lua 引擎），lip 会自动处理依赖。启动日志中应能看到 Lua 引擎被加载。若插件安装不完整，可先 `lip cache clean` 清理缓存再重新安装插件。

*适用版本：LSE 0.23.x / lip 0.41.x（当前版本）*

### 在较旧 BDS（如 1.21.70）的 LeviLamina 服务端上用 lip 安装 LSE nodejs 引擎报依赖冲突，怎么安装对应版本？

不带版本号时 lip 默认安装最新 LSE，其依赖的 LeviLamina 版本与旧服务端冲突。需指定与服务端匹配的 LSE 版本，语法为 `<repo>#<variant>@<version>`（变体写在 `@` 之前），例如 `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs@0.11.3`（BDS 1.21.70 / LeviLamina 1.2.x 时期）。可查看 LSE CHANGELOG 中各版本支持的 LeviLamina 版本来选择。

LSE 0.10.0 起变体用 `#nodejs` 写法，旧文档里的 `legacy-script-engine-nodejs` 包名是 0.10.0 以前的。

注意：LSE 0.13.x 及更早版本 `tooth.json` 中 nodejs 变体用了 `uncompressed` 类型资源下载 node，当前 lip（v0.38 起读取 `tooth.json` 时不支持 `uncompressed`）会认为该版本没有 nodejs 变体而无法安装；这类旧版本的 nodejs 引擎需改用 lip v0.37.0 及更早版本安装，或从对应 GitHub Release 手动下载 `legacy-script-engine-nodejs` 包并把 `node-prebuilt.zip` 解压到其目录。LSE 0.14.0 起 nodejs 变体改用 zip 资源，可由当前 lip 正常安装。

*适用版本：LSE 0.10.0 及以上；当前 lip 0.41.x*

### LSE 的 Python 引擎和 NodeJS 引擎安装时有什么需要注意的？

现在各引擎都是 LegacyScriptEngine 包的变体，用 lip 安装即可：`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` / `#python`（`#quickjs`、`#lua` 同理），lip 会自动处理依赖（NodeJS 变体会一并下载 node 预编译运行时到 `legacy-script-engine-nodejs` 目录）。

Python 引擎需要在运行它的机器上安装对应版本的 Python：LSE >=0.16.2 用 3.12.10，>=0.9.0 \<0.16.2 用 3.12.8，\<0.9.0 用 3.10.11；引擎会从 `PATH` 中名字含 Python 的目录查找 `Lib`/`DLLs`/`site-packages`，所以安装时需把该 Python 加入 `PATH`。

*适用版本：LSE 0.23.x（Python 版本对应表适用于所有版本）*

## 配置

### LeviLamina 下 LSE 脚本插件的 `manifest.json` 放在哪里、怎么写（`type` 填什么）？提示未知类型 / 插件不被识别怎么办？旧插件自带的自定义 `manifest.json` 冲突怎么办？如何用 `ll load` 手动加载？

每个 mod/插件都必须在 `plugins/<插件文件夹>/manifest.json`（服务端模组根目录为 `plugins/`）放一个符合 LeviLamina 规范的清单，至少包含 `name`（与文件夹名相同）、`entry`（入口文件）、`type`；可用 `dependencies` / `optionalDependencies` / `loadBefore` 控制依赖与加载顺序。

`type` 取值：

- C++ 原生 mod 填 `native`
- QuickJS 插件填 `lse-quickjs`
- Lua 填 `lse-lua`
- Node.js 填 `lse-nodejs`
- Python 填 `lse-python`（`entry` 为 `__init__.py`）

同时必须安装对应的 LSE 引擎（如 `lip install LegacyScriptEngine#quickjs`），否则该 `type` 无人处理、插件不会被识别。

清单不能使用自定义格式，若旧插件自己也用了名为 `manifest.json` 的文件，需要把它改名或改成兼容格式。偷懒的做法是直接把单个 `.js` 等文件丢进 `plugins` 根目录启动一次，LSE 会自动迁移并生成清单，按提示重启即可。

手动加载用控制台命令 `ll load <插件文件夹名>`。

清单格式文档：<https://levimc.org/zh-Hans/LeviLamina/api_reference/mod/>

*适用版本：LeviLamina 1.x 及以上，对应 LSE（含 LeviLamina 26.60.x / LSE 0.23.x）*

### LSE 中 `data.name2xuid` 等玩家信息查询接口返回空/没有返回值（尤其对之前进过服的玩家），是接口坏了吗？

不是接口坏了。这些接口（`data.name2xuid`、`data.xuid2name`、`data.name2uuid`、`data.getAllPlayerInfo`、`data.fromName` 等）依赖 LeviLamina 的 PlayerInfo 服务。该服务默认不随服务器启动，只有在有插件调用时才启用，因此之前进过服的玩家不会被记录，查询返回空。

解决：在 LeviLamina 配置文件（`mods/LeviLamina/config/Config.json`）的 `targeted.playerInfo` 中把 `alwaysLaunch` 设为 `true`，重启服务器；之后进服的玩家会被记录。

*适用版本：LeviLamina 服务端（当前 26.60.x 仍适用）；LSE*

### LSE 的 Node.js 插件 `manifest.json` 里 `entry` 写成了绝对路径（如指向 E 盘），换到别的服务器就无法加载，正确写法是什么？

`entry` 应写相对于插件（模组）目录的路径（通常就是入口脚本文件名），不要用绝对路径：LSE 加载时用 `模组目录 / entry` 拼出入口路径，绝对路径会原样生效，换机器就找不到文件。

示例：

```json
{
  "entry": "LLSE-FakePlayer.js",
  "name": "LLSE-FakePlayer",
  "type": "lse-nodejs",
  "dependencies": [ { "name": "legacy-script-engine-nodejs" } ]
}
```

注意：Node.js 插件包（`.llplugin`）由 LSE 自动迁移时，生成的 `manifest.json` 的 `entry` 是按 `package.json` 的 `main` 解析出的规范化绝对路径（或解析失败时为空），这正是 `entry` 变成本机绝对路径的常见来源；迁移后请检查并手动改成相对路径。

*适用版本：LeviLamina 1.x 及以上；LSE 0.23.x（当前版本）*

### LSE 的各个引擎（quickjs、nodejs、lua、python）版本不一致会有问题吗？

会，LSE 各引擎的版本需要保持一致。现在各引擎是同一个 LegacyScriptEngine 包的变体（`#quickjs`、`#lua`、`#nodejs`、`#python`），用 lip 安装/升级时版本会保持一致，且共同依赖同一版本范围的 LeviLamina、LegacyRemoteCall、LegacyMoney、iListenAttentively。

### LeviLamina 下 LSE 插件（如依赖 nodejs 引擎或 LegacyRemoteCall/GMLIB 的插件）不被识别/不加载，报“无法识别的模组类型：lse-nodejs”，怎么办？

该报错表示加载这个插件时对应的引擎（`legacy-script-engine-nodejs`）尚未加载或未安装。LeviLamina 按 `manifest.json` 中的依赖关系排序加载，插件目录下的 `manifest.json` 要写明 `dependencies`，例如依赖 `legacy-script-engine-nodejs` 或 LegacyRemoteCall 的插件必须声明依赖；不写依赖时只能靠默认顺序（按名称排序）碰运气。`manifest.json` 还支持 `optionalDependencies`、`conflicts`、`loadBefore` 等字段。

同时确认已用 lip 安装对应引擎变体。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）*

### 在 LeviLamina 上用 LSE 插件时，还需要另外装 LL2 的 PAPI（PlaceholderAPI）吗？

不需要，LL2 的 PAPI 无法在 LeviLamina 上使用。第三方库 GMLIB 自带 PAPI 功能，依赖 PAPI 的插件安装 GMLIB 即可。

*适用版本：LeviLamina；第三方 GMLIB。未能从源码或文档中直接证实，仅供参考。*

### 在 LeviLamina + LSE 服务器上装了 OneTitle 称号插件，插件已加载，但玩家聊天消息里没有显示称号，怎么办？

OneTitle 本身只导出 API/PAPI，不负责修改聊天格式，需要搭配聊天格式插件使用。例如 ChatFormatter（需配合 GMLIB），在其配置的聊天格式中加入 OneTitle 提供的 PAPI 占位符（如 `%onetitle%`）即可。

*适用版本：第三方插件 OneTitle / ChatFormatter / GMLIB。未能从源码或文档中直接证实，仅供参考。*

### 用不到 Lua/Python 引擎和 LegacyMoney（原 LLMoney），能否禁用这些组件以加快启动和节省资源？

不需要的脚本引擎可以去掉：LSE 的每个引擎都是独立的 mod 目录（`mods/legacy-script-engine-quickjs`、`mods/legacy-script-engine-lua`、`mods/legacy-script-engine-python`、`mods/legacy-script-engine-nodejs`），删掉不用的那个目录即可。

用 lip 时，单独安装的变体可用 `lip uninstall` 卸载（如 `lip uninstall LegacyScriptEngine#python`）；但默认安装（`lip install LegacyScriptEngine` 不带变体）会同时装 QuickJS 和 Lua，二者是默认变体的依赖，lip 不会单独卸载仍被需要的依赖。想只保留一个引擎，应卸载 LegacyScriptEngine 后改装单个变体（如 `lip install LegacyScriptEngine#quickjs`）。

但 LegacyMoney 不能删：当前版本中 LegacyMoney 是 LSE 的必需依赖（`manifest.json` 的 `dependencies` 中列出 LegacyMoney、LegacyRemoteCall、iListenAttentively），删掉后 LeviLamina 会以缺少依赖（`MissingDependency`）为由拒绝加载所有 LSE 引擎。

*适用版本：LegacyScriptEngine 0.23.x（LeviLamina 26.60.x）及当前版本*

### 装了 BehaviorLog（行为日志）LSE 插件后，后台一直刷命令方块执行的日志，怎么关掉？

打开 BehaviorLog 的配置文件 `./plugins/BehaviorLog/config.json`，找到 `onCmdBlockExecute` 项，把里面的 `true` 改成 `false`（数值项 `1` 改成 `0`），保存后重启服务器（或重载插件）。插件说明见 <https://www.minebbs.com/threads/behaviorlog.7759/>

*适用版本：第三方 LSE 插件 BehaviorLog，具体配置路径和键名以所用插件版本为准。未能从源码或文档中直接证实，仅供参考。*

## 版本与兼容性

### 旧版 LeviLamina 上装最新版 LSE 装不上或提示依赖缺失（如提示需要更新的 LeviLamina），LSE 和 LeviLamina 的版本怎么对应？怎么装旧版 LSE？

LSE 的版本号与 LeviLamina 不一一相同，但每个 LSE 版本只兼容特定范围的 LeviLamina，新版 LSE 不能用在旧版 LL 上（例如当前 LSE 0.23.x 要求 LeviLamina 26.60.*）。

查对应关系：看 LSE 对应 release tag 提交里的 `lip.toml`（0.23.1 及更早为 `tooth.json`）中依赖的 `github.com/LiteLDev/LeviLamina` 版本范围，或看 CHANGELOG 中“Adapted to LeviLamina xx”的记录。

旧 LL 需用 lip 指定匹配的旧版本 LSE，变体写在 `@` 之前，例如 `lip install LegacyScriptEngine#quickjs@0.13.2`；lip 会按该版本声明的依赖安装配套的 LegacyRemoteCall、LegacyMoney 等。也可以从各项目 GitHub Releases 下载对应旧版本手动安装。GMLIB 等第三方 native 前置同样必须使用与当前 LeviLamina/BDS 版本对应的版本。

历史例子：LeviLamina 0.13.x（BDS 1.21.2/1.21.3）对应 LSE 0.8.20（当时包名为 `gitea.litebds.com/LiteLDev/legacy-script-engine-*`）。

*适用版本：当前版本（LSE 0.10.0 及以上可用 `LegacyScriptEngine#<变体>@<版本>` 安装，更早版本使用旧 gitea 包名）*

### BDS 26.20（LeviLamina 26.20.x）上装了最新版 LSE 后不工作、LSE 插件不加载，该装哪个版本的 LSE？

LSE 每个版本只对应一个 LeviLamina 小版本系列，不能跨版本使用。最新的 LSE 0.23.x 面向 LeviLamina 26.60.*（BDS 26.60），不能在 26.20 上运行。LeviLamina 26.20.x 对应 LSE 0.19.x，应安装该系列最后一个版本 LSE 0.19.7。

版本对应关系：

- 0.19.x → LL 26.20.*
- 0.20.0 → LL 26.32.*
- 0.21.x → LL 26.40.*
- 0.22.x → LL 26.51.*
- 0.23.x → LL 26.60.*

查看 LSE 的 CHANGELOG 中 “Adapted to LeviLamina xx” 的条目即可确认某版本适配哪个 LL。

*适用版本：LeviLamina 26.20.x；LSE 0.19.x～0.23.x（版本对应原则适用于当前版本）*

### LeviLamina 更新到新 BDS 版本后，LSE 报一堆 fatal 错误或提示 mod 版本太旧，JS 插件都跑不起来，怎么办？

这是 LSE 还没有适配新版 LeviLamina，旧版 LSE 无法加载。可以等 LSE 发布正式适配版本再一起升级，或者先把 LeviLamina 保持在与当前 LSE 匹配的版本。

着急的话，可以登录 GitHub 后到 <https://github.com/LiteLDev/LegacyScriptEngine/actions> 下载最新的构建产物（artifact）临时使用。依赖 GMLIB 等第三方前置库的插件，还要等这些前置库也完成适配。

*适用版本：当前版本（每次 LeviLamina 跟进新版 BDS 时都会出现）*

### 更新 GMLIB 后，LSE 插件通过 GMLIB-LegacyRemoteCallApi 调用 GMLIB 接口（如 `GMLIB_API::getServerAverageTps`）时报接口不存在/报错，之前版本正常，是什么原因？

新版 GMLIB-LegacyRemoteCallApi（LRCA）在清单中被设为 passive：没有任何插件在 manifest 中依赖它时不会被加载（可用 `ll show GMLIB-LegacyRemoteCallApi` 确认）。

解决：在调用方插件的 `manifest.json` 中把 `GMLIB-LegacyRemoteCallApi` 写进 `dependencies`（必选依赖），或写进 `optionalDependencies`（可选依赖，没装也能正常加载）。如果代码是被宿主插件引用的子模块，没有自己的 manifest，就要把依赖加到宿主插件上。

运行时可用 `ll.getAllPluginInfo().some(p => p.name === "GMLIB-LegacyRemoteCallApi")` 判断是否已加载，未加载时提示用户安装 GMLIB 和 LRCA；部分接口在低版本 LRCA 中不存在，必要时还要检测版本。

若报错来自 GMLIB 本身（如 `bad optional_ref access`），属于 GMLIB 的 bug，应更新到 GMLIB 已修复的版本或向其作者反馈，而非 LSE 问题。

*适用版本：LeviLamina 1.x 及以上；GMLIB / GMLIB-LegacyRemoteCallApi（第三方）。未能从源码或文档中直接证实，仅供参考。*

### LSE 插件用 `BinaryStream` 自己发包刷新告示牌，更新服务器版本后失效了，怎么改？

新协议中方块坐标的 y 写法变了：协议版本 >= 944 时 y 坐标要用 `writeVarInt`（有符号），旧版本用 `writeUnsignedVarInt`。

示例：

```js
bs[mc.getServerProtocolVersion() >= 944 ? "writeVarInt" : "writeUnsignedVarInt"](pos.y);
```

*适用版本：BDS 协议版本 944 及以上（LSE 0.18.4 起观察到）。未能从源码或文档中直接证实，仅供参考。*

### LegacyScriptEngine 的 NodeJS 引擎（`legacy-script-engine-nodejs`）内置的是哪个版本的 Node.js？

Node.js v22.12.0。LSE 通过 lip 安装 nodejs 变体时，会一并下载 LiteLDev/node 的 v22.12.0 预编译包（`node-prebuilt.zip`），ScriptX 的 V8 后端也是基于 node v22.12.0 构建的。

*适用版本：LSE 0.9.0 及以上（当前 v0.23.1）*

### LSE nodejs 引擎加载失败，报 `Raw Seh Exception: [0xC0000005:ntstatus]` 访问违例（如 `legacy-script-engine-nodejs` 加载失败），怎么解决？

LSE 各个引擎（quickjs、lua、nodejs、python）的版本必须一致，否则必然崩溃，例如 0.18.0 的 lua 配 0.18.2 的 nodejs 就会出错。把所有已安装的引擎更新/重装到同一版本即可，例如 `lip install LegacyScriptEngine#nodejs`（与已安装的 `#quickjs`、`#lua` 保持同一版本）；不需要 nodejs 插件也可以直接卸载 nodejs 引擎。

同时 LeviLamina 也要更新到该 LSE 版本要求的版本（如 LSE 0.23.x 要求 LeviLamina 26.60.*）。

*适用版本：当前版本（LSE 0.23.x 对应 LeviLamina 26.60.\*）*

### LSE 中获取玩家延迟的 API（`player.getDevice().avgPing` / `lastPing`）在 26.20 正常，在 26.51 上获取不到，是什么原因？

可能是服务端使用 NetherNet 协议导致拿不到相关网络统计信息，可尝试把服务端切换为 RakNet 再试。

*适用版本：BDS 26.51 及以上（推测性答案）。未能从源码或文档中直接证实，仅供参考。*

### LSE 的 Python 引擎还推荐使用吗？LSE 的 JS/Lua 引擎会停止维护吗？

JS（QuickJS、Node.js）和 Lua 引擎会继续维护。

Python 引擎目前仍作为 `LegacyScriptEngine#python` 变体提供（`lip install LegacyScriptEngine#python`），但需要先在机器上安装 Python（LSE >=0.16.2 需要 Python 3.12.10），且有 threading/asyncio 不可用等已知问题；维护者建议需要 Python 插件生态的用户改用 LeviStone（在 LeviLamina 上运行 Endstone 的 Python 插件）。

*适用版本：当前版本（LSE 0.23.x）*

### 升级到新版 LeviLamina（如 26.10）后 LSE 加载报错，LSE 正式版还没适配新版本，怎么提前用上？

LSE 正式版发布前，可去 GitHub Actions（<https://github.com/LiteLDev/LegacyScriptEngine/actions>）中 `build.yml` 工作流的一次成功（绿色）运行里下载构建产物（需登录 GitHub）。产物按 `<仓库>-<commit>-<server|client>-<引擎>-windows-x64` 命名，服务端请选 `server` 且对应引擎（nodejs/quickjs/lua/python）的包。

NodeJS 引擎还需要 node 运行时（<https://github.com/LiteLDev/node/releases/download/v22.12.0/node-prebuilt.zip>，解压到 `mods/legacy-script-engine-nodejs/`），正式版 nodejs 变体另外依赖 7-zip-tooth。

依赖的 LegacyMoney、LegacyRemoteCall、iListenAttentively 可用 lip 安装（`lip install github.com/LiteLDev/LegacyMoney` 等）；但它们的正式版同样锁定某个 LeviLamina 小版本（目前为 26.60.*），若 lip 报与新版 LeviLamina 冲突，也需要到各自仓库的 Actions 下载适配新版的构建。

*适用版本：当前版本（LSE 正式版尚未适配最新 LeviLamina 的过渡期）*

### 把服务器从 BDS 1.21.93 升级到 1.21.124 后，LSE 加载时报一堆红字、BackupHelper 等插件无法正常工作，报错涉及 LegacyParticleAPI，怎么解决？

先确认插件已更新到适配新版本的版本（例如 BackupHelper 0.9.1 不兼容，需更新到 0.14.0）。LegacyParticleAPI 是旧版 LSE 的依赖，LSE 0.15.0 起已移除，直接卸载/删除 LegacyParticleAPI 即可。

加载地图时的红字若是低版本存档升级导致，一般不影响使用。

*适用版本：LSE 0.15.0 及以上（从更旧版本升级时）*

### 老 LXL（LiteXLoader/LLSE）插件开发者回坑：现在还用 LXL 吗？支持多维度吗？旧插件写法还能用吗？

LXL/LiteLoaderBDS 已不再使用，现在的方案是 LeviLamina + LegacyScriptEngine（LSE，LLSE 脚本引擎的延续）。

LSE 沿用同一套 LLSE API，旧的 LLSE 插件几乎无需修改即可运行（部分插件可能因事件触发时机差异等原因无法正常工作）：把旧插件放进 `plugins/` 启动服务器，LSE 会自动迁移并生成 `manifest.json`，重启后加载。

多维度方面，LeviLamina 生态中有 MoreDimensions 库（`lip install github.com/LiteLDev/MoreDimensions`）提供自定义维度 API，它本身不添加维度，需要配合使用其 API 的模组。

*适用版本：LeviLamina 26.60.x；LSE 0.23.x（当前版本）*
