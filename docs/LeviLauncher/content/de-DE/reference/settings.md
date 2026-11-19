---
platforms: [windows]
---
# Alle Einstellungen

Jede Einstellung der Seite **Einstellungen** der Windows-Version, Tab für Tab, Stand LeviLauncher 1.1.0, mit dem `config`-Schlüssel, der sie über die [Befehlszeile](./command-line) ändert, sofern es einen gibt. Das Suchfeld oben auf der Seite findet eine Einstellung über ihren Namen. Tipps, was du ändern solltest, findest du unter [Einstellungen & Personalisierung](../guide/settings-personalization).

## Allgemeine Einstellungen

| Einstellung | Was sie tut | Schlüssel |
| --- | --- | --- |
| **Inhaltspfade → Basis-Stammverzeichnis** | Das Datenstammverzeichnis: der Ordner mit den Instanzen, Downloads und Backups (siehe [Ordner & Dateien](./files)). **Anwenden** speichert einen neuen Ordner, **Zurücksetzen** kehrt zum Standard zurück. Darunter werden die Ordner **Installers** und **Versionen** angezeigt. Vorhandene Daten werden nicht verschoben. | `data-root` |
| **Sprache** | Die Sprache des Launchers. | — |
| **Discord Rich Presence** | Zeigt deinen Spielstatus auf Discord. Standardmäßig an. | `discord` |
| **Beim Start von Minecraft** | Was der Launcher tut, wenn Minecraft startet: **Launcher minimieren** (Standard), **Launcher ausblenden**, **Launcher schließen** oder **Launcher geöffnet lassen**. | `on-game-launch` |
| **Beim Beenden von Minecraft** | Was der Launcher tut, wenn Minecraft beendet wird: **Launcher wieder öffnen** (Standard), **Nichts tun** oder **Launcher schließen**. | `on-game-exit` |
| **Beim Schließen ins Tray ausblenden** | Die Schließen-Schaltfläche blendet den Launcher in den Infobereich aus, statt ihn zu beenden; die Minimieren-Schaltfläche minimiert weiterhin in die Taskleiste. Standardmäßig aus. | `close-to-tray` |

## Personalisierung

Der Tab hat vier Teile. Personalisierungseinstellungen (Farben, Deckkraft usw.) werden für das helle und das dunkle Design getrennt gespeichert (**Einstellungen je Modus**): Wähle **Hellmodus** oder **Dunkelmodus**, um eines davon zu bearbeiten.

### Design und Farben

| Einstellung | Was sie tut |
| --- | --- |
| **Design-Modus** | **Hellmodus**, **Dunkelmodus**, **Manueller Zeitplan** (dunkel zwischen einer **Startzeit Dunkelmodus** und einer **Endzeit Dunkelmodus**), **Sonnenaufgang/Sonnenuntergang** (nach den örtlichen Zeiten von Sonnenaufgang und -untergang, auf dem Gerät berechnet) oder **System folgen** (die Windows-Einstellung). |
| **Designfarbe** | Die Akzentfarbe: eine der **Voreingestellten Farben**, eine der **Weiteren Farben** oder eine **Benutzerdefinierte Farbe**. |
| **Basismodus** | Eine Volltonfarbe unter dem Hintergrundbild, für mehr Kontrast: **Keine**, **Designfarbe folgen** oder **Benutzerdefinierte Farbe**, mit ihrer **Basisdeckkraft**. |

### Layout und Animationen

| Einstellung | Was sie tut |
| --- | --- |
| **Obere Navigationsleiste verwenden** | Eine Navigationsleiste oben statt der senkrechten Seitenleiste. |
| **Animationen deaktivieren** | Schaltet die Übergangsanimationen der Oberfläche aus. |

### Hintergrundbild

| Einstellung | Was sie tut |
| --- | --- |
| **Hintergrundbild** | Ein Ordner mit Bildern als Hintergrund: **Ordner auswählen**, **Ordner öffnen**, **Ordner entfernen** und **Nächstes Bild**, wenn der Ordner mehrere Bilder enthält. |
| **Anpassungsmodus** | **Intelligent**, **Zentriert**, **Anpassen**, **Strecken**, **Kacheln**, **Oben links** oder **Oben rechts**. |
| **Wiedergabereihenfolge** | **Zufällig** oder **Sequentiell** (natürliche Reihenfolge der Dateinamen). |
| **Hintergrundunschärfe**, **Hintergrundhelligkeit**, **Hintergrunddeckkraft** | Wie das Bild angezeigt wird. |

### Material und Lesbarkeit

| Einstellung | Was sie tut |
| --- | --- |
| **Oberflächenmaterial** | Das Aussehen von Navigation, Karten, Tabs, Steuerelementen und Pop-ups über dem Hintergrundbild. **Material-Voreinstellungen**: **Ausgewogen** (Standard), **Klar** oder **Deckend**. |
| **Deckkraft der Oberfläche**, **Unschärfe der Oberfläche**, **Hintergrundbild-Overlay** | Feinabstimmung des Materials. |
| **Lesbarkeitsschutz** | Hält Text lesbar durch eine Mindesttönung der Flächen, abhängig von Design, Bildhelligkeit und Unschärfe. |
| **Dieses Design zurücksetzen** | Stellt das Material des bearbeiteten Designs wieder her. |

