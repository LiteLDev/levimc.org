# 在 Docker 中运行 LeviLamina

## 用 LeviLamina 官方 docker 镜像部署后，怎么查看日志、进入服务器控制台输入命令（能用 `docker exec` 吗）、以及找到服务器数据？`attach` 后没有任何输出正常吗？

用 `docker ps`（或 `podman ps`）查看容器名/ID；`docker logs -f <容器名>` 查看日志；`docker attach <容器名>` 接入服务器控制台输入命令（不加开头的 `/`），按 `Ctrl+P` 再按 `Ctrl+Q` 脱离而不停止服务器。容器需以 `-d -it` 启动（compose 中为 `stdin_open: true`、`tty: true`）。`attach` 后不会回显之前的日志，看起来没反应是正常的，输入一条命令（如 `list`）即可看到输出。`docker exec` 进入的是容器里的新 shell，看不到也无法输入 BDS 控制台（`docker exec` 可用来在容器里执行 `lip` 等命令）。服务器数据在 volume 中（容器内 `/data`），可用 `docker volume inspect levilamina-server-data` 查看宿主机上的存储位置；不要在宿主机上再直接启动 volume 里的 `bedrock_server_mod.exe`。另外 LeviLamina 注册的命令默认不需要开启作弊即可使用。

*适用版本：docker-levilamina-server 0.9.x（wine 与 windows 镜像）*

## 用 LeviLamina docker 镜像拉到/装上的是很旧的版本（镜像本身很旧，或 `VERSION=LATEST` 仍装旧版 LL），怎么办？

1. 如果拉下来的镜像本身很旧（例如很早期的版本），多半是用了国内 docker 镜像加速站，它缓存的是旧镜像。请直接从官方源 `ghcr.io/liteldev/levilamina-server:latest-wine`（或 `latest-windows`）拉取，或换一个同步正常的镜像站，必要时先 `docker pull` 更新镜像。
2. 环境变量 `VERSION`（默认 `LATEST`，可指定如 `26.60.7`，不带 `v` 前缀）只在第一次启动、卷里还没有 `bedrock_server_mod.exe` 时生效；卷里已经装过服务器时，改 `VERSION` 或换新镜像都不会重新安装 LL。要升级已有服务器里的 LeviLamina，在容器里用 `lip setup` 同时指定游戏版本和 LL 版本，例如 `docker exec -it <容器名> lip setup --game <该 LL 版本支持的游戏版本> --loader levilamina@<LL 版本> --accept-eula`（可先加 `--dry-run` 查看影响），然后重启容器（`docker stop -t 60` 再 `docker start`）；注意 `lip update` 不能更新游戏和 LeviLamina，会拒绝并提示改用 `lip setup`。也可以新建一个卷重新部署。
3. LL 本体在 `mods/LeviLamina`，迁移旧服务器时不要把旧的 LeviLamina 目录覆盖回去，只拷贝 `worlds`、`allowlist.json`、`server.properties` 等数据和其他模组。

教程：<https://levimc.org/zh-Hans/tutorials/server/docker/>

*适用版本：docker-levilamina-server 0.9.x（lip v0.41+）*

## LeviLamina 服务器有 docker 部署方式吗？能挂载数据吗？镜像里没有 Python 运行环境怎么办？

有官方镜像 `ghcr.io/liteldev/levilamina-server:latest-wine`（Linux 容器）和 `:latest-windows`（Windows 容器），服务器、世界和设置都在 `/data`（Windows 为 `C:\data`），可用命名卷或 bind mount 挂载。官方 LeviLamina 镜像不含 Python。如果是为了跑 LeviStone/Endstone Python 插件，直接用官方 `ghcr.io/liteldev/levistone-server` 镜像（已内置 Python 和 LeviStone）；其他需求可基于官方镜像 `docker build` 二次打包：Windows 镜像可在 servercore 里自行安装 Python；Linux（Wine）镜像中 BDS 跑在 lip 安装的 Wine 里，Python 也要装进那个 Wine 前缀（`/data/.lip/wine`），而不是 `apt install python3`，可参考 docker-levistone-server 的实现。

*适用版本：docker-levilamina-server 0.9.x；docker-levistone-server 0.3.x*

## 在 Windows 容器中运行 LeviLamina/BDS，能用 nanoserver 作基础镜像吗？nanoserver 装不上 VC 运行库怎么办？

nanoserver 缺少大量组件，装不上 VC 运行库，也跑不起 BDS/LeviLamina；请使用 servercore 基础镜像（官方 Windows 镜像用的就是 `mcr.microsoft.com/windows/servercore:ltsc2022`）。在 servercore 中可静默安装 VC 运行库：`vc_redist.x64.exe /install /quiet /norestart`。想减小体积只能在 servercore 上逐项裁剪。

*适用版本：Windows 容器，当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## 用 docker 部署 LeviLamina，服务端文件和配置文件（`server.properties` 等）在哪里？

