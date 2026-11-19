# 實例與遊戲版本

LeviLauncher 把每一份 Minecraft 安裝為一個**實例**：一個遊戲版本，帶有自己的名稱、自己的設定，以及（如果你需要）自己的遊戲資料。你可以同時保留多個實例，遊戲版本相同或不同都可以，需要哪個就啟動哪個。應用程式把它們列於 **實例** 頁面。

## 實例是什麼

=== "Windows"

    實例是啟動器 `Instances` 資料夾中的一個資料夾（見[資料夾與檔案](../reference/files)），實例的名稱就是資料夾的名稱。資料夾中包括：

    - 一個 Minecraft 建置的遊戲檔案，從它的安裝包中解壓而來；
    - `.levilauncher\instance.json`：啟動器記錄的實例資訊，包括遊戲版本、通道、是否使用自己的遊戲資料，以及啟動選項（主控台、編輯器模式、啟動參數、環境變數）；
    - `mods\`：實例的模組；`.lip\`：內置套件管理器所裝套件的狀態（見[模組如何載入](./mod-loading)）；
    - 開啟[隔離](./isolation)時，實例自己的遊戲資料（世界、資源包、設定）。

    模組始終屬於某一個實例。遊戲資料只有在開啟隔離時才屬於某一個實例；否則實例使用這部電腦上 Minecraft 平常使用的遊戲資料。

=== "Android"

    實例是你匯入 LeviLauncher 的一個官方 Minecraft APK。它在啟動器內執行，無需安裝到系統中。裝置上仍需安裝 Google Play 上的 Minecraft（1.21.80 或更高版本）；LeviLauncher 會把它和你匯入的版本列在一起。

    版本隔離讓匯入版本的世界、資源包和設定與已安裝的 Google Play 版本分開。匯入的版本通常需要開啟隔離才能啟動。

## 正式版與預覽版

每個 Minecraft 建置都屬於一個**通道**：

| 通道 | 說明 |
| --- | --- |
| Release（正式版） | 大多數玩家使用的穩定版遊戲。 |
| Preview（預覽版） | 即將推出的版本的測試建置，更容易出現世界、資源包或模組的相容性問題。 |
| Beta | 只為 UWP 發佈的測試建置。 <Badge platform="windows" /> |

在 Windows 上，正式版和預覽版各有自己的遊戲資料資料夾（`Minecraft Bedrock` 和 `Minecraft Bedrock Preview`），所以未開啟隔離的預覽版實例也不會與正式版實例共用世界。

## GDK 與 UWP 建置 <Badge platform="windows" />

Windows 版 Minecraft 先後以兩種套件格式發佈，LeviLauncher 兩種都能安裝。同一版本兩種格式都有時，選擇 GDK。

| | GDK | UWP |
| --- | --- | --- |
| 安裝包 | `.msixvc`，從 LeviLauncher 測速後選出的鏡像下載 | `.appx` / `.msix`（或其套件組合），從 Windows Update 下載 |
| 安裝需要 | 已登入且擁有 Minecraft 的微軟帳號 | — |
| 執行需要 | Microsoft Gaming Services 與 Microsoft GameInput | Windows 開發人員模式，用於向 Windows 註冊套件 |
| 共用遊戲資料 | `%APPDATA%\Minecraft Bedrock`（預覽版：`Minecraft Bedrock Preview`），在 `Users\` 下按玩家檔案各一個資料夾 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState`（預覽版：`Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`） |
| 隔離 | 所有版本 | 1.19.70.2 及更高的 x64 版本 |
| LeviLamina | 在其支援的版本上由 LeviLauncher 安裝 | LeviLauncher 不安裝 |
| 啟動參數與環境變數 | 支援 | 不支援 |

匯入的本機安裝包（`.msixvc`、`.appx`、`.msix`、`.appxbundle` 或 `.msixbundle`）按副檔名作為 GDK 或 UWP 安裝。

### 玩家檔案 {#player-profiles}

GDK 實例按**玩家檔案**保存世界、截圖和伺服器列表：玩家檔案是 `Users\` 下以玩家 ID 命名的資料夾，啟動器知道其玩家代號（gamertag）時會顯示玩家代號。資源包和行為包由所有檔案共用（`Users\Shared\`）；皮膚包從遊戲 1.26 起共用，之前按檔案保存。UWP 實例沒有玩家檔案。

## 向 Windows 註冊 <Badge platform="windows" /> {#registration-with-windows}

Windows 每個通道只認一個已安裝的 Minecraft。**註冊**一個實例，就是讓 Windows 把它當作這個 Minecraft：開始功能表、`minecraft://` 連結和 Xbox 功能隨後都會使用它。註冊會取代正式版或預覽版位置的目前持有者（Microsoft Store 中的遊戲或另一個實例），其資料保留。註冊和取消註冊都不會改動遊戲資料。

UWP 實例在啟動時自動註冊。已註冊的實例需要先取消註冊，才能重新命名或刪除。

## 相關頁面

- [版本管理](../guide/version-management)
- [實例隔離](./isolation)
- [資料夾與檔案](../reference/files)
