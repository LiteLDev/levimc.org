# 實例隔離

Minecraft 在每部裝置上把世界、資源包和設定保存在一個遊戲資料資料夾裏。**實例隔離**（應用程式中為 **實例設定** 裏的 **啟用實例隔離**，以及安裝版本時的 **實例隔離**）讓實例改用自己的遊戲資料資料夾，放在實例內部。命令列把這兩種方式稱為 *own data*（自有資料）和 *shared data*（共用資料）。

## 共用資料與自有資料

=== "Windows"

    **未開啟隔離**的實例使用這部電腦上 Minecraft 平常使用的遊戲資料：與 Microsoft Store 中的遊戲、以及同類的其他未隔離實例共用世界、資源包和設定。

    **開啟隔離**的實例把遊戲資料保存在自己的資料夾中。它的世界、資源包、行為包、皮膚包、截圖、伺服器列表和遊戲設定與其他所有實例以及 Microsoft Store 中的遊戲都分開。

    | 實例 | 共用資料（隔離關閉） | 自有資料（隔離開啟） |
    | --- | --- | --- |
    | GDK，正式版 | `%APPDATA%\Minecraft Bedrock` | `<實例>\Minecraft Bedrock` |
    | GDK，預覽版 | `%APPDATA%\Minecraft Bedrock Preview` | `<實例>\Minecraft Bedrock Preview` |
    | UWP，正式版 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<實例>\Minecraft Bedrock` |
    | UWP，預覽版 | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState` | `<實例>\Minecraft Bedrock Preview` |
    | UWP，Beta | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<實例>\Minecraft Bedrock Beta` |

    `<實例>` 是該實例在 `Instances` 中的資料夾（見[資料夾與檔案](../reference/files)）。在 GDK 的資料資料夾裏，遊戲把每個玩家的資料放在 `Users\` 下（見[玩家檔案](./instances#player-profiles)）；在 UWP 的資料資料夾裏，則放在 `games\com.mojang\` 下。

=== "Android"

    版本隔離讓一個版本的遊戲資料（世界、資源包和設定）與其他版本、以及從 Google Play 安裝的 Minecraft 分開。為一個實例更改這個設定不會影響其他實例。匯入的版本通常需要開啟隔離才能啟動。

## 運作原理 <Badge platform="windows" />

遊戲本身並不知道實例的存在。LeviLauncher 安裝實例時，會把自己的載入器 `LeviLauncher.dll` 放在遊戲執行檔旁邊（見[模組如何載入](./mod-loading)）。開啟隔離的遊戲啟動時，載入器把遊戲尋找資料的資料夾（應用程式資料資料夾和暫存資料夾）重新導向到實例的資料資料夾。不複製、也不連結任何東西：遊戲直接在那裏讀寫。

隔離不會改變的：

- **模組**始終按實例存放在實例的 `mods\` 資料夾中，與是否隔離無關。
- **微軟帳號**和啟動器本身的設定對所有實例都相同。
- 向 Windows **註冊**（見[實例與遊戲版本](./instances#registration-with-windows)）與隔離無關。

## 限制 <Badge platform="windows" />

- GDK 實例的所有版本都支援隔離；UWP 實例從 1.19.70.2 起支援，且僅限 x64。
- 開啟隔離不會複製任何東西：實例從空的遊戲資料開始。想從現有資料開始，可以在安裝版本時選擇複製資料（從這部電腦上已安裝的遊戲，或從同類型的另一個隔離實例），也可以之後用 `LeviLauncher.exe instance copy-data` 複製（GDK）。
- 關閉隔離後，實例重新使用共用資料；它自己的資料資料夾仍留在實例資料夾中。
- 刪除實例會刪除它的資料夾，**包括它自有資料中的世界**。請先備份重要世界（見[世界工具](../guide/world-tools)）。
- 內容只能從一個實例複製到開啟了隔離的實例，或複製到不使用同一個資料資料夾的 UWP 實例。

## 什麼時候使用

隔離適合這些需求：

- 不同版本使用不同內容組合
- 更安全地測試模組或 Minecraft 預覽版（Preview）
- 降低一個環境影響另一個環境的風險

一種好用的組合：一個隔離的正式版實例用於日常遊玩，一個隔離的預覽版實例僅在需要時使用，再加一個臨時測試實例用於模組或排查問題。

## 相關頁面

- [版本管理](../guide/version-management)
- [內容管理](../guide/content-management)
- [實例與遊戲版本](./instances)
