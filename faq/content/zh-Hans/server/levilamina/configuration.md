# 配置 LeviLamina

## BDS 26.x 改用 NetherNet 网络协议后，用 frp（如樱花 frp）等内网穿透/端口转发时玩家连不上服务器（只看到 TCP 19132、UDP 端口随机或只看到 7551），装了 LeviLamina 的服务端该怎么配置？

基岩版服务器仍然使用 UDP，只是新版默认传输方式变成了 NetherNet（底层类似 WebRTC）。当前版本（BDS 26.60.6 起 / LeviLamina 26.60.x）NetherNet 默认就只用 `server.properties` 里 `server-udp-ports` 指定的单个 UDP 端口，不再需要 LeviLamina 的 `singlePort` 选项（该选项已删除）。配置要点：

1. `server.properties` 中 `server-port`（TCP+UDP，默认 19132）与 `server-udp-ports`（UDP，默认 19132）决定要开放的端口；穿透/映射时 TCP 和 UDP 都要转发，且内外端口保持一致。
2. 使用 frp 等内网穿透时，把公网地址直接写进 `server-udp-ports`，格式为 `<公网IP>:<外部端口>:<本机端口>`，例如：

   ```text
   server-port=11451
   server-udp-ports=203.0.113.4:11451:11451
   ```

3. 同时在 `mods/LeviLamina/config/Config.json` 的 `targeted.netherNetPatch` 中把 `"enable"` 设为 `false`（关闭 LL 的 STUN 补丁）；若 STUN 获取公网 IP 失败，客户端会报错误代码 `Door`。
4. 7551 是局域网（LAN）发现端口，与外网连接无关。

此外 `server.properties` 的 `transport` 项仍可切回 RakNet，此时只用 `server-port`，但 RakNet 将来可能被 Mojang 移除。官方教程：<https://levimc.org/zh-Hans/tutorials/server/let-friends-join/>

*适用版本：BDS 26.60.6+；LeviLamina 26.60.1 及以上*

## NetherNet 协议下端口 TCP/UDP 都开放、控制台无报错，玩家仍进不了服务器，浏览器访问 IP:端口 出现备案拦截页面；NetherNet 用于信令的 HTTP 服务能否与游戏 UDP 不在同一台机器，用海外节点/内网穿透反代来规避未备案拦截？

出现备案拦截页说明云服务商对未备案的 HTTP 流量做了拦截。NetherNet 走 `server-port` 的 TCP 部分（HTTP）只用于广播 MOTD 及告知客户端服务器的 IP 与端口，游戏数据走 UDP，二者可以不在同一台机器：可以给服务器/域名备案，或用海外服务器、内网穿透的海外 HTTP/HTTPS 隧道（或 easytier 之类组网工具）反向代理 HTTP 部分，游戏 UDP 流量仍直连国内服务器。注意服务器对外地址需通过 `server.properties` 的 `server-udp-ports=<公网IP>:<外部端口>:<本机端口>` 指定（填数字 IP）。该问题与云服务商策略相关。

*适用版本：BDS 26.51 及以上（NetherNet 传输）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 的 mod/插件加载顺序怎么决定？前置插件总在依赖它的插件之后加载导致加载失败，怎么调整？

LeviLamina 没有手动排序加载顺序的选项，加载顺序由各 mod 目录下 `manifest.json` 中声明的依赖关系决定（拓扑排序；彼此没有依赖关系的 mod 之间按名称排序，但不要依赖这一点）。正确做法是让插件作者在 manifest 里写好依赖；自己处理的话，在后加载的那个 mod 的 `manifest.json` 里把前置写进 `dependencies`：

```json
"dependencies": [ { "name": "前置mod名" } ]
```

字段名为小写 `dependencies`，可选带 `"version": "^1.2.3"` 之类的版本要求。

- `dependencies` 列表内的顺序无所谓；被依赖的 mod 先加载。若依赖缺失、版本不匹配或加载失败，依赖方会被阻止加载。
- 现在的 LeviLamina 也支持 `optionalDependencies`（可选依赖：存在且版本匹配时先加载它，缺失也不阻止本 mod 加载）和 `loadBefore`（声明本 mod 要在某 mod 之前加载，但不建立依赖关系）。
- 给其他加载器（如 .NET 加载器、LSE）写的插件，必须依赖对应加载器，否则先于加载器加载就会失败/崩溃。
- 加载器类、库类 mod 一般设置 `"passive": true`，只在被其他 mod 依赖时才加载。

