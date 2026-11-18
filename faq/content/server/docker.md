# LeviLamina in Docker

## After deploying with the official LeviLamina docker image, how do I view the logs, enter the server console to type commands (can I use `docker exec`?), and find the server data? Is it normal that nothing is printed after `attach`?

Use `docker ps` (or `podman ps`) to see the container name/ID; `docker logs -f <container name>` shows the logs; `docker attach <container name>` connects to the server console so you can type commands (without the leading `/`), and pressing `Ctrl+P` then `Ctrl+Q` detaches without stopping the server. The container must be started with `-d -it` (in compose: `stdin_open: true` and `tty: true`). After `attach`, earlier logs are not echoed, so it is normal that nothing seems to happen; type a command (such as `list`) and you will see the output. `docker exec` opens a new shell inside the container; it cannot show or accept input for the BDS console (you can use `docker exec` to run commands such as `lip` in the container). The server data is in the volume (`/data` inside the container); use `docker volume inspect levilamina-server-data` to find where it is stored on the host. Do not start the `bedrock_server_mod.exe` in the volume directly on the host as well. Also, commands registered by LeviLamina can be used without enabling cheats by default.

*Applies to: docker-levilamina-server 0.9.x (wine and windows images)*

## The LeviLamina docker image I pulled or installed is a very old version (the image itself is old, or `VERSION=LATEST` still installs an old LL). What should I do?

1. If the image you pulled is itself very old (for example a very early version), you most likely used a docker mirror (accelerator) site in mainland China that cached an old image. Pull directly from the official source `ghcr.io/liteldev/levilamina-server:latest-wine` (or `latest-windows`), or switch to a mirror that syncs properly, and run `docker pull` first to update the image if needed.
2. The `VERSION` environment variable (default `LATEST`; you can set a value such as `26.60.7`, without a `v` prefix) only takes effect on the first start, when the volume does not yet contain `bedrock_server_mod.exe`. When the volume already has a server installed, changing `VERSION` or switching to a newer image does not reinstall LL. To upgrade LeviLamina in an existing server, use `lip setup` in the container and specify both the game version and the LL version, for example `docker exec -it <container name> lip setup --game <game version supported by that LL version> --loader levilamina@<LL version> --accept-eula` (add `--dry-run` first to see the effects), then restart the container (`docker stop -t 60`, then `docker start`). Note that `lip update` cannot update the game or LeviLamina; it refuses and tells you to use `lip setup`. You can also create a new volume and deploy again.
3. LeviLamina itself is in `mods/LeviLamina`. When migrating an old server, do not copy the old LeviLamina directory back over it; copy only data such as `worlds`, `allowlist.json` and `server.properties`, plus your other mods.

Tutorial: <https://levimc.org/tutorials/server/docker/>

*Applies to: docker-levilamina-server 0.9.x (lip v0.41+)*

## Is there a docker deployment for LeviLamina servers? Can I mount data? What if the image has no Python runtime?

There are official images: `ghcr.io/liteldev/levilamina-server:latest-wine` (Linux container) and `:latest-windows` (Windows container). The server, worlds and settings are all in `/data` (`C:\data` on Windows), and you can mount it with a named volume or a bind mount. The official LeviLamina image does not include Python. If you want to run LeviStone/Endstone Python plugins, use the official `ghcr.io/liteldev/levistone-server` image directly (it has Python and LeviStone built in). For other needs, you can build your own image on top of the official one with `docker build`: on the Windows image you can install Python yourself in servercore; in the Linux (Wine) image BDS runs inside a Wine installed by lip, so Python must be installed into that Wine prefix (`/data/.lip/wine`) rather than with `apt install python3`. See docker-levistone-server for a reference implementation.

*Applies to: docker-levilamina-server 0.9.x; docker-levistone-server 0.3.x*

## Can I use nanoserver as the base image when running LeviLamina/BDS in a Windows container? What if the VC runtime cannot be installed on nanoserver?

nanoserver lacks many components, so the VC runtime cannot be installed and BDS/LeviLamina cannot run. Use the servercore base image (the official Windows image uses `mcr.microsoft.com/windows/servercore:ltsc2022`). In servercore you can install the VC runtime silently with `vc_redist.x64.exe /install /quiet /norestart`. To reduce the image size, the only option is to trim components from servercore one by one.

*Applies to: Windows containers, all current versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## When deploying LeviLamina with docker, where are the server files and config files (`server.properties` and so on)?

