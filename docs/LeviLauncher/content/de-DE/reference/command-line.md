---
platforms: [windows]
---
# Befehlszeile

`LeviLauncher.exe` ohne Argumente öffnet das Launcher-Fenster. Mit einem Befehl läuft es im Terminal und beendet sich danach; die Befehle folgen dem Schema `<Nomen> <Verb>`:

```text
LeviLauncher.exe <command> [arguments] [flags]
```

Diese Seite listet alle Befehle von LeviLauncher 1.1.0. `LeviLauncher.exe help <command>` gibt die Optionen und Beispiele jedes Befehls aus, `LeviLauncher.exe help` die Übersicht. Die Ausgabe der Befehlszeile ist englisch.

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe play
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe world export "My World" -o D:\Backups
LeviLauncher.exe instance list --json
```

## Aus einer Shell ausführen

`LeviLauncher.exe` ist ein Fensterprogramm, deshalb warten Shells standardmäßig nicht darauf. Wenn du seine Ausgabe brauchst, bevor die Eingabeaufforderung zurückkehrt, oder seinen Exit-Code:

- in cmd `start /wait LeviLauncher.exe ...` verwenden und danach `%ERRORLEVEL%` lesen;
- in PowerShell die Ausgabe weiterleiten (`LeviLauncher.exe instance list | Out-String`) oder `Start-Process -Wait -NoNewWindow` verwenden.

Die Befehlszeile öffnet kein Fenster und kann laufen, während das Fenster offen ist.

## Befehle

### Alltag

| Befehl | Was er tut |
| --- | --- |
| `play [<instance>]` | Startet das Spiel und wartet, bis sein Fenster erscheint (Alias von `launch`) |
| `install <version\|file>` | Lädt Minecraft herunter und installiert es als neue Instanz (= `instance create`) |
| `use [<instance>]` | Legt die Standardinstanz fest oder zeigt sie an |
| `stop [<instance>\|<pid>...]` | Schließt ein laufendes Minecraft (= `process stop`) |

### Eine Instanz verwalten

| Befehl | Was er tut |
| --- | --- |
| `instance list [<filter>]` | Listet die installierten Instanzen |
| `instance show [<instance>]` | Zeigt Einstellungen, Registrierung, Loader, Spieler und Inhaltszahlen einer Instanz (auch `instance <instance>`) |
| `instance create <version\|file>` | Lädt Minecraft herunter und installiert es als neue Instanz |
| `instance copy-data [<instance>] --from system\|<instance>` | Kopiert Spieldaten (Welten, Einstellungen) in eine Instanz mit eigenen Daten |
| `instance rename <instance> <new-name>` | Benennt eine Instanz um |
| `instance set [<instance>]` | Ändert Instanzeinstellungen (Konsole, Editor-Modus, eigene Daten, Argumente, Umgebung, Logo) |
| `instance remove <instance>...` | Löscht Instanzen und alles in ihren Ordnern endgültig |
| `instance register [<instance>]` | Lässt Windows diese Instanz als das installierte Minecraft ihres Kanals behandeln |
| `instance unregister [<instance>]` | Hebt die Windows-Registrierung der Instanz auf (Spieldaten bleiben erhalten) |
| `instance shortcut [<instance>]` | Erstellt eine Desktop-Verknüpfung, die die Instanz startet, oder entfernt sie |
| `instance path [<instance>] [<kind>]` | Gibt einen Ordner einer Instanz aus (und öffnet ihn auf Wunsch) |
| `mod list [<filter>]` | Listet die Mods einer Instanz |
| `mod show <package>` | Zeigt einen Mod des Katalogs |
| `mod search [<words>]` | Durchsucht den LeviLamina-Mod-Katalog |
| `mod install <package[@version]>...` | Installiert, aktualisiert oder downgradet Mods aus dem Katalog |
| `mod update [<mod>...]` | Aktualisiert Katalog-Mods auf ihre neueste Version |
| `mod import <file>...` | Fügt Mods aus `.mcmod`-, `.zip`- oder `.dll`-Dateien hinzu |
| `mod set <mod>` | Ändert das Manifest eines Mods |
| `mod remove <mod>...` | Entfernt Mods aus einer Instanz |
| `mod enable <mod>... \| --all` | Schaltet Mods ein |
| `mod disable <mod>... \| --all` | Schaltet Mods aus, ohne sie zu entfernen |
| `mod path [<mod>]` | Gibt den Ordner eines Mods oder der Mods der Instanz aus |
| `loader versions` | Listet die LeviLamina-Versionen, die für eine Spielversion verfügbar sind |
| `loader install [<version>]` | Installiert LeviLamina in einer Instanz oder ändert seine Version |
| `loader remove` | Entfernt LeviLamina aus einer Instanz |
| `world list [<filter>]` | Listet die Welten einer Instanz und eines Spielers |
| `world import <file.mcworld>...` | Importiert Welten aus `.mcworld`-Dateien |
| `world export <world>...` | Exportiert (sichert) Welten als `.mcworld`-Dateien |
| `world copy <world>...` | Kopiert Welten in eine andere Instanz |
| `world rename <world> <new-name>` | Ändert den Anzeigenamen einer Welt |
| `world get <world> [<key>[/<sub>...]]` | Liest Welteinstellungen aus `level.dat` |
| `world set <world> <key>[/<sub>...]=<value>...` | Ändert Welteinstellungen in `level.dat` |
| `world remove <world>...` | Löscht Welten endgültig |
| `pack list [<filter>]` | Listet Ressourcen-, Verhaltens- und Skin-Pakete |
| `pack import <file.mcpack\|file.mcaddon>...` | Installiert Pakete und Add-ons aus `.mcpack`- und `.mcaddon`-Dateien |
| `pack copy <pack>... \| --all` | Kopiert Pakete in eine andere Instanz |
| `pack remove <pack>...` | Löscht installierte Pakete |
| `screenshot list` | Listet die Screenshots einer Instanz und eines Spielers, die neuesten zuerst |
| `screenshot remove <name\|path>... \| --all` | Löscht Screenshots |
| `server list [<filter>]` | Listet die gespeicherten Server und prüft, ob sie online sind |
| `player list` | Listet die Spielerprofile einer GDK-Instanz |
| `backup list [<instance>]` | Listet Instanz- und Welt-Backups (Vorschau) |
| `backup create [<instance>]` | Sichert die Spieldaten und Mods einer Instanz (Vorschau) |
| `backup restore [<instance>] <archive.zip>` | Stellt ein Instanz-Backup wieder her (Vorschau) |

### Etwas zum Installieren finden

| Befehl | Was er tut |
| --- | --- |
| `installer search [<version>]` | Listet die Minecraft-Builds, die installiert werden können |
| `installer download <version>` | Lädt das Installationspaket eines Builds herunter, ohne es zu installieren |
| `installer list` | Listet heruntergeladene Installationspakete, auch unfertige Downloads |
| `installer remove <version\|file>...` | Löscht heruntergeladene Installationspakete, um Speicherplatz freizugeben |
| `installer mirrors <version>` | Misst die Download-Spiegel eines GDK-Builds |
| `curseforge search [<words>]` | Durchsucht CurseForge nach Welten, Add-ons, Paketen und Skins (Alias des Nomens: `cf`) |
| `curseforge show <id>` | Zeigt ein CurseForge-Projekt |
| `curseforge categories` | Listet die CurseForge-Klassen und -Kategorien zum Filtern |
| `curseforge install <id>` | Lädt eine CurseForge-Datei herunter und importiert sie in eine Instanz |

### Dieser PC und der Launcher

| Befehl | Was er tut |
| --- | --- |
| `process list` | Listet laufende Minecraft-Prozesse, auch solche, die nicht der Launcher gestartet hat (Alias: `ps`) |
| `process stop [<instance>\|<pid>...]` | Beendet laufendes Minecraft zwangsweise (Fortschritt seit der letzten automatischen Speicherung geht verloren) |
| `account status` | Zeigt das angemeldete Microsoft-Konto und welche Editionen es besitzt |
| `account login` | Meldet sich bei einem Microsoft-Konto an oder wechselt das Konto |
| `account logout` | Vergisst das Microsoft-Konto des Launchers |
| `config list` | Listet Launcher-Einstellungen und Ordner |
| `config get <key>` | Gibt den Wert einer Einstellung aus |
| `config set <key> <value>` | Ändert eine Einstellung |
| `config unset <key>` | Setzt eine Einstellung auf ihren Standardwert zurück |
| `cache clean [packages\|downloads\|partial]...` | Gibt Speicherplatz frei, den Caches belegen |
| `doctor [--fix [<fix>...]]` | Prüft, was Minecraft und Mods auf diesem PC brauchen; `--fix` repariert es (`vcruntime`, `gameinput`, `loader-migration`, `developer-mode`) |
| `self-update` | Aktualisiert LeviLauncher selbst auf das neueste Release |
| `version` | Gibt Versionsinformationen aus |
| `help [<command>...]` | Hilfe zu jedem Befehl, mit Beispielen |

Jedes `list`-Verb versteht auch `ls`, jedes `remove`-Verb auch `rm`. Die Einstellungen, die `config` liest und ändert, stehen unter [Alle Einstellungen](./settings#command-line-keys).

### Versionen und Pakete

- `<version>` von `install` und `installer` ist ein Build aus `installer search`: exakt (`1.21.50.07`), ein Präfix mit Punkten (`1.21.50` ist das neueste `1.21.50.x`; `1.21.5` passt nicht darauf) oder `latest`. `<file>` ist eine lokale `.msixvc`, `.appx`, `.msix`, `.appxbundle` oder `.msixbundle`.
- `<package>` von `mod install` ist `owner/repo`, `github.com/owner/repo` oder eine URL, optional mit `#variant` und `@version`.

