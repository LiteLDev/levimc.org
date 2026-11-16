# 在 Docker 中运行服务器

学完这篇教程，你会有一个运行在 Docker 容器里、装有 LeviLamina 的基岩版专用服务器，它的世界保存在 Docker 卷里；你还会知道怎样进入它的控制台、添加模组、安全地停止它。容器第一次启动时会自己装好一切：宿主机上既不用装 `lip`，也不用装 Wine。

镜像有两种，都来自 [LiteLDev/docker-levilamina-server](https://github.com/LiteLDev/docker-levilamina-server)：

| 镜像 | 运行在 | 方式 |
| --- | --- | --- |
| `ghcr.io/liteldev/levilamina-server:latest-wine` | Linux 容器：x64 的 Linux 宿主机，或 Docker Desktop | 通过 Wine 运行 Windows 服务器 |
| `ghcr.io/liteldev/levilamina-server:latest-windows` | Windows 容器：Windows Server，或切换到 Windows 容器的 Docker Desktop | 直接运行 Windows 服务器 |

本教程使用 Wine 镜像。Windows 镜像见第 2 步末尾的提示。

## 你需要准备

- Docker：Linux 上的 Docker Engine，或 Windows 和 macOS 上的 Docker Desktop。`docker version` 应当能同时列出客户端和服务端的版本。
- 一台 x64 处理器的宿主机。
- 网络连接。容器从 minecraft.net 下载游戏，从 GitHub 下载 LeviLamina。

## 1. 启动容器

1. 运行：

   ```shell
   docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
   ```

   各部分的作用：

   - `-d -it`：在后台运行，并保留一个之后可以接入的控制台。
   - `--name levilamina`：后面的命令用这个名字指代容器。
   - `-e EULA=TRUE`：表示你接受[《Minecraft 最终用户许可协议》](https://www.minecraft.net/eula)。没有它，容器会立即停止。
   - `-p 19132:19132/udp -p 19132:19132/tcp`：服务器的端口，两种协议都要映射。
   - `-v levilamina-server-data:/data`：服务器、世界和设置都放在卷 `levilamina-server-data` 里，删除容器后它们依然保留。

2. 查看容器在做什么：

   ```shell
   docker logs -f levilamina
   ```

   第一次启动时，容器会准备 Wine，用 `lip` 安装 LeviLamina 和游戏，然后启动服务器，需要几分钟。最后你应该看到 `Server started.`。按 `Ctrl+C` 停止查看日志，服务器会继续运行。

::: tip 从 GitHub 下载很慢
在 `docker run` 命令里加上 `-e GITHUB_MIRROR_URL=<GitHub 镜像地址>`，例如 `-e GITHUB_MIRROR_URL=https://v4.gh-proxy.org/https://github.com/`。
:::

## 2. 使用控制台

1. 接入服务器：

   ```shell
   docker attach levilamina
   ```

2. 输入一条服务器命令（不用加开头的 `/`），按 `Enter`：

   ```text
   list
   ```

   你应该看到 `There are 0/10 players online:`。

3. 脱离而不停止服务器：先按 `Ctrl+P`，再按 `Ctrl+Q`。

::: tip Windows 镜像
在 Windows 容器宿主机上，使用 `ghcr.io/liteldev/levilamina-server:latest-windows`，并把卷挂载到 `C:\data`：`-v levilamina-server-data:C:\data`。本教程的其他内容都一样。
:::

## 3. 添加模组

容器第一次启动、安装服务器时，会安装变量 `PACKAGES` 里列出的包，包之间用空格分隔。[LeviMC 模组](https://levimc.org/zh-Hans/mods/)目录里的任何模组都可以，名字就是模组页面上 `lip install` 后面的部分。

要新开一个带模组的服务器，把这个变量加进第 1 步的 `docker run` 命令：

```shell
-e PACKAGES="github.com/LiteLDev/LeviOptimize github.com/LiteLDev/LegacyScriptEngine#lua"
```

::: details 给已经装好的服务器添加模组
`PACKAGES` 只在第一次启动时读取。之后请在运行中的容器里执行 `lip`：

```shell
docker exec -it levilamina lip install github.com/LiteLDev/LeviOptimize
```

服务器下次启动时才会加载这个模组：按第 4 步停止并重新启动它。之后 `docker logs levilamina` 应当显示 `[LeviLamina]` 正在加载这个模组。
:::

## 4. 停止和启动服务器

1. 接入（`docker attach levilamina`）后输入 `stop`。服务器保存世界后退出，容器也随之停止。你应该在输出里看到 `Quit correctly`。
2. 以后再启动它：

   ```shell
   docker start levilamina
   ```

   第二次启动很快：服务器已经装在卷里了。

`docker stop` 也能用，但它只给服务器 10 秒，之后就会强行结束。输入 `stop` 才是安全的做法。

## 使用 Docker Compose

也可以不用 `docker run`：把 [wine/compose.yaml](https://github.com/LiteLDev/docker-levilamina-server/blob/main/wine/compose.yaml)（或 [windows/compose.yaml](https://github.com/LiteLDev/docker-levilamina-server/blob/main/windows/compose.yaml)）下载到一个空文件夹，在那里运行 `docker compose up -d`。它设置了同样的 EULA、端口和卷。`PACKAGES` 等变量写在 `environment:` 下面。`docker compose logs -f` 查看日志，`docker compose attach levilamina-server` 打开控制台。

## 容器的设置

| 变量 | 默认值 | 含义 |
| --- | --- | --- |
| `EULA` | | 必须为 `TRUE`。 |
| `VERSION` | `LATEST` | 要安装的 LeviLamina 版本，例如 `26.60.7`。游戏版本由它决定。 |
| `PACKAGES` | | 第一次启动时安装的包，用空格分隔。 |
| `GITHUB_MIRROR_URL` | | 下载用的 GitHub 镜像。 |
| `TZ` | `UTC` | 时区，影响日志里的时间。 |
| `LANG`、`LC_ALL` | | 容器里的区域设置，例如 `en_US.UTF-8`（Wine 镜像包含所有区域设置）。 |
| `WINEDEBUG` | `-all` | Wine 的调试输出（仅 Wine 镜像）。 |

## 你现在有了什么

- 一个名为 `levilamina` 的容器，在 19132 端口上运行 LeviLamina 服务器。
- 一个卷 `levilamina-server-data`，里面有服务器、世界和设置，容器删掉后它依然在。

## 下一步

- 挑选模组：[给服务器安装模组](install-mods.md)讲了包名和变体。
- 让网络外的玩家连进来：[让朋友连上你的服务器](let-friends-join.md)。
- 不用 Docker 开服：[开你的第一个服务器](first-server.md)或[用命令行开服](command-line.md)。
- `PACKAGES` 接受的包名、版本和引用：[管理包](https://levimc.org/zh-Hans/lip/guides/managing_packages.html)。
- 镜像、它们的 Dockerfile 和更新日志：[LiteLDev/docker-levilamina-server](https://github.com/LiteLDev/docker-levilamina-server)。
- 出了问题：[LeviLamina 问题排除](https://levimc.org/zh-Hans/LeviLamina/user_guides/troubleshooting/)。
