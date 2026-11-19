# Instanzen & Spielversionen

LeviLauncher installiert jede Kopie von Minecraft als **Instanz**: eine Spielversion mit eigenem Namen, eigenen Einstellungen und, wenn du willst, eigenen Spieldaten. Du kannst mehrere Instanzen nebeneinander behalten, von derselben Spielversion oder von verschiedenen, und die starten, die du gerade brauchst. Die App listet sie auf der Seite **Instanzen**.

## Was eine Instanz ist

=== "Windows"

    Eine Instanz ist ein Ordner im Ordner `Instances` des Launchers (siehe [Ordner & Dateien](../reference/files)). Ihr Name ist der Name des Ordners. Der Ordner enthält:

    - die Spieldateien eines Minecraft-Builds, aus seinem Installationspaket entpackt;
    - `.levilauncher\instance.json`, was der Launcher über die Instanz weiß: die Spielversion, den Kanal, ob sie eigene Spieldaten hat, und die Startoptionen (Konsole, Editor-Modus, Startargumente, Umgebungsvariablen);
    - `mods\`, die Mods der Instanz, und `.lip\`, den Zustand der Pakete, die mit dem integrierten Paketmanager installiert wurden (siehe [Wie Mods geladen werden](./mod-loading));
    - die eigenen Spieldaten der Instanz (Welten, Pakete, Einstellungen), wenn [Isolierung](./isolation) eingeschaltet ist.

    Mods gehören immer zu einer Instanz. Spieldaten gehören nur dann zu einer Instanz, wenn die Isolierung eingeschaltet ist; sonst verwendet die Instanz die Spieldaten, die Minecraft auf diesem PC normalerweise verwendet.

=== "Android"

    Eine Instanz ist eine offizielle Minecraft-APK, die du in LeviLauncher importierst. Sie läuft im Launcher, ohne im System installiert zu werden. Das Minecraft aus Google Play (1.21.80 oder neuer) muss trotzdem auf dem Gerät installiert sein; LeviLauncher listet es neben den Versionen, die du importiert hast.

    Die Versionsisolierung hält Welten, Pakete und Einstellungen einer importierten Version von der installierten Google-Play-Version getrennt. Importierte Versionen brauchen zum Starten oft die Isolierung.

## Release und Preview

Jeder Minecraft-Build gehört zu einem **Kanal**:

| Kanal | Was er ist |
| --- | --- |
| Release | Das stabile Spiel, das die meisten Spieler verwenden. |
| Preview | Builds kommender Versionen, zum Testen. Sie beschädigen Welten, Pakete oder Mods häufiger. |
| Beta | Test-Builds, die nur für UWP veröffentlicht wurden. <Badge platform="windows" /> |

Unter Windows haben Release und Preview je einen eigenen Spieldatenordner (`Minecraft Bedrock` und `Minecraft Bedrock Preview`), daher teilt eine Preview-Instanz ohne Isolierung keine Welten mit einer Release-Instanz.

## GDK- und UWP-Builds <Badge platform="windows" />

Minecraft für Windows wurde in zwei Paketformaten veröffentlicht, und LeviLauncher installiert beide. Gibt es eine Version in beiden, wird GDK gewählt.

| | GDK | UWP |
| --- | --- | --- |
| Installationspaket | `.msixvc`, von einem Spiegel geladen, den LeviLauncher misst und auswählt | `.appx` / `.msix` (oder ein Bundle), über Windows Update geladen |
| Zum Installieren | Ein angemeldetes Microsoft-Konto, dem Minecraft gehört | — |
| Zum Ausführen | Microsoft Gaming Services und Microsoft GameInput | Der Windows-Entwicklermodus, um das Paket bei Windows zu registrieren |
| Gemeinsame Spieldaten | `%APPDATA%\Minecraft Bedrock` (Preview: `Minecraft Bedrock Preview`), ein Ordner pro Spielerprofil unter `Users\` | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` (Preview: `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) |
| Isolierung | Alle Versionen | x64-Versionen ab 1.19.70.2 |
| LeviLamina | Von LeviLauncher auf den unterstützten Versionen installiert | Wird von LeviLauncher nicht installiert |
| Startargumente und Umgebungsvariablen | Ja | Nein |

Ein lokales Installationspaket, das du importierst (`.msixvc`, `.appx`, `.msix`, `.appxbundle` oder `.msixbundle`), wird anhand seiner Endung als GDK oder UWP installiert.

### Spielerprofile {#player-profiles}

Eine GDK-Instanz speichert Welten, Screenshots und die Serverliste pro **Spielerprofil**: ein Ordner unter `Users\`, benannt nach der ID des Spielers und mit seinem Gamertag angezeigt, wenn der Launcher ihn kennt. Ressourcen- und Verhaltenspakete teilen sich alle Profile (`Users\Shared\`); Skin-Pakete werden ab Spielversion 1.26 geteilt und davor pro Profil gespeichert. UWP-Instanzen haben keine Profile.

## Registrierung bei Windows <Badge platform="windows" /> {#registration-with-windows}

Windows kennt ein installiertes Minecraft pro Kanal. Eine Instanz zu **registrieren** bewirkt, dass Windows sie als dieses Minecraft behandelt: Startmenü, `minecraft://`-Links und die Xbox-Funktionen verwenden dann sie. Die Registrierung ersetzt den aktuellen Inhaber des Release- oder Preview-Platzes (das Spiel aus dem Microsoft Store oder eine andere Instanz), dessen Daten erhalten bleiben. Registrieren und Abmelden verändern nie die Spieldaten.

UWP-Instanzen werden beim Starten automatisch registriert. Eine registrierte Instanz muss abgemeldet werden, bevor sie umbenannt oder entfernt werden kann.

## Verwandte Seiten

- [Versionsverwaltung](../guide/version-management)
- [Instanz-Isolierung](./isolation)
- [Ordner & Dateien](../reference/files)
