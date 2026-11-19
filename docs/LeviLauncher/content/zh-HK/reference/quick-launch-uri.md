---
platforms: [android]
---
# 快速啟動 URI

Android 版的 **Quick Launch**（快速啟動）用一個 `minecraft://` URI 啟動 Minecraft，告訴遊戲先開啟甚麼。快速啟動畫面上的每個操作都會產生下面的某個 URI；**Custom URI**（自訂 URI）接受任何以 `minecraft://` 開頭的 URI。遊戲如何處理 URI 由 Minecraft 決定。以下操作名稱為應用程式英文介面中顯示的名稱，括號內為譯名。

LeviLauncher 也能開啟其他應用程式中的 `minecraft://` 連結：Android 會把它列為可以開啟這類連結的應用程式之一。

## 操作

| 操作 | URI | 需要填寫 |
| --- | --- | --- |
| **How to Play**（玩法說明） | `minecraft://?showHowToPlayScreen=1` | — |
| **Servers Tab**（伺服器分頁） | `minecraft://openServersTab` | — |
| **Profile / Dressing Room**（個人資料 / 更衣室） | `minecraft://showProfileScreen` | — |
| **Marketplace Home**（市集首頁） | `minecraft://openStore` | — |
| **Minecoins** | `minecraft://?showMineCoinOffers=1` | — |
| **Marketplace Pass** | `minecraft://?openCsbPDPScreen=<tab>` | 分頁：`Home`、`Content`、`Faq` 或 `Subscribe` |
| **Connect to Server**（連接伺服器） | `minecraft://connect/?serverUrl=<位址>&serverPort=<連接埠>` | 伺服器位址和連接埠（預設 `19132`） |
| **Add External Server**（新增外部伺服器） | `minecraft://?addExternalServer=<名稱>\|<位址>:<連接埠>` | 名稱、位址和連接埠（預設 `19132`） |
| **Join Realm**（加入 Realm） | `minecraft://acceptRealmInvite?inviteID=<邀請碼>` | Realm 邀請碼 |
| **Load World**（載入世界） | `minecraft://connect/?localWorld=<世界>` | 本機世界的名稱 |
| **Execute Command**（執行指令） | `minecraft://?slashcommand=<指令>` | 要在遊戲中執行的指令 |
| **Custom URI**（自訂 URI） | 任意 `minecraft://…` | URI |

伺服器名稱、世界名稱和指令會經過 URL 編碼（空格變為 `%20`，`/` 變為 `%2F`）。

## 範例

要加入 `play.example.org` 上連接埠為 `19132` 的伺服器，選擇 **Connect to Server**，或在裝置上開啟這個連結：

```text
minecraft://connect/?serverUrl=play.example.org&serverPort=19132
```

其他 Android 專屬功能見[帳號與快速啟動](../guide/accounts-quick-launch)。
