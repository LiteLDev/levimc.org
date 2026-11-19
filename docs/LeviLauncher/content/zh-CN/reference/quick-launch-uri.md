---
platforms: [android]
---
# 快速启动 URI

Android 版的 **快速启动** 用一个 `minecraft://` URI 启动 Minecraft，告诉游戏先打开什么。快速启动界面上的每个操作都会生成下面的某个 URI；**自定义 URI** 接受任何以 `minecraft://` 开头的 URI。游戏如何处理 URI 由 Minecraft 决定。

LeviLauncher 也能打开其他应用中的 `minecraft://` 链接：Android 会把它列为可以打开这类链接的应用之一。

## 操作

| 操作 | URI | 需要填写 |
| --- | --- | --- |
| **玩法说明** | `minecraft://?showHowToPlayScreen=1` | — |
| **服务器选项卡** | `minecraft://openServersTab` | — |
| **个人资料 / 更衣室** | `minecraft://showProfileScreen` | — |
| **市场首页** | `minecraft://openStore` | — |
| **Minecoins** | `minecraft://?showMineCoinOffers=1` | — |
| **市场通行证** | `minecraft://?openCsbPDPScreen=<tab>` | 选项卡：`Home`、`Content`、`Faq` 或 `Subscribe` |
| **连接到服务器** | `minecraft://connect/?serverUrl=<地址>&serverPort=<端口>` | 服务器地址和端口（默认 `19132`） |
| **添加外部服务器** | `minecraft://?addExternalServer=<名称>\|<地址>:<端口>` | 名称、地址和端口（默认 `19132`） |
| **加入领域** | `minecraft://acceptRealmInvite?inviteID=<邀请码>` | 领域（Realm）邀请码 |
| **加载世界** | `minecraft://connect/?localWorld=<世界>` | 本地世界的名称 |
| **执行命令** | `minecraft://?slashcommand=<命令>` | 要在游戏中执行的命令 |
| **自定义 URI** | 任意 `minecraft://…` | URI |

服务器名称、世界名称和命令会经过 URL 编码（空格变为 `%20`，`/` 变为 `%2F`）。

## 示例

要加入 `play.example.org` 上端口为 `19132` 的服务器，选择 **连接到服务器**，或在设备上打开这个链接：

```text
minecraft://connect/?serverUrl=play.example.org&serverPort=19132
```

其他 Android 专属功能见[账号与快速启动](../guide/accounts-quick-launch)。
