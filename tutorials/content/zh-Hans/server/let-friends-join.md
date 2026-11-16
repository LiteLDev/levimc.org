# 让朋友连上你的服务器

学完这篇教程，你的朋友就能连上你的服务器：先是家里网络中的另一台设备，然后是通过互联网——无论你的路由器有公网 IP、服务商只允许你使用某些端口，还是你根本没有公网 IP、要借助 frp 之类的内网穿透。

## 你需要准备

- 一个能启动的、带 LeviLamina 的服务器：见[开你的第一个服务器](first-server.md)。
- 另一台装有 Minecraft 基岩版的设备，版本与服务器相同，用来测试。
- 如果要通过互联网游玩：能进入路由器的设置，或者服务商、内网穿透服务的管理面板。

## 服务器监听哪些端口

服务器文件夹里 `server.properties` 的两个配置项决定了要开放哪些端口：

| 配置项 | 默认值 | 协议 | 用途 |
| --- | --- | --- | --- |
| `server-port` | `19132` | TCP 和 UDP | 加入服务器 |
| `server-udp-ports` | `19132` | UDP | NetherNet（基岩版较新的网络传输方式）的游戏通信 |

所以在默认配置下，规则很简单：**开放 19132 端口，TCP 和 UDP 都要开。** 配置项 `transport` 表示服务器使用哪种传输方式。第 5、6 步里的 `server-udp-ports` 和 LeviLamina 的 NetherNet 补丁只在它为 `nethernet` 时才有意义；使用 RakNet 时，服务器只用 `server-port`。

修改 `server.properties` 之前先停止服务器，然后用文本编辑器修改这个文件，或者在 `lip` 的「游戏配置」页面上修改。

## 1. 找到服务器的地址

在运行服务器的电脑上打开终端：

::: code-group

```powershell [Windows]
ipconfig
```

```shell [Linux]
hostname -I
```

```shell [macOS]
ipconfig getifaddr en0
```

:::

记下你的网卡的 IPv4 地址，例如 `192.168.1.20`。这就是服务器在家庭网络里的地址。

## 2. 开放防火墙

服务器第一次在 Windows 上启动时，Windows Defender 防火墙可能会询问是否允许它。请允许它访问**专用网络**。

如果错过了这个询问，或者有别的防火墙挡住了端口，就自己开放它。在以管理员身份运行的 PowerShell 里执行：

```powershell
New-NetFirewallRule -DisplayName "Minecraft server (UDP)" -Direction Inbound -Protocol UDP -LocalPort 19132 -Action Allow
New-NetFirewallRule -DisplayName "Minecraft server (TCP)" -Direction Inbound -Protocol TCP -LocalPort 19132 -Action Allow
```

使用 ufw 的 Linux：`sudo ufw allow 19132`。

## 3. 从家庭网络加入

1. 启动服务器，等出现 `Server started.`。
2. 在另一台设备上打开 Minecraft，依次进入**开始游戏**、**服务器**、**添加服务器**。名称随便填，地址填第 1 步得到的地址（`192.168.1.20`），端口填 `19132`，然后保存。
3. 加入服务器。你应该进入了世界，在服务器控制台输入 `list` 也应该能看到你的名字。

在同一个网络里，服务器也可能出现在**好友**页的局域网游戏中。

::: tip 白名单
如果 `server.properties` 里的 `allow-list` 为 `true`，只有白名单上的玩家能加入。用服务器命令 `allowlist add <玩家名>` 添加朋友，或者在 `lip` 的「游戏配置」页面的**白名单**标签页里添加。
:::

## 4. 通过互联网加入：有公网 IP 的路由器

这是家庭网络里最常见的情况。

1. 给服务器所在的电脑分配一个固定的局域网地址，让下面的端口映射始终指向它。大多数路由器把这叫作 DHCP 地址保留（静态 DHCP）。
2. 在路由器的设置里添加一条**端口映射**（端口转发）规则：外部端口 `19132` 映射到 `192.168.1.20` 的 `19132` 端口，**TCP 和 UDP** 都要映射。
3. 在路由器的状态页面上找到你的公网 IP 地址。
4. 从你的网络之外测试，例如用开着移动数据的手机：添加一个服务器，地址填你的公网 IP，端口填 `19132`。很多路由器从内网访问不了自己的公网地址，所以即使一切正常，在家里测试也可能失败。
5. 把公网 IP 和端口告诉朋友。

如果路由器状态页面上的公网 IP 和网站查到的不一样，或者以 `100.64` 到 `100.127` 开头，说明你没有自己的公网 IP：请看第 6 步。

## 5. 端口由服务商决定时

在租用的机器或处在 NAT 后面的主机上，服务商通常会把它选定的外部端口映射到你的机器。假设它允许你使用端口 `11451`。

1. 停止服务器。在 `server.properties` 里把两个端口都改成允许使用的那个：

   ```properties
   server-port=11451
   server-udp-ports=11451
   ```

2. 在服务商的管理面板里，把外部端口 `11451` 映射到你的机器的 `11451` 端口，**TCP 和 UDP** 都要映射，并像第 2 步那样在防火墙里开放它。
3. 启动服务器，用服务商给的公网 IP 和端口 `11451` 连接。

::: warning 客户端报错，错误代码为“Door”
LeviLamina 通过 STUN 服务器获取服务器的公网 IP。获取失败时，客户端就连不上，并显示错误代码 `Door`。这时请自己告诉服务器它的公网地址，格式是 `<公网 IP>:<外部端口>:<本机端口>`：

```properties
server-udp-ports=203.0.113.4:11451:11451
```

然后在 `mods/LeviLamina/config/Config.json` 的 `targeted` 部分里关闭 LeviLamina 的 NetherNet 补丁：

```json
"netherNetPatch": {
    "enable": false,
    "stunServers": ["stun:stun.l.google.com:19302", "stun:stun.miwifi.com:3478"]
}
```
:::

## 6. 没有公网 IP：内网穿透

你的网络没有公网 IP 时，可以用 frp 之类的内网穿透软件，把一台有公网 IP 的机器（**出口节点**）上的端口转发到你的服务器。假设内网穿透给了你出口节点 `203.0.113.4` 上的端口 `11451`。

1. 停止服务器。在 `server.properties` 里设置：

   ```properties
   server-port=11451
   server-udp-ports=203.0.113.4:11451:11451
   ```

2. 在内网穿透软件里，把出口节点的 `11451` 端口转发到你的机器的 `11451` 端口，**TCP 和 UDP** 都要转发。
3. 按第 5 步的警告框，在 `mods/LeviLamina/config/Config.json` 里关闭 NetherNet 补丁。
4. 启动服务器，用 `203.0.113.4` 和端口 `11451` 连接。

## 你现在有了什么

- 一个服务器：家庭网络里的玩家用局域网地址就能加入，互联网上的玩家用你的公网地址或内网穿透的地址加入。
- 决定这一切的配置：`server-port` 和 `server-udp-ports`，以及服务器在 NAT 后面时 LeviLamina 的 NetherNet 补丁。

## 下一步

- 给玩家们添点乐子：[给服务器安装模组](install-mods.md)。
- 修改服务器名称、游戏模式、白名单和权限：[游戏配置](https://levimc.org/lip/zh-Hans/interface/game_config.html)。
- 不开终端也让服务器运行：[用命令行开服](command-line.md#_4-不开终端也让它运行)。
- LeviLamina 的错误码：[问题排除](https://levimc.org/LeviLamina/zh-Hans/user_guides/troubleshooting/)。