They are all in the container's data directory `/data` (`C:\data` on the Windows image): `bedrock_server_mod.exe`, `server.properties`, `worlds`, `mods` and so on, which correspond to the mounted volume (default `levilamina-server-data`). On the host, use `docker volume inspect levilamina-server-data` to see the volume's actual path. You can also switch to a bind mount (`-v /host/directory:/data`) to access the files directly.

*Applies to: docker-levilamina-server, all current versions*

## How do I install LeviLamina on a Linux panel host (such as the Pterodactyl panel)?

The panel (or hosting provider) must support an environment that runs the Windows version of BDS with Wine. You can follow the implementation of the official docker image: <https://github.com/LiteLDev/docker-levilamina-server> (in the Linux image, native lip installs with `lip install --accept-eula github.com/LiteLDev/LeviLamina` and then starts the server with `lip run`; lip brings its own Wine).

*Applies to: all current versions, x64 Linux*

## On Linux, with the LeviLamina docker image, `pip install levistone --target ...` fails with `No matching distribution found for levistone`. How do I use LeviStone in docker?

The official LeviLamina image (`levilamina-server`) has no Python environment, and installing with the Linux pip on a Linux host or in the container does not work either (LeviStone must be installed into the Windows build of Python inside the Wine that runs the server). Use the official LeviStone image instead:

```shell
docker run -d -it --name levistone -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levistone-server-data:/data ghcr.io/liteldev/levistone-server:latest-wine
```

It installs Python into the Wine prefix and uses pip to install LeviStone into `mods/EndstoneRuntime`; put Endstone plugins in the `plugins/` directory of the volume. You can set the version with `LEVISTONE_VERSION` (it must match the LeviLamina version) and a PyPI mirror with `PYPI_MIRROR_URL`.

*Applies to: docker-levistone-server 0.3.x and later*

## LeviStone cannot be installed on a panel host or in a Wine environment. Is there another way to run LeviStone on Linux?

Use the official LeviStone docker image: <https://github.com/LiteLDev/docker-levistone-server> (`ghcr.io/liteldev/levistone-server:latest-wine`). On first start it installs Wine, the VC runtime, the game, LeviLamina, Python and LeviStone automatically. In mainland China you can speed things up with `GITHUB_MIRROR_URL`, `PYPI_MIRROR_URL` and `ghcr.nju.edu.cn`.

*Applies to: docker-levistone-server, current version*

## I run a LeviLamina server on Linux (for example with MCSManager), and the mods (plugins) are not loaded after startup. What should I do?