[Einstellungen & Personalisierung](../guide/settings-personalization#hintergrundbild-und-oberflachenmaterial) erklärt jede davon.

## Paketverwaltung

| Einstellung | Was sie tut | Schlüssel |
| --- | --- | --- |
| **Cache leeren** | Löscht die vom Paketmanager heruntergeladenen Paketdateien; verwende es, wenn Paket-Downloads fehlschlagen. | `cache clean packages` |
| **Mirror-Quellen verwenden** | Lädt Launcher-Updates, Pakete und Versionslisten von Spiegeln in Festlandchina herunter. Für Nutzer in Festlandchina standardmäßig an. | `mirror` |
| **GitHub-Proxy** | Der GitHub-Proxy für Paket-Downloads, sichtbar, solange **Mirror-Quellen verwenden** an ist: eine Voreinstellung oder **Benutzerdefiniert**, um eine URL einzugeben. Leer stellt den Standard wieder her (`https://gh-proxy.org/https://github.com`). | `github-proxy` |

## Sonstiges

| Einstellung | Was sie tut |
| --- | --- |
| **Prozess-Manager → Prozesse scannen** | Listet die laufenden Minecraft-Prozesse; **Task beenden** beendet einen, **Alle Prozesse beenden** alle. Nicht gespeicherter Spielfortschritt kann verloren gehen. |
| **Experimentelle Funktionen → Instanz-Backup (Experimentell)** | Fügt den **Instanz-Einstellungen** Aktionen zum Sichern und Wiederherstellen hinzu. Beim Einschalten erscheint zuerst eine Warnung. |

## Datenschutz

| Einstellung | Was sie tut |
| --- | --- |
| **Nutzungsanalyse (Google Analytics)** | Sendet Nutzungsdaten, die helfen, den Launcher zu verbessern. Du kannst sie jederzeit ausschalten. Mit Links zu den **Google Analytics-Nutzungsbedingungen** und der **Google-Datenschutzerklärung**. |

## Updates

| Einstellung | Was sie tut | Schlüssel |
| --- | --- | --- |
| **Beta-Updates erhalten** | Bietet auch Vorabversionen des Launchers an. Standardmäßig aus. | `beta-updates` |
| **Aktuelle Version → Auf Update prüfen** | Zeigt die Version des Launchers und sucht nach einer neueren. | `self-update --check` |

## Über

Die Credits des Launchers und Links zu LiteLDev auf GitHub und zur Discord-Community.

## Schlüssel der Befehlszeile {#command-line-keys}

`LeviLauncher.exe config list` zeigt jeden Schlüssel mit seinem Wert und woher der Wert stammt: `set` (gespeichert), `default` (Standard), `auto` (erkannt) oder `lip` (die eigene `config.toml` von lip). `config set <key> <value>` ändert einen Schlüssel, `config unset <key>` setzt ihn auf den Standard zurück.

| Schlüssel | Werte | Bedeutung |
| --- | --- | --- |
| `data-root` | ein Ordner | Wo Instanzen, Downloads und Backups liegen (vorhandene Daten werden nicht verschoben) |
| `default-instance` | eine Instanz | Die Instanz, die Befehle verwenden, wenn keine angegeben ist (wie `use`) |
| `mirror` | `on`, `off` | Von Spiegeln in Festlandchina herunterladen (nicht gesetzt: nach Region erkannt) |
| `github-proxy` | eine http(s)-URL | GitHub-Proxy für Mod-Downloads (verwendet, solange Spiegel an sind, sofern nicht gesetzt) |
| `beta-updates` | `on`, `off` | Vorabversionen des Launchers anbieten (Standard `off`) |
| `discord` | `on`, `off` | Discord Rich Presence beim Spielen zeigen, nur aus dem Launcher-Fenster (Standard `on`) |
| `on-game-launch` | `minimize`, `hide`, `close`, `keep` | Was das Launcher-Fenster beim Spielstart tut (Standard `minimize`) |
| `on-game-exit` | `reopen`, `keep`, `close` | Was das Launcher-Fenster beim Beenden des Spiels tut (Standard `reopen`) |
| `close-to-tray` | `on`, `off` | Beim Schließen des Launcher-Fensters bleibt er im Infobereich (Standard `off`) |

Nur lesbare Schlüssel, die `config list` und `config get` zeigen: `instances-dir`, `installers-dir`, `backups-dir`, `cache-dir`, `logs-dir` (die Ordner aus [Ordner & Dateien](./files)) und `config-file` (die Einstellungsdatei `%APPDATA%\LeviLauncher\config.json`).