不要靠每次在后台手动执行 `ll load <mod>` 来补救，`ll` 命令权限也不建议放开（默认需要 Admin 权限）。

*适用版本：LeviLamina 0.x 至 26.60.x（`optionalDependencies`/`loadBefore` 仅较新版本提供）*

## GMLIB、LRCA（GMLIB-LegacyRemoteCallApi）、iListenAttentively 等前置库 mod 装了却没有加载、也没有日志，或某个 mod 不会自动加载了，是什么原因？manifest 里的 `"passive": true` 是什么意思？

`manifest.json` 中 `"passive": true` 表示被动加载：没有其他 mod 在 manifest 中声明依赖它时就不加载。库/前置类 mod 通常这样设置，所以单独安装、没有任何依赖方时不加载属于正常现象，并非不兼容。

- 安装一个在 manifest 中声明依赖它的 mod 后，它会被自动加载。
- 如果实际使用它的插件（例如某些 LSE 脚本插件，或漏写依赖的库）没有在 manifest 中声明依赖，它就不会被加载，或加载顺序碰巧不对导致依赖方失败（装了别的声明依赖的插件后又能用，只是碰巧）。根本解决办法是由使用方在 `manifest.json` 的 `dependencies` 中声明该前置。
- 临时办法：把该前置 mod 的 `manifest.json` 里 `passive` 改为 `false` 或删掉该字段，使其独立加载。
- 注意 `passive` 与插件本身的加载报错（如未适配新版 BDS）无关，删掉 `passive` 不能解决那类报错，需等作者更新。

*适用版本：LeviLamina 0.x 至 26.60.x*

## 安装 LeviLamina 后服务器控制台不显示玩家聊天和玩家执行的命令，需要装插件吗？怎么开启？

不需要额外插件。LeviLamina 内置 `simpleServerLogger` 功能，但默认关闭（原版 BDS 本身不会在控制台记录玩家聊天）。打开 `mods/LeviLamina/config/Config.json`（旧版路径为 `plugins/LeviLamina/config/Config.json`；首次安装时该文件不存在，需先启动一次服务器生成），在 `targeted` 下找到 `simpleServerLogger`，把 `"enabled"` 改为 `true`，并保持需要的子项为 `true`：

- `"playerChat"`：玩家聊天，输出形如 `[PlayerChat] <玩家> 消息`
- `"playerCommand"`：玩家执行的命令，`[PlayerCmd]`
- `"playerPermission"`：玩家权限变更

保存后重启服务器生效。当前 v26.60.8 的配置路径为 `mods/LeviLamina/config/Config.json`，键位于 `targeted.simpleServerLogger`。

*适用版本：LeviLamina 0.11 及以上*

## LeviLamina 服务器上玩家被踢出或退出后仍残留在服务器里（“幽灵玩家”，别人看到它一动不动、显示在线，kick 也踢不掉，本人也无法重新进服），怎么解决？

这是 LeviLamina 漏洞修复功能中“断开连接时强制关闭连接”这一项（`DisconnectClientHook`）引起的副作用。可在 LeviLamina 配置文件 `Config.json` 中关闭这一项：

```json
"targeted": {
  "vulnerabilityFixes": {
    "enable": true,
    "disconnectClient": false
  }
}
```

配置文件位于 `<服务端模组目录>/LeviLamina/config/Config.json`（新版 lip 安装为 `mods/LeviLamina/config/Config.json`；若服务端存在 `plugins/` 目录则为 `plugins/LeviLamina/config/Config.json`）。只关 `disconnectClient` 即可，不必把整个 `vulnerabilityFixes.enable` 关掉（那会同时关闭其他漏洞修复）。LeviLamina 1.9.5 及更早没有单独的 `disconnectClient` 开关（该开关在 1.9.6 拆分 `vulnerabilityFixes` 配置时加入），需要先升级。已经卡住的玩家需要重启服务器才能清除。