LeviLamina exists only for Windows. On Linux you must run the Windows server (`bedrock_server_mod.exe`) with Wine; running the Linux build of BDS directly does not load LeviLamina or any mods. The simplest way is to run the official image `ghcr.io/liteldev/levilamina-server:latest-wine` with Docker (repository <https://github.com/LiteLDev/docker-levilamina-server>), for example:

```shell
docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
```

On the container's first start, lip installs Wine, the VC++ runtime, the game and LeviLamina automatically; the host does not need Wine. You can also skip Docker: on x64 Linux, run the server directly with the Linux build of lip, which runs the Windows server with its own Wine. In mainland China, downloads from GitHub can be slow or time out; you can add `-e GITHUB_MIRROR_URL=<GitHub mirror address>`, and pulling the ghcr.io image itself may also need a proxy or a mirror.

*Applies to: all current versions (docker-levilamina-server 0.9.x / lip v0.41+)*

## How do I install mods such as LSE in the official LeviLamina docker container? Why does LeviLamina show English in the container?

The official image includes lip. For an already installed server, use `docker exec` to run lip in the running container, for example:

```shell
docker exec -it levilamina lip install github.com/LiteLDev/LegacyScriptEngine#quickjs
```

(the variants are `#lua`, `#quickjs`, `#nodejs` and `#python`). After installing, restart the container (`docker stop -t 60 levilamina && docker start levilamina`) so the mod is loaded. When you set up a new server, you can also install packages on the first start with the `PACKAGES` environment variable.

It shows English because `"language"` in the LeviLamina config `mods/LeviLamina/config/Config.json` defaults to `"system"`, which follows the container's system locale, and the container is not set to Chinese by default. With the wine image you can pass `-e LANG=zh_CN.UTF-8` to the container (and set `LC_ALL` too if needed), or change `language` in `Config.json` directly to `"zh_CN"` (`"zh-CN"` also works) and restart.

*Applies to: docker-levilamina-server 0.9.x; LeviLamina current version; LSE current version*

## Is Docker a good way to deploy a LeviLamina server? Can it run in a Windows container?

Two official images are provided: `ghcr.io/liteldev/levilamina-server:latest-wine` (a Linux container; lip runs natively and uses its own installed Wine to run the Windows server) and `ghcr.io/liteldev/levilamina-server:latest-windows` (a Windows container). The Windows image is based on `mcr.microsoft.com/windows/servercore:ltsc2022` and can run LeviLamina. If you build a Windows image yourself, also use servercore as the base image; nanoserver is generally not suitable for running a full server. The volume of the Windows image must be mounted at `C:\data`. Whether to use Docker is a matter of preference: if the host is already Windows, running the server directly (with a panel and start on boot) is usually simpler; on a Linux host, the official wine image is recommended. Note that you use `docker attach` to reach the console, and the container must run with `-it`.

*Applies to: docker-levilamina-server 0.9.x*

## How should I configure the start command and the container when building a LeviLamina server with the MCSManager panel (Docker image mode)?

Set the image to `ghcr.io/liteldev/levilamina-server:latest-wine`; leave the start command empty (the image's own entrypoint is used); set the mount directory inside the container to `/data`; map the port `19132:19132/udp` (the official example also maps `19132:19132/tcp`); an interactive console (`-it`) is required. Environment variables:

- `EULA=TRUE` (must be uppercase `TRUE`; the entrypoint is case-sensitive, and `true` makes it exit immediately)
- `LANG=zh_CN.UTF-8` (optional, Chinese locale)
- `WINEDEBUG=-all` (if unset, lip sets it to `-all` by default when running the server, so you can leave it out)
- Optional: `VERSION`, `PACKAGES`, `GITHUB_MIRROR_URL`, `TZ`

If errors related to the crash log appear at startup, set `modules.crashLogger.enabled` to `false` in `mods/LeviLamina/config/Config.json` to investigate.

*Applies to: docker-levilamina-server 0.9.x; LeviLamina current version*

## After running `ghcr.io/liteldev/levilamina-server:latest-wine` with docker, the client reports a version mismatch and cannot join. Which MC version do I need?

The game (BDS) version in the image is determined by the installed LeviLamina version (the `VERSION` environment variable; the default `LATEST` means the newest LeviLamina). LeviLamina takes time to support a new MC version, so the server version is often lower than the newest client. The client version must match the BDS version that this LeviLamina version supports (see the LeviLamina release notes for the matching game version), or you can wait until LeviLamina supports the new version and then redeploy with it. Some third-party mods also let newer clients join, but they are not officially supported by LiteLDev.

## When running the server with the official LeviLamina docker image, Chinese text in the console (such as in the MCSManager panel) is garbled. How do I fix it?

First pass the locale environment variable `LANG=zh_CN.UTF-8` to the container (and set `LC_ALL=zh_CN.UTF-8` too if needed). The wine image already includes all locales (`locales-all`), and Wine converts the output encoding according to that locale. Then check that the terminal/output encoding of the panel (MCSM) instance is UTF-8. If the text is still garbled, you can temporarily set LeviLamina's `language` to English to avoid it, but mods that output only Chinese may still be garbled.

*Applies to: docker-levilamina-server wine image (includes locales-all since 0.7.1). Not confirmed against the source code or the documentation: treat it as a pointer.*

## With the `ghcr.io/liteldev/levilamina-server` image, how do I specify the LeviLamina version, use a mirror for faster downloads, and preinstall mods?

Configure these through environment variables:

- `EULA=TRUE` (required, uppercase)
- `VERSION`: the LeviLamina version to install, such as `26.60.7`; the default is `LATEST` (the newest), and it determines the game version
- `GITHUB_MIRROR_URL`: the GitHub mirror used for downloads (that is, lip's `github_proxy`), such as `https://v4.gh-proxy.org/https://github.com/`
- `PACKAGES`: packages that lip installs on the first start, separated by spaces
- Also available: `TZ`, `LANG`/`LC_ALL`, and `WINEDEBUG` (wine image only, default `-all`)

Example:

```shell
docker run -d -it --name levilamina -e EULA=TRUE -e VERSION=26.60.7 -e PACKAGES="github.com/LiteLDev/LeviOptimize" -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
```

Note that `VERSION` and `PACKAGES` only take effect on the first install (when the volume does not yet contain `bedrock_server_mod.exe`). To add mods later, use `docker exec -it levilamina lip install <package>`.

*Applies to: docker-levilamina-server 0.8.8 and later (currently 0.9.1)*
