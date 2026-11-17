# A server in Docker

At the end of this tutorial you have a Bedrock Dedicated Server with LeviLamina running in a Docker container, its world kept in a Docker volume, and you know how to reach its console, add mods and stop it cleanly. The container installs everything itself on its first start: you need neither `lip` nor Wine on the host.

There are two images, both from [LiteLDev/docker-levilamina-server](https://github.com/LiteLDev/docker-levilamina-server):

| Image | Runs on | How |
| --- | --- | --- |
| `ghcr.io/liteldev/levilamina-server:latest-wine` | Linux containers: a Linux x64 host, or Docker Desktop | `lip` runs natively and runs the Windows server under a Wine it installs itself |
| `ghcr.io/liteldev/levilamina-server:latest-windows` | Windows containers: Windows Server, or Docker Desktop switched to Windows containers | The Windows server directly |

This tutorial uses the Wine image. For the Windows image, see the tip at the end of step 2.

## What you need

- Docker: Docker Engine on Linux, or Docker Desktop on Windows and macOS. `docker version` must answer with a client and a server version.
- A host with an x64 processor.
- An internet connection. The container downloads the game from minecraft.net and LeviLamina from GitHub.

## 1. Start the container

1. Run:

   ```shell
   docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
   ```

   What the parts do:

   - `-d -it`: run in the background, with a console you can attach to later.
   - `--name levilamina`: the name the next commands use.
   - `-e EULA=TRUE`: you accept the [Minecraft End User License Agreement](https://www.minecraft.net/eula). Without it the container stops at once.
   - `-p 19132:19132/udp -p 19132:19132/tcp`: the port of the server, on both protocols.
   - `-v levilamina-server-data:/data`: the server, its world and its settings live in the volume `levilamina-server-data`, so they survive when the container is removed.

2. Follow what the container does:

   ```shell
   docker logs -f levilamina
   ```

   On the first start `lip` installs everything into the volume: its Wine and the Visual C++ runtime, then the game, LeviLamina and the mods of `PACKAGES`. Then it starts the server. This takes several minutes; later starts take seconds. You should finally see `Server started.` Press `Ctrl+C` to stop following the log; the server keeps running.

::: tip Slow downloads from GitHub
Add `-e GITHUB_MIRROR_URL=<address of a GitHub mirror>` to the `docker run` command, for example `-e GITHUB_MIRROR_URL=https://v4.gh-proxy.org/https://github.com/`.
:::

## 2. Use the console

1. Attach to the server:

   ```shell
   docker attach levilamina
   ```

2. Type a server command, without a leading `/`, and press `Enter`:

   ```text
   list
   ```

   You should see `There are 0/10 players online:`.

3. Detach without stopping the server: press `Ctrl+P`, then `Ctrl+Q`.

::: tip The Windows image
On a Windows container host, use `ghcr.io/liteldev/levilamina-server:latest-windows` and mount the volume at `C:\data`: `-v levilamina-server-data:C:\data`. Everything else in this tutorial is the same.
:::

## 3. Add mods

The container installs the packages of the `PACKAGES` variable, separated by spaces, when it sets up the server, on its first start. Any mod of the [LeviMC Mods](https://levimc.org/mods/) catalog works; use the name after `lip install` on its page.

To start a new server with mods, add the variable to the `docker run` command of step 1:

```shell
-e PACKAGES="github.com/LiteLDev/LeviOptimize github.com/LiteLDev/LegacyScriptEngine#lua"
```

::: details Add a mod to a server that is already set up
`PACKAGES` is read only on the first start. Later, run `lip` inside the running container:

```shell
docker exec -it levilamina lip install github.com/LiteLDev/LeviOptimize
```

The server loads the mod the next time it starts: stop it and start it again as in step 4. `docker logs levilamina` should then show `[LeviLamina]` loading the mod.
:::

## 4. Stop and start the server

1. Stop the container:

   ```shell
   docker stop -t 60 levilamina
   ```

   `lip` types `stop` into the server, which saves the world and exits; the container stops with it. `docker logs levilamina` should end with `Quit correctly`. Typing `stop` in the console (`docker attach levilamina`) does the same.
2. Start it again later:

   ```shell
   docker start levilamina
   ```

   A second start is quick: the server is already set up in the volume.

`-t 60` gives the server up to a minute to save a large world before Docker kills it; without it, Docker waits only 10 seconds. The compose files set the same minute (`stop_grace_period`).

## With Docker Compose

Instead of `docker run`, download [wine/compose.yaml](https://github.com/LiteLDev/docker-levilamina-server/blob/main/wine/compose.yaml) (or [windows/compose.yaml](https://github.com/LiteLDev/docker-levilamina-server/blob/main/windows/compose.yaml)) into an empty folder and run `docker compose up -d` there. It sets the same EULA, ports and volume. Add variables such as `PACKAGES` under `environment:`. `docker compose logs -f` follows the log, and `docker compose attach levilamina-server` opens the console.

## Settings of the container

| Variable | Default | Meaning |
| --- | --- | --- |
| `EULA` | | Must be `TRUE`. |
| `VERSION` | `LATEST` | The LeviLamina version to install, such as `26.60.7`. The game version follows from it. |
| `PACKAGES` | | Packages to install on the first start, separated by spaces. |
| `GITHUB_MIRROR_URL` | | A GitHub mirror for the downloads. |
| `TZ` | `UTC` | The time zone, for the timestamps of the log. |
| `LANG`, `LC_ALL` | | The locale in the container, such as `en_US.UTF-8` (the Wine image has every locale). |
| `WINEDEBUG` | `-all` | The debug output of Wine (Wine image only). |

## What you have now

- A container `levilamina` that runs a LeviLamina server on port 19132.
- A volume `levilamina-server-data` with the server, its world and its settings, which survives the container.

## Next steps

- Choose mods: [Install mods on your server](install-mods.md) explains package names and variants.
- Let other players connect from outside your network: [Let friends join your server](let-friends-join.md).
- A server without Docker: [Your first server](first-server.md) or [A server from the command line](command-line.md).
- Package names, versions and refs that `PACKAGES` accepts: [Managing packages](https://levimc.org/lip/guides/managing_packages.html).
- The images, their Dockerfiles and their changelog: [LiteLDev/docker-levilamina-server](https://github.com/LiteLDev/docker-levilamina-server).
- Something went wrong: [LeviLamina troubleshooting](https://levimc.org/LeviLamina/user_guides/troubleshooting/).
