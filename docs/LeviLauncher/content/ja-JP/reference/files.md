---
platforms: [windows]
---
# フォルダーとファイル

Windows 版 LeviLauncher が読み書きするすべてのファイルとフォルダーです（LeviLauncher 1.1.0 時点）。ランチャーはシステムの一時フォルダー（`%TEMP%`）には何も書き込みません。

## 概要

| フォルダー | 場所 | 内容 |
| --- | --- | --- |
| 設定フォルダー | `%APPDATA%\LeviLauncher\` | `config.json` のみ。小さく、Windows プロファイルと一緒にローミングされる |
| ローカルフォルダー | `%LOCALAPPDATA%\LeviLauncher\` | ログ、Microsoft アカウント、ウィンドウの WebView2 データ。既定のデータルートでもある |
| データルート | 別の場所を選ばない限りローカルフォルダー（**設定 → 基本設定** の **基本ルート**、または `config set data-root`） | `Instances\`、`Backups\`、`Cache\` |

```text
%APPDATA%\LeviLauncher\
  config.json                      ランチャーの設定
%LOCALAPPDATA%\LeviLauncher\        既定のデータルート
  Logs\startup.log                 ランチャーのログと、それ以前の startup.1.log … startup.4.log
  Accounts\                        Microsoft アカウントとデバイスの記録。現在の Windows ユーザー用に暗号化
  WebView2\                        ランチャーのウィンドウのデータ
  storage-migration.json           旧レイアウトからの移行記録（後述）
<データルート>\
  Instances\<インスタンス>\         1 つのインスタンス（後述）
  Backups\
    Worlds\<インスタンス>\<フォルダー>_<ワールド>\<ワールド>_<yyyyMMdd-HHmmss>.mcworld
    Instances\<インスタンス>\<インスタンス>_<yyyyMMdd-HHmmss>.zip
  Cache\
    Installers\                    ゲームのインストーラー、Visual C++ と WebView2 のインストーラー
    Updates\                       ランチャーの更新。インストール後に削除
    Downloads\                     インポート用にダウンロードしたファイル。1 日経つと起動時に削除
    Imports\                       インポートに渡されたファイル。1 日経つと起動時に削除
    gdk-pending-versions.json
    gamertags.json                 ランチャーが見たプレイヤープロファイルのゲーマータグ
```

`Cache\` の中身はすべて、何も失わずに削除できます。`LeviLauncher.exe cache clean` はパッケージキャッシュ、インポート用にダウンロードしたファイル、未完了のダウンロードを削除し、`LeviLauncher.exe installer remove` はダウンロード済みのゲームのインストーラーを削除します。データルートを変更しても、ランチャーが別のフォルダーを見るようになるだけで、既存のインスタンス、ダウンロード、バックアップは移動しません。

## インスタンスのフォルダー

```text
Instances\<インスタンス>\
  Minecraft.Windows.exe …          ビルドのゲームファイル
  LeviLauncher.dll                 LeviLauncher のネイティブローダー（x64 ビルド）
  .levilauncher\                   インスタンス内のランチャーの状態（隠しフォルダー）
    instance.json                  名前、ゲームバージョン、チャンネル、隔離、起動オプション
    icon.ico                       ゲームの LargeLogo.png から作ったインスタンスのアイコン
    xbox-auth-key-v1               Xbox サインイン用の UWP インスタンスの目印
  .lip\                            インスタンスにインストールしたパッケージの状態（lip の形式）
  mods\                            Mod（「Mod の読み込み」を参照）
  Minecraft Bedrock\               隔離が有効なときのゲームデータ（プレビュー版: Minecraft Bedrock Preview）
```

隔離の有無によるインスタンスのゲームデータフォルダーは[インスタンスの隔離](../concepts/isolation)を、`mods\` は[Mod の読み込み](../concepts/mod-loading)を参照してください。

## LeviLauncher のフォルダー以外

| パス | 内容 |
| --- | --- |
| デスクトップの `Minecraft - <インスタンス>.lnk` | インスタンスのデスクトップショートカット（**デスクトップにショートカットを作成**、または `instance shortcut`）。`--launch=<インスタンス>` でランチャーを開きます。書き込むのは自分のデスクトップだけで、パブリックデスクトップには書き込みません。 |
| `%APPDATA%\lip\` | lip の設定 `config.toml`。たとえばその `github_proxy` は内蔵パッケージマネージャーも読み込みます。 |
| `%LOCALAPPDATA%\lip\Cache\` | 内蔵パッケージマネージャーのパッケージキャッシュで、lip のものと同じです。**設定 → パッケージ管理** の **キャッシュを削除** で空になります。 |
| `%APPDATA%\Minecraft Bedrock\`、`%APPDATA%\Minecraft Bedrock Preview\` | 隔離していない GDK インスタンスの共有ゲームデータ。 |
| `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\`（プレビュー版: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`） | 隔離していない UWP インスタンスの共有ゲームデータ。 |

## ファイルの書き込み方

- ファイルは最終的な場所の横に `<名前>.<ランダム文字列>.tmp` として書き込まれ、その後で名前を変えて配置されるため、書きかけのファイルが見えることはありません。再開できる未完了のダウンロードは `<名前>.partial.tmp` として保存されます。
- ユーザーが付けた名前（インスタンス、ワールド）は Windows の規則で整えられます。`<>:"/\|?*` の文字と末尾のピリオドや空白が取り除かれ、`CON` や `NUL` などの予約名は避けられます。
- ランチャーが作るファイルの名前は `<名前>_<yyyyMMdd-HHmmss>.<拡張子>` です。例: `MyWorld_20261107-142301.mcworld`。

## 旧レイアウト

1.1.0 より前の LeviLauncher は、すべてを `%APPDATA%\<プログラム名>\`（例: `%APPDATA%\levilauncher.exe\`）に置いており、そこに `versions\`、`backups\`、`installers\`、`updates\`、`logs\` フォルダーと、`config.json`、`user_gamertag_map.json`、`gdk_pending_versions.json` ファイルがありました。インスタンスには `version.json` と `LargeLogo.ico` がありました。

LeviLauncher 1.1.0 以降は最初の起動時に、このデータを上のレイアウトへ一度だけ移行し、何も削除しません。同じドライブのデータは名前を変えて配置し、別のドライブのデータはコピーして元のものを残し、古い `config.json` は `config.migrated.json` に名前を変えます。自分で選んだデータルートはその場所に残ります。移行できないものがある場合（たとえばインスタンスからゲームが実行中のとき）、すべての手順が元に戻され、ランチャーは次回の起動まで旧レイアウトで動作します。何をどこへ移したかは `storage-migration.json` に記録され、その後デスクトップショートカットが新しい場所に更新されます。
