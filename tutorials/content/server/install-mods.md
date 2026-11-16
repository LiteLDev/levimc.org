# Install mods on your server

At the end of this tutorial your server runs two mods: LeviOptimize, which makes the server faster, and LegacyScriptEngine, which runs script plugins. You find mods in the LeviMC Mods catalog, install them with `lip` (in its interface or with a command), check that LeviLamina loads them, and learn how to update and remove them.

## What you need

- A server with LeviLamina, set up with `lip`: see [Your first server](first-server.md) or [A server from the command line](command-line.md). This tutorial uses the folder `D:\servers\survival`.
- The server **stopped**. While it runs, the interface of `lip` changes nothing in its folder, and a running server only loads new mods when it starts again anyway.
- An internet connection. Mods come from GitHub.

A server in Docker installs mods through its `PACKAGES` variable instead: see [A server in Docker](docker.md#_3-add-mods). The mod names are the same.

## 1. Find a mod in the catalog

1. Open [LeviMC Mods](https://levimc.org/mods/) and search for `LeviOptimize`.
2. Open its page. Check **Side**: a mod for your server must list the server. Check the game versions: one of them must be the version of your server.
3. Press **Install**. The dialog lets you choose a **Variant** and a **Version**, and shows the command under "Run this in your server folder with lip:", for example:

   ```shell
   lip install github.com/LiteLDev/LeviOptimize@1.8.1
   ```

   Without the `@<version>` at the end, `lip` picks the newest version that fits your server by itself.

You do not need the website to install: the **Get mods** page of `lip` shows the same catalog. Choose one of the two ways below.

## 2. Install a mod

### In the interface

1. Start `lip` in the folder of the server (`cd D:\servers\survival`, then `lip`). On **Home**, select **Install mods** and press `Enter`. The **Get mods** page opens.
2. Press `↑` until you are in **Search**, type `optim`, and press `Enter`. LeviOptimize is selected.
3. Press `Enter`, then `Enter` again on **Install…**.
4. `lip` lists only the versions that fit your game and your LeviLamina. Keep the newest and press `Enter`.
5. `lip` shows its plan, such as `Dry run: would install LeviOptimize 1.8.1`. If the mod needs other mods, they are listed too. Press `Enter` on **Apply**.
6. You should see **✓ Done.**, and back in the list LeviOptimize has a **✓**.

![The Get mods page after the installation: the row of LeviOptimize starts with a tick.](https://levimc.org/lip/screenshots/en/first-server-19-mod-installed.svg)

### With a command

In the folder of the server, run:

```shell
lip install LeviOptimize
```

A short name like `LeviOptimize` means `github.com/LiteLDev/LeviOptimize`; mods of other authors need the full address from their page. `lip` installs the mod and everything it depends on into `mods/`. You should see:

```text
✓ Packages installed successfully.
```

`lip list` now shows `github.com/LiteLDev/LeviOptimize` under **User-Requested**.

## 3. Install LegacyScriptEngine

LegacyScriptEngine (LSE) runs plugins written in a script language. It comes in four **variants**, one per language; install the one your plugins are written in:

| Variant | Language |
| --- | --- |
| `#lua` | Lua |
| `#quickjs` | JavaScript (QuickJS) |
| `#nodejs` | JavaScript (Node.js) |
| `#python` | Python |

1. Install the variant, for example Lua:

   ::: code-group

   ```shell [Command]
   lip install LegacyScriptEngine#lua
   ```

   ```text [Interface]
   Get mods → search "LegacyScriptEngine" → Enter → Install…
   → choose the variant with ← and → → Enter → Apply
   ```

   :::

   ![The versions of LegacyScriptEngine. The variant tabs are lua, quickjs, nodejs and python.](https://levimc.org/lip/screenshots/en/get-mods-05-versions.svg)

   `lip` also installs what LSE needs: LegacyRemoteCall, LegacyMoney and iListenAttentively.

2. To install several engines, install each variant the same way.

::: warning The Python engine needs Python
Before you install `#python`, install Python on the server machine: Python 3.12.10 for LSE 0.16.2 and later.
:::

Plugins go into the folder `plugins/` of the server. On the next start, LSE migrates them and gives each one a LeviLamina mod manifest; restart the server once more to load them.

## 4. Check that the mods load

1. Start the server: **Start the server** on **Home**, or `lip run`.
2. Look for the lines of `[LeviLamina]` in the output. You should see one `Loaded` line per mod, such as `Loaded LeviOptimize v1.8.1`, and a count such as `5 mod(s) loaded` (the dependencies are mods too).
3. Stop the server with `Ctrl+C`.

If a mod is missing from the list, the output says why. Error codes such as 126 and 127 are explained in [LeviLamina troubleshooting](https://levimc.org/LeviLamina/user_guides/troubleshooting/).

## 5. Update and remove mods

Stop the server first. Then:

| To | Command | In the interface |
| --- | --- | --- |
| Update every mod you installed | `lip update` | **Mods** page: the action row **Update all** |
| Update one mod | `lip update LeviOptimize` | **Mods** page: `Enter` on the mod, **Update** |
| Remove a mod | `lip uninstall LeviOptimize` | **Mods** page: `Enter` on the mod, **Uninstall** |
| See what a command would do | add `--dry-run` | Every change shows its plan first |

`lip` removes the dependencies that nothing needs any more by itself. `lip update` never changes the game or LeviLamina; to move the server to a new game version, see [Workspaces](https://levimc.org/lip/interface/workspaces.html) or [`lip setup`](https://levimc.org/lip/reference/commands/setup.html).

## What you have now

- A server with LeviOptimize and LegacyScriptEngine, each with the dependencies it needs, in `mods/`.
- A way to find mods, check that they fit, and install, update and remove them.

## Next steps

- Write a plugin for the engine you just installed: [Your first script plugin](../develop/first-script-plugin.md).
- Let other players join: [Let friends join your server](let-friends-join.md).
- Change the settings of a mod: [Mod config](https://levimc.org/lip/interface/mod_config.html).
- Search, sort and filter the catalog in `lip`: [Get mods](https://levimc.org/lip/interface/get_mods.html). Manage what is installed: [Mods](https://levimc.org/lip/interface/mods.html).
- Every way to name a package (versions, branches, ZIP files, folders): [Managing packages](https://levimc.org/lip/guides/managing_packages.html).
- The script engines and their languages: [LegacyScriptEngine](https://levimc.org/LegacyScriptEngine/).
- Mods for the game client rather than the server: [Play with mods on Windows](../play/play-with-mods.md).
