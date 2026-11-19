# LeviLauncher

面向 Windows 與 Android 的 Minecraft Bedrock 啟動器：在 Windows 電腦或 Android 裝置上完成 Minecraft Bedrock 的安裝、管理、隔離、模組配置與啟動。

**下載：** [LeviLauncher Windows 版](https://github.com/LiteLDev/LeviLauncher/releases/latest) · [LeviLauncher Android 版](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) · [下載](./download)頁面列出兩個版本各自的要求和其他下載渠道。

::: info Windows 版與 Android 版
LeviLauncher 提供面向 Minecraft Bedrock Edition (GDK / UWP) 的 **Windows 版**，以及面向 Google Play 官方 Minecraft 的 **Android 版**，兩者都需要您擁有**正版授權**。我們沒有開發 iOS 版的計劃。
:::

::: tip 從這裏開始
第一次使用 LeviLauncher？教學[在 Windows 上玩模組](https://levimc.org/zh-Hant/tutorials/play/play-with-mods/)會帶你從下載 LeviLauncher 一直走到帶模組進入遊戲。
:::

## LeviLauncher 能做什麼

- **以版本為核心。** 安裝、重新命名、啟動及移除 Minecraft 正式版或預覽版，讓每個環境都井井有條。每個已安裝的副本是一個「實例」：見[版本管理](./guide/version-management)和[實例與遊戲版本](./concepts/instances)。
- **乾淨隔離。** 需要更安全的工作區時，可將世界、資源包與遊戲檔案與預設 AppData 安裝分開存放：見[實例隔離](./concepts/isolation)。
- **內容管理。** 從單一入口管理世界、資源包、行為包、皮膚包、截圖與伺服器列表：見[內容管理](./guide/content-management)。
- **模組就緒。** 匯入 `.mcmod` 模組包、瀏覽 CurseForge，並透過內置套件管理器安裝 LeviLamina 與 LIP 套件：見[模組與整合](./guide/mods-integrations)和[模組如何載入](./concepts/mod-loading)。
- **世界工具。** 匯出備份、檢視世界資料，並在不離開啟動器的情況下編輯部分 `level.dat` 欄位：見[世界工具](./guide/world-tools)。
- **使用者設定。** 調整語言、外觀、下載行為、私隱偏好、更新通道與套件管理：見[設定與個人化](./guide/settings-personalization)和[全部設定](./reference/settings)。
- **Android 專屬功能。** 在同一個啟動器裏切換 Xbox 帳號，並用 URI 快速啟動：見[帳號與快速啟動](./guide/accounts-quick-launch)。

## 一個簡短的例子

在 Windows 上，啟動器視窗能做的事都可以在終端機裏完成。以下三條指令把最新的 Minecraft 正式版連同 LeviLamina 安裝為一個新實例並設為預設實例，再從 [LeviMC 模組](https://levimc.org/zh-Hant/mods/)為它裝上一個模組，然後啟動遊戲：

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe play
```

安裝 GDK 版本需要先登入一個擁有 Minecraft 的微軟帳號（`LeviLauncher.exe account login`）。在視窗中，同樣的步驟對應 **下載** 頁面、**LeviMC 模組** 頁面和 **啟動** 按鈕。[命令列](./reference/command-line)參考列出了全部指令。

## 這個網站包含什麼

這套文檔面向**最終用戶**，而非維護者或開發者。

- **指南**：每頁一項任務。在[下載](./download)頁面取得應用程式，然後[管理版本](./guide/version-management)、[下載與鏡像](./guide/downloads-mirrors)、[內容](./guide/content-management)、[帳號與快速啟動](./guide/accounts-quick-launch)（Android）、[模組](./guide/mods-integrations)、[世界](./guide/world-tools)和[設定](./guide/settings-personalization)。「協助」分組包括[更新與故障排查](./guide/update-troubleshooting)和[社群與回饋](./guide/faq-community-feedback)。
- **概念**：LeviLauncher 的運作方式：[實例與遊戲版本](./concepts/instances)（正式版與預覽版、GDK 與 UWP、Windows 與 Android）、[實例隔離](./concepts/isolation)和[模組如何載入](./concepts/mod-loading)。
- **參考**：[命令列](./reference/command-line)、[全部設定](./reference/settings)、LeviLauncher 使用的[資料夾與檔案](./reference/files)、Android 的[快速啟動 URI](./reference/quick-launch-uri)以及 Android 版的[私隱政策](./privacy-policy)。

建議閱讀順序：先看教學[在 Windows 上玩模組](https://levimc.org/zh-Hant/tutorials/play/play-with-mods/)，再看[版本管理](./guide/version-management)和[內容管理](./guide/content-management)。

## 下載渠道

- **GitHub Releases（LeviLauncher 下載）：** [LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- **藍奏雲鏡像：** [levimc.lanzoue.com/b016ke39hc](https://levimc.lanzoue.com/b016ke39hc) — 密碼：`levi`
- **Android 版：** [LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

## 社群與回饋

- **官方 Discord：** [discord.gg/v5R5P4vRZk](https://discord.gg/v5R5P4vRZk)
- **個人 Discord 頻道：** [discord.gg/VqQaC8vWz8](https://discord.gg/VqQaC8vWz8)
- **QQ 群組：** [458083875](https://qm.qq.com/q/1z791rJgJG)
- **問題回饋：** [GitHub Issues](https://github.com/LiteLDev/LeviLauncher/issues)
