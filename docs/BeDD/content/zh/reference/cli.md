# 命令行

不带参数（双击）运行 `BeDD.exe` 是[管理窗口](/zh/guide/several-games#管理窗口)；带参数就是这里的命令行：
`BeDD.exe <名词> <动词> [参数] [选项]`。`BeDD.exe help`、`help <名词>` 和 `<命令> --help` 离线输出同样的内容。

## 约定

| | |
|---|---|
| 选项 | 写在命令词之后任意位置：`--name value`、`--name=value`、`-n value`；开关 `--name` / `--no-name`；`--` 之后不再是选项 |
| 名字 | 精确匹配，不分大小写，从不按前缀匹配 |
| 时长 | `launch` 的 `--timeout`、`--lock-timeout`：数字加 `ms`、`s`（默认）、`m`/`min` 或 `h`，如 `90s`、`3m`、`2h`；最多 30 天 |
| stdout | 只有结果 |
| stderr | 进度（`-q` 和 `--json` 时不输出）、警告、`-v` 的细节 |
| 出错 | `error: <信息>`，然后 `hint: <命令>`；带 `--json` 时 stdout 还会输出 `{"error":{code,message,exit,hint}}`（`code` 如 `ERR_USAGE`） |

所有命令都有的全局选项：

| 选项 | |
|---|---|
| `--json` | 结果输出为一个 JSON 文档：列表是数组，其他是对象；键名 camelCase，时间 RFC 3339，大小以字节计 |
| `-q`、`--quiet` | 只输出标识符，每行一个；不输出进度 |
| `-v`、`--verbose` | 在 stderr 输出执行细节 |
| `-h`、`--help` | 该命令的帮助 |

退出码：`0` 成功，`1` 失败，`2` 用法错误，`4` 找不到，`5` 冲突（如槽位正在使用），`10` 被拒绝。

## 游戏

### launch

`BeDD.exe launch [<instance>]`（别名 `play`）：在后台启动一个实例的游戏，输出它的端点。需要时先克隆实例，安装或更新它的模组
（[升级](/zh/guide/installs#升级)），打开管理窗口，并在游戏整个生命期内持有信令锁（[规矩](/zh/guide/several-games#并行测试的规矩)）。
用法：[启动游戏](/zh/guide/usage#启动游戏)。

| 选项 | 默认 | |
|---|---|---|
| `--slot <n>` | `1` | 没指定实例时，用这个槽位的克隆（基础实例的克隆） |
| `--dir <folder>` | | 改为启动这个目录里的实例（任意含 `Minecraft.Windows.exe` 的目录） |
| `--label <text>` | `BEDD_LABEL`，否则为调用方仓库 | 游戏在管理窗口里的名字 |
| `--exclusive-signaling` | | 独占整台电脑：等其他游戏全部关掉，并让新启动的游戏等着 |
| `--no-manager` | | 不启动管理窗口 |
| `--keep-mod` | | 保留克隆里的 BeDD 模组，即使它和这个 `BeDD.exe` 带的不同 |
| `--detach` | | 进程一创建就返回；`url` 和 `token` 为 `null` |
| `--timeout <时长>` | `3m` | 等待端点的时间 |
| `--lock-timeout <时长>` | `2h` | 等待信令锁的时间 |

```powershell
BeDD.exe launch --slot 3 --json
BeDD.exe launch --dir D:\games\mc-test --label smoke --detach -q
```

### process list

`BeDD.exe process list`（别名 `ps`、`process ls`）：正在运行、模组已公布 WebSocket 端点（`run\<pid>.json`）的游戏和服务器。
`--json` 输出每个端点及其令牌：测试就是这样找到要连接的地址（[选哪个游戏](/zh/guide/usage#选哪个游戏)）。

| 选项 | |
|---|---|
| `--all` | 也列出实例目录下还没有端点的游戏（仍在加载，或模组较旧） |

### process stop

`BeDD.exe process stop [<instance>]`（别名 `stop`）：强制结束一个实例的游戏（实例目录下的文件夹名，或它的路径）。实例目录之外的
Minecraft 进程从不碰，除非 `--pid` 指定的进程公布过 BeDD 端点。

| 选项 | |
|---|---|
| `--pid <pid>` | 结束这个游戏 |
| `--all` | 结束 BeDD 所有实例的游戏 |
| `-y`、`--yes` | 结束全部游戏前不询问 |

```powershell
BeDD.exe stop --pid 12345
BeDD.exe stop --all --yes
```

## 实例

克隆和目录：[安装与克隆](/zh/guide/installs#克隆)。接受 `[<name>]` 的命令也接受 `--slot <n>`（该槽位的克隆）。

| 命令 | |
|---|---|
| `instance list`（`ls`） | BeDD 的游戏实例（`%LOCALAPPDATA%\BeDD\instances` 下的克隆）以及各自还缺什么。`--bases`：能用来克隆的 LeviLauncher 实例；`--bases --all`：也列出不能克隆的实例及原因 |
| `instance show [<name>]` | 一个实例以及它还缺什么 |
| `instance clone` | 从 LeviLauncher 实例做出 `<gameVersion>-<slot>`（游戏文件硬链接，资源通过目录联接，游戏数据和 LeviLamina 复制；LeviLauncher 实例只读），已有克隆则刷新。`--slot <n>`（`1`）；`--base <name>`（否则 `BEDD_INSTANCE`，否则 LeviLauncher 的默认实例，否则第一个合适的）；`-f`、`--force`：删掉克隆重做，游戏数据也重做 |
| `instance refresh [<name>]` | 让克隆跟上它的 LeviLauncher 实例。`--all`：所有实例（有游戏在运行的跳过） |
| `instance remove [<name>]`（`rm`） | 删除一个实例；LeviLauncher 实例保持原样。`-y`、`--yes`：不询问 |
| `instance path <name> [dir\|mods\|logs\|data\|worlds]` | 输出实例的一个目录：`dir`（实例本身）、`mods`、`logs`、`data`（游戏数据，`Minecraft Bedrock`）或 `worlds`（第一个玩家的 `minecraftWorlds`） |

## 模组

配置项及取值：[配置](/zh/guide/configuration#配置项)。

| 命令 | |
|---|---|
| `mod install <instance>` | 把 `BeDD.dll` 和 `manifest.json` 复制到 `<instance>\mods\BeDD`，`config\config.json` 只写入给出的设置，并把 LeviLamina 切换到内置崩溃记录器。会替换之前的安装，配置也一起替换。`--from <dir>`：要安装的构建，之后的 `launch` 都以它为准，直到下一次不带 `--from` 的安装（否则 `BEDD_MOD_DIR`，否则 `BeDD.exe` 旁的 `mod\BeDD`，否则当前目录所在检出的 `bin\BeDD`） |
| `mod uninstall <instance>` | 从实例里移除模组 |
| `mod config <instance>` | 应用 `--set`、`--unset` 和 `--world-mode` 后输出 `mods\BeDD\config\config.json`；游戏启动时读取它。`--unset <key>`（可重复）：恢复模组默认值 |

`mod install` 和 `mod config` 都接受：

| 选项 | |
|---|---|
| `--set <key=value>` | 一项配置，可重复；值能解析为 JSON 就按 JSON，否则按文本 |
| `--world-mode <mode>` | `ClientOnly`、`ClientServer` 或 `Remote`（配置 `mode`；[世界在哪里运行](/zh/guide/modes)） |
| `--server-host <host>` | 配合 `--world-mode Remote`：游戏要加入的服务器；`*`：`join` 指定的任何服务器 |

## 世界

`BeDD.exe world singleplayer <instance> [<world folder>]`：清除世界 `level.dat`（以及 `level.dat_old`）里的多人游戏和广播设置，
让共用同一登录的游戏不再互相踢掉（"Blaze"）。不写世界目录：实例的所有世界。在世界没打开时运行。

| 选项 | 默认 | |
|---|---|---|
| `--recent` | | 只处理 `level.dat` 最近写过的世界（刚恢复的测试世界） |
| `--minutes <n>` | `15` | `--recent` 指多少分钟内 |

## 服务器

用于[客户端 + 服务端模式](/zh/guide/modes#客户端-服务端)的专用服务器，放在 servers 目录里。

| 命令 | |
|---|---|
| `server init <name>` | 准备服务器：通过 lip 安装 BDS 和 LeviLamina、BeDD 的服务端模组、`server.properties`。没缺东西时很快；再运行一次可更新模组或修改设置。`--port <N>`：IPv4 端口，IPv6 为 N+1（默认：服务器自己的，否则从 19140 起第一对空闲端口）；`--from <dir>`：服务端模组（否则 `BEDD_SERVER_MOD_DIR`、`BeDD.exe` 旁的 `mod\BeDD-server`、最近的 `bin\BeDD-server`）；`--set <key=value>`：一项 `server.properties`，可重复（[准备服务器](/zh/guide/modes#准备服务器)） |
| `server start <name>` | 无窗口启动服务器（控制台写到 `logs\console.log`），等它启动、BeDD 公布端点；输出 `name`、`pid`、`port`、`portV6`、`url`、`token`。已在运行的服务器照原样输出。`--detach`：不等端点（`url`、`token` 可能为 `null`）；`--timeout <秒>`（`180`）；`--allow-firewall-prompt`：启动没有 BeDD 回环绑定的服务器 |
| `server stop <name>` | 停止服务器（它会保存世界）。`--all`：所有服务器；`--timeout <秒>`（`30`）：超时后强制结束 |
| `server list`（`ls`） | 服务器、端口以及是否在运行 |
| `server remove <name>`（`rm`） | 删除已停止服务器的目录，世界也一起删。`-y`、`--yes`：不询问（没有控制台时必须加） |
| `server path <name>` | 输出服务器的目录 |

## 管理窗口

| 命令 | |
|---|---|
| `manager status` | 管理窗口是否在运行及其进程 id；两种情况退出码都是 `0` |
| `manager stop` | 关闭管理窗口及其中的所有游戏（每个收到 `{op:"close"}`，10 秒后强制结束），然后等它退出。`-y`、`--yes`：不询问；`--timeout <秒>`（`60`） |

## 其他命令

| 命令 | |
|---|---|
| `version` | 版本信息 |
| `dev` | 模组开发循环：为 `--slot`（`9`）克隆基础实例，安装构建到 `--from` 的模组（默认检出的 `bin\BeDD`），启动游戏（`--label`，默认 `dev`）并保持运行，把前台窗口和光标限制区域的每次变化记到 `--watch-log`（默认检出的 `tools\out\desktop-watch.log`；以 `MINECRAFT HAS THE FOREGROUND` 结尾的行表示有游戏抢了焦点）。Ctrl+C 或创建 `<日志目录>\dev.stop`：关闭游戏（除非 `--keep`）并退出；创建 `<日志目录>\dev.restart`：关闭游戏、重装模组、重新启动。`--watch-only`：只监视桌面 |
