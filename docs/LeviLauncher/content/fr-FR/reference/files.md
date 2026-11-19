---
platforms: [windows]
---
# Dossiers & fichiers

Tous les fichiers et dossiers que lit et écrit la version Windows de LeviLauncher, d'après LeviLauncher 1.1.0. Le lanceur n'écrit rien dans le dossier temporaire du système (`%TEMP%`).

## Vue d'ensemble

| Dossier | Emplacement | Contenu |
| --- | --- | --- |
| Dossier des paramètres | `%APPDATA%\LeviLauncher\` | Uniquement `config.json` : petit, et suit votre profil Windows itinérant |
| Dossier local | `%LOCALAPPDATA%\LeviLauncher\` | Journaux, le compte Microsoft, les données WebView2 de la fenêtre ; c'est aussi la racine de données par défaut |
| Racine de données | le dossier local, sauf si vous en choisissez un autre (**Racine de base** dans **Paramètres → Paramètres généraux**, ou `config set data-root`) | `Instances\`, `Backups\`, `Cache\` |

```text
%APPDATA%\LeviLauncher\
  config.json                      les paramètres du lanceur
%LOCALAPPDATA%\LeviLauncher\        la racine de données par défaut
  Logs\startup.log                 le journal du lanceur, et avant lui startup.1.log … startup.4.log
  Accounts\                        le compte Microsoft et les enregistrements de l'appareil, chiffrés pour votre utilisateur Windows
  WebView2\                        les données de la fenêtre du lanceur
  storage-migration.json           le relevé du déplacement depuis l'ancienne organisation (voir plus bas)
<racine de données>\
  Instances\<instance>\            une instance (voir plus bas)
  Backups\
    Worlds\<instance>\<dossier>_<monde>\<monde>_<yyyyMMdd-HHmmss>.mcworld
    Instances\<instance>\<instance>_<yyyyMMdd-HHmmss>.zip
  Cache\
    Installers\                    installateurs du jeu, et ceux de Visual C++ et WebView2
    Updates\                       mises à jour du lanceur ; supprimées une fois installées
    Downloads\                     fichiers téléchargés pour une importation ; nettoyés au démarrage après 1 jour
    Imports\                       fichiers transmis pour une importation ; nettoyés au démarrage après 1 jour
    gdk-pending-versions.json
    gamertags.json                 les gamertags des profils de joueur que le lanceur a vus
```

Tout ce qui se trouve dans `Cache\` peut être supprimé sans rien perdre. `LeviLauncher.exe cache clean` supprime le cache des paquets, les fichiers téléchargés pour des importations et les téléchargements inachevés, et `LeviLauncher.exe installer remove` supprime les installateurs du jeu téléchargés. Changer la racine de données ne fait que diriger le lanceur vers un autre dossier : les instances, téléchargements et sauvegardes existants ne sont pas déplacés.

## Le dossier d'une instance

```text
Instances\<instance>\
  Minecraft.Windows.exe …          les fichiers du jeu de la build
  LeviLauncher.dll                 le chargeur natif de LeviLauncher (builds x64)
  .levilauncher\                   l'état du lanceur dans l'instance (caché)
    instance.json                  nom, version du jeu, canal, isolation et options de lancement
    icon.ico                       l'icône de l'instance, créée à partir du LargeLogo.png du jeu
    xbox-auth-key-v1               un marqueur des instances UWP pour la connexion Xbox
  .lip\                            l'état des paquets installés dans l'instance (format de lip)
  mods\                            les mods (voir Chargement des mods)
  Minecraft Bedrock\               les données de jeu, quand l'isolation est activée (Preview : Minecraft Bedrock Preview)
```

Voir [Isolation des instances](../concepts/isolation) pour les dossiers de données de jeu des instances avec et sans isolation, et [Chargement des mods](../concepts/mod-loading) pour `mods\`.

## En dehors des dossiers de LeviLauncher

| Chemin | Ce que c'est |
| --- | --- |
| `Minecraft - <instance>.lnk` sur votre bureau | Le raccourci d'une instance (**Créer un raccourci sur le bureau**, ou `instance shortcut`). Il ouvre le lanceur avec `--launch=<instance>`. Seul votre propre bureau est modifié, pas le bureau public. |
| `%APPDATA%\lip\` | Les paramètres de lip : `config.toml`, par exemple son `github_proxy`, que lit aussi le gestionnaire de paquets intégré. |
| `%LOCALAPPDATA%\lip\Cache\` | Le cache de paquets du gestionnaire de paquets intégré, le même que celui de lip. **Nettoyer le cache** dans **Paramètres → Gestion des paquets** le vide. |
| `%APPDATA%\Minecraft Bedrock\`, `%APPDATA%\Minecraft Bedrock Preview\` | Les données de jeu partagées des instances GDK sans isolation. |
| `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\` (Preview : `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) | Les données de jeu partagées des instances UWP sans isolation. |

## Comment les fichiers sont écrits

- Un fichier est écrit à côté de son emplacement final sous le nom `<nom>.<aléatoire>.tmp`, puis renommé en place : on ne voit donc jamais un fichier à moitié écrit. Un téléchargement inachevé qui peut être repris est conservé sous le nom `<nom>.partial.tmp`.
- Les noms que vous choisissez (instances, mondes) sont nettoyés selon les règles de Windows : les caractères `<>:"/\|?*` ainsi que les points et espaces finaux sont retirés, et les noms réservés comme `CON` ou `NUL` sont évités.
- Les fichiers que crée le lanceur s'appellent `<nom>_<yyyyMMdd-HHmmss>.<extension>`, par exemple `MyWorld_20261107-142301.mcworld`.

## L'ancienne organisation

Avant la version 1.1.0, LeviLauncher rangeait tout dans `%APPDATA%\<nom du programme>\` (par exemple `%APPDATA%\levilauncher.exe\`), avec les dossiers `versions\`, `backups\`, `installers\`, `updates\`, `logs\` et les fichiers `config.json`, `user_gamertag_map.json` et `gdk_pending_versions.json`. Les instances contenaient `version.json` et `LargeLogo.ico`.

À son premier démarrage, LeviLauncher 1.1.0 ou ultérieur déplace une fois ces données vers l'organisation ci-dessus, sans rien supprimer : les données sur le même lecteur sont renommées en place, celles d'un autre lecteur sont copiées et l'original est conservé, et l'ancien `config.json` est renommé en `config.migrated.json`. Une racine de données que vous aviez choisie reste où elle est. Si quelque chose ne peut pas être déplacé (par exemple parce que le jeu tourne depuis une instance), toutes les étapes sont annulées et le lanceur fonctionne sur l'ancienne organisation jusqu'au démarrage suivant. `storage-migration.json` consigne ce qui a été déplacé et où ; les raccourcis du bureau sont ensuite mis à jour vers les nouveaux emplacements.
