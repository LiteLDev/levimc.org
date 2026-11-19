# 模組如何載入

Minecraft Bedrock 本身不支援模組：模組是原生程式碼，由載入器在遊戲啟動時放進遊戲程序。本頁說明 LeviLauncher 使用哪些載入器、模組放在哪裏，以及加入模組的幾種方式之間的關係。

## 模組放在哪裏 <Badge platform="windows" />

每個實例都有一個 `mods\` 資料夾（見[資料夾與檔案](../reference/files)）。每個模組是其中的一個資料夾，帶有描述該模組的 `manifest.json`：

| 欄位 | 含義 |
| --- | --- |
| `name` | 模組名稱。 |
| `entry` | 載入器載入的檔案，相對於模組資料夾（一個 `.dll`）。 |
| `version` | 模組版本。 |
| `type` | 由哪個載入器載入：`preload-native` 由 LeviLauncher 的原生載入器載入；LeviLamina 的模組有它們自己的類型。 |
| `author` | 作者（可選）。 |

模組屬於某一個實例，不受[隔離](./isolation)影響，隔離只涉及遊戲資料。

**關閉模組**（在 **管理模組** 中，或用 `LeviLauncher.exe mod disable`）會把它的 `manifest.json` 改名為 `manifest.json.close`；重新開啟時再改回來。模組的檔案留在原處，尋找 `manifest.json` 的載入器就不會再找到這個模組。

## 兩個載入器 <Badge platform="windows" />

### LeviLauncher 的原生載入器

LeviLauncher 安裝或準備實例時，會把自己的載入器 `LeviLauncher.dll` 放在遊戲執行檔旁邊，並把它加入執行檔的匯入表，使 Windows 隨遊戲一起載入它。這適用於 x64 建置，GDK 和 UWP 都一樣；[隔離](./isolation)也是靠它實現的。

遊戲啟動時，原生載入器按名稱順序走訪 `mods\` 中的資料夾，載入每個 `type` 為 `preload-native` 的模組的 `entry`。沒有 `manifest.json` 的資料夾和其他類型的模組會被略過。如果實例裏有另一個預載入器（遊戲旁邊的 `preloader.dll`），原生載入器會把全部模組載入交給它。原生載入器需要 Visual C++ 執行階段（x64），LeviLauncher 會檢查並提供安裝。

### LeviLamina

[LeviLamina](https://levimc.org/zh-Hant/LeviLamina/) 是 LeviMC 的模組載入器。[LeviMC 模組](https://levimc.org/zh-Hant/mods/)上的大多數模組都是 LeviLamina 模組：它們需要支援該實例遊戲版本的 LeviLamina。LeviLauncher 在其支援的版本的 GDK 實例上安裝 LeviLamina（安裝版本時的 **安裝 LeviLamina** 開關，或 **實例設定** 的 **載入器** 分頁），作為內置套件管理器的一個套件。

## 加入模組的三種方式 <Badge platform="windows" />

| 你加入的是 | LeviLauncher 的做法 |
| --- | --- |
| **LeviMC 模組** 中的模組（或 `mod install owner/repo`） | 用內置的、與 [lip](https://github.com/LiteLDev/lip) 相容的套件管理器把它作為套件安裝：下載適用於本平台的發佈版本，安裝它依賴的套件，並記錄在實例的 `.lip\state.json` 中。模組需要 LeviLamina 而已安裝的版本不合適（或尚未安裝）時，會先安裝一個相容的 LeviLamina。這樣安裝的模組可以作為套件更新和移除。 |
| `.mcmod` 模組包（或 `.zip`） | 解壓到 `mods\` 下的一個新資料夾。壓縮檔中必須包含 `manifest.json`。 |
| 單個 `.dll` | 放進 `mods\` 下的一個新資料夾，並為它寫一個 `manifest.json`：預設以檔案名稱為名稱，類型為 `preload-native`，版本為 `0.0.0`。 |

套件在它的 `lip.toml` 和 `.lip\state.json` 中用 `side`（`client` 或 `server`）和 `platform`（例如 `win-x64`）記錄它在哪裏執行。對用戶端，LeviLauncher 安裝模組的 `client` 變體（如有），否則安裝其預設變體。詳情（包括舊套件如何遷移）見[模組與整合](../guide/mods-integrations)。

## Android <Badge platform="android" />

Android 版載入原生模組：在遊戲程序中執行的 `.so` 函式庫。請把裝了模組的環境放在隔離的版本中，並只安裝來源可信的模組。想自己製作，請參閱 LeviLamina 文檔中的 [Android 原生模組](https://levimc.org/zh-Hant/LeviLamina/developer_guides/android/)。

## 相關頁面

- [模組與整合](../guide/mods-integrations)
- [實例與遊戲版本](./instances)
- [命令列](../reference/command-line)
