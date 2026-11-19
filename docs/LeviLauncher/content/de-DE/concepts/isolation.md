# Instanz-Isolierung

Minecraft speichert seine Welten, Pakete und Einstellungen in einem Spieldatenordner pro Gerät. Die **Instanz-Isolierung** (in der App: **Isolierung aktivieren** in den **Instanz-Einstellungen** und **Instanz-Isolierung** beim Installieren einer Version) gibt einer Instanz stattdessen einen eigenen Spieldatenordner, innerhalb der Instanz. Die Befehlszeile nennt die beiden Modi *own data* (eigene Daten) und *shared data* (gemeinsame Daten).

## Gemeinsame und eigene Daten

=== "Windows"

    Eine Instanz **ohne Isolierung** verwendet die Spieldaten, die Minecraft auf diesem PC normalerweise verwendet: dieselben Welten, Pakete und Einstellungen wie das Spiel aus dem Microsoft Store und wie jede andere Instanz derselben Art ohne Isolierung.

    Eine Instanz **mit Isolierung** speichert ihre Spieldaten in ihrem eigenen Ordner. Ihre Welten, Ressourcenpakete, Verhaltenspakete, Skin-Pakete, Screenshots, Serverliste und Spieleinstellungen sind von jeder anderen Instanz und vom Spiel aus dem Microsoft Store getrennt.

    | Instanz | Gemeinsame Daten (Isolierung aus) | Eigene Daten (Isolierung an) |
    | --- | --- | --- |
    | GDK, Release | `%APPDATA%\Minecraft Bedrock` | `<Instanz>\Minecraft Bedrock` |
    | GDK, Preview | `%APPDATA%\Minecraft Bedrock Preview` | `<Instanz>\Minecraft Bedrock Preview` |
    | UWP, Release | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<Instanz>\Minecraft Bedrock` |
    | UWP, Preview | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState` | `<Instanz>\Minecraft Bedrock Preview` |
    | UWP, Beta | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<Instanz>\Minecraft Bedrock Beta` |

    `<Instanz>` ist der Ordner der Instanz in `Instances` (siehe [Ordner & Dateien](../reference/files)). In einem GDK-Datenordner legt das Spiel die Daten jedes Spielers unter `Users\` ab (siehe [Spielerprofile](./instances#player-profiles)); in einem UWP-Datenordner unter `games\com.mojang\`.

=== "Android"

    Die Versionsisolierung hält die Spieldaten einer Version (Welten, Pakete und Einstellungen) von den anderen Versionen und vom aus Google Play installierten Minecraft getrennt. Änderst du sie für eine Instanz, sind andere Instanzen nicht betroffen. Importierte Versionen brauchen zum Starten oft die Isolierung.

## Wie es funktioniert <Badge platform="windows" />

Das Spiel selbst weiß nichts von Instanzen. Wenn LeviLauncher eine Instanz installiert, legt es seinen Loader `LeviLauncher.dll` neben die ausführbare Datei des Spiels (siehe [Wie Mods geladen werden](./mod-loading)). Startet das Spiel mit eingeschalteter Isolierung, leitet der Loader die Ordner, in denen das Spiel seine Daten sucht (die Anwendungsdatenordner und den temporären Ordner), auf den Datenordner der Instanz um. Nichts wird kopiert oder verknüpft: Das Spiel liest und schreibt einfach dort.

Was die Isolierung nicht ändert:

- **Mods** gehören immer zu einer Instanz und liegen in ihrem Ordner `mods\`, mit oder ohne Isolierung.
- **Das Microsoft-Konto** und die Einstellungen des Launchers selbst sind für alle Instanzen gleich.
- Die **Registrierung** bei Windows (siehe [Instanzen & Spielversionen](./instances#registration-with-windows)) ist unabhängig von der Isolierung.

## Grenzen <Badge platform="windows" />

- GDK-Instanzen unterstützen die Isolierung in allen Versionen, UWP-Instanzen ab Version 1.19.70.2 und nur unter x64.
- Das Einschalten der Isolierung kopiert nichts: Die Instanz beginnt mit leeren Spieldaten. Um mit vorhandenen Daten zu beginnen, wähle beim Installieren der Version, Daten zu kopieren (vom auf diesem PC installierten Spiel oder von einer anderen isolierten Instanz desselben Typs), oder kopiere sie später mit `LeviLauncher.exe instance copy-data` (GDK).
- Schaltest du die Isolierung aus, verwendet die Instanz wieder die gemeinsamen Daten; ihr eigener Datenordner bleibt im Instanzordner.
- Das Entfernen einer Instanz löscht ihren Ordner, **einschließlich der Welten ihrer eigenen Daten**. Sichere wichtige Welten vorher (siehe [Welt-Tools](../guide/world-tools)).
- Inhalte lassen sich von einer Instanz in eine andere nur kopieren, wenn das Ziel eigene Daten hat oder eine UWP-Instanz ist, die nicht denselben Datenordner verwendet.

## Wann du sie verwenden solltest

Isolierung ist nützlich, wenn du Folgendes möchtest:

- unterschiedliche Inhalte für unterschiedliche Versionen
- sichereres Testen von Mods oder Minecraft-Preview-Builds
- weniger Risiko, dass eine Umgebung eine andere beeinflusst

Eine bewährte Aufteilung: eine isolierte Release-Instanz zum normalen Spielen, eine isolierte Preview-Instanz nur bei Bedarf und eine temporäre Testinstanz für Mods oder die Fehlersuche.

## Verwandte Seiten

- [Versionsverwaltung](../guide/version-management)
- [Inhaltsverwaltung](../guide/content-management)
- [Instanzen & Spielversionen](./instances)
