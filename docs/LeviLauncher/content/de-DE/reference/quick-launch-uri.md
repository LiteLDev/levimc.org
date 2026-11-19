---
platforms: [android]
---
# Schnellstart-URIs

**Quick Launch** (Schnellstart) in der Android-Version startet Minecraft mit einer `minecraft://`-URI, die dem Spiel sagt, was es zuerst öffnen soll. Jede Aktion des Schnellstart-Bildschirms erzeugt eine der URIs unten; **Custom URI** nimmt jede URI an, die mit `minecraft://` beginnt. Was das Spiel mit einer URI macht, entscheidet Minecraft. Die Aktionen heißen in der App so wie in der englischen Oberfläche; die Übersetzung steht in Klammern.

LeviLauncher öffnet auch `minecraft://`-Links aus anderen Apps: Android bietet es als eine der Apps an, die sie öffnen können.

## Aktionen

| Aktion | URI | Fragt nach |
| --- | --- | --- |
| **How to Play** (Spielanleitung) | `minecraft://?showHowToPlayScreen=1` | — |
| **Servers Tab** (Server-Tab) | `minecraft://openServersTab` | — |
| **Profile / Dressing Room** (Profil / Umkleide) | `minecraft://showProfileScreen` | — |
| **Marketplace Home** (Marktplatz-Startseite) | `minecraft://openStore` | — |
| **Minecoins** | `minecraft://?showMineCoinOffers=1` | — |
| **Marketplace Pass** | `minecraft://?openCsbPDPScreen=<tab>` | Dem Tab: `Home`, `Content`, `Faq` oder `Subscribe` |
| **Connect to Server** (Mit Server verbinden) | `minecraft://connect/?serverUrl=<Adresse>&serverPort=<Port>` | Adresse und Port des Servers (Standard `19132`) |
| **Add External Server** (Externen Server hinzufügen) | `minecraft://?addExternalServer=<Name>\|<Adresse>:<Port>` | Einem Namen, der Adresse und dem Port (Standard `19132`) |
| **Join Realm** (Realm beitreten) | `minecraft://acceptRealmInvite?inviteID=<Code>` | Dem Einladungscode des Realms |
| **Load World** (Welt laden) | `minecraft://connect/?localWorld=<Welt>` | Dem Namen einer lokalen Welt |
| **Execute Command** (Befehl ausführen) | `minecraft://?slashcommand=<Befehl>` | Einem Befehl, der im Spiel ausgeführt wird |
| **Custom URI** (Eigene URI) | beliebige `minecraft://…` | Der URI |

Servername, Weltname und Befehl werden URL-kodiert (ein Leerzeichen wird zu `%20`, `/` zu `%2F`).

## Beispiel

Um einem Server auf `play.example.org` mit Port `19132` beizutreten, wähle **Connect to Server** oder öffne diesen Link auf dem Gerät:

```text
minecraft://connect/?serverUrl=play.example.org&serverPort=19132
```

Die übrigen Funktionen nur für Android findest du unter [Konten & Schnellstart](../guide/accounts-quick-launch).
