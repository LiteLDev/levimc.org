---
platforms: [windows]
---
# 資料夾與檔案

Windows 版 LeviLauncher 讀寫的所有檔案和資料夾（以 LeviLauncher 1.1.0 為準）。啟動器不向系統暫存資料夾（`%TEMP%`）寫入任何東西。

## 概覽

| 資料夾 | 位置 | 內容 |
| --- | --- | --- |
| 設定資料夾 | `%APPDATA%\LeviLauncher\` | 只有 `config.json`：體積小，隨 Windows 設定檔漫遊 |
| 本機資料夾 | `%LOCALAPPDATA%\LeviLauncher\` | 記錄檔、微軟帳號、視窗的 WebView2 資料；也是預設的資料根目錄 |
| 資料根目錄 | 本機資料夾，除非你另選一個（**設定 → 基礎設定** 中的 **根目錄**，或 `config set data-root`） | `Instances\`、`Backups\`、`Cache\` |

```text
%APPDATA%\LeviLauncher\
  config.json                      啟動器的設定
%LOCALAPPDATA%\LeviLauncher\        預設的資料根目錄
  Logs\startup.log                 啟動器記錄檔，以及之前的 startup.1.log … startup.4.log
  Accounts\                        微軟帳號和裝置記錄，按目前 Windows 使用者加密
  WebView2\                        啟動器視窗的資料
  storage-migration.json           從舊佈局遷移的記錄（見下文）
<資料根目錄>\
  Instances\<實例>\                 一個實例（見下文）
  Backups\
    Worlds\<實例>\<資料夾>_<世界>\<世界>_<yyyyMMdd-HHmmss>.mcworld
    Instances\<實例>\<實例>_<yyyyMMdd-HHmmss>.zip
  Cache\
    Installers\                    遊戲安裝包，以及 Visual C++ 和 WebView2 安裝程式
    Updates\                       啟動器更新包，安裝後刪除
    Downloads\                     為匯入而下載的檔案，超過 1 天後在啟動時清理
    Imports\                       交給匯入處理的檔案，超過 1 天後在啟動時清理
    gdk-pending-versions.json
    gamertags.json                 啟動器見過的玩家檔案的玩家代號
```

`Cache\` 中的所有內容都可以刪除，不會遺失任何東西。`LeviLauncher.exe cache clean` 刪除套件快取、為匯入下載的檔案和未完成的下載，`LeviLauncher.exe installer remove` 刪除已下載的遊戲安裝包。更改資料根目錄只是讓啟動器改用另一個資料夾：已有的實例、下載和備份不會被移動。

## 實例的資料夾

```text
Instances\<實例>\
  Minecraft.Windows.exe …          該建置的遊戲檔案
  LeviLauncher.dll                 LeviLauncher 的原生載入器（x64 建置）
  .levilauncher\                   啟動器在實例內的狀態（隱藏）
    instance.json                  名稱、遊戲版本、通道、隔離與啟動選項
    icon.ico                       實例圖示，由遊戲的 LargeLogo.png 產生
    xbox-auth-key-v1               UWP 實例用於 Xbox 登入的標記
  .lip\                            實例中已安裝套件的狀態（lip 的格式）
  mods\                            模組（見「模組如何載入」）
  Minecraft Bedrock\               開啟隔離時的遊戲資料（預覽版：Minecraft Bedrock Preview）
```

開啟和未開啟隔離的實例的遊戲資料資料夾見[實例隔離](../concepts/isolation)，`mods\` 見[模組如何載入](../concepts/mod-loading)。

## LeviLauncher 資料夾之外

| 路徑 | 說明 |
| --- | --- |
| 桌面上的 `Minecraft - <實例>.lnk` | 實例的桌面捷徑（**建立桌面捷徑**，或 `instance shortcut`）。它以 `--launch=<實例>` 開啟啟動器。只寫入你自己的桌面，不寫公用桌面。 |
| `%APPDATA%\lip\` | lip 的設定：`config.toml`，例如其中的 `github_proxy`，內置套件管理器也會讀取。 |
| `%LOCALAPPDATA%\lip\Cache\` | 內置套件管理器的套件快取，與 lip 的相同。**設定 → 套件管理** 中的 **清理快取** 會清空它。 |
| `%APPDATA%\Minecraft Bedrock\`、`%APPDATA%\Minecraft Bedrock Preview\` | 未開啟隔離的 GDK 實例的共用遊戲資料。 |
| `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\`（預覽版：`Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`） | 未開啟隔離的 UWP 實例的共用遊戲資料。 |

## 檔案如何寫入

- 檔案先以 `<名稱>.<隨機字串>.tmp` 寫在最終位置旁邊，再改名到位，所以不會看到寫了一半的檔案。可以續傳的未完成下載保存為 `<名稱>.partial.tmp`。
- 你起的名稱（實例、世界）按 Windows 規則清理：去掉 `<>:"/\|?*` 這些字元和結尾的點與空格，並避開 `CON`、`NUL` 等保留名稱。
- 啟動器產生的檔案命名為 `<名稱>_<yyyyMMdd-HHmmss>.<副檔名>`，例如 `MyWorld_20261107-142301.mcworld`。

## 舊佈局

1.1.0 之前的 LeviLauncher 把所有東西放在 `%APPDATA%\<程式名稱>\`（例如 `%APPDATA%\levilauncher.exe\`），裏面有 `versions\`、`backups\`、`installers\`、`updates\`、`logs\` 資料夾，以及 `config.json`、`user_gamertag_map.json` 和 `gdk_pending_versions.json` 檔案。實例中則是 `version.json` 和 `LargeLogo.ico`。

LeviLauncher 1.1.0 及更高版本第一次啟動時，會把這些資料一次性遷移到上面的佈局，不刪除任何東西：同一個磁碟機上的資料直接改名到位，另一個磁碟機上的資料複製過去並保留原件，舊的 `config.json` 改名為 `config.migrated.json`。你自己選過的資料根目錄留在原處。有東西無法遷移時（例如遊戲還在從某個實例執行），所有步驟都會撤銷，啟動器本次以舊佈局執行，下次啟動再試。`storage-migration.json` 記錄了甚麼被移到了哪裏；之後桌面捷徑會更新到新位置。
