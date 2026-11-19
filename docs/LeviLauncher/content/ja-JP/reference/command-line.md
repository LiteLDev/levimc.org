---
platforms: [windows]
---
# コマンドライン

引数なしで `LeviLauncher.exe` を実行するとランチャーのウィンドウが開きます。コマンドを付けると、ターミナルで実行されて終了します。コマンドは `<名詞> <動詞>` の形式です。

```text
LeviLauncher.exe <command> [arguments] [flags]
```

このページには LeviLauncher 1.1.0 のすべてのコマンドを載せています。`LeviLauncher.exe help <command>` で各コマンドのフラグと例が、`LeviLauncher.exe help` で概要が表示されます。コマンドラインの出力は英語です。

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe play
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe world export "My World" -o D:\Backups
LeviLauncher.exe instance list --json
```

## シェルから実行する

`LeviLauncher.exe` はウィンドウプログラムなので、シェルは既定では終了を待ちません。プロンプトが戻る前に出力が必要なときや、終了コードが必要なときは:

- cmd では `start /wait LeviLauncher.exe ...` を使い、その後 `%ERRORLEVEL%` を読みます。
- PowerShell では出力をパイプに渡す（`LeviLauncher.exe instance list | Out-String`）か、`Start-Process -Wait -NoNewWindow` を使います。

コマンドラインはウィンドウを開かず、ウィンドウが開いている間も実行できます。

## コマンド

### 日常

| コマンド | 内容 |
| --- | --- |
| `play [<instance>]` | ゲームを起動し、ウィンドウが表示されるまで待つ（`launch` の別名） |
| `install <version\|file>` | Minecraft をダウンロードして新しいインスタンスとしてインストール（= `instance create`） |
| `use [<instance>]` | 既定のインスタンスを設定または表示 |
| `stop [<instance>\|<pid>...]` | 実行中の Minecraft を閉じる（= `process stop`） |

### インスタンスの管理

| コマンド | 内容 |
| --- | --- |
| `instance list [<filter>]` | インストール済みのインスタンスを一覧表示 |
| `instance show [<instance>]` | インスタンスの設定、登録、ローダー、プレイヤー、コンテンツ数を表示（`instance <instance>` でも可） |
| `instance create <version\|file>` | Minecraft をダウンロードして新しいインスタンスとしてインストール |
| `instance copy-data [<instance>] --from system\|<instance>` | ゲームデータ（ワールド、設定）を独自データを持つインスタンスにコピー |
| `instance rename <instance> <new-name>` | インスタンスの名前を変更 |
| `instance set [<instance>]` | インスタンスの設定を変更（コンソール、エディターモード、独自データ、引数、環境変数、ロゴ） |
| `instance remove <instance>...` | インスタンスとそのフォルダーの中身をすべて完全に削除 |
| `instance register [<instance>]` | Windows にこのインスタンスをそのチャンネルのインストール済み Minecraft として扱わせる |
| `instance unregister [<instance>]` | インスタンスの Windows への登録を解除（ゲームデータは保持） |
| `instance shortcut [<instance>]` | インスタンスを起動するデスクトップショートカットを作成、または削除 |
| `instance path [<instance>] [<kind>]` | インスタンスのフォルダーを表示（必要なら開く） |
| `mod list [<filter>]` | インスタンスの Mod を一覧表示 |
| `mod show <package>` | カタログの Mod を表示 |
| `mod search [<words>]` | LeviLamina の Mod カタログを検索 |
| `mod install <package[@version]>...` | カタログから Mod をインストール、アップグレード、ダウングレード |
| `mod update [<mod>...]` | カタログの Mod を最新版に更新 |
| `mod import <file>...` | `.mcmod`、`.zip`、`.dll` ファイルから Mod を追加 |
| `mod set <mod>` | Mod のマニフェストを変更 |
| `mod remove <mod>...` | インスタンスから Mod を削除 |
| `mod enable <mod>... \| --all` | Mod をオンにする |
| `mod disable <mod>... \| --all` | Mod を削除せずにオフにする |
| `mod path [<mod>]` | Mod のフォルダー、またはインスタンスの Mod フォルダーを表示 |
| `loader versions` | ゲームバージョンで使える LeviLamina のバージョンを一覧表示 |
| `loader install [<version>]` | インスタンスに LeviLamina をインストール、またはバージョンを変更 |
| `loader remove` | インスタンスから LeviLamina を削除 |
| `world list [<filter>]` | インスタンスとプレイヤーのワールドを一覧表示 |
| `world import <file.mcworld>...` | `.mcworld` ファイルからワールドをインポート |
| `world export <world>...` | ワールドを `.mcworld` ファイルとしてエクスポート（バックアップ） |
| `world copy <world>...` | ワールドを別のインスタンスにコピー |
| `world rename <world> <new-name>` | ワールドの表示名を変更 |
| `world get <world> [<key>[/<sub>...]]` | `level.dat` からワールド設定を読む |
| `world set <world> <key>[/<sub>...]=<value>...` | `level.dat` のワールド設定を変更 |
| `world remove <world>...` | ワールドを完全に削除 |
| `pack list [<filter>]` | リソースパック、ビヘイビアパック、スキンパックを一覧表示 |
| `pack import <file.mcpack\|file.mcaddon>...` | `.mcpack` と `.mcaddon` ファイルからパックとアドオンをインストール |
| `pack copy <pack>... \| --all` | パックを別のインスタンスにコピー |
| `pack remove <pack>...` | インストール済みのパックを削除 |
| `screenshot list` | インスタンスとプレイヤーのスクリーンショットを新しい順に一覧表示 |
| `screenshot remove <name\|path>... \| --all` | スクリーンショットを削除 |
| `server list [<filter>]` | 保存されたサーバーを一覧表示し、オンラインかどうかを確認 |
| `player list` | GDK インスタンスのプレイヤープロファイルを一覧表示 |
| `backup list [<instance>]` | インスタンスとワールドのバックアップを一覧表示（プレビュー機能） |
| `backup create [<instance>]` | インスタンスのゲームデータと Mod をバックアップ（プレビュー機能） |
| `backup restore [<instance>] <archive.zip>` | インスタンスのバックアップを復元（プレビュー機能） |

### インストールするものを探す

| コマンド | 内容 |
| --- | --- |
| `installer search [<version>]` | インストールできる Minecraft のビルドを一覧表示 |
| `installer download <version>` | ビルドのインストーラーをインストールせずにダウンロード |
| `installer list` | ダウンロード済みのインストーラーを一覧表示（未完了のダウンロードを含む） |
| `installer remove <version\|file>...` | ダウンロード済みのインストーラーを削除してディスク容量を空ける |
| `installer mirrors <version>` | GDK ビルドのダウンロードミラーを計測 |
| `curseforge search [<words>]` | CurseForge でワールド、アドオン、パック、スキンを検索（名詞の別名: `cf`） |
| `curseforge show <id>` | CurseForge のプロジェクトを表示 |
| `curseforge categories` | 絞り込みに使う CurseForge のクラスとカテゴリーを一覧表示 |
| `curseforge install <id>` | CurseForge のファイルをダウンロードしてインスタンスにインポート |

### この PC とランチャー

| コマンド | 内容 |
| --- | --- |
| `process list` | 実行中の Minecraft のプロセスを一覧表示（ランチャーが起動していないものも含む。別名: `ps`） |
| `process stop [<instance>\|<pid>...]` | 実行中の Minecraft を強制終了（最後の自動保存以降の進行状況は失われる） |
| `account status` | サインイン中の Microsoft アカウントと、所有するエディションを表示 |
| `account login` | Microsoft アカウントにサインイン、またはアカウントを切り替え |
| `account logout` | ランチャーの Microsoft アカウントを忘れる |
| `config list` | ランチャーの設定とフォルダーを一覧表示 |
| `config get <key>` | 設定の値を表示 |
| `config set <key> <value>` | 設定を変更 |
| `config unset <key>` | 設定を既定値に戻す |
| `cache clean [packages\|downloads\|partial]...` | キャッシュが使うディスク容量を空ける |
| `doctor [--fix [<fix>...]]` | この PC で Minecraft と Mod に必要なものを確認し、`--fix` で修復（`vcruntime`、`gameinput`、`loader-migration`、`developer-mode`） |
| `self-update` | LeviLauncher 自身を最新のリリースに更新 |
| `version` | バージョン情報を表示 |
| `help [<command>...]` | 任意のコマンドのヘルプと例 |

`list` の動詞はすべて `ls` でも、`remove` の動詞はすべて `rm` でも使えます。`config` が読み書きする設定は[すべての設定](./settings#command-line-keys)にあります。

### バージョンとパッケージ

- `install` と `installer` の `<version>` は `installer search` のビルドです。完全なバージョン（`1.21.50.07`）、ドット区切りの接頭辞（`1.21.50` は最新の `1.21.50.x`。`1.21.5` はこれに一致しない）、または `latest`。`<file>` はローカルの `.msixvc`、`.appx`、`.msix`、`.appxbundle`、`.msixbundle` です。
- `mod install` の `<package>` は `owner/repo`、`github.com/owner/repo`、または URL で、`#variant` と `@version` を付けられます。

