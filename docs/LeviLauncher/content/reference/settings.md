---
platforms: [windows]
---
# All Settings

Every setting of the **Settings** page of the Windows version, tab by tab, as of LeviLauncher 1.1.0, with the `config` key that changes it from the [command line](./command-line) where there is one. The search field at the top of the page finds a setting by its name. For advice on what to change, see [Settings & Personalization](../guide/settings-personalization).

## Basic Settings

| Setting | What it does | Key |
| --- | --- | --- |
| **Content Paths → Base Root** | The data root: the folder that holds the instances, downloads and backups (see [Folders & Files](./files)). **Apply** saves a new folder, **Reset** returns to the default. The folders of the **Installers** and **Versions** are shown below it. Existing data is not moved. | `data-root` |
| **Language** | The language of the launcher. | — |
| **Discord Rich Presence** | Show your game status on Discord. On by default. | `discord` |
| **On Game Launch** | What the launcher does when Minecraft starts: **Minimize launcher** (default), **Hide to system tray**, **Close launcher** or **Keep launcher open**. | `on-game-launch` |
| **On Game Exit** | What the launcher does when Minecraft closes: **Re-open launcher** (default), **Do nothing** or **Close launcher**. | `on-game-exit` |
| **Hide to tray on close** | The close button hides the launcher to the system tray instead of exiting; the minimize button still minimizes to the taskbar. Off by default. | `close-to-tray` |

## Personalization

The tab has four parts. Personalization settings (colors, opacity and so on) are saved separately for the light and the dark theme (**Per-Mode Settings**): choose **Light Mode** or **Dark Mode** to edit one of them.

### Theme and colors

| Setting | What it does |
| --- | --- |
| **Theme Mode** | **Light Mode**, **Dark Mode**, **Manual Schedule** (dark between a **Dark Mode Start Time** and a **Dark Mode End Time**), **Sunrise/Sunset** (dark between the local sunset and sunrise, worked out on the device) or **Follow System** (the Windows setting). |
| **Theme Color** | The accent color: one of the **Preset Colors**, one of **More Colors**, or a **Custom Color**. |
| **Base Mode** | A solid color under the background image, for contrast: **None**, **Follow Theme Color** or **Custom Color**, with its **Base Opacity**. |

### Layout and motion

| Setting | What it does |
| --- | --- |
| **Use Top Navigation Bar** | A navigation bar at the top instead of the vertical sidebar. |
| **Disable Animations** | Turn off the interface's transition animations. |

### Wallpaper

| Setting | What it does |
| --- | --- |
| **Background Image** | A folder of images to use as background: **Select Folder**, **Open Folder**, **Clear Folder**, and **Next image** when the folder holds several pictures. |
| **Fit Mode** | **Smart**, **Center**, **Fit**, **Stretch**, **Tile**, **Top Left** or **Top Right**. |
| **Play Order** | **Random** or **Sequential** (natural file name order). |
| **Background Blur**, **Background Brightness**, **Background Opacity** | How the image is shown. |

### Materials and readability

| Setting | What it does |
| --- | --- |
| **Interface material** | The look of navigation, cards, tabs, controls and popups over the wallpaper. **Material presets**: **Balanced** (default), **Clear** or **Solid**. |
| **Interface opacity**, **Interface blur**, **Wallpaper overlay** | Fine-tune the material. |
| **Readability protection** | Keeps text legible with a minimum surface tint, based on the theme, the image brightness and the blur. |
| **Reset this theme** | Restores the material of the theme being edited. |

[Settings & Personalization](../guide/settings-personalization#wallpaper-and-interface-material) explains each of them.

## Package Management

| Setting | What it does | Key |
| --- | --- | --- |
| **Clear cache → Clean Cache** | Deletes the package manager's downloaded package files; use it when package downloads fail. | `cache clean packages` |
| **Use mirror sources** | Download launcher updates, packages and version lists from mirrors hosted in mainland China. On by default for users in mainland China. | `mirror` |
| **GitHub proxy** | The GitHub proxy for package downloads, shown while **Use mirror sources** is on: a preset, or **Custom** to type a URL. Empty restores the default (`https://gh-proxy.org/https://github.com`). | `github-proxy` |

## Others

| Setting | What it does |
| --- | --- |
| **Process Manager → Scan Processes** | Lists the running Minecraft processes; **End Task** ends one, **End All Processes** all of them. Unsaved game progress may be lost. |
| **Experimental Features → Instance backup (Experimental)** | Adds backup and restore actions to **Instance Settings**. Turning it on shows a warning first. |

## Privacy

| Setting | What it does |
| --- | --- |
| **Usage Analytics (Google Analytics)** | Sends usage analytics that help improve the launcher. You can turn it off at any time. Links to the **Google Analytics Terms** and the **Google Privacy Policy**. |

## Updates

| Setting | What it does | Key |
| --- | --- | --- |
| **Receive Beta Updates** | Also offer prerelease launcher updates. Off by default. | `beta-updates` |
| **Current Version → Check Update** | Shows the launcher's version and looks for a newer one. | `self-update --check` |

## About

The launcher's credits and links to LiteLDev on GitHub and to the Discord community.

## Command-line keys {#command-line-keys}

`LeviLauncher.exe config list` shows every key with its value and where the value comes from: `set` (saved), `default`, `auto` (detected) or `lip` (lip's own `config.toml`). `config set <key> <value>` changes a key, `config unset <key>` returns it to its default.

| Key | Values | Meaning |
| --- | --- | --- |
| `data-root` | a folder | Where instances, downloads and backups live (existing data is not moved) |
| `default-instance` | an instance | The instance commands use when none is named (same as `use`) |
| `mirror` | `on`, `off` | Download from mirrors in mainland China (unset: detected by region) |
| `github-proxy` | an http(s) URL | GitHub proxy for mod downloads (used while mirrors are on, unless set) |
| `beta-updates` | `on`, `off` | Offer pre-release launcher updates (default `off`) |
| `discord` | `on`, `off` | Show Discord Rich Presence while playing, from the launcher window only (default `on`) |
| `on-game-launch` | `minimize`, `hide`, `close`, `keep` | What the launcher window does when the game starts (default `minimize`) |
| `on-game-exit` | `reopen`, `keep`, `close` | What the launcher window does when the game exits (default `reopen`) |
| `close-to-tray` | `on`, `off` | Closing the launcher window keeps it in the tray (default `off`) |

Read-only keys, shown by `config list` and `config get`: `instances-dir`, `installers-dir`, `backups-dir`, `cache-dir`, `logs-dir` (the folders of [Folders & Files](./files)) and `config-file` (the settings file, `%APPDATA%\LeviLauncher\config.json`).
