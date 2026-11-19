# Isolation des instances

Minecraft range ses mondes, packs et paramètres dans un dossier de données de jeu par appareil. L'**isolation des instances** (dans l'application : **Activer l'isolement** dans les **Paramètres de l'instance**, et **Isolement de l'instance** à l'installation d'une version) donne à une instance son propre dossier de données de jeu, à l'intérieur de l'instance. La ligne de commande appelle ces deux modes *own data* (données propres) et *shared data* (données partagées).

## Données partagées et données propres

=== "Windows"

    Une instance **sans isolation** utilise les données de jeu que Minecraft utilise normalement sur ce PC : les mêmes mondes, packs et paramètres que le jeu du Microsoft Store et que toute autre instance du même type sans isolation.

    Une instance **avec isolation** garde ses données de jeu dans son propre dossier. Ses mondes, packs de ressources, packs de comportements, packs de skins, captures d'écran, liste de serveurs et paramètres du jeu sont séparés de toutes les autres instances et du jeu du Microsoft Store.

    | Instance | Données partagées (isolation désactivée) | Données propres (isolation activée) |
    | --- | --- | --- |
    | GDK, Release | `%APPDATA%\Minecraft Bedrock` | `<instance>\Minecraft Bedrock` |
    | GDK, Preview | `%APPDATA%\Minecraft Bedrock Preview` | `<instance>\Minecraft Bedrock Preview` |
    | UWP, Release | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<instance>\Minecraft Bedrock` |
    | UWP, Preview | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\LocalState` | `<instance>\Minecraft Bedrock Preview` |
    | UWP, Beta | `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState` | `<instance>\Minecraft Bedrock Beta` |

    `<instance>` est le dossier de l'instance dans `Instances` (voir [Dossiers & fichiers](../reference/files)). Dans un dossier de données GDK, le jeu range les données de chaque joueur sous `Users\` (voir [profils de joueur](./instances#player-profiles)) ; dans un dossier UWP, sous `games\com.mojang\`.

=== "Android"

    L'isolation des versions sépare les données de jeu d'une version (mondes, packs et paramètres) des autres versions et du Minecraft installé depuis Google Play. La modifier pour une instance n'affecte pas les autres. Les versions importées ont souvent besoin de l'isolation pour se lancer.

## Fonctionnement <Badge platform="windows" />

Le jeu lui-même ne connaît pas les instances. Quand LeviLauncher installe une instance, il place son chargeur, `LeviLauncher.dll`, à côté de l'exécutable du jeu (voir [Chargement des mods](./mod-loading)). Quand le jeu démarre avec l'isolation activée, le chargeur redirige les dossiers où le jeu cherche ses données (les dossiers de données d'application et le dossier temporaire) vers le dossier de données de l'instance. Rien n'est copié ni lié : le jeu lit et écrit simplement là.

Ce que l'isolation ne change pas :

- **Les mods** sont toujours propres à une instance, dans son dossier `mods\`, avec ou sans isolation.
- **Le compte Microsoft** et les paramètres du lanceur lui-même sont les mêmes pour toutes les instances.
- **L'enregistrement** auprès de Windows (voir [Instances & versions du jeu](./instances#registration-with-windows)) est indépendant de l'isolation.

## Limites <Badge platform="windows" />

- Les instances GDK prennent en charge l'isolation sur toutes les versions ; les instances UWP à partir de la version 1.19.70.2, en x64 uniquement.
- Activer l'isolation ne copie rien : l'instance démarre avec des données de jeu vides. Pour partir de données existantes, choisissez de copier des données à l'installation de la version (depuis le jeu installé sur ce PC, ou depuis une autre instance isolée du même type), ou copiez-les plus tard avec `LeviLauncher.exe instance copy-data` (GDK).
- Désactiver l'isolation fait de nouveau utiliser les données partagées à l'instance ; son dossier de données propres reste dans le dossier de l'instance.
- Supprimer une instance supprime son dossier, **y compris les mondes de ses données propres**. Sauvegardez d'abord les mondes importants (voir [Outils pour les mondes](../guide/world-tools)).
- Du contenu ne peut être copié d'une instance à une autre que vers une instance qui a ses propres données, ou vers une instance UWP qui n'utilise pas le même dossier de données.

## Quand l'utiliser

L'isolation est utile si vous voulez :

- des ensembles de contenu différents pour des versions différentes
- tester plus sûrement des mods ou des builds Preview de Minecraft
- moins de risque qu'une configuration en affecte une autre

Une organisation qui fonctionne bien : une instance Release isolée pour jouer normalement, une instance Preview isolée seulement quand c'est nécessaire, et une instance de test temporaire pour les mods ou le dépannage.

## Pages liées

- [Gestion des versions](../guide/version-management)
- [Gestion du contenu](../guide/content-management)
- [Instances & versions du jeu](./instances)
