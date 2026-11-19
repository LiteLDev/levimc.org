# Mod の読み込み

Minecraft Bedrock 自体には Mod の仕組みがありません。Mod はネイティブコードで、ゲームの起動時にローダーがゲームのプロセスへ読み込みます。このページでは、LeviLauncher が使うローダー、Mod の置き場所、そして Mod を追加するいくつかの方法の関係を説明します。

## Mod の置き場所 <Badge platform="windows" />

どのインスタンスにも `mods\` フォルダーがあります（[フォルダーとファイル](../reference/files)を参照）。各 Mod はその中の 1 つのフォルダーで、Mod を説明する `manifest.json` を持ちます。

| フィールド | 意味 |
| --- | --- |
| `name` | Mod の名前。 |
| `entry` | ローダーが読み込むファイル。Mod のフォルダーからの相対パス（`.dll`）。 |
| `version` | Mod のバージョン。 |
| `type` | どのローダーが読み込むか。`preload-native` は LeviLauncher のネイティブローダー用、LeviLamina 用の Mod には独自の種類があります。 |
| `author` | 作者（省略可）。 |

Mod は 1 つのインスタンスに属します。ゲームデータだけに関わる[隔離](./isolation)の影響は受けません。

**Mod をオフにする**（**Mod管理** で、または `LeviLauncher.exe mod disable`）と、その `manifest.json` の名前が `manifest.json.close` に変わり、オンにすると元に戻ります。Mod のファイルはそのまま残り、`manifest.json` を探すローダーからはその Mod が見えなくなります。

## 2 つのローダー <Badge platform="windows" />

### LeviLauncher のネイティブローダー

LeviLauncher はインスタンスをインストールまたは準備するとき、自身のローダー `LeviLauncher.dll` をゲームの実行ファイルの横に置き、実行ファイルのインポートに追加して、Windows がゲームと一緒に読み込むようにします。これは x64 ビルドで、GDK でも UWP でも同じように働きます。[隔離](./isolation)もこの仕組みで動いています。

ゲームが起動すると、ネイティブローダーは `mods\` 内のフォルダーを名前順に調べ、`type` が `preload-native` の各 Mod の `entry` を読み込みます。`manifest.json` のないフォルダーとほかの種類の Mod は飛ばします。インスタンスに別のプリローダー（ゲームの横の `preloader.dll`）がある場合、ネイティブローダーは Mod の読み込みをすべてそちらに任せます。ネイティブローダーには Visual C++ ランタイム（x64）が必要で、LeviLauncher がその有無を確認してインストールを提案します。

### LeviLamina

[LeviLamina](https://levimc.org/LeviLamina/) は LeviMC の Mod ローダーです。[LeviMC Mods](https://levimc.org/mods/) の Mod の多くは LeviLamina の Mod で、インスタンスのゲームバージョンに対応したバージョンの LeviLamina が必要です。LeviLauncher は、対応バージョンの GDK インスタンスに LeviLamina を内蔵パッケージマネージャーのパッケージとしてインストールします（バージョンのインストール時の **LeviLamina をインストール** スイッチ、または **インスタンス設定** の **ローダー** タブ）。

## Mod を追加する 3 つの方法 <Badge platform="windows" />

| 追加するもの | LeviLauncher の動作 |
| --- | --- |
| **LeviMC Mods** の Mod（または `mod install owner/repo`） | [lip](https://github.com/LiteLDev/lip) 互換の内蔵パッケージマネージャーでパッケージとしてインストールします。このプラットフォーム向けのリリースをダウンロードし、依存するパッケージをインストールし、インスタンスの `.lip\state.json` に記録します。Mod が LeviLamina を必要とし、インストール済みのものが合わない（または未インストールの）場合は、先に互換性のある LeviLamina をインストールします。こうして入れた Mod はパッケージとして更新・削除できます。 |
| `.mcmod` パッケージ（または `.zip`） | `mods\` 内の新しいフォルダーに展開します。アーカイブには `manifest.json` が必要です。 |
| 単体の `.dll` | `mods\` 内の新しいフォルダーに置き、`manifest.json` を書きます。既定では、ファイル名を名前に、`preload-native` を種類に、`0.0.0` をバージョンにします。 |

パッケージは、`lip.toml` と `.lip\state.json` の中で `side`（`client` または `server`）と `platform`（`win-x64` など）によって動作する場所を示します。クライアントには、LeviLauncher は Mod に `client` バリアントがあればそれを、なければ既定のバリアントをインストールします。古いパッケージの移行を含む詳細は[Mod と統合](../guide/mods-integrations)を参照してください。

## Android <Badge platform="android" />

Android 版はネイティブ Mod、つまりゲームのプロセスで動く `.so` ライブラリを読み込みます。Mod を入れた環境は隔離したバージョンにまとめ、信頼できる入手元の Mod だけをインストールしてください。自分で作る場合は、LeviLamina のドキュメントの [Android native mods](https://levimc.org/LeviLamina/developer_guides/android/) に従ってください。

## 関連ページ

- [Mod と統合](../guide/mods-integrations)
- [インスタンスとゲームバージョン](./instances)
- [コマンドライン](../reference/command-line)
