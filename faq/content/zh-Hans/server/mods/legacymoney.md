# LegacyMoney

## LegacyMoney 的 `/money add` 只能指定玩家名，能不能用目标选择器（如 `@s`、`@a`）给玩家加钱？有没有 LL2 LLMoney 那样的 `money_s`？

可以。LegacyMoney 重写了命令，旧版 LLMoney 的 `money_s` 改为在子命令后加 `s` 的写法，使用目标选择器：`/money adds <选择器> <数量>`、`/money reduces <选择器> <数量>`、`/money sets <选择器> <数量>`、`/money querys <选择器>`，例如 `/money adds @s 10`。不带 `s` 的 `/money add`/`reduce`/`set`/`query` 则接受玩家名（可对离线玩家操作）。这些操作需要 OP（GameDirectors 及以上）权限。用法见仓库 README。

*适用版本：LegacyMoney 0.x 至当前（v0.23.0）*

## LeviLamina 还像 LiteLoaderBDS 那样内置经济系统吗？LeviLamina 下用什么经济插件，怎么安装和使用？

LeviLamina 不再内置经济系统。原 LiteLoaderBDS 的 LLMoney 已移植为独立模组 LegacyMoney（<https://github.com/LiteLDev/LegacyMoney>），大部分 LSE 脚本插件的经济功能（`money` API）都调用它。

用 lip 安装 LegacyScriptEngine（如 `lip install github.com/LiteLDev/LegacyScriptEngine`）时会作为依赖自动安装；也可单独安装：`lip install github.com/LiteLDev/LegacyMoney`。

游戏内通过 `/money` 命令使用（`query`/`pay`/`add`/`reduce`/`set`/`hist`/`top` 等），配置文件为模组目录下的 `money.json`（`currency_symbol`、`def_money`、`enable_commands`、`pay_tax`）。

*适用版本：LeviLamina 全部版本（当前 LegacyMoney v0.23.0 / LSE v0.23.1）*

## LegacyMoney 的 `/money` 命令“没法用”：对玩家操作提示找不到玩家/没反应，或提示没有权限，怎么解决？

两类常见原因：

1. 提示 `Player not found` 或对玩家操作无效：`/money add/set/reduce/query/hist <玩家名>` 通过 LeviLamina 的 PlayerInfo 服务（玩家数据库，记录 uuid、xuid、name）按名字查找玩家。该服务默认是懒加载的，只有在首次被调用后才开始记录进服玩家，之前进服但没记录过的玩家会找不到。在 LeviLamina 配置文件 `Config.json` 中把 `playerInfo` 的 `alwaysLaunch` 设为 `true`，让服务器启动时就启用玩家信息记录（占用资源极小），之后玩家重新进服一次即可被记录。
2. 提示 `You don't have permission to do this`：`/money` 命令本身对所有人可见（注册权限为 Any），但 add/reduce/set、查询他人余额、`hist <玩家名>`、purge 在执行时要求 OP（GameDirectors）及以上权限，普通玩家会被拒绝；控制台权限最高，不会因此被拒，但 pay 和不带玩家名的 hist 只能由玩家执行，控制台会提示 `Console is not allowed to use this command`。

*适用版本：LeviLamina 当前版本；LegacyMoney 0.23.0*

## 如何在玩家离线时修改其 LegacyMoney 余额？为什么有的离线玩家能改成功、有的会失败？

用不带 `s` 的命令按玩家名操作即可对离线玩家生效，例如 `/money add <玩家名> <数量>`、`/money set <玩家名> <数量>`（带 `s` 的选择器版本只能选中在线玩家）。

按名字操作依赖 LeviLamina 的 PlayerInfo 记录把名字解析为 xuid：

- 如果该玩家从未被 PlayerInfo 记录（例如 PlayerInfo 服务未在启动时开启、玩家之后没再进过服），会提示 `Player not found`。
- 如果玩家 xuid 为空（如离线模式/未登录 Xbox 的玩家），LegacyMoney 会直接返回失败（`Failed to add money`）。

可在 LeviLamina 的 `Config.json` 中把 `playerInfo.alwaysLaunch` 设为 `true`，并让玩家重新进服一次以写入记录。脚本插件中也可直接用 `money.add(xuid, value)` 等按 xuid 操作离线玩家。

*适用版本：LegacyMoney v0.23.0；LeviLamina 当前版本*

## 自己写的插件想注册一个命令（如 `/checkin`）给玩家加经济（LegacyMoney 的钱），可以直接操作吗？

可以。LegacyMoney 是前置模组，LSE 提供了经济接口：`money.get`/`set`/`add`/`reduce`/`trans`/`getHistory`/`clearHistory`（参数为玩家 xuid），以及 Player 对象上的 `getMoney`/`setMoney`/`addMoney`/`reduceMoney` 等，可直接在脚本插件中加减玩家余额，详见 LSE 文档“经济系统 API”。