## グローバルフラグ

次のフラグはすべてのコマンドで使えます。

| フラグ | 意味 |
| --- | --- |
| `-i`、`--instance <name>` | 対象のインスタンス |
| `-p`、`--player <id\|gamertag>` | プレイヤープロファイル（GDK インスタンス） |
| `--json` | 機械可読な出力を stdout に |
| `-q`、`--quiet` | 識別子だけを出力し、進行状況や通知は出さない |
| `-v`、`--verbose` | より詳しい情報と、stderr へのランチャーのログ |
| `-y`、`--yes` | 確認にはいと答える |
| `--no-input` | 一切問い合わせない |
| `-h`、`--help` | コマンドのヘルプ |
| `--version` | バージョンを表示 |

**どのインスタンスか:** `-i`、なければ環境変数 `LEVILAUNCHER_INSTANCE`、なければ既定のインスタンス（`use`）、なければ唯一のインスタンス。**どのプレイヤーか:** `-p`、なければ `LEVILAUNCHER_PLAYER`、なければ唯一のプロファイル、なければサインイン中のアカウントのプロファイル。

## 出力

- 結果は stdout に出ます。進行状況、通知、エラーは stderr に出ます。エラーは `error:` として、`hint:` と `[ERR_GAME_RUNNING]` のようなエラーコードとともに出力されます。
- `--json` は 1 つの JSON ドキュメントを出力します。一覧は配列、それ以外はオブジェクトで、キーは camelCase、時刻は RFC 3339、サイズはバイト単位です。
- `-q` は識別子だけを 1 行に 1 つずつ出力します。

## 終了コード

| コード | 意味 |
| --- | --- |
| 0 | 成功 |
| 1 | 失敗 |
| 2 | 使い方の誤り |
| 3 | 見つからない |
| 4 | 競合（ゲームが実行中など） |
| 5 | サインインまたはライセンス |
| 6 | ネットワーク |
| 7 | 一部のみ完了 |
| 8 | システムの変更または管理者権限が必要 |
| 9 | タイムアウト |
| 10 | キャンセル |
| 130 | 中断（Ctrl-C） |

`launch --wait-exit` は代わりにゲーム自身の終了コードを返します。

## ウィンドウ用の引数

次の引数は、コマンドを実行する代わりにウィンドウを開きます。

| 引数 | 効果 |
| --- | --- |
| `--launch=<instance>` | ランチャーを開いてインスタンスを起動します。デスクトップショートカットが使います。ランチャーがすでに実行中なら、そちらでインスタンスを起動します。 |
| `--debug` | ランチャーのログをコンソールウィンドウにも表示します（`debug`、`-debug`、`/debug` でも可）。 |
