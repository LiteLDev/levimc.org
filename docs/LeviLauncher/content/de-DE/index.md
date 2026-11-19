# LeviLauncher

Minecraft Bedrock-Launcher für Windows und Android: Minecraft Bedrock Edition auf deinem Windows-PC oder Android-Gerät installieren, verwalten, isolieren, modden und starten.

**Download:** [LeviLauncher für Windows](https://github.com/LiteLDev/LeviLauncher/releases/latest) · [LeviLauncher für Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) · die Seite [Downloads](./download) nennt, was jede Version braucht, und die weiteren Downloadquellen.

::: info Windows und Android
LeviLauncher gibt es als **Windows-Version** für Minecraft Bedrock Edition (GDK / UWP) und als **Android-Version** für das offizielle Minecraft aus Google Play. Für beide brauchst du eine rechtmäßig lizenzierte Kopie des Spiels. Eine iOS-Version gibt es nicht, und sie ist auch nicht geplant.
:::

::: tip Hier anfangen
Neu bei LeviLauncher? Das Tutorial [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/) (auf Englisch) führt dich vom Herunterladen von LeviLauncher bis zum ersten Spiel mit Mods.
:::

## Was LeviLauncher kann

- **Versionszentriert.** Installiere, benenne um, starte und entferne Minecraft-Release- oder Vorschau-Builds und behalte dabei jede Umgebung im Griff. Jede installierte Kopie ist eine *Instanz*: siehe [Versionsverwaltung](./guide/version-management) und [Instanzen & Spielversionen](./concepts/instances).
- **Saubere Isolierung.** Halte Welten, Pakete und Spieldateien von deiner Standardinstallation in AppData getrennt, wenn du eine sicherere Arbeitsumgebung möchtest: siehe [Instanz-Isolierung](./concepts/isolation).
- **Inhaltsverwaltung.** Verwalte Welten, Ressourcenpakete, Verhaltenspakete, Skin-Pakete, Screenshots und Serverlisten zentral an einer Stelle: siehe [Inhaltsverwaltung](./guide/content-management).
- **Mod-Unterstützung.** Importiere Mod-Pakete (`.mcmod`), durchsuche CurseForge und installiere LeviLamina und LIP-Pakete mit dem integrierten Paketmanager für fortgeschrittene Setups: siehe [Mods & Integrationen](./guide/mods-integrations) und [Wie Mods geladen werden](./concepts/mod-loading).
- **Welt-Tools.** Exportiere Backups, sieh dir Weltdaten an und bearbeite ausgewählte `level.dat`-Felder, ohne den Launcher zu verlassen: siehe [Welt-Tools](./guide/world-tools).
- **Benutzereinstellungen.** Passe Sprache, Erscheinungsbild, Download-Verhalten, Datenschutzoptionen, Update-Kanäle und Paketverwaltung an: siehe [Einstellungen & Personalisierung](./guide/settings-personalization) und [Alle Einstellungen](./reference/settings).
- **Android-Extras.** Xbox-Kontowechsel und Schnellstart per URI-Aktionen im selben Launcher: siehe [Konten & Schnellstart](./guide/accounts-quick-launch).

## Ein kurzes Beispiel

Unter Windows lässt sich alles, was das Launcher-Fenster kann, auch im Terminal erledigen. Diese drei Befehle installieren den neuesten Minecraft-Release-Build als neue Instanz mit LeviLamina und machen sie zur Standardinstanz, fügen ihr einen Mod von [LeviMC Mods](https://levimc.org/mods/) hinzu und starten das Spiel:

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe play
```

Zum Installieren eines GDK-Builds musst du mit einem Microsoft-Konto angemeldet sein, dem Minecraft gehört (`LeviLauncher.exe account login`). Im Fenster entsprechen dieselben Schritte der Seite **Herunterladen**, der Seite **LeviMC Mods** und der Schaltfläche **Starten**. Die Referenz [Befehlszeile](./reference/command-line) listet alle Befehle.

## Was enthält diese Website?

Diese Dokumentation richtet sich an **Endnutzer**, nicht an Entwickler oder Mitwirkende.

- **Anleitungen**: eine Aufgabe pro Seite. Hol dir die App auf der Seite [Downloads](./download), dann [verwalte Versionen](./guide/version-management), [Downloads und Spiegel](./guide/downloads-mirrors), [Inhalte](./guide/content-management), [Konten und Schnellstart](./guide/accounts-quick-launch) (Android), [Mods](./guide/mods-integrations), [Welten](./guide/world-tools) und [Einstellungen](./guide/settings-personalization). Die Gruppe „Hilfe“ behandelt [Updates und Fehlerbehebung](./guide/update-troubleshooting) sowie [Community und Feedback](./guide/faq-community-feedback).
- **Konzepte**: wie LeviLauncher funktioniert: [Instanzen und Spielversionen](./concepts/instances) (Release und Preview, GDK und UWP, Windows und Android), [Instanz-Isolierung](./concepts/isolation) und [wie Mods geladen werden](./concepts/mod-loading).
- **Referenz**: die [Befehlszeile](./reference/command-line), [alle Einstellungen](./reference/settings), die [Ordner und Dateien](./reference/files), die LeviLauncher verwendet, die [Schnellstart-URIs](./reference/quick-launch-uri) für Android und die [Datenschutzerklärung](./privacy-policy) der Android-Version.

Empfohlene Lese-Reihenfolge: das Tutorial [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/), dann [Versionsverwaltung](./guide/version-management) und [Inhaltsverwaltung](./guide/content-management).

## Downloadquellen

- **GitHub Releases (offizieller LeviLauncher-Download):** [LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- **Lanzou Cloud Mirror (chinesischer Mirror):** [levimc.lanzoue.com/b016ke39hc](https://levimc.lanzoue.com/b016ke39hc) — Passwort: `levi`
- **Android-Version:** [LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

## Community & Feedback

- **Offizieller Discord:** [discord.gg/v5R5P4vRZk](https://discord.gg/v5R5P4vRZk)
- **Persönlicher Discord-Channel:** [discord.gg/VqQaC8vWz8](https://discord.gg/VqQaC8vWz8)
- **QQ-Gruppe (chinesisch):** [458083875](https://qm.qq.com/q/1z791rJgJG)
- **Fehler melden oder Vorschläge einreichen:** [GitHub Issues](https://github.com/LiteLDev/LeviLauncher/issues)
