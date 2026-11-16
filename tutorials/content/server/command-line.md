# A server from the command line

At the end of this tutorial you have a Minecraft Bedrock Dedicated Server with LeviLamina, set up, started and stopped with three `lip` commands: `lip setup`, `lip run` and `Ctrl+C`. You also keep it running after you close the terminal. This is the way to go for scripts, remote machines over SSH, and anyone who prefers commands to the interface of [Your first server](first-server.md).

## What you need

- `lip`, installed: see step 1 of [Your first server](first-server.md#_1-install-lip). `lip -v` must print a version.
- Windows 10, Windows 11 or Windows Server 2019 or later; or Linux on x64 or macOS, where `lip` runs the Windows server through its own Wine.
- An internet connection.

## 1. Make a folder for the server

Every `lip` command works on the folder you are in, which `lip` calls the **workspace**. Make one and go into it:

::: code-group

```powershell [Windows]
mkdir D:\servers\survival
cd D:\servers\survival
```

```shell [Linux and macOS]
mkdir -p ~/servers/survival
cd ~/servers/survival
```

:::

## 2. Set up the server

1. Choose a game version that LeviLamina supports, such as `1.26.60`, and look at what `lip` would do first:

   ```shell
   lip setup --game 1.26.60 --dry-run
   ```

   You should see lines starting with `Dry run:` that name the game (`github.com/LiteLDev/bds`) and LeviLamina, and the last line `Dry run: nothing was changed.` If `lip` says that no LeviLamina fits the version, pick another one.

2. Run the same command without `--dry-run`:

   ```shell
   lip setup --game 1.26.60
   ```

   This installs the game (the Bedrock Dedicated Server), the newest LeviLamina that supports it, and what LeviLamina needs.

3. `lip` names the Minecraft End User License Agreement and the Microsoft Privacy Policy and asks you to accept them. Read them, then type `yes` and press `Enter`. Any other answer stops the command with nothing changed.

4. Wait for the downloads. The first time, `lip` may also install the Microsoft Visual C++ Redistributable (Windows asks you to allow it), or Wine on Linux and macOS. You should see:

   ```text
   ✓ The server is set up. Run it with 'lip run', or install mods with 'lip install'.
   ```

::: tip Let LeviLamina choose the game version
If you do not mind which version you get, `lip install LeviLamina` sets up the newest LeviLamina with the newest game it supports. It asks about the EULA in the same way.
:::

::: details In a script or a container
`lip` cannot ask a question there, and the setup fails. If you accept the EULA, say so on the command line:

```shell
lip setup --game 1.26.60 --accept-eula
```
:::

## 3. Run the server

1. Start the server:

   ```shell
   lip run
   ```

   The server writes its output to your terminal. Wait for the line `Server started.` Lines marked `[LeviLamina]` show the loader at work.

2. What you type now goes to the server. Type a server command, without a leading `/`:

   ```text
   list
   ```

   You should see `There are 0/10 players online:`.

3. Press `Ctrl+C`. `lip` types `stop` into the server, the server saves the world and exits, and then `lip` exits. Pressing `Ctrl+C` again does not cut the server off: `lip` always waits for it.

Closing the terminal window also stops a server started with a plain `lip run`.

## 4. Keep it running without a terminal

A **managed server** runs in the background process of `lip` instead of in your terminal.

1. Start it, without staying attached:

   ```shell
   lip run --managed --detach
   ```

   The command returns as soon as the server has started.

2. Come back to it from any terminal, in the same folder:

   ```shell
   lip run --managed
   ```

   You should see the last lines the server wrote, and you can type commands again.

3. To leave it running, close the terminal window. `Ctrl+C` does **not** detach: it stops the server, as with a plain `lip run`.

4. To stop it, attach as in step 2 and press `Ctrl+C` (or type `stop`).

A managed server does not come back after the machine restarts. For that, have your system's service manager run a plain `lip run` in the workspace.

::: tip Restart after a crash
`lip config set restart on-failure --workspace` makes `lip` start the server again, 5 seconds after it exits with an error. It works for plain and managed servers.
:::

## What you have now

- A workspace, `D:\servers\survival` (or `~/servers/survival`), with the game and LeviLamina, pinned to the versions you chose.
- Two ways to run it: `lip run` in the foreground, and `lip run --managed` in the background.

The interface and the commands work on the same folders. Start `lip` alone in the folder, and the server shows on its **Server** page; a managed server you start there is the same one `lip run --managed` attaches to.

## Next steps

- Add mods: [Install mods on your server](install-mods.md).
- Let other players connect: [Let friends join your server](let-friends-join.md).
- Run the server in a container instead: [A server in Docker](docker.md).
- Install, list, update and uninstall packages: [Managing packages](https://levimc.org/lip/guides/managing_packages.html).
- Settings of `lip`, and what to do when GitHub is slow or blocked: [Configuration](https://levimc.org/lip/guides/configuration.html).
- Every option: [`lip setup`](https://levimc.org/lip/reference/commands/setup.html), [`lip run`](https://levimc.org/lip/reference/commands/run.html), [`lip config`](https://levimc.org/lip/reference/commands/config.html).
- When a command fails: [Troubleshooting](https://levimc.org/lip/guides/troubleshooting.html).
