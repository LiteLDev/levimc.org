# LeviLauncher

Windows・Android 向け Minecraft Bedrock ランチャー。Windows PC や Android デバイスで、Minecraft 統合版のインストール、管理、分離、Mod 導入、起動を行えます。

**ダウンロード:** [Windows 版 LeviLauncher](https://github.com/LiteLDev/LeviLauncher/releases/latest) · [Android 版 LeviLauncher](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) · [ダウンロード](./download)ページに、各バージョンの動作要件とほかの入手先が載っています。

::: info Windows 版と Android 版
LeviLauncher には Minecraft Bedrock Edition (GDK / UWP) 向けの **Windows 版**と、Google Play の公式 Minecraft 向けの **Android 版**があります。どちらも**正規版のライセンス**が必要です。iOS 版はなく、開発する予定もありません。
:::

::: tip ここから始める
LeviLauncher が初めての方は、チュートリアル[Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/)（英語）で、LeviLauncher のダウンロードから Mod を入れた最初のプレイまでを進められます。
:::

## LeviLauncher でできること

- **バージョン中心主義。** Minecraft の正式版・プレビュー版をインストール、名前変更、起動、削除でき、各環境をしっかり管理できます。インストールした各コピーは「インスタンス」です。[バージョン管理](./guide/version-management)と[インスタンスとゲームバージョン](./concepts/instances)を参照してください。
- **厳密な分離。** より安全な作業環境が必要なときに、ワールド、パック、ゲームファイルをデフォルトの AppData インストールから分離して保持します。[インスタンスの隔離](./concepts/isolation)を参照してください。
- **コンテンツ管理。** ワールド、リソースパック、ビヘイビアパック、スキンパック、スクリーンショット、サーバーリストを 1 か所で管理します。[コンテンツ管理](./guide/content-management)を参照してください。
- **Mod 機能。** `.mcmod` 形式の Mod パッケージをインポートし、CurseForge を閲覧し、内蔵パッケージマネージャーで LeviLamina や LIP パッケージをインストールできます。[Mod と統合](./guide/mods-integrations)と[Mod の読み込み](./concepts/mod-loading)を参照してください。
- **ワールドツール。** ランチャーを離れずに、バックアップのエクスポート、ワールドデータの確認、`level.dat` の一部フィールドの編集ができます。[ワールドツール](./guide/world-tools)を参照してください。
- **ユーザー設定。** 言語、外観、ダウンロード動作、プライバシー設定、更新チャンネル、パッケージ管理を調整できます。[設定とカスタマイズ](./guide/settings-personalization)と[すべての設定](./reference/settings)を参照してください。
- **Android 版の機能。** 同じランチャーで Xbox アカウントの切り替えと URI によるクイック起動。[アカウントとクイック起動](./guide/accounts-quick-launch)を参照してください。

## 簡単な例

Windows では、ランチャーのウィンドウでできることはすべてターミナルからも行えます。次の 3 つのコマンドは、最新の Minecraft 正式版を LeviLamina 付きの新しいインスタンスとしてインストールして既定のインスタンスにし、[LeviMC Mods](https://levimc.org/mods/) の Mod を 1 つ追加して、ゲームを起動します。

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe play
```

GDK 版をインストールするには、Minecraft を所有する Microsoft アカウントでサインインしている必要があります（`LeviLauncher.exe account login`）。ウィンドウでは、同じ手順が **ダウンロード** ページ、**LeviMC Mods** ページ、**起動** ボタンに当たります。すべてのコマンドは[コマンドライン](./reference/command-line)リファレンスにあります。

## このサイトには何が載っていますか

このドキュメントは**最終ユーザー**向けであり、メンテナーや開発者向けではありません。

- **ガイド**: 1 ページに 1 つの作業。[ダウンロード](./download)ページでアプリを入手し、[バージョン](./guide/version-management)、[ダウンロードとミラー](./guide/downloads-mirrors)、[コンテンツ](./guide/content-management)、[アカウントとクイック起動](./guide/accounts-quick-launch)（Android）、[Mod](./guide/mods-integrations)、[ワールド](./guide/world-tools)、[設定](./guide/settings-personalization)を管理します。「ヘルプ」グループでは[更新とトラブルシューティング](./guide/update-troubleshooting)と[コミュニティとフィードバック](./guide/faq-community-feedback)を扱います。
- **概念**: LeviLauncher の仕組み。[インスタンスとゲームバージョン](./concepts/instances)（正式版とプレビュー版、GDK と UWP、Windows と Android）、[インスタンスの隔離](./concepts/isolation)、[Mod の読み込み](./concepts/mod-loading)。
- **リファレンス**: [コマンドライン](./reference/command-line)、[すべての設定](./reference/settings)、LeviLauncher が使う[フォルダーとファイル](./reference/files)、Android の[クイック起動 URI](./reference/quick-launch-uri)、Android 版の[プライバシーポリシー](./privacy-policy)。

推奨読解順序: チュートリアル[Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/)、次に[バージョン管理](./guide/version-management)と[コンテンツ管理](./guide/content-management)。

## ダウンロードチャンネル

- **GitHub Releases (LeviLauncherダウンロード):** [LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- **LanZou Cloudミラーサイト:** [levimc.lanzoue.com/b016ke39hc](https://levimc.lanzoue.com/b016ke39hc) — パスワード: `levi`
- **Android 版:** [LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

## コミュニティとフィードバック

- **公式 Discord:** [discord.gg/v5R5P4vRZk](https://discord.gg/v5R5P4vRZk)
- **個人 Discordチャンネル:** [discord.gg/VqQaC8vWz8](https://discord.gg/VqQaC8vWz8)
- **QQグループ:** [458083875](https://qm.qq.com/q/1z791rJgJG)
- **問題報告:** [GitHub Issues](https://github.com/LiteLDev/LeviLauncher/issues)
