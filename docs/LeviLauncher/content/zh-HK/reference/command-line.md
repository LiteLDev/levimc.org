---
platforms: [windows]
---
# 命令列

不帶參數執行 `LeviLauncher.exe` 會開啟啟動器視窗。帶上指令時，它在終端機中執行並在完成後結束，指令採用 `<名詞> <動詞>` 的格式：

```text
LeviLauncher.exe <command> [arguments] [flags]
```

本頁列出 LeviLauncher 1.1.0 的全部指令。`LeviLauncher.exe help <command>` 會列印每個指令的參數和範例，`LeviLauncher.exe help` 列印總覽。命令列的輸出是英文。

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe play
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe world export "My World" -o D:\Backups
LeviLauncher.exe instance list --json
```

## 在 shell 中執行

`LeviLauncher.exe` 是視窗程式，所以 shell 預設不會等待它結束。需要在提示字元返回之前看到輸出，或需要它的結束代碼時：

- 在 cmd 中使用 `start /wait LeviLauncher.exe ...`，然後讀取 `%ERRORLEVEL%`；
- 在 PowerShell 中把輸出接到管線（`LeviLauncher.exe instance list | Out-String`），或使用 `Start-Process -Wait -NoNewWindow`。

命令列不會開啟視窗，視窗開著時也可以執行。

## 指令

### 日常

| 指令 | 作用 |
| --- | --- |
| `play [<instance>]` | 啟動遊戲並等到遊戲視窗出現（`launch` 的別名） |
| `install <version\|file>` | 下載 Minecraft 並安裝為新實例（= `instance create`） |
| `use [<instance>]` | 設定或顯示預設實例 |
| `stop [<instance>\|<pid>...]` | 關閉正在執行的 Minecraft（= `process stop`） |

### 管理實例

| 指令 | 作用 |
| --- | --- |
| `instance list [<filter>]` | 列出已安裝的實例 |
| `instance show [<instance>]` | 顯示實例的設定、註冊狀態、載入器、玩家和內容數量（也可寫作 `instance <instance>`） |
| `instance create <version\|file>` | 下載 Minecraft 並安裝為新實例 |
| `instance copy-data [<instance>] --from system\|<instance>` | 把遊戲資料（世界、設定）複製到使用自有資料的實例 |
| `instance rename <instance> <new-name>` | 重新命名實例 |
| `instance set [<instance>]` | 更改實例設定（主控台、編輯器模式、自有資料、啟動參數、環境變數、圖示） |
| `instance remove <instance>...` | 永久刪除實例及其資料夾中的一切 |
| `instance register [<instance>]` | 讓 Windows 把該實例當作其通道已安裝的 Minecraft |
| `instance unregister [<instance>]` | 解除實例在 Windows 中的註冊（遊戲資料保留） |
| `instance shortcut [<instance>]` | 建立啟動該實例的桌面捷徑，或刪除它 |
| `instance path [<instance>] [<kind>]` | 列印實例的某個資料夾（並可開啟它） |
| `mod list [<filter>]` | 列出實例的模組 |
| `mod show <package>` | 顯示模組目錄中的一個模組 |
| `mod search [<words>]` | 搜尋 LeviLamina 模組目錄 |
| `mod install <package[@version]>...` | 從模組目錄安裝、升級或降級模組 |
| `mod update [<mod>...]` | 把目錄中的模組更新到最新版本 |
| `mod import <file>...` | 從 `.mcmod`、`.zip` 或 `.dll` 檔案加入模組 |
| `mod set <mod>` | 修改模組的清單（manifest） |
| `mod remove <mod>...` | 從實例中移除模組 |
| `mod enable <mod>... \| --all` | 開啟模組 |
| `mod disable <mod>... \| --all` | 關閉模組而不移除 |
| `mod path [<mod>]` | 列印某個模組或實例模組資料夾的路徑 |
| `loader versions` | 列出某個遊戲版本可用的 LeviLamina 版本 |
| `loader install [<version>]` | 在實例上安裝 LeviLamina，或更換其版本 |
| `loader remove` | 從實例中移除 LeviLamina |
| `world list [<filter>]` | 列出實例和玩家的世界 |
| `world import <file.mcworld>...` | 從 `.mcworld` 檔案匯入世界 |
| `world export <world>...` | 把世界匯出（備份）為 `.mcworld` 檔案 |
| `world copy <world>...` | 把世界複製到另一個實例 |
| `world rename <world> <new-name>` | 更改世界的顯示名稱 |
| `world get <world> [<key>[/<sub>...]]` | 讀取 `level.dat` 中的世界設定 |
| `world set <world> <key>[/<sub>...]=<value>...` | 修改 `level.dat` 中的世界設定 |
| `world remove <world>...` | 永久刪除世界 |
| `pack list [<filter>]` | 列出資源包、行為包和皮膚包 |
| `pack import <file.mcpack\|file.mcaddon>...` | 從 `.mcpack` 和 `.mcaddon` 檔案安裝資源包和附加元件 |
| `pack copy <pack>... \| --all` | 把資源包複製到另一個實例 |
| `pack remove <pack>...` | 刪除已安裝的資源包 |
| `screenshot list` | 列出實例和玩家的截圖，最新的在前 |
| `screenshot remove <name\|path>... \| --all` | 刪除截圖 |
| `server list [<filter>]` | 列出已保存的伺服器並檢查是否在線 |
| `player list` | 列出 GDK 實例的玩家檔案 |
| `backup list [<instance>]` | 列出實例備份和世界備份（預覽功能） |
| `backup create [<instance>]` | 備份實例的遊戲資料和模組（預覽功能） |
| `backup restore [<instance>] <archive.zip>` | 還原實例備份（預覽功能） |

### 尋找可安裝的內容

| 指令 | 作用 |
| --- | --- |
| `installer search [<version>]` | 列出可以安裝的 Minecraft 建置 |
| `installer download <version>` | 只下載某個建置的安裝包，不安裝 |
| `installer list` | 列出已下載的安裝包，包括未完成的下載 |
| `installer remove <version\|file>...` | 刪除已下載的安裝包以釋放磁碟空間 |
| `installer mirrors <version>` | 測量某個 GDK 建置的下載鏡像 |
| `curseforge search [<words>]` | 在 CurseForge 上搜尋世界、附加元件、資源包和皮膚（名詞的別名：`cf`） |
| `curseforge show <id>` | 顯示一個 CurseForge 專案 |
| `curseforge categories` | 列出可用於篩選的 CurseForge 類別和分類 |
| `curseforge install <id>` | 下載一個 CurseForge 檔案並匯入到實例 |

### 這部電腦與啟動器

| 指令 | 作用 |
| --- | --- |
| `process list` | 列出正在執行的 Minecraft 程序，包括不是由啟動器啟動的（別名：`ps`） |
| `process stop [<instance>\|<pid>...]` | 強制關閉正在執行的 Minecraft（上次自動保存之後的進度會遺失） |
| `account status` | 顯示已登入的微軟帳號以及它擁有哪些版本 |
| `account login` | 登入微軟帳號，或切換帳號 |
| `account logout` | 讓啟動器忘記它的微軟帳號 |
| `config list` | 列出啟動器設定和資料夾 |
| `config get <key>` | 列印某個設定的值 |
| `config set <key> <value>` | 修改某個設定 |
| `config unset <key>` | 把某個設定恢復為預設值 |
| `cache clean [packages\|downloads\|partial]...` | 釋放快取佔用的磁碟空間 |
| `doctor [--fix [<fix>...]]` | 檢查這部電腦上 Minecraft 和模組需要的東西；`--fix` 修復（`vcruntime`、`gameinput`、`loader-migration`、`developer-mode`） |
| `self-update` | 把 LeviLauncher 本身更新到最新版本 |
| `version` | 列印版本資訊 |
| `help [<command>...]` | 任意指令的說明和範例 |

每個 `list` 動詞也可以寫作 `ls`，每個 `remove` 動詞也可以寫作 `rm`。`config` 讀取和修改的設定列於[全部設定](./settings#command-line-keys)。

### 版本與套件

- `install` 和 `installer` 的 `<version>` 是 `installer search` 列出的建置：完整版本號（`1.21.50.07`）、帶點的前綴（`1.21.50` 表示最新的 `1.21.50.x`；`1.21.5` 不匹配它）或 `latest`。`<file>` 是本機的 `.msixvc`、`.appx`、`.msix`、`.appxbundle` 或 `.msixbundle`。
- `mod install` 的 `<package>` 是 `owner/repo`、`github.com/owner/repo` 或一個 URL，可以加上 `#variant` 和 `@version`。