*适用版本：LeviLamina 1.9.6 及之后（含 26.60.x）*

## LeviLamina 下如何让某个 mod 开服时不加载但不删除它的文件？（例如某个 mod 与当前版本不匹配导致每次启动都崩溃）

在该 mod 目录（`mods/<模组名>/`）的 `manifest.json` 中加上 `"passive": true`，它就不会被主动加载，只在被其他 mod 依赖时才加载。也可以把该 mod 的 `manifest.json` 或整个 mod 文件夹重命名，LeviLamina 就识别不到它（启动时可能会有提示）。如果崩溃是某个 mod（如 trace 日志中出现的某 dll）版本与当前 LeviLamina 不匹配导致的，直接删除或换成匹配版本即可。

## LeviLamina 的 STUN 功能是做什么的？关闭它或使用 frp 等穿透后插件获取到的玩家 IP 变成 127.0.0.1 与之有关吗？

STUN 是 LeviLamina 的 NetherNet 补丁（配置项 `targeted.netherNetPatch`，含 `enable` 与 `stunServers`，默认 `["stun:stun.l.google.com:19302", "stun:stun.miwifi.com:3478"]`）用来帮助服务端获取自己的公网地址，有多个公网 IP 时会一起监听，与获取玩家 IP 无关。玩家 IP 变成 127.0.0.1 是因为使用了 frp 之类的转发/穿透工具，服务端只能看到转发端的地址，无法获取玩家真实 IP。

*适用版本：LeviLamina 26.60.x（带 `netherNetPatch`）*

## 同一台机器上运行两个 LeviLamina 服务端，开了 A 端后再开 B 端，B 端加载完就闪退，怎么解决？

这是端口冲突。在两个服务端的 `server.properties` 中把 `enable-lan-visibility` 设为 `false`（`transport=raknet` 时它会让服务器强制绑定默认端口 19132/19133，即使你改了端口），并把各自的端口都改成互不相同的值：`server-port`、`server-portv6`，以及 `transport=nethernet` 时使用的 `server-udp-ports`。修改前先停止服务器。按此设置后（例如用 lip 部署两个独立的服务端文件夹）即可同时运行。

## `server.properties` 已配置 `transport=nethernet`，但 LeviLamina 服务器启动仍提示正在使用 raknet，为什么？

这是 Glacie 插件导致的：当时版本的 Glacie 会强制开启 raknet。卸载 Glacie 即可使用 NetherNet，或等待/更新到同时支持 raknet 与 nethernet 的 Glacie 版本。

*适用版本：BDS 26.51 起；取决于 Glacie 版本。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 的配置里没有 `resourcePackEncryptionMap`（资源包加密）配置项，怎么给资源包加密？

LeviLamina 本体没有资源包加密功能（早期配置里的 `resourcePackEncryptionMap` 是从 LL2 拷过来的遗留项，并未实现）。资源包加密由独立插件 ResourcePackEncryption 提供：<https://github.com/ShrBox/ResourcePackEncryption>，可用 `lip install github.com/ShrBox/ResourcePackEncryption` 安装。资源包可先用 PackCrypt 等工具加密，然后在插件配置的 `"ResourcePacks"` 中按 `"uuid": "contentkey"` 填写密钥；该插件还支持 `"ResourcePacksCDN"` 配置 CDN 下载地址。

*适用版本：LeviLamina 0.8 至当前版本*

## LeviLamina 在不支持颜色输出的控制台环境下会输出乱码颜色符号吗？

不会。LL 的日志格式化器会根据是否启用彩色日志（`ColorLog`，该开关由 PreLoader 提供）决定输出方式：关闭彩色日志后，LL 会自动去除消息和标题中的所有颜色/转义符号再输出。

## LeviLamina 怎么切换成中文（安装中文语言包）？

用 lip 安装 LeviLamina 时会自动把语言包 `levilamina-loc` 作为依赖装到 `mods/LeviLamina/lang/`（含 `zh_CN.json`、`zh_TW.json` 等），无需手动删除语言目录。LeviLamina 的 `mods/LeviLamina/config/Config.json` 中 `"language": "system"` 表示跟随系统语言，想强制中文可改为 `"zh_CN"`。如果语言包缺失，可单独安装：