都在容器的数据目录 `/data`（Windows 镜像为 `C:\data`），`bedrock_server_mod.exe`、`server.properties`、`worlds`、`mods` 等都在这里，对应挂载的卷（默认 `levilamina-server-data`）。在宿主机上用 `docker volume inspect levilamina-server-data` 查看卷的实际路径；也可以改用 bind mount（`-v /宿主机目录:/data`）直接访问。

*适用版本：docker-levilamina-server 当前所有版本*

## Linux 面板服（如翼龙/Pterodactyl 面板）如何安装 LeviLamina？

需要面板（或服务商）支持运行 Windows 版 BDS + Wine 的环境，可参考官方 docker 镜像的实现：<https://github.com/LiteLDev/docker-levilamina-server>（Linux 镜像里由原生 lip 执行 `lip install --accept-eula github.com/LiteLDev/LeviLamina` 安装，再用 `lip run` 启动，lip 会自带 Wine）。

*适用版本：当前所有版本，x64 Linux*

## 在 Linux 上用 LeviLamina docker 镜像运行服务器，执行 `pip install levistone --target ...` 报 `No matching distribution found for levistone`，如何在 docker 里用 LeviStone？

官方 LeviLamina 镜像（`levilamina-server`）没有 Python 环境，在 Linux 宿主机/容器里直接用 Linux 的 pip 也装不了（LeviStone 需要装在运行服务器的 Wine 里的 Windows 版 Python 中）。请直接改用官方的 LeviStone 镜像：

```shell
docker run -d -it --name levistone -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levistone-server-data:/data ghcr.io/liteldev/levistone-server:latest-wine
```

它会把 Python 装进 Wine 前缀，并用 pip 把 LeviStone 装到 `mods/EndstoneRuntime`；Endstone 插件放在卷中的 `plugins/` 目录。可用 `LEVISTONE_VERSION` 指定版本（须与 LeviLamina 版本匹配），`PYPI_MIRROR_URL` 指定 PyPI 镜像。

*适用版本：docker-levistone-server 0.3.x 及以上*

## 面板服或 Wine 环境下无法安装 LeviStone，有其它在 Linux 上运行 LeviStone 的办法吗？

使用官方 LeviStone docker 镜像：<https://github.com/LiteLDev/docker-levistone-server>（`ghcr.io/liteldev/levistone-server:latest-wine`），首次启动会自动安装 Wine、VC 运行库、游戏、LeviLamina、Python 和 LeviStone。国内可用 `GITHUB_MIRROR_URL`、`PYPI_MIRROR_URL` 和 `ghcr.nju.edu.cn` 加速。

*适用版本：docker-levistone-server 当前版本*

## 在 Linux（如用 MCSManager）上运行 LeviLamina 服务端，启动后模组（插件）没有加载，怎么办？

LeviLamina 只有 Windows 版，在 Linux 上必须用 Wine 运行 Windows 版服务端（`bedrock_server_mod.exe`），直接跑 Linux 版 BDS 是不会加载 LeviLamina 和模组的。最简单的做法是用 Docker 运行官方镜像 `ghcr.io/liteldev/levilamina-server:latest-wine`（仓库 <https://github.com/LiteLDev/docker-levilamina-server>），例如：

```shell
docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
```

容器首次启动时 lip 会自动装好 Wine、VC++ 运行库、游戏和 LeviLamina，宿主机不需要装 Wine。也可以不用 Docker：x64 Linux 上直接用 Linux 版 lip 开服，lip 会用自带的 Wine 运行 Windows 服务端。国内从 GitHub 下载慢/超时，可加 `-e GITHUB_MIRROR_URL=<GitHub 镜像地址>`，拉取 ghcr.io 镜像本身也可能需要代理或镜像源。

*适用版本：当前所有版本（docker-levilamina-server 0.9.x / lip v0.41+）*

## 在官方 LeviLamina docker 容器里如何安装 LSE 等模组？为什么容器里 LeviLamina 显示的是英文？

官方镜像自带 lip。已装好的服务器用 `docker exec` 在运行中的容器里执行 lip，例如：

```shell
docker exec -it levilamina lip install github.com/LiteLDev/LegacyScriptEngine#quickjs
```

（变体有 `#lua`、`#quickjs`、`#nodejs`、`#python`），装完后重启容器（`docker stop -t 60 levilamina && docker start levilamina`）模组才会加载。新开服务器时也可以用环境变量 `PACKAGES` 在首次启动时一并安装。

显示英文是因为 LeviLamina 配置 `mods/LeviLamina/config/Config.json` 中 `"language"` 默认为 `"system"`，跟随容器的系统区域设置，而容器默认不是中文。使用 wine 镜像时可以给容器传入 `-e LANG=zh_CN.UTF-8`（必要时同时设 `LC_ALL`），或直接把 `Config.json` 里的 `language` 改为 `"zh_CN"`（写成 `"zh-CN"` 也可以）后重启。

*适用版本：docker-levilamina-server 0.9.x；LeviLamina 当前版本；LSE 当前版本*