原生 C++ 模组可链接 LegacyMoney 并调用 `LLMoney.h` 中导出的 `LLMoney_Add`/`LLMoney_Reduce` 等函数。

若不想写插件，也可以用第三方插件的命令映射功能（如 GMEssentials 的 `command_map`）把自定义命令映射为 `/money add` 等命令。

*适用版本：LSE v0.23.1；LegacyMoney v0.23.0*

## LSE 领地等插件配置里要求花费“货币/硬币”，这个货币从哪来？LLMoney 是什么，需要单独装吗？

这类 LSE 插件的经济一般对接的是 LLMoney 经济系统，在 LeviLamina 上即 LegacyMoney（LLMoney 的移植版），插件里说的“货币/硬币”就是它的余额。安装 LegacyScriptEngine（运行 JS/Lua 等脚本插件的引擎）时它会作为依赖自动安装，无需另装。之后还需要通过其他插件或命令给玩家提供获取货币的途径，例如管理员用 `/money add <玩家> <数量>`，或在 `money.json` 中设置 `def_money` 作为新玩家初始金额。

*适用版本：当前 LSE / LegacyMoney 所有版本*

## LegacyMoney 的 `/money` 以前有 GUI 表单，更新 LSE 后没有了，是 LegacyMoney 自带的 GUI 被删了吗？

LegacyMoney 本身从来没有 GUI，只有命令。以前看到的表单来自其他 LSE 插件（如 TMEssential/TMET）注册了同名 `/money` 命令，覆盖了 LegacyMoney 的命令。新版 LSE 规范了命令注册，已存在的命令不能再被脚本覆盖（只会提示命令已存在），所以表单消失。

解决方法：

- 修改该 LSE 插件里注册的命令名（如改成 `/moneys`）。
- 或者使用提供经济 GUI 的其他插件。
- 如果不需要 LegacyMoney 自带命令，也可在 LegacyMoney 的 `money.json` 中把 `enable_commands` 设为 `false`，让出 `/money` 命令名。
- 也可以去 LegacyMoney 仓库提 feature request。

LegacyMoney v0.23.0 仍无 GUI。

*适用版本：LSE 0.17.x 及以后；LegacyMoney 当前版本*

## LegacyMoney（LLMoney）支持多货币或小数金额吗？

不支持。LegacyMoney 是单一货币系统，每个玩家（xuid）只有一个余额，金额为整数（内部为 `long long`，LSE API 参数类型为 Integer）。需要多货币可以用计分板等方案实现；需要小数（如两位小数）时，建议以整数存储最小单位（如“分”），显示时再换算。

*适用版本：LegacyMoney 当前所有版本*

## LegacyMoney（LLMoney）支持用 UUID 作为玩家标识吗？

不支持，LegacyMoney 以 xuid 作为玩家标识，所有接口（`LLMoney_*` 及 LSE 的 `money.*` API）都传 xuid。没有 xuid 的玩家（如离线模式未登录 Xbox）无法使用，相关操作会直接返回失败。若只有 UUID，可先通过 LeviLamina 的 PlayerInfo（`ll::service::PlayerInfo::fromUuid`）或 LSE 的数据接口换算出 xuid。

*适用版本：LegacyMoney 当前所有版本*

## 使用 LegacyMoney 时，如何查看经济（金钱）流水/来源记录？

使用 `/money hist` 查看自己的流水（仅玩家可执行，可选参数 `time` 为秒数，默认最近 24 小时）；OP 可用 `/money hist <玩家名> [time]` 查看他人流水（控制台查询需带玩家名）。清除流水用 `/money purge`，需再输入 `/money purge confirm [time]` 确认。脚本中可用 LSE 的 `money.getHistory(xuid, time)`。

*适用版本：LegacyMoney 当前所有版本*

## LeviLamina 本体自带经济系统吗？如何在多个服务器之间同步 LegacyMoney 经济数据、实现跨服传送？

LeviLamina 本体不自带经济系统。经济功能由独立的原生 mod LegacyMoney 提供（`lip install github.com/LiteLDev/LegacyMoney`），LegacyScriptEngine 依赖它，安装 LSE 时会自动拉取。LegacyMoney 只把数据存在本地 SQLite（`mods/LegacyMoney/economy.db`），不提供跨服同步或跨服传送功能；这类需求需要借助第三方的跨服协调插件（例如 MineBBS 上的 CoordinationWSS，含跨服传送），或自行开发同步方案。

*适用版本：当前版本（LegacyMoney 0.23.x；LeviLamina 26.60.x）。未能从源码或文档中直接证实，仅供参考。*

## 重构后的 LegacyMoney 有哪些功能？能否提供备份记分板数据的功能？

LegacyMoney 支持查询排行（`/money top [number]`，默认前 10 名）、通过配置项 `currency_symbol` 自定义货币符号，并已提供中文本地化（`lang/zh_CN.json`）。它不提供备份记分板数据的功能，经济数据本身存在 `mods/LegacyMoney/economy.db`（SQLite），备份记分板需自行找第三方工具/插件。