```shell
lip install github.com/LiteLDev/levilamina-loc
```

翻译在 Crowdin（<https://crowdin.com/project/levilamina>）维护，可参与贡献。注意部分 mod 自身输出的文字是 mod 写死的，语言包管不到。

*适用版本：LeviLamina 26.x；levilamina-loc 1.7.x*

## LeviLamina 服务器（未用内网穿透，直接 IP+端口）客户端无法正常连接，怎么处理？

可能是服务器连不上 STUN 服务器导致（新版 BDS 走 NetherNet，LL 的 NetherNetPatch 会用 STUN 服务器让 NAT 后的服务器告诉客户端公网地址）。在 `plugins/LeviLamina/config/Config.json` 中把 `targeted.netherNetPatch.stunServers` 清空（默认是 `"stun:stun.l.google.com:19302"` 和 `"stun:stun.miwifi.com:3478"` 两个，只支持 `stun:`/`stuns:` 开头的 URI）；然后在 `server.properties` 里用 `server-udp-ports=公网IP:公网端口:本地端口`（例如 `server-udp-ports=203.0.113.4:19489:19489`）手动指定服务器公网地址。

26.51 至 26.60.0 版本中，公网地址用 LL 配置里的 `netherNetPatch.serverIP` 设置。

*适用版本：LeviLamina 26.60.1 及以上*

## LeviLamina 的控制台日志时间戳精确到毫秒，能否通过配置改成只显示到秒？

没有现成的配置项。控制台格式在 LeviLamina 中写死为 `"{3:.3%T.} {2} {1} {0}"`（带 3 位毫秒）。只能自己写 mod 通过日志 API（`Logger`/`Sink` 的 `setFormatter`，配合 `PatternFormatter`）替换格式，或修改 LeviLamina 源码重新编译。

## LeviLamina 的漏洞修复功能误伤导致玩家被断开等异常时，如何关闭？

在 `plugins/LeviLamina/config/Config.json` 中把 `targeted.vulnerabilityFixes` 下对应的单项设为 `false`，例如断开连接相关的 `disconnectClient`。可单独关闭的项有 `subChunkRequest`、`itemReadUserData`、`disconnectClient`、`limitIPFrequency`、`simulatedPlayerChunkLoading`；也可把 `targeted.vulnerabilityFixes.enable` 设为 `false` 整体关闭。改完后重启服务器生效。更早版本只能整体关闭 `vulnerabilityFixes`。

*适用版本：LeviLamina 2026-02 之后（拆分配置后）至 26.60.x*

## LeviLamina 配置文件中 `commands` 下的 `crashCommand` 选项是做什么的？

`modules.command.crashCommand` 开启（`enabled: true`）后会注册一个 `crash` 命令（客户端为 `clicrash`），执行后会让服务器主动抛异常崩溃，用于测试崩溃处理/CrashLogger，可选参数 `exceptionCode` 指定异常码。默认 `enabled` 为 `false`，正常服务器不需要开启；`permission` 字段控制使用权限（默认 `GameDirectors`）。

*适用版本：LeviLamina 0.11 至 26.60.x*

## Windows 上运行 LeviLamina/BDS 时控制台中文显示乱码，怎么解决？

设置 → 时间和语言 → 语言 → 管理语言设置 → 更改系统区域设置 → 勾选“Beta 版: 使用 Unicode UTF-8 提供全球语言支持(U)”，然后重启电脑。

*适用版本：当前版本（Windows）。未能从源码或文档中直接证实，仅供参考。*

## `ll show` 展示的插件信息（作者、版本）在哪里设置？在 manifest json 里写 `Author` 和 `Version` 没生效。

在 mod 的 `manifest.json` 中设置，键名必须是小写，例如 `"author"`、`"version"`（还有 `"description"` 等），写成首字母大写不会被识别。设置后执行 `ll show <mod名>` 即可看到。

*适用版本：LeviLamina 0.9 至 26.60.x*

## 修改 mod/插件的配置文件后不生效怎么办？

