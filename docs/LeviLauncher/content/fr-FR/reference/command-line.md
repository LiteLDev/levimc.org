---
platforms: [windows]
---
# Ligne de commande

`LeviLauncher.exe` sans argument ouvre la fenêtre du lanceur. Avec une commande, il s'exécute dans le terminal puis se termine ; les commandes suivent la forme `<nom> <verbe>` :

```text
LeviLauncher.exe <command> [arguments] [flags]
```

Cette page liste toutes les commandes de LeviLauncher 1.1.0. `LeviLauncher.exe help <command>` affiche les options et les exemples de chaque commande, et `LeviLauncher.exe help` la vue d'ensemble. La sortie de la ligne de commande est en anglais.

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe play
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe world export "My World" -o D:\Backups
LeviLauncher.exe instance list --json
```

## L'exécuter depuis un shell

`LeviLauncher.exe` est un programme fenêtré : les shells ne l'attendent donc pas par défaut. Si vous avez besoin de sa sortie avant le retour de l'invite, ou de son code de sortie :

- dans cmd, utilisez `start /wait LeviLauncher.exe ...`, puis lisez `%ERRORLEVEL%` ;
- dans PowerShell, redirigez la sortie dans un pipe (`LeviLauncher.exe instance list | Out-String`) ou utilisez `Start-Process -Wait -NoNewWindow`.

La ligne de commande n'ouvre pas la fenêtre et peut s'exécuter pendant que la fenêtre est ouverte.

## Commandes

### Au quotidien

| Commande | Ce qu'elle fait |
| --- | --- |
| `play [<instance>]` | Lance le jeu et attend que sa fenêtre apparaisse (alias de `launch`) |
| `install <version\|file>` | Télécharge et installe Minecraft comme nouvelle instance (= `instance create`) |
| `use [<instance>]` | Définit ou affiche l'instance par défaut |
| `stop [<instance>\|<pid>...]` | Ferme un Minecraft en cours d'exécution (= `process stop`) |

### Gérer une instance

| Commande | Ce qu'elle fait |
| --- | --- |
| `instance list [<filter>]` | Liste les instances installées |
| `instance show [<instance>]` | Affiche les paramètres, l'enregistrement, le chargeur, les joueurs et le nombre de contenus d'une instance (aussi `instance <instance>`) |
| `instance create <version\|file>` | Télécharge et installe Minecraft comme nouvelle instance |
| `instance copy-data [<instance>] --from system\|<instance>` | Copie des données de jeu (mondes, paramètres) dans une instance qui a ses propres données |
| `instance rename <instance> <new-name>` | Renomme une instance |
| `instance set [<instance>]` | Modifie les paramètres de l'instance (console, mode éditeur, données propres, arguments, environnement, logo) |
| `instance remove <instance>...` | Supprime définitivement des instances et tout ce que contiennent leurs dossiers |
| `instance register [<instance>]` | Fait traiter cette instance par Windows comme le Minecraft installé de son canal |
| `instance unregister [<instance>]` | Annule l'enregistrement de l'instance auprès de Windows (les données de jeu sont conservées) |
| `instance shortcut [<instance>]` | Crée un raccourci sur le bureau qui lance l'instance, ou le supprime |
| `instance path [<instance>] [<kind>]` | Affiche un dossier d'une instance (et l'ouvre si besoin) |
| `mod list [<filter>]` | Liste les mods d'une instance |
| `mod show <package>` | Affiche un mod du catalogue |
| `mod search [<words>]` | Recherche dans le catalogue de mods LeviLamina |
| `mod install <package[@version]>...` | Installe, met à niveau ou rétrograde des mods du catalogue |
| `mod update [<mod>...]` | Met à jour les mods du catalogue vers leur dernière version |
| `mod import <file>...` | Ajoute des mods depuis des fichiers `.mcmod`, `.zip` ou `.dll` |
| `mod set <mod>` | Modifie le manifeste d'un mod |
| `mod remove <mod>...` | Supprime des mods d'une instance |
| `mod enable <mod>... \| --all` | Active des mods |
| `mod disable <mod>... \| --all` | Désactive des mods sans les supprimer |
| `mod path [<mod>]` | Affiche le dossier d'un mod ou celui des mods de l'instance |
| `loader versions` | Liste les versions de LeviLamina disponibles pour une version du jeu |
| `loader install [<version>]` | Installe LeviLamina sur une instance, ou change sa version |
| `loader remove` | Supprime LeviLamina d'une instance |
| `world list [<filter>]` | Liste les mondes d'une instance et d'un joueur |
| `world import <file.mcworld>...` | Importe des mondes depuis des fichiers `.mcworld` |
| `world export <world>...` | Exporte (sauvegarde) des mondes en fichiers `.mcworld` |
| `world copy <world>...` | Copie des mondes vers une autre instance |
| `world rename <world> <new-name>` | Change le nom affiché d'un monde |
| `world get <world> [<key>[/<sub>...]]` | Lit des paramètres du monde dans `level.dat` |
| `world set <world> <key>[/<sub>...]=<value>...` | Modifie des paramètres du monde dans `level.dat` |
| `world remove <world>...` | Supprime définitivement des mondes |
| `pack list [<filter>]` | Liste les packs de ressources, de comportements et de skins |
| `pack import <file.mcpack\|file.mcaddon>...` | Installe des packs et add-ons depuis des fichiers `.mcpack` et `.mcaddon` |
| `pack copy <pack>... \| --all` | Copie des packs vers une autre instance |
| `pack remove <pack>...` | Supprime des packs installés |
| `screenshot list` | Liste les captures d'écran d'une instance et d'un joueur, les plus récentes d'abord |
| `screenshot remove <name\|path>... \| --all` | Supprime des captures d'écran |
| `server list [<filter>]` | Liste les serveurs enregistrés et vérifie s'ils sont en ligne |
| `player list` | Liste les profils de joueur d'une instance GDK |
| `backup list [<instance>]` | Liste les sauvegardes d'instances et de mondes (aperçu) |
| `backup create [<instance>]` | Sauvegarde les données de jeu et les mods d'une instance (aperçu) |
| `backup restore [<instance>] <archive.zip>` | Restaure une sauvegarde d'instance (aperçu) |

### Trouver quoi installer

| Commande | Ce qu'elle fait |
| --- | --- |
| `installer search [<version>]` | Liste les builds de Minecraft qui peuvent être installées |
| `installer download <version>` | Télécharge l'installateur d'une build sans l'installer |
| `installer list` | Liste les installateurs téléchargés, y compris les téléchargements inachevés |
| `installer remove <version\|file>...` | Supprime des installateurs téléchargés pour libérer de l'espace disque |
| `installer mirrors <version>` | Mesure les miroirs de téléchargement d'une build GDK |
| `curseforge search [<words>]` | Recherche sur CurseForge des mondes, add-ons, packs et skins (alias du nom : `cf`) |
| `curseforge show <id>` | Affiche un projet CurseForge |
| `curseforge categories` | Liste les classes et catégories CurseForge pour filtrer |
| `curseforge install <id>` | Télécharge un fichier CurseForge et l'importe dans une instance |

### Ce PC et le lanceur

| Commande | Ce qu'elle fait |
| --- | --- |
| `process list` | Liste les processus Minecraft en cours, y compris ceux que le lanceur n'a pas démarrés (alias : `ps`) |
| `process stop [<instance>\|<pid>...]` | Force la fermeture de Minecraft (la progression depuis la dernière sauvegarde automatique est perdue) |
| `account status` | Affiche le compte Microsoft connecté et les éditions qu'il possède |
| `account login` | Se connecte à un compte Microsoft, ou change de compte |
| `account logout` | Oublie le compte Microsoft du lanceur |
| `config list` | Liste les paramètres et dossiers du lanceur |
| `config get <key>` | Affiche la valeur d'un paramètre |
| `config set <key> <value>` | Modifie un paramètre |
| `config unset <key>` | Rétablit la valeur par défaut d'un paramètre |
| `cache clean [packages\|downloads\|partial]...` | Libère l'espace disque occupé par les caches |
| `doctor [--fix [<fix>...]]` | Vérifie ce dont Minecraft et les mods ont besoin sur ce PC ; `--fix` le répare (`vcruntime`, `gameinput`, `loader-migration`, `developer-mode`) |
| `self-update` | Met à jour LeviLauncher lui-même vers la dernière version |
| `version` | Affiche les informations de version |
| `help [<command>...]` | Aide de n'importe quelle commande, avec des exemples |

Chaque verbe `list` répond aussi à `ls`, et chaque verbe `remove` à `rm`. Les paramètres que lit et modifie `config` sont listés dans [Tous les paramètres](./settings#command-line-keys).

### Versions et paquets

- Le `<version>` de `install` et `installer` est une build de `installer search` : exacte (`1.21.50.07`), un préfixe pointé (`1.21.50` est la `1.21.50.x` la plus récente ; `1.21.5` ne lui correspond pas) ou `latest`. `<file>` est un `.msixvc`, `.appx`, `.msix`, `.appxbundle` ou `.msixbundle` local.
- Le `<package>` de `mod install` est `owner/repo`, `github.com/owner/repo` ou une URL, éventuellement avec `#variant` et `@version`.