## Globale Optionen

Diese Optionen funktionieren mit jedem Befehl:

| Option | Bedeutung |
| --- | --- |
| `-i`, `--instance <name>` | Die Instanz, auf die sich der Befehl bezieht |
| `-p`, `--player <id\|gamertag>` | Das Spielerprofil, bei GDK-Instanzen |
| `--json` | Maschinenlesbare Ausgabe auf stdout |
| `-q`, `--quiet` | Nur Bezeichner ausgeben; keine Fortschritte oder Hinweise |
| `-v`, `--verbose` | Mehr Details und das Launcher-Protokoll auf stderr |
| `-y`, `--yes` | Bestätigungen mit Ja beantworten |
| `--no-input` | Nie nachfragen |
| `-h`, `--help` | Hilfe zu einem Befehl |
| `--version` | Die Version ausgeben |

**Welche Instanz:** `-i`, sonst die Umgebungsvariable `LEVILAUNCHER_INSTANCE`, sonst die Standardinstanz (`use`), sonst die einzige Instanz. **Welcher Spieler:** `-p`, sonst `LEVILAUNCHER_PLAYER`, sonst das einzige Profil, sonst das Profil des angemeldeten Kontos.

## Ausgabe

- Ergebnisse gehen nach stdout. Fortschritt, Hinweise und Fehler gehen nach stderr; ein Fehler wird als `error:` ausgegeben, mit einem `hint:` und einem Fehlercode wie `[ERR_GAME_RUNNING]`.
- `--json` gibt ein einziges JSON-Dokument aus: ein Array für Listen, sonst ein Objekt, mit Schlüsseln in camelCase, Zeiten in RFC 3339 und Größen in Bytes.
- `-q` gibt nur Bezeichner aus, einen pro Zeile.

## Exit-Codes

| Code | Bedeutung |
| --- | --- |
| 0 | OK |
| 1 | Fehlgeschlagen |
| 2 | Falsche Verwendung |
| 3 | Nicht gefunden |
| 4 | Konflikt (zum Beispiel läuft das Spiel) |
| 5 | Anmeldung oder Lizenz |
| 6 | Netzwerk |
| 7 | Teilweise erledigt |
| 8 | Erfordert eine Systemänderung oder Administratorrechte |
| 9 | Zeitüberschreitung |
| 10 | Abgebrochen |
| 130 | Unterbrochen (Strg+C) |

`launch --wait-exit` gibt stattdessen den Exit-Code des Spiels selbst zurück.

## Fenster-Argumente

Diese Argumente öffnen das Fenster, statt einen Befehl auszuführen:

| Argument | Wirkung |
| --- | --- |
| `--launch=<instance>` | Öffnet den Launcher und startet die Instanz; Desktop-Verknüpfungen verwenden es. Läuft der Launcher bereits, startet er die Instanz dort. |
| `--debug` | Zeigt das Launcher-Protokoll zusätzlich in einem Konsolenfenster (`debug`, `-debug` und `/debug` funktionieren ebenfalls). |