修改后要保存配置文件（建议用 VS Code 等编辑器而不是记事本，避免编码/格式问题），然后重启服务器，或在控制台执行 `ll reload <mod名>` 重载该 mod 才能生效。部分 mod 重载可能出问题，可改用 `ll disable <mod名>` 再 `ll enable <mod名>`，或 `ll reactivate <mod名>`；仍不行就重启服务器。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）*

## 如何让非 OP 玩家也能使用 `tpdim` 等 LeviLamina 内置命令？

修改 `plugins/LeviLamina/config/Config.json` 中 `modules.command` 下对应命令的 `permission`，例如把 `tpdimCommand` 的 `"permission": "GameDirectors"` 改为 `"Any"`，然后重启服务器。

*适用版本：LeviLamina 1.x 至 26.60.x*

## 装了 MOTD 修复插件后，在 `server.properties` 里改了服务器名称（MOTD），客户端却始终显示其他内容，怎么回事？

通常不是 MOTD 修复插件造成的。在控制台执行 `ll list` 查看已装的 mod，一般是其他插件带有动态 MOTD 功能覆盖了 `server.properties` 中的 `server-name`，去该插件配置里修改或关闭动态 MOTD。

*适用版本：LeviLamina 所有版本。未能从源码或文档中直接证实，仅供参考。*

## 服务器启动后再附加调试器（如 Visual Studio / .NET 托管调试）附加不上，怎么办？

外置 CrashLogger 以调试器身份附加在 BDS 进程上，一个进程同一时间只能有一个调试器，所以其他调试器会附加失败。不必删除 CrashLogger，在 `mods/LeviLamina/config/Config.json` 中把 `modules.crashLogger.enabled` 设为 `false`（或把 `builtin` 设为 `true` 改用进程内的内置模式）后重启服务器，再附加调试器；也可以直接用调试器启动服务器，此时 CrashLogger 会自动不启用。该案例中 .NET 托管调试还与编译路径有关，程序集需从调试构建输出目录加载才能正常附加。

*适用版本：LeviLamina 当前版本，使用外置 CrashLogger 时*

## LeviLamina 服务器崩溃时会把崩溃日志上传到 Sentry，如何关闭上传？

在 LeviLamina 配置文件 `mods/LeviLamina/config/Config.json`（旧安装为 `plugins/LeviLamina/config/Config.json`）中，把 `modules.crashLogger.uploadToSentry` 设为 `false`：

```json
"modules": {
  "crashLogger": {
    "uploadToSentry": false
  }
}
```

内置和外置 CrashLogger 都受此项控制（外置时不再传 `--enablesentry`）。另外注意：若服务器配置了自动重启但端口被占用或重复启动，会反复崩溃并不断上传日志，应先修复端口冲突/重复启动问题。

*适用版本：LeviLamina 当前版本*

## LeviLamina 控制台日志没有颜色（全是白色），在 LeviLamina 配置里找不到 `colorLog`，怎么开启彩色日志？

彩色日志开关不在 LeviLamina 自己的配置里，而在 PreLoader 的配置文件中：打开服务端根目录的 `PreLoaderConfig.json`，把 `"colorLog"` 改为 `true`，重启服务器即可恢复彩色输出。

*适用版本：LeviLamina 0.13.4 及以上至当前版本*

## 使用 MCSManager 面板运行 LeviLamina 时，PreLoader 输出后就看不到 BDS 的正常输出，面板输入命令也无效，怎么办？

需要虚拟 TTY，在 MCSManager 实例设置里开启“仿真终端”选项即可。

*适用版本：LeviLamina 1.x 及以上，使用 MCSManager 面板时。未能从源码或文档中直接证实，仅供参考。*

## 非 LeviLamina 插件（例如要在 PreLoader 阶段加载的 DLL）应该怎么写 manifest？可以直接用 LL 插件的 manifest 吗？

不要使用 LeviLamina 模组的 `"type": "native"`（那是由 LeviLamina 原生模组管理器加载的普通 C++ 模组）。需要由 PreLoader 在游戏启动前加载的 DLL，manifest 中应写 `"type": "preload-native"`：它会在游戏启动前、LeviLamina 的模组之前由 PreLoader 加载（LeviLamina 本身就是这种类型），LeviLamina 的模组注册表会跳过这类清单，它们不算 LeviLamina 模组。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）*
