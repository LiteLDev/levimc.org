# lip 基礎

新使用者最常問的問題，每個都有簡短的回答，並附上詳細說明所在的頁面。

## 關於 lip

### lip 是做什麼的？

lip 在一個資料夾裡安裝 Minecraft 基岩版伺服器，安裝和更新它的模組，並執行它。你可以通過終端機裡的介面使用它，也可以通過命令使用它。見[首頁](https://levimc.org/zh-Hant/lip/)。

### 它只能用於 LeviLamina 嗎？

不是，不過它是為此而做的。lip 安裝的模組是 LeviLamina 模組，LeviLamina 也是 lip 唯一會安裝的載入器。你也可以執行不帶載入器的原版伺服器：Windows 版用 `lip setup --game <version> --no-loader`，Linux 版用 `--build linux`。見[遊戲版本與組建](https://levimc.org/zh-Hant/lip/reference/commands/setup.html)。

### lip 能安裝客戶端模組嗎？

不能。lip 只管理伺服器。遊戲客戶端的模組由 LeviLauncher 這樣的啟動器管理，它們讀取的是同樣的套件。

### 它能在哪些系統上執行？

Windows、x64 的 Linux，以及 macOS。在 Linux 和 macOS 上，lip 通過它自己下載的 Wine 執行 Windows 伺服器。沒有 arm64 Linux 版的 lip。見 [Linux 與 macOS](https://levimc.org/zh-Hant/lip/guides/linux_macos.html)。

### 需要 git、Wine 或別的東西嗎？

不需要。lip 自己與 git 儲存庫通信，並在需要時下載遊戲、載入器、Wine 和 Microsoft Visual C++ Redistributable。見[內部機制](https://levimc.org/zh-Hant/lip/concepts/internals.html)。

### 有繁體中文嗎？

有。介面有英語、簡體中文和繁體中文，並跟隨系統語言。想自己選擇，可以用設定頁面，或者 `lip config set language zh-Hant`。這份文件也有這三種語言。命令在終端機裡輸出的內容始終是英語。見 [language](https://levimc.org/zh-Hant/lip/guides/configuration.html#language)。

## 使用 lip

### 可以不用介面嗎？

可以。介面做的每一件事都是一條命令：`lip setup`、`lip install`、`lip update`、`lip uninstall`、`lip run`、`lip config`。從[用命令行開服](https://levimc.org/zh-Hant/tutorials/server/command-line/)開始。這些命令也能在沒人回答問題的指令碼裡使用：見 [`lip setup`](https://levimc.org/zh-Hant/lip/reference/commands/setup.html) 的 `--accept-eula`。

### 反過來呢：一定要學命令嗎？

不用。只輸入 `lip`、後面什麼都不加，然後使用介面即可。見[開你的第一個伺服器](https://levimc.org/zh-Hant/tutorials/server/first-server/)。

### 關掉終端機後伺服器會停止嗎？

取決於你是怎麼啟動它的。

- **在介面裡啟動的：** 不會。結束介面或關掉終端機後，它繼續執行。
- **用 `lip run --managed` 啟動的：** 不會。關掉終端機只是讓你脫離它。
- **用普通的 `lip run` 啟動的：** 會。lip 會請伺服器停止，並等它結束。

前兩種情況下，伺服器執行在 lip 的背景處理程序裡。用介面或 `lip run --managed` 就能回到它那裡。見[託管伺服器](https://levimc.org/zh-Hant/lip/reference/commands/run.html)。

### 怎麼停止在背景執行的伺服器？

開啟介面，在伺服器頁面選擇「停止」。或者在伺服器資料夾裡執行 `lip run --managed` 接入它，再按 Ctrl+C。

### 機器重新啟動後伺服器會自動啟動嗎？

不會。lip 不會在系統啟動時啟動任何東西。需要這樣做時，請讓系統的服務管理器在伺服器資料夾裡執行 `lip run`。

### lip 能重新啟動當機的伺服器嗎？

能。在伺服器頁面開啟「自動重新啟動」，或者執行 `lip config set restart on-failure --workspace`。見[重新啟動](https://levimc.org/zh-Hant/lip/reference/commands/run.html)。

### 伺服器執行時能安裝或更新模組嗎？

在介面裡不能：它會請你先停止伺服器。用命令可以，伺服器下次啟動時才會用上變更。在 Windows 上，這樣的命令可能因為執行中的伺服器開啟著某個檔案而失敗；這時 lip 會復原它做過的變更。見[介面與命令](https://levimc.org/zh-Hant/lip/concepts/how_lip_works.html)。

### 能執行多個伺服器嗎？

能，每個伺服器一個單獨的資料夾，並在各自的 `server.properties` 裡設定不同的連接埠。一個資料夾同一時間只執行一個伺服器。介面在[工作區](https://levimc.org/zh-Hant/lip/interface/workspaces.html)頁面儲存著你的伺服器資料夾清單。

### 兩個人能管理同一個伺服器嗎？

以這臺機器上**同一個使用者**的身份登入的兩個人共享一切：兩人在介面裡看到的是同一個執行中的伺服器，誰都可以停止它或變更模組。lip 保證兩次變更不會同時進行：後來的那次會立刻失敗，稍後重試即可。

這臺機器上的兩個**不同使用者**不共享 lip 的背景處理程序。只要檔案權限允許，兩人都能變更資料夾裡的套件。但其中一人啟動的伺服器，對另一人來說是「在此介面之外執行」：看得到，卻不能停止，也不能向它輸入。

lip 自己沒有網路訪問功能。要管理另一臺機器上的伺服器，請登入那臺機器（例如通過 SSH），在那裡執行 lip。

### 怎麼更新 lip？

執行 `lip self-update`，或者使用設定頁面的「檢查更新」。`lip self-update --check` 只告訴你有沒有新版本。見 [`lip self-update`](https://levimc.org/zh-Hant/lip/reference/commands/self_update.html)。

### 怎麼變更伺服器的 Minecraft 版本？

在伺服器資料夾裡再執行一次 `lip setup --game <version>`，或者使用介面的工作區頁面。模組會換成能配合新遊戲的版本。見 [`lip setup`](https://levimc.org/zh-Hant/lip/reference/commands/setup.html)。

## 檔案

### 我的世界和設定在哪裡？

在伺服器資料夾裡，就在遊戲放它們的地方。lip 不會移動它們。

| 內容 | 在伺服器資料夾裡的位置 |
| --- | --- |
| 世界 | `worlds/` |
| 遊戲的設定 | `server.properties`、`allowlist.json`、`permissions.json` |
| 模組，通常還有它的設定 | `mods/<名字>/` |

介面在[遊戲設定](https://levimc.org/zh-Hant/lip/interface/game_config.html)和[模組設定](https://levimc.org/zh-Hant/lip/interface/mod_config.html)頁面編輯這些設定。

### `.lip` 資料夾是什麼？

lip 對這個伺服器資料夾的記錄：安裝了哪些套件、工作區設定、失敗報告，以及 Linux 和 macOS 上的 Wine 前綴。在 Windows 上它是隱藏的。別去動它；移動伺服器時，讓它跟著資料夾一起走。見[檔案和目錄](https://levimc.org/zh-Hant/lip/reference/files.html)。

### lip 在伺服器資料夾之外還存了什麼？

四個屬於每個使用者的目錄：你的設定、下載快取、lip 的 Wine，以及介面的工作區清單。

| 內容 | Windows | Linux 和 macOS |
| --- | --- | --- |
| 設定 | `%APPDATA%\lip` | `~/.config/lip` |
| 快取 | `%LOCALAPPDATA%\lip\Cache` | `~/.cache/lip` |
| 資料：lip 為執行伺服器而安裝的東西，例如它的 Wine | `%LOCALAPPDATA%\lip\Data` | `~/.local/share/lip` |
| 狀態：工作區清單 | `%LOCALAPPDATA%\lip\State` | `~/.local/state/lip` |

快取隨時可以用 `lip cache clean` 刪除。lip 不往系統的臨時目錄裡寫任何東西。見[使用者目錄](https://levimc.org/zh-Hant/lip/concepts/how_lip_works.html)。

### 變更遊戲版本會刪掉我的世界嗎？

不會。`worlds/`、`server.properties`、`allowlist.json` 和 `permissions.json` 都會保留。遊戲自身的一些資料夾，例如根目錄下的 `resource_packs/` 和 `behavior_packs/`，會被刪除後重新寫入。見[更換遊戲後保留什麼](https://levimc.org/zh-Hant/lip/reference/files.html)。

### 怎麼把伺服器搬到另一個資料夾或另一臺機器？

停止伺服器，把整個資料夾（包括 `.lip`）移動或複製過去。然後在新位置執行 lip。在新機器上，第一次啟動時 lip 會重新安裝伺服器需要的系統組件。

## 套件

### 套件從哪裡來？

來自公開的 git 儲存庫，多數在 GitHub 上。沒有中央儲存庫。套件用它的儲存庫地址來指定，例如 `github.com/LiteLDev/LegacyScriptEngine`。介面的取得模組頁面列出的是 [levimc.org](https://levimc.org) 上的模組。見[指定一個套件](https://levimc.org/zh-Hant/lip/guides/managing_packages.html)。

### 怎麼安裝磁碟上的套件？

把根目錄下有 `lip.toml` 的 ZIP 檔案或資料夾的路徑交給 `lip install`，例如 `lip install ./my-mod.zip`。見[磁碟上的 ZIP 檔案或資料夾](https://levimc.org/zh-Hant/lip/guides/managing_packages.html)。

### lip 支援私有儲存庫嗎？

不支援。lip 下載時不登入，所以只能用公開儲存庫。

### 為什麼我儲存庫裡的某個標籤不算版本？

只有名為 `v` 加完整版本號的標籤（例如 `v1.2.3`）才是版本。`v1.2` 或 `1.2.3` 這樣的標籤不是。不過任何標籤、分支或提交都可以安裝：`lip install github.com/user/repo@tag:1.2.3`。見 [git 儲存庫](https://levimc.org/zh-Hant/lip/guides/managing_packages.html)。

### 還能安裝為 lip v0.x 製作的、帶 `tooth.json` 的套件嗎？

能。lip 能讀取它們，並像其他套件一樣安裝。lip v0.x 的伺服器資料夾和設定，會在 lip 第一次處理它們時自動轉換。套件的作者可以用 `lip pkg migrate` 轉換自己的套件：見[移轉套件](https://levimc.org/zh-Hant/lip/authors/migrating_packages.html)。

### `lip.toml` 是什麼？

描述一個套件的檔案：它的名字、版本、相依什麼，以及安裝哪些檔案。只有製作套件時才需要它。見 [lip.toml](https://levimc.org/zh-Hant/lip/concepts/lip_toml.html)。

### `lip install` 會修改我的 `lip.toml` 嗎？

不會。`lip install` 把套件安裝到伺服器資料夾裡，並記錄在 `.lip` 中。它從不寫 `lip.toml`。

## 出問題的時候

### 命令失敗了，去哪裡找原因？

先看 lip 輸出的 `error:` 和 `hint:` 兩行。更多細節在伺服器資料夾的 `.lip/logs/` 裡的失敗報告中；lip 會輸出它的路徑。見[讀懂失敗資訊](https://levimc.org/zh-Hant/lip/guides/troubleshooting.html)。

### 安裝到一半失敗了會怎樣？

不會留下做了一半的東西。會變更伺服器資料夾的命令，要麼做完全部工作，要麼什麼都不做：失敗時，或者你按下 Ctrl+C 時，lip 會復原它做過的變更。如果 lip 自己被殺掉，那個資料夾裡的下一條命令會先把事情理順。見[操作](https://levimc.org/zh-Hant/lip/concepts/how_lip_works.html)。

### 這裡 GitHub 很慢或被屏蔽，怎麼辦？

設定 GitHub 代理伺服器，或者使用你的網路代理伺服器。見 [GitHub 很慢或被屏蔽時](https://levimc.org/zh-Hant/lip/guides/configuration.html)。

### 能同時執行兩條 lip 命令嗎？

能，只要是在不同的伺服器資料夾裡。在同一個資料夾裡，同一時間只能有一條命令變更它：第二條會立刻失敗，等第一條結束後再執行。唯讀的命令（例如 `lip list`）隨時可用。見[另一個 lip 正在變更工作區](https://levimc.org/zh-Hant/lip/guides/troubleshooting.html)。

### 背景一直在執行的那個 lip 處理程序是什麼？

常駐程式。它執行你的命令，並讓你的託管伺服器持續執行。沒有工作 10 分鐘後它會自己結束，除非它正在執行伺服器。`lip daemon status` 可以檢視它，`lip daemon stop` 可以在它空閒時結束它。見[常駐程式和客戶端](https://levimc.org/zh-Hant/lip/concepts/how_lip_works.html)。