## 全域參數

以下參數適用於所有指令：

| 參數 | 含義 |
| --- | --- |
| `-i`、`--instance <name>` | 要操作的實例 |
| `-p`、`--player <id\|gamertag>` | 玩家檔案（GDK 實例） |
| `--json` | 在 stdout 上輸出機器可讀的結果 |
| `-q`、`--quiet` | 只列印識別碼；不顯示進度和提示 |
| `-v`、`--verbose` | 顯示更多細節，並把啟動器記錄輸出到 stderr |
| `-y`、`--yes` | 對所有確認回答「是」 |
| `--no-input` | 從不提示輸入 |
| `-h`、`--help` | 顯示指令的說明 |
| `--version` | 列印版本 |

**使用哪個實例：**`-i`，否則環境變數 `LEVILAUNCHER_INSTANCE`，否則預設實例（`use`），否則唯一的實例。**使用哪個玩家：**`-p`，否則 `LEVILAUNCHER_PLAYER`，否則唯一的檔案，否則已登入帳號的檔案。

## 輸出

- 結果輸出到 stdout。進度、提示和錯誤輸出到 stderr；錯誤以 `error:` 開頭，附帶 `hint:` 和錯誤代碼，例如 `[ERR_GAME_RUNNING]`。
- `--json` 列印一個 JSON 文件：清單為陣列，其他為物件；鍵名為 camelCase，時間為 RFC 3339 格式，大小以位元組為單位。
- `-q` 只列印識別碼，每行一個。

## 結束代碼

| 代碼 | 含義 |
| --- | --- |
| 0 | 成功 |
| 1 | 失敗 |
| 2 | 用法錯誤 |
| 3 | 找不到 |
| 4 | 衝突（例如遊戲正在執行） |
| 5 | 登入或授權 |
| 6 | 網絡 |
| 7 | 部分完成 |
| 8 | 需要更改系統或管理員權限 |
| 9 | 逾時 |
| 10 | 已取消 |
| 130 | 被中斷（Ctrl-C） |

`launch --wait-exit` 改為返回遊戲本身的結束代碼。

## 視窗參數

以下參數會開啟視窗，而不是執行指令：

| 參數 | 作用 |
| --- | --- |
| `--launch=<instance>` | 開啟啟動器並啟動該實例；桌面捷徑使用的就是它。啟動器已經在執行時，在已執行的啟動器中啟動該實例。 |
| `--debug` | 同時在主控台視窗中顯示啟動器記錄（也可以寫作 `debug`、`-debug` 和 `/debug`）。 |
