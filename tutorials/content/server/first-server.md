# Your first server

At the end of this tutorial you have a Minecraft Bedrock Dedicated Server (BDS) with LeviLamina, the loader that runs mods, in a folder of its own on your computer. You install it, start it, send it a command and stop it, all in the interface of `lip`, the LeviMC package installer. You type no command but `lip` itself.

It takes about ten minutes, most of it waiting for downloads.

## What you need

- A computer with Windows 10, Windows 11 or Windows Server 2019 or later. Linux on x64 and macOS work too: `lip` runs the Windows server there through Wine, which it installs by itself.
- A terminal: Windows Terminal or PowerShell on Windows. It should be at least 80 columns wide.
- An internet connection. `lip` downloads the game from minecraft.net, and LeviLamina from GitHub.

You do not need to install anything else first: no .NET, no Git, no Visual C++ runtime. `lip` installs what the server needs.

## 1. Install lip

1. Open the [latest release of lip](https://github.com/LiteLDev/lip/releases/latest) and download `lip-<version>-win-x64.msi`. On a PC with an ARM processor, take `lip-<version>-win-arm64.msi`.
2. Run the file. The installer asks for the folder to install `lip` in, `C:\Program Files\lip` unless you change it, and installs once you click **Install** and allow Windows to make changes. It adds that folder to the `PATH`.
3. Open a **new** terminal window. A terminal that was open before does not know the new `PATH` yet.
4. Ask `lip` for its version:

   ```shell
   lip -v
   ```

   You should see a version number, such as `0.41.0`. If the terminal says it does not know `lip`, close it and open a new one.

::: details On Linux or macOS: the portable archive
Download the archive for your system from the [latest release](https://github.com/LiteLDev/lip/releases/latest) (`lip-<version>-linux-x64.tar.xz`, `lip-<version>-osx-arm64.zip` or `lip-<version>-osx-x64.zip`) and extract it into a folder on your `PATH`:

```shell
mkdir -p ~/.local/bin
tar -xJf lip-<version>-linux-x64.tar.xz -C ~/.local/bin       # Linux
unzip lip-<version>-osx-arm64.zip -d ~/.local/bin             # macOS
```

If `~/.local/bin` is not on your `PATH`, add `export PATH="$HOME/.local/bin:$PATH"` to `~/.profile` (Linux) or `~/.zshrc` (macOS) and open a new terminal. If macOS refuses to run the file, remove its quarantine mark with `xattr -d com.apple.quarantine ~/.local/bin/lip`. Then check `lip -v` as above.
:::

## 2. Start lip

1. Make a folder to keep your servers in, go into it, and start `lip`. This tutorial uses `D:\servers`:

   ::: code-group

   ```powershell [Windows]
   mkdir D:\servers
   cd D:\servers
   lip
   ```

   ```shell [Linux and macOS]
   mkdir -p ~/servers
   cd ~/servers
   lip
   ```

   :::

2. You should see the **Home** page of `lip`: a sidebar at the left, an overview that says the folder holds no game yet, and three **Next steps**, of which **Create a server** is selected.

   ![The Home page of lip in the empty folder D:\servers. The sidebar lists nine pages; the overview says that no game is installed; "Create a server" is selected.](https://levimc.org/lip/screenshots/en/first-server-01-home.svg)

   You need only a few keys: `↑` and `↓` move, `Enter` opens or confirms, `Esc` goes back. The bottom line always lists the keys that work right now.

::: details lip says "GitHub unreachable"
LeviLamina comes from GitHub. If `lip` cannot reach it, it asks what to do. Choose **Use a proxy** if you have the address of a GitHub proxy, **Connect directly** if your network does reach GitHub after all, or **Later** to be asked again next time. Without a way to GitHub, `lip` cannot download LeviLamina. You can change the answer on the **Settings** page.
:::

## 3. Create the server

1. With **Create a server** selected, press `Enter`. `lip` asks where the server goes. Each server needs a folder of its own, so choose **Another folder…** (`↓`, then `Enter`).
2. The folder browser opens at `D:\servers`. Press `Tab` to reach the buttons, `→` to reach **New folder…**, and `Enter`. Type `survival` and press `Enter`. `lip` creates `D:\servers\survival` and takes it as the folder of the server.
3. Choose the **Game version**. The newest version is at the top. Select the newest one marked **LeviLamina ✓** (versions marked **No LeviLamina** cannot run mods) and press `Enter`.

   ![The dialog "Game version" lists eight versions; most are marked "LeviLamina ✓". The first, 1.26.60, is selected.](https://levimc.org/lip/screenshots/en/first-server-05-game-version.svg)

   On Linux, `lip` then asks for the **Build**: choose **windows**, the only one that runs LeviLamina.

4. Choose the **Loader**: keep the newest LeviLamina and press `Enter`.
5. `lip` shows its plan before it changes anything: lines starting with `Dry run:` say that it would install the game (`bds`) and LeviLamina. Press `Enter` on **Apply**.

   ![The dialog "Set up server" with three "Dry run:" lines and the buttons "Apply" and "Cancel".](https://levimc.org/lip/screenshots/en/first-server-07-plan.svg)

6. Read the Minecraft End User License Agreement and the Microsoft Privacy Policy at the addresses shown. To accept them, press `Enter` on **Accept**. If you decline, nothing is installed.
7. Wait while `lip` downloads and installs. The first time, it may also install the Microsoft Visual C++ Redistributable (Windows asks you to allow it), or Wine on Linux and macOS.
8. You should see **✓ Done.** Press `Enter`. You are now on the **Workspaces** page, and `D:\servers\survival` is in the list with a **●**: it is the folder that `lip` works in now.

## 4. Start the server

1. Go back to **Home**: press `Esc` to move to the sidebar, `↑` until **Home** is highlighted, and `Enter`. The overview now names the game and LeviLamina, and **Create a server** has a tick.
2. **Install mods** is selected. Skip it for now: press `↓` to select **Start the server**, then `Enter`.
3. `lip` starts the server and shows the **Server** page. Wait for the line `Server started.` in the output. The lines marked `[LeviLamina]` show that the loader is running.

   ![The Server page while the server runs. The output shows LeviLamina loading, the ports 19132 and 19133, and "Server started.". Below it is the input line.](https://levimc.org/lip/screenshots/en/first-server-21-running.svg)

   On Windows, the firewall may ask whether to allow the server on your network. Allow it on private networks if you want other devices to join; see [Let friends join your server](let-friends-join.md).

4. Send the server a command: type `list` in the input line at the bottom and press `Enter`. You should see the answer `There are 0/10 players online:`. Server commands are typed here without the leading `/`.

To play on it from Minecraft on the same PC, add a server with the address `127.0.0.1` and the port `19132`.

## 5. Stop the server

1. Press `Ctrl+C` on the Server page. `lip` sends the server its `stop` command and waits until the world is saved.
2. You should see **Exited with code 0** in the first line: the server ended normally. The **Start** button starts it again.
3. To leave `lip`, press `Esc` until you are in the sidebar, `Esc` once more, and confirm **Quit**.

Next time, start `lip` in `D:\servers\survival` (or in any folder: your server is listed on the **Workspaces** page).

## What you have now

- The folder `D:\servers\survival`, which holds the game and LeviLamina. It is an ordinary folder: you can back it up or move it.
- A server you start and stop on the **Server** page of `lip`.

::: warning Stop the server before you change it
While the server runs, `lip` does not install, update or remove anything in its folder, and does not save `server.properties`, the allowlist or the permissions.
:::

## Next steps

- Add mods to the server: [Install mods on your server](install-mods.md).
- Let other players connect: [Let friends join your server](let-friends-join.md).
- Do the same with commands, for scripts and remote machines: [A server from the command line](command-line.md).
- Change the server name, game mode or number of players: [Game config](https://levimc.org/lip/interface/game_config.html).
- Restart the server by itself after a crash: [Server](https://levimc.org/lip/interface/server.html).
- Add a second server, or change the game version: [Workspaces](https://levimc.org/lip/interface/workspaces.html).
- Learn every page of the interface: [A tour of the interface](https://levimc.org/lip/interface/tour.html).
- How `lip` runs the Windows server on Linux and macOS: [Linux and macOS](https://levimc.org/lip/guides/linux_macos.html).
- Something went wrong: [lip troubleshooting](https://levimc.org/lip/guides/troubleshooting.html) and [LeviLamina troubleshooting](https://levimc.org/faq/server/levilamina/errors/).