## Options globales

Ces options fonctionnent avec toutes les commandes :

| Option | Signification |
| --- | --- |
| `-i`, `--instance <name>` | L'instance concernée |
| `-p`, `--player <id\|gamertag>` | Le profil de joueur, sur les instances GDK |
| `--json` | Sortie lisible par une machine sur stdout |
| `-q`, `--quiet` | N'affiche que les identifiants ; ni progression ni notices |
| `-v`, `--verbose` | Plus de détails, et le journal du lanceur sur stderr |
| `-y`, `--yes` | Répond oui aux confirmations |
| `--no-input` | Ne pose jamais de question |
| `-h`, `--help` | Aide d'une commande |
| `--version` | Affiche la version |

**Quelle instance :** `-i`, sinon la variable d'environnement `LEVILAUNCHER_INSTANCE`, sinon l'instance par défaut (`use`), sinon la seule instance. **Quel joueur :** `-p`, sinon `LEVILAUNCHER_PLAYER`, sinon le seul profil, sinon le profil du compte connecté.

## Sortie

- Les résultats vont sur stdout. La progression, les notices et les erreurs vont sur stderr ; une erreur s'affiche comme `error:`, avec un `hint:` et un code d'erreur tel que `[ERR_GAME_RUNNING]`.
- `--json` affiche un seul document JSON : un tableau pour les listes, un objet sinon, avec des clés en camelCase, des dates en RFC 3339 et des tailles en octets.
- `-q` n'affiche que des identifiants, un par ligne.

## Codes de sortie

| Code | Signification |
| --- | --- |
| 0 | OK |
| 1 | Échec |
| 2 | Erreur d'utilisation |
| 3 | Introuvable |
| 4 | Conflit (par exemple, le jeu est en cours d'exécution) |
| 5 | Connexion ou licence |
| 6 | Réseau |
| 7 | Fait en partie |
| 8 | Nécessite une modification du système ou des droits d'administrateur |
| 9 | Délai dépassé |
| 10 | Annulé |
| 130 | Interrompu (Ctrl-C) |

`launch --wait-exit` renvoie à la place le code de sortie du jeu lui-même.

## Arguments de la fenêtre

Ces arguments ouvrent la fenêtre au lieu d'exécuter une commande :

| Argument | Effet |
| --- | --- |
| `--launch=<instance>` | Ouvre le lanceur et lance l'instance ; les raccourcis du bureau l'utilisent. Si le lanceur est déjà ouvert, il y lance l'instance. |
| `--debug` | Affiche aussi le journal du lanceur dans une fenêtre de console (`debug`, `-debug` et `/debug` fonctionnent aussi). |