## 用 Docker 部署 LeviLamina 服务器好用吗？Windows 容器能跑吗？

官方提供两种镜像：`ghcr.io/liteldev/levilamina-server:latest-wine`（Linux 容器，lip 原生运行并用自装 Wine 运行 Windows 服务端）和 `ghcr.io/liteldev/levilamina-server:latest-windows`（Windows 容器）。Windows 镜像基于 `mcr.microsoft.com/windows/servercore:ltsc2022`，可以运行 LeviLamina；如果自己构建 Windows 镜像，建议同样使用 servercore 作为基础镜像，nanoserver 一般不适合运行完整的服务端。Windows 镜像卷要挂载到 `C:\data`。是否用 Docker 取决于习惯：如果宿主机本来就是 Windows，直接开服（配合面板、开机自启）通常更简单；Linux 宿主机推荐用官方 wine 镜像。注意要接入控制台用 `docker attach`，且容器要以 `-it` 运行。

*适用版本：docker-levilamina-server 0.9.x*

## 用 MCSManager 面板（Docker 镜像方式）搭建 LeviLamina 服务器，启动命令和容器应该怎么配置？

镜像填 `ghcr.io/liteldev/levilamina-server:latest-wine`；启动命令留空（使用镜像自带的 entrypoint）；容器内挂载目录设为 `/data`；端口映射 `19132:19132/udp`（官方示例同时映射 `19132:19132/tcp`）；需要可交互控制台（`-it`）。环境变量：

- `EULA=TRUE`（必须是大写 `TRUE`，entrypoint 区分大小写，写 `true` 会直接退出）
- `LANG=zh_CN.UTF-8`（可选，中文区域设置）
- `WINEDEBUG=-all`（未设置时 lip 运行服务端会默认设为 `-all`，可不填）
- 可选：`VERSION`、`PACKAGES`、`GITHUB_MIRROR_URL`、`TZ`

如果启动时出现崩溃日志相关报错，可在 `mods/LeviLamina/config/Config.json` 中把 `modules.crashLogger.enabled` 设为 `false` 排查。

*适用版本：docker-levilamina-server 0.9.x；LeviLamina 当前版本*

## 用 docker 运行 `ghcr.io/liteldev/levilamina-server:latest-wine` 后，客户端提示版本不匹配无法进入，需要什么版本的 MC？

镜像里的游戏（BDS）版本由所装的 LeviLamina 版本决定（环境变量 `VERSION`，默认 `LATEST` 即最新 LeviLamina），而 LeviLamina 适配新版 MC 需要时间，所以服务端版本经常低于最新客户端。客户端版本需要与该 LeviLamina 版本支持的 BDS 版本一致（可在 LeviLamina 的 release 说明中查看对应游戏版本），或等待 LeviLamina 适配新版后用新版本重新部署。也有第三方模组可以让更高版本的客户端进入，但不属于 LiteLDev 官方支持范围。

## 使用 LeviLamina 官方 docker 镜像运行服务端时，控制台（如 MCSManager 面板）里的中文显示为乱码，怎么解决？

先给容器传入区域设置环境变量 `LANG=zh_CN.UTF-8`（必要时同时设 `LC_ALL=zh_CN.UTF-8`），wine 镜像已包含全部区域设置（`locales-all`），Wine 会按该区域设置转换输出编码。然后检查面板（MCSM）实例的终端/输出编码是否为 UTF-8。仍然乱码时可临时把 LeviLamina 的 `language` 改为英文规避，但只输出中文的模组仍可能乱码。

*适用版本：docker-levilamina-server wine 镜像（0.7.1 起含 locales-all）。未能从源码或文档中直接证实，仅供参考。*

## 使用 `ghcr.io/liteldev/levilamina-server` 镜像时，如何指定 LeviLamina 版本、使用镜像加速、预装模组？

通过环境变量配置：

- `EULA=TRUE`（必须，大写）
- `VERSION`：要安装的 LeviLamina 版本，如 `26.60.7`，默认 `LATEST`（最新），游戏版本由它决定
- `GITHUB_MIRROR_URL`：下载用的 GitHub 镜像（即 lip 的 `github_proxy`），如 `https://v4.gh-proxy.org/https://github.com/`
- `PACKAGES`：首次启动时用 lip 安装的包，空格分隔
- 另有 `TZ`、`LANG`/`LC_ALL`、`WINEDEBUG`（仅 wine 镜像，默认 `-all`）

例：

```shell
docker run -d -it --name levilamina -e EULA=TRUE -e VERSION=26.60.7 -e PACKAGES="github.com/LiteLDev/LeviOptimize" -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
```

注意 `VERSION` 和 `PACKAGES` 只在首次安装（卷里还没有 `bedrock_server_mod.exe`）时生效；之后加模组请用 `docker exec -it levilamina lip install <包>`。

*适用版本：docker-levilamina-server 0.8.8 及以上（当前 0.9.1）*
