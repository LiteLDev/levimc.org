# Wie Mods geladen werden

Minecraft Bedrock unterstützt von sich aus keine Mods: Ein Mod ist nativer Code, den ein Loader beim Start des Spiels in den Spielprozess bringt. Diese Seite erklärt, welche Loader LeviLauncher verwendet, wo Mods liegen und wie die verschiedenen Wege, einen Mod hinzuzufügen, zusammenpassen.

## Wo Mods liegen <Badge platform="windows" />

Jede Instanz hat einen Ordner `mods\` (siehe [Ordner & Dateien](../reference/files)). Jeder Mod ist ein Ordner darin, mit einer `manifest.json`, die den Mod beschreibt:

| Feld | Bedeutung |
| --- | --- |
| `name` | Der Name des Mods. |
| `entry` | Die Datei, die der Loader lädt, relativ zum Ordner des Mods (eine `.dll`). |
| `version` | Die Version des Mods. |
| `type` | Welcher Loader ihn lädt: `preload-native` für den nativen Loader von LeviLauncher; Mods für LeviLamina haben eigene Typen. |
| `author` | Wer ihn gemacht hat (optional). |

Mods gehören zu einer Instanz. Die [Isolierung](./isolation) betrifft sie nicht, sie betrifft nur Spieldaten.

**Einen Mod ausschalten** (in **Mods verwalten** oder mit `LeviLauncher.exe mod disable`) benennt seine `manifest.json` in `manifest.json.close` um; Einschalten benennt sie zurück. Die Dateien des Mods bleiben, wo sie sind, und ein Loader, der nach `manifest.json` sucht, findet den Mod nicht mehr.

## Die zwei Loader <Badge platform="windows" />

### Der native Loader von LeviLauncher

Wenn LeviLauncher eine Instanz installiert oder vorbereitet, legt es seinen Loader `LeviLauncher.dll` neben die ausführbare Datei des Spiels und trägt ihn in deren Importe ein, damit Windows ihn mit dem Spiel lädt. Das funktioniert für x64-Builds, GDK wie UWP; darauf beruht auch die [Isolierung](./isolation).

Beim Start des Spiels geht der native Loader die Ordner in `mods\` in der Reihenfolge ihrer Namen durch und lädt den `entry` jedes Mods, dessen `type` `preload-native` ist. Ordner ohne `manifest.json` und Mods anderer Typen werden übersprungen. Hat die Instanz einen anderen Preloader (eine `preloader.dll` neben dem Spiel), überlässt ihm der native Loader das gesamte Laden der Mods. Der native Loader braucht die Visual C++-Laufzeit (x64), die LeviLauncher prüft und zur Installation anbietet.

### LeviLamina

[LeviLamina](https://levimc.org/LeviLamina/) ist der Mod-Loader von LeviMC. Die meisten Mods auf [LeviMC Mods](https://levimc.org/mods/) sind LeviLamina-Mods: Sie brauchen LeviLamina in einer Version, die die Spielversion der Instanz unterstützt. LeviLauncher installiert LeviLamina auf GDK-Instanzen der unterstützten Versionen (der Schalter **LeviLamina installieren** beim Installieren einer Version oder der Tab **Loader** der **Instanz-Einstellungen**), als Paket seines integrierten Paketmanagers.

## Drei Wege, einen Mod hinzuzufügen <Badge platform="windows" />

| Du fügst hinzu | Was LeviLauncher tut |
| --- | --- |
| Einen Mod aus **LeviMC Mods** (oder `mod install owner/repo`) | Installiert ihn als Paket mit dem integrierten, [lip](https://github.com/LiteLDev/lip)-kompatiblen Paketmanager: Es lädt das Release für diese Plattform herunter, installiert die Pakete, von denen er abhängt, und trägt ihn in die `.lip\state.json` der Instanz ein. Braucht der Mod LeviLamina und passt die installierte nicht (oder ist keine installiert), wird zuerst eine kompatible LeviLamina installiert. Solche Mods lassen sich als Pakete aktualisieren und entfernen. |
| Ein `.mcmod`-Paket (oder eine `.zip`) | Entpackt es in einen neuen Ordner in `mods\`. Das Archiv muss eine `manifest.json` enthalten. |
| Eine einzelne `.dll` | Legt sie in einen neuen Ordner in `mods\` und schreibt eine `manifest.json` dafür: standardmäßig den Dateinamen als Name, `preload-native` als Typ und `0.0.0` als Version. |

Ein Paket gibt mit `side` (`client` oder `server`) und `platform` (etwa `win-x64`) an, wo es läuft, in seiner `lip.toml` und in `.lip\state.json`. Für den Client installiert LeviLauncher die `client`-Variante eines Mods, wenn es eine gibt, sonst seine Standardvariante. Einzelheiten, auch zur Migration älterer Pakete, findest du unter [Mods & Integrationen](../guide/mods-integrations).

## Android <Badge platform="android" />

Die Android-Version lädt native Mods: `.so`-Bibliotheken, die im Spielprozess laufen. Halte gemoddete Umgebungen in isolierten Versionen und installiere nur Mods aus vertrauenswürdigen Quellen. Wenn du selbst einen bauen willst, folge [Android native mods](https://levimc.org/LeviLamina/developer_guides/android/) in der LeviLamina-Dokumentation.

## Verwandte Seiten

- [Mods & Integrationen](../guide/mods-integrations)
- [Instanzen & Spielversionen](./instances)
- [Befehlszeile](../reference/command-line)
