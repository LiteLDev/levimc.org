---
platforms: [android]
---
# Quick Launch URIs

**Quick Launch** in the Android version starts Minecraft with a `minecraft://` URI, which tells the game what to open first. Each action of the Quick Launch screen builds one of the URIs below; **Custom URI** takes any URI that starts with `minecraft://`. What the game does with a URI is up to Minecraft.

LeviLauncher also opens `minecraft://` links from other apps: Android offers it as one of the apps that can open them.

## Actions

| Action | URI | Asks for |
| --- | --- | --- |
| **How to Play** | `minecraft://?showHowToPlayScreen=1` | — |
| **Servers Tab** | `minecraft://openServersTab` | — |
| **Profile / Dressing Room** | `minecraft://showProfileScreen` | — |
| **Marketplace Home** | `minecraft://openStore` | — |
| **Minecoins** | `minecraft://?showMineCoinOffers=1` | — |
| **Marketplace Pass** | `minecraft://?openCsbPDPScreen=<tab>` | The tab: `Home`, `Content`, `Faq` or `Subscribe` |
| **Connect to Server** | `minecraft://connect/?serverUrl=<address>&serverPort=<port>` | The server's address and port (default `19132`) |
| **Add External Server** | `minecraft://?addExternalServer=<name>\|<address>:<port>` | A name, the address and the port (default `19132`) |
| **Join Realm** | `minecraft://acceptRealmInvite?inviteID=<code>` | The Realm invite code |
| **Load World** | `minecraft://connect/?localWorld=<world>` | The name of a local world |
| **Execute Command** | `minecraft://?slashcommand=<command>` | A command to run in the game |
| **Custom URI** | any `minecraft://…` | The URI |

The server name, the world name and the command are URL-encoded (a space becomes `%20`, `/` becomes `%2F`).

## Example

To join a server at `play.example.org` on port `19132`, choose **Connect to Server**, or open this link on the device:

```text
minecraft://connect/?serverUrl=play.example.org&serverPort=19132
```

See [Accounts & Quick Launch](../guide/accounts-quick-launch) for the rest of the Android-only features.
