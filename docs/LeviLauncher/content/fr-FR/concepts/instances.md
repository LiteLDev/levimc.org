# Instances & versions du jeu

LeviLauncher installe chaque copie de Minecraft comme une **instance** : une version du jeu avec son propre nom, ses propres paramètres et, si vous le souhaitez, ses propres données de jeu. Vous pouvez garder plusieurs instances côte à côte, de la même version du jeu ou de versions différentes, et lancer celle dont vous avez besoin. L'application les liste sur la page **Instances**.

## Ce qu'est une instance

=== "Windows"

    Une instance est un dossier dans le dossier `Instances` du lanceur (voir [Dossiers & fichiers](../reference/files)). Son nom est le nom du dossier. Le dossier contient :

    - les fichiers du jeu d'une build de Minecraft, extraits de son installateur ;
    - `.levilauncher\instance.json`, ce que le lanceur sait de l'instance : la version du jeu, le canal, si elle garde ses propres données de jeu, et les options de lancement (console, mode éditeur, arguments de lancement, variables d'environnement) ;
    - `mods\`, les mods de l'instance, et `.lip\`, l'état des paquets installés avec le gestionnaire de paquets intégré (voir [Chargement des mods](./mod-loading)) ;
    - les données de jeu propres à l'instance (mondes, packs, paramètres) lorsque l'[isolation](./isolation) est activée.

    Les mods appartiennent toujours à une instance. Les données de jeu n'appartiennent à une instance que si l'isolation est activée ; sinon l'instance utilise les données de jeu que Minecraft utilise normalement sur ce PC.

=== "Android"

    Une instance est un APK officiel de Minecraft que vous importez dans LeviLauncher. Il s'exécute dans le lanceur, sans être installé sur le système. Le Minecraft de Google Play (1.21.80 ou ultérieur) doit tout de même être installé sur l'appareil ; LeviLauncher l'affiche à côté des versions que vous avez importées.

    L'isolation des versions sépare les mondes, packs et paramètres d'une version importée de la version Google Play installée. Les versions importées ont souvent besoin de l'isolation pour se lancer.

## Release et Preview

Chaque build de Minecraft appartient à un **canal** :

| Canal | Ce que c'est |
| --- | --- |
| Release (officielle) | Le jeu stable qu'utilisent la plupart des joueurs. |
| Preview (aperçu) | Des builds des versions à venir, pour les tests. Elles cassent plus souvent les mondes, les packs ou les mods. |
| Beta | Des builds de test publiées uniquement pour UWP. <Badge platform="windows" /> |

Sous Windows, Release et Preview ont chacune leur propre dossier de données de jeu (`Minecraft Bedrock` et `Minecraft Bedrock Preview`) : une instance Preview sans isolation ne partage donc pas ses mondes avec une instance Release.

## Builds GDK et UWP <Badge platform="windows" />

Minecraft pour Windows a été publié dans deux formats de paquet, et LeviLauncher installe les deux. Quand une version existe dans les deux, GDK est choisi.

| | GDK | UWP |
| --- | --- | --- |
| Installateur | `.msixvc`, téléchargé depuis un miroir que LeviLauncher mesure et choisit | `.appx` / `.msix` (ou un bundle), téléchargé depuis Windows Update |
| Pour installer | Un compte Microsoft connecté qui possède Minecraft | — |
| Pour lancer | Microsoft Gaming Services et Microsoft GameInput | Le mode développeur de Windows, pour enregistrer le paquet auprès de Windows |
| Données de jeu partagées | `%APPDATA%\Minecraft Bedrock` (Preview : `Minecraft Bedrock Preview`), un dossier par profil de joueur sous `Users\` | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` (Preview : `Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe`) |
| Isolation | Toutes les versions | Versions x64 1.19.70.2 et ultérieures |
| LeviLamina | Installé par LeviLauncher sur les versions qu'il prend en charge | Non installé par LeviLauncher |
| Arguments de lancement et variables d'environnement | Oui | Non |

Un installateur local que vous importez (`.msixvc`, `.appx`, `.msix`, `.appxbundle` ou `.msixbundle`) est installé comme GDK ou UWP selon son extension.

### Profils de joueur {#player-profiles}

Une instance GDK conserve les mondes, les captures d'écran et la liste des serveurs par **profil de joueur** : un dossier sous `Users\` portant l'ID du joueur, affiché avec son gamertag quand le lanceur le connaît. Les packs de ressources et de comportements sont partagés par tous les profils (`Users\Shared\`) ; les packs de skins sont partagés à partir du jeu 1.26 et rangés par profil avant. Les instances UWP n'ont pas de profils.

## Enregistrement auprès de Windows <Badge platform="windows" /> {#registration-with-windows}

Windows connaît un seul Minecraft installé par canal. **Enregistrer** une instance fait que Windows la traite comme ce Minecraft : le menu Démarrer, les liens `minecraft://` et les fonctions Xbox l'utilisent alors. L'enregistrement remplace le détenteur actuel de la place Release ou Preview (le jeu du Microsoft Store ou une autre instance), dont les données sont conservées. Enregistrer ou désenregistrer ne touche jamais aux données de jeu.

Les instances UWP sont enregistrées automatiquement à leur lancement. Une instance enregistrée doit être désenregistrée avant de pouvoir être renommée ou supprimée.

## Pages liées

- [Gestion des versions](../guide/version-management)
- [Isolation des instances](./isolation)
- [Dossiers & fichiers](../reference/files)
