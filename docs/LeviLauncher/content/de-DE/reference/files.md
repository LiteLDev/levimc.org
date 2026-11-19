---
platforms: [windows]
---
# Ordner & Dateien

Alle Dateien und Ordner, die die Windows-Version von LeviLauncher liest und schreibt, Stand LeviLauncher 1.1.0. Der Launcher schreibt nichts in den temporären Ordner des Systems (`%TEMP%`).

## Überblick

| Ordner | Ort | Inhalt |
| --- | --- | --- |
| Einstellungsordner | `%APPDATA%\LeviLauncher\` | Nur `config.json`: klein und wandert mit deinem Windows-Profil |
| Lokaler Ordner | `%LOCALAPPDATA%\LeviLauncher\` | Protokolle, das Microsoft-Konto, die WebView2-Daten des Fensters; auch das Standard-Datenstammverzeichnis |
| Datenstammverzeichnis | der lokale Ordner, sofern du keinen anderen wählst (**Basis-Stammverzeichnis** unter **Einstellungen → Allgemeine Einstellungen** oder `config set data-root`) | `Instances\`, `Backups\`, `Cache\` |

```text
%APPDATA%\LeviLauncher\
  config.json                      die Einstellungen des Launchers
%LOCALAPPDATA%\LeviLauncher\        das Standard-Datenstammverzeichnis
  Logs\startup.log                 das Launcher-Protokoll, davor startup.1.log … startup.4.log
  Accounts\                        das Microsoft-Konto und die Geräteeinträge, für deinen Windows-Benutzer verschlüsselt
  WebView2\                        die Daten des Launcher-Fensters
  storage-migration.json           der Eintrag über den Umzug aus dem alten Layout (siehe unten)
<Datenstammverzeichnis>\
  Instances\<Instanz>\             eine Instanz (siehe unten)
  Backups\
    Worlds\<Instanz>\<Ordner>_<Welt>\<Welt>_<yyyyMMdd-HHmmss>.mcworld
    Instances\<Instanz>\<Instanz>_<yyyyMMdd-HHmmss>.zip
  Cache\
    Installers\                    Spiel-Installationspakete sowie die Visual C++- und WebView2-Installer
    Updates\                       Launcher-Updates; nach der Installation gelöscht
    Downloads\                     für einen Import heruntergeladene Dateien; beim Start nach 1 Tag bereinigt
    Imports\                       an einen Import übergebene Dateien; beim Start nach 1 Tag bereinigt
    gdk-pending-versions.json
    gamertags.json                 die Gamertags der Spielerprofile, die der Launcher gesehen hat
```

Alles in `Cache\` kann gelöscht werden, ohne dass etwas verloren geht. `LeviLauncher.exe cache clean` löscht den Paket-Cache, die für Importe heruntergeladenen Dateien und unfertige Downloads, und `LeviLauncher.exe installer remove` löscht heruntergeladene Spiel-Installationspakete. Das Datenstammverzeichnis zu ändern, verweist den Launcher nur auf einen anderen Ordner: Vorhandene Instanzen, Downloads und Backups werden nicht verschoben.

## Der Ordner einer Instanz

```text
Instances\<Instanz>\
  Minecraft.Windows.exe …          die Spieldateien des Builds
  LeviLauncher.dll                 der native Loader von LeviLauncher (x64-Builds)
  .levilauncher\                   der Zustand des Launchers in der Instanz (versteckt)
    instance.json                  Name, Spielversion, Kanal, Isolierung und Startoptionen
    icon.ico                       das Symbol der Instanz, aus der LargeLogo.png des Spiels erzeugt
    xbox-auth-key-v1               eine Markierung von UWP-Instanzen für die Xbox-Anmeldung
  .lip\                            der Zustand der in der Instanz installierten Pakete (Format von lip)
  mods\                            die Mods (siehe „Wie Mods geladen werden“)
  Minecraft Bedrock\               die Spieldaten bei eingeschalteter Isolierung (Preview: Minecraft Bedrock Preview)
```

Die Spieldatenordner von Instanzen mit und ohne Isolierung beschreibt [Instanz-Isolierung](../concepts/isolation), `mods\` beschreibt [Wie Mods geladen werden](../concepts/mod-loading).

## Außerhalb der Ordner von LeviLauncher

| Pfad | Was es ist |
| --- | --- |
| `Minecraft - <Instanz>.lnk` auf deinem Desktop | Die Desktop-Verknüpfung einer Instanz (**Desktop-Verknüpfung erstellen** oder `instance shortcut`). Sie öffnet den Launcher mit `--launch=<Instanz>`. Geschrieben wird nur auf deinen eigenen Desktop, nicht auf den öffentlichen. |
| `%APPDATA%\lip\` | Die Einstellungen von lip: `config.toml`, zum Beispiel sein `github_proxy`, den auch der integrierte Paketmanager liest. |
| `%LOCALAPPDATA%\lip\Cache\` | Der Paket-Cache des integrierten Paketmanagers, derselbe wie der von lip. **Cache leeren** unter **Einstellungen → Paketverwaltung** leert ihn. |
| `%APPDATA%\Minecraft Bedrock\`, `%APPDATA%\Minecraft Bedrock Preview\` | Die gemeinsamen Spieldaten von GDK-Instanzen ohne Isolierung. |
| `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\` (Preview: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) | Die gemeinsamen Spieldaten von UWP-Instanzen ohne Isolierung. |

## Wie Dateien geschrieben werden

- Eine Datei wird neben ihrem endgültigen Ort als `<Name>.<Zufall>.tmp` geschrieben und dann an ihren Platz umbenannt, sodass nie eine halb geschriebene Datei zu sehen ist. Ein unfertiger Download, der fortgesetzt werden kann, wird als `<Name>.partial.tmp` aufbewahrt.
- Namen, die du wählst (Instanzen, Welten), werden nach den Windows-Regeln bereinigt: Die Zeichen `<>:"/\|?*` sowie Punkte und Leerzeichen am Ende werden entfernt, und reservierte Namen wie `CON` oder `NUL` werden vermieden.
- Dateien, die der Launcher erzeugt, heißen `<Name>_<yyyyMMdd-HHmmss>.<Endung>`, zum Beispiel `MyWorld_20261107-142301.mcworld`.

## Das alte Layout

LeviLauncher vor 1.1.0 legte alles in `%APPDATA%\<Programmname>\` ab (zum Beispiel `%APPDATA%\levilauncher.exe\`), mit den Ordnern `versions\`, `backups\`, `installers\`, `updates\`, `logs\` und den Dateien `config.json`, `user_gamertag_map.json` und `gdk_pending_versions.json`. Instanzen enthielten `version.json` und `LargeLogo.ico`.

Beim ersten Start zieht LeviLauncher 1.1.0 oder neuer diese Daten einmal in das obige Layout um, ohne etwas zu löschen: Daten auf demselben Laufwerk werden an ihren Platz umbenannt, Daten auf einem anderen Laufwerk werden kopiert und das Original bleibt erhalten, und die alte `config.json` wird in `config.migrated.json` umbenannt. Ein Datenstammverzeichnis, das du gewählt hattest, bleibt, wo es ist. Lässt sich etwas nicht umziehen (etwa weil das Spiel aus einer Instanz läuft), werden alle Schritte rückgängig gemacht, und der Launcher läuft bis zum nächsten Start mit dem alten Layout. `storage-migration.json` hält fest, was wohin umgezogen ist; danach werden Desktop-Verknüpfungen auf die neuen Orte aktualisiert.
