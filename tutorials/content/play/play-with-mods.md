# Play with mods on Windows

At the end of this tutorial you play Minecraft Bedrock Edition on Windows with LeviLamina and a mod, in an instance of LeviLauncher that keeps its worlds and settings apart from your normal game. LeviLauncher installs the game version, LeviLamina and the mods for you: you do not need `lip` or anything else.

## What you need

- Windows 10 or Windows 11, 64-bit.
- Minecraft Bedrock Edition, bought on the Microsoft account you sign in with, and installed from the Microsoft Store at least once on this PC. LeviLauncher manages your game; it does not replace the license.
- An internet connection.

## 1. Install LeviLauncher

1. Open the [latest release of LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases/latest) and download `LeviLauncher-amd64-installer.exe`. If GitHub is slow where you are, use the [Lanzou mirror](https://levimc.lanzoue.com/b016ke39hc) with the password `levi`.
2. Run the installer and finish the setup wizard. If it asks to install WebView2 or another component, let it continue.
3. Start LeviLauncher. You should see the window of the launcher with a sidebar: **Launch**, **Download**, **Instances**, **About** and **Settings**.

## 2. Go through the first launch

1. The **First Launch Setup** asks for the content path, where LeviLauncher keeps your instances, and the language. Keep the path on a drive with a few GB free, and finish the setup.
2. LeviLauncher checks what the game needs: Microsoft Gaming Services, Microsoft GameInput, and the Microsoft Visual C++ Redistributable for the mod loader. If one is missing, follow its prompt to install or repair it.
3. If LeviLauncher says that Minecraft is not found, install it from the Microsoft Store with the account that owns it, start it once, close it, and return to LeviLauncher.

You are done with this step when LeviLauncher shows no more prompts.

## 3. Install a game version with LeviLamina

1. Open **Download** in the sidebar.
2. Choose **Release** (Minecraft's normal release, not Preview) and the package type **GDK**. LeviLamina is installed automatically only into supported GDK versions.
3. Pick a version whose **Loader** column shows LeviLamina. The newest such version is usually the right choice.
4. In the install dialog:
   - Turn on **Instance isolation**, so that this instance keeps its worlds, settings and caches in its own folder.
   - Turn on **Install LeviLamina** and keep the newest **LeviLamina Version**.
5. Start the installation and wait until it completes.

If the dialog says "LeviLamina is not supported for this game version", go back and pick another version.

## 4. Launch the game

1. Open **Launch** in the sidebar.
2. Select the instance you just installed, and press **Launch**.
3. If LeviLauncher reports a missing component such as GameInput or Gaming Services, install it as it asks and press **Launch** again.
4. Minecraft starts. Close it again once you have seen the title screen: the next step adds a mod.

This first launch without mods tells you that the instance itself works. If something goes wrong later, you know it is the mod.

## 5. Install a mod

1. On the **Launch** page, the **Content Download** card leads to **LeviMC Mods**. Open it. It lists the mods of [LeviMC Mods](https://levimc.org/mods/) that have a build for the game client on Windows.
2. Search for `LeviOptimize` and open it.
3. Press **Install**. LeviLauncher picks the client build of the mod and the version that fits your LeviLamina, with what the mod needs.
4. You should see "Installation completed successfully". Back on **Launch**, the **Mods** card of the instance lists LeviOptimize.

To add a mod you got as a file, use **Manage Mods** on the **Mods** card, then **Import .mcmod**. For a `.zip` or a bare `.dll`, choose **All files (\*.\*)** in the file picker.

## 6. Play with the mod

1. On **Launch**, select the instance and press **Launch**.
2. Minecraft starts with LeviLamina and LeviOptimize loaded. Open a world and play.

Add more mods one at a time, and launch after each one. If the game stops starting, disable the newest mod first on the **Mods** page.

::: tip Change LeviLamina later
To install, update or remove LeviLamina in an instance that already exists, open the menu next to **Launch**, choose **Instance Settings**, and go to the **Loader** tab.
:::

## What you have now

- LeviLauncher, which installs and launches Minecraft versions.
- An isolated instance with LeviLamina and LeviOptimize, whose worlds and settings stay apart from your normal game.

## Next steps

- Join a server with mods, or run your own: [Your first server](../server/first-server.md).
- Everything the mods page of the launcher does, including CurseForge and the built-in package manager: [Mods & Integrations](https://levimc.org/LeviLauncher/guide/mods-integrations).
- Rename, delete and organize instances: [Version Management](https://levimc.org/LeviLauncher/guide/version-management).
- Worlds, resource packs and behavior packs: [Content Management](https://levimc.org/LeviLauncher/guide/content-management).
- When downloads fail or the game does not start: [Update & Troubleshooting](https://levimc.org/LeviLauncher/guide/update-troubleshooting).
- LeviLauncher for Android, and all releases: [Download](https://levimc.org/LeviLauncher/download).
- Make a mod of your own: [Your first LeviLamina mod](../develop/first-levilamina-mod.md).
