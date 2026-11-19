---
platforms: [android]
---
# クイック起動 URI

Android 版の **クイック起動** は、`minecraft://` URI で Minecraft を起動し、最初に何を開くかをゲームに伝えます。クイック起動画面の各アクションは下のいずれかの URI を作ります。**カスタム URI** は `minecraft://` で始まる任意の URI を受け付けます。URI をどう扱うかは Minecraft 次第です。

LeviLauncher はほかのアプリの `minecraft://` リンクも開けます。Android は、そのリンクを開けるアプリの 1 つとして LeviLauncher を示します。

## アクション

| アクション | URI | 入力するもの |
| --- | --- | --- |
| **遊び方** | `minecraft://?showHowToPlayScreen=1` | — |
| **サーバータブ** | `minecraft://openServersTab` | — |
| **プロフィール / 更衣室** | `minecraft://showProfileScreen` | — |
| **マーケットプレイスのホーム** | `minecraft://openStore` | — |
| **Minecoins** | `minecraft://?showMineCoinOffers=1` | — |
| **マーケットプレイス パス** | `minecraft://?openCsbPDPScreen=<tab>` | タブ: `Home`、`Content`、`Faq`、`Subscribe` |
| **サーバーに接続** | `minecraft://connect/?serverUrl=<アドレス>&serverPort=<ポート>` | サーバーのアドレスとポート（既定 `19132`） |
| **外部サーバーを追加** | `minecraft://?addExternalServer=<名前>\|<アドレス>:<ポート>` | 名前、アドレス、ポート（既定 `19132`） |
| **Realm に参加** | `minecraft://acceptRealmInvite?inviteID=<コード>` | Realm の招待コード |
| **ワールドをロード** | `minecraft://connect/?localWorld=<ワールド>` | ローカルワールドの名前 |
| **コマンドを実行** | `minecraft://?slashcommand=<コマンド>` | ゲーム内で実行するコマンド |
| **カスタム URI** | 任意の `minecraft://…` | URI |

サーバー名、ワールド名、コマンドは URL エンコードされます（空白は `%20`、`/` は `%2F` になります）。

## 例

`play.example.org` のポート `19132` のサーバーに参加するには、**サーバーに接続** を選ぶか、デバイスで次のリンクを開きます。

```text
minecraft://connect/?serverUrl=play.example.org&serverPort=19132
```

そのほかの Android 版だけの機能は[アカウントとクイック起動](../guide/accounts-quick-launch)を参照してください。