*适用版本：LegacyMoney 0.2 及以上*

## LLMoney（经济插件）在哪里下载？在 MineBBS 上找不到。

LLMoney 在 LeviLamina 下的继任者叫 LegacyMoney，由 LiteLDev 在 GitHub 发布（<https://github.com/LiteLDev/LegacyMoney>），推荐用 lip 安装：`lip install github.com/LiteLDev/LegacyMoney`。旧的 LLMoney 仓库已归档，不适用于 LeviLamina。

*适用版本：LeviLamina 全部版本*

## 从 GitHub 下载的 LegacyMoney 怎么手动安装（不用 lip）？

推荐用 lip 安装（`lip install github.com/LiteLDev/LegacyMoney`），它会自动处理 LeviLamina 版本依赖。

手动安装：

1. 在 Release 中下载对应端的压缩包（服务端为 `LegacyMoney-server-windows-x64.zip`）。
2. 解压后只取其中的 `LegacyMoney` 文件夹，放到服务端的 `mods` 目录下（即 `mods/LegacyMoney/`）。

注意 LegacyMoney 版本必须与 LeviLamina 版本匹配（如 0.23.x 对应 LeviLamina 26.60.*）。

*适用版本：LegacyMoney 0.8 及以上*

## 经济插件（LegacyMoney）里玩家余额变成 -1，用命令设置成任何值都无效，是什么原因？

通常是 `server.properties` 中把 `online-mode` 关闭了。关闭在线模式后玩家拿不到 xuid，而 LegacyMoney 以 xuid 为键：xuid 为空时查询余额直接返回 -1，set/add/reduce 也会直接失败。应保持 `online-mode=true`；关闭期间产生的数据可能因 xuid 缺失/错乱而无法对应。另外数据库读写出错时也会返回 -1，可查看控制台的 `Database error` 日志。

*适用版本：LegacyMoney 0.8.4 及以上*

## C++ 插件中要调用 LegacyMoney（LLMoney）的 API，直接 include `LLMoney.h` 就行吗？

不行，需要先在 `xmake.lua` 中引入 levimc-repo 里的 `legacymoney` 包，例如 `add_requires("legacymoney 0.23.*")`，并在 target 中 `add_packages("legacymoney")`，然后 `#include "LLMoney.h"` 使用 `LLMoney_Get`、`LLMoney_Add` 等函数（需链接其导入库）。运行时服务器上也必须安装 LegacyMoney，建议在 mod 的依赖中声明它。

*适用版本：LegacyMoney 当前所有版本*

## 从 <https://github.com/LiteLDev/LLMoney/releases> 手动下载的 LLMoney 在 LeviLamina 下出问题（经济数据被清零、db/配置文件消失），LLMoney 不支持 LeviLamina 吗？

LLMoney 是 LiteLoaderBDS 时代的插件，仓库已归档，不支持 LeviLamina。LeviLamina 下应使用其继任者 LegacyMoney（<https://github.com/LiteLDev/LegacyMoney>），通过 `lip install github.com/LiteLDev/LegacyMoney` 安装，不要像 LL2 时代那样手动下载放文件。数据位于 `mods/LegacyMoney/economy.db`（配置为 `mods/LegacyMoney/money.json`）；旧数据可把原 `economy.db` 复制到该目录继续使用，LL2 旧格式的 `money.db` 放到 `mods/LegacyMoney/LLMoney/money.db`，启动时会自动转换。

*适用版本：LeviLamina 全部版本*

## LegacyMoney（llmoney）的数据库文件为什么越来越大？如何清理？

数据库 `mods/LegacyMoney/economy.db` 除余额表 `money` 外，还有流水表 `mtrans`，玩家转账、加减钱都会写入，积少成多。清理流水需 OP（GameDirectors 及以上）执行 `/money purge confirm [time]`（直接输入 `/money purge` 只会提示危险操作并要求加 `confirm`；`time` 为秒数，只删除早于该时间的流水，默认 0 即全部清空）。也可以停服后用 SQLite 工具手动删除无用数据（如余额为 0 的记录）。

*适用版本：LegacyMoney 0.7 及以上*

## LeviLamina 下 LegacyMoney（原 LLMoney）的经济数据保存在哪个文件？

经济数据是一个 SQLite 数据库，位于模组目录下：服务端为 `.\plugins\LegacyMoney\economy.db`（余额表 `money` 和流水表 `mtrans` 都在里面）。同一目录下的 `money.json` 是配置文件。如果模组目录里有旧版 LLMoney 的数据 `.\plugins\LegacyMoney\LLMoney\money.db`，LegacyMoney 启动时会自动把它导入 `economy.db`，然后把原文件重命名为 `money_old.db`。

这也适用于当前的 LegacyMoney v0.23.0（服务端模组根目录为 `plugins/`）。

*适用版本：LeviLamina 0.13.x 及以上*
