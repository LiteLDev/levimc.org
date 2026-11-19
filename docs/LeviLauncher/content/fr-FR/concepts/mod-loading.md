# Chargement des mods

Minecraft Bedrock ne prend pas en charge les mods par lui-même : un mod est du code natif qu'un chargeur place dans le processus du jeu au démarrage de celui-ci. Cette page explique quels chargeurs LeviLauncher utilise, où se trouvent les mods et comment s'articulent les différentes façons d'ajouter un mod.

## Où se trouvent les mods <Badge platform="windows" />

Chaque instance a un dossier `mods\` (voir [Dossiers & fichiers](../reference/files)). Chaque mod est un dossier à l'intérieur, avec un `manifest.json` qui le décrit :

| Champ | Signification |
| --- | --- |
| `name` | Le nom du mod. |
| `entry` | Le fichier que charge le chargeur, relatif au dossier du mod (un `.dll`). |
| `version` | La version du mod. |
| `type` | Le chargeur qui le charge : `preload-native` pour le chargeur natif de LeviLauncher ; les mods pour LeviLamina ont leurs propres types. |
| `author` | Son auteur (facultatif). |

Les mods appartiennent à une instance. L'[isolation](./isolation), qui ne concerne que les données de jeu, ne les affecte pas.

**Désactiver un mod** (dans **Gérer les mods**, ou avec `LeviLauncher.exe mod disable`) renomme son `manifest.json` en `manifest.json.close` ; le réactiver lui rend son nom. Les fichiers du mod restent en place, et un chargeur qui cherche `manifest.json` ne trouve plus le mod.

## Les deux chargeurs <Badge platform="windows" />

### Le chargeur natif de LeviLauncher

Quand LeviLauncher installe ou prépare une instance, il place son chargeur, `LeviLauncher.dll`, à côté de l'exécutable du jeu et l'ajoute aux imports de l'exécutable, pour que Windows le charge avec le jeu. Cela fonctionne pour les builds x64, GDK comme UWP ; c'est aussi ce qui fait fonctionner l'[isolation](./isolation).

Au démarrage du jeu, le chargeur natif parcourt les dossiers de `mods\` dans l'ordre de leurs noms et charge l'`entry` de chaque mod dont le `type` est `preload-native`. Les dossiers sans `manifest.json` et les mods d'autres types sont ignorés. Si l'instance a un autre préchargeur (un `preloader.dll` à côté du jeu), le chargeur natif lui laisse tout le chargement des mods. Le chargeur natif a besoin du runtime Visual C++ (x64), que LeviLauncher vérifie et propose d'installer.

### LeviLamina

[LeviLamina](https://levimc.org/LeviLamina/) est le chargeur de mods de LeviMC. La plupart des mods de [LeviMC Mods](https://levimc.org/mods/) sont des mods LeviLamina : ils ont besoin de LeviLamina dans une version qui prend en charge la version du jeu de l'instance. LeviLauncher installe LeviLamina sur les instances GDK des versions prises en charge (l'interrupteur **Installer LeviLamina** à l'installation d'une version, ou l'onglet **Chargeur** des **Paramètres de l'instance**), comme un paquet de son gestionnaire de paquets intégré.

## Trois façons d'ajouter un mod <Badge platform="windows" />

| Vous ajoutez | Ce que fait LeviLauncher |
| --- | --- |
| Un mod de **LeviMC Mods** (ou `mod install owner/repo`) | Il l'installe comme paquet avec le gestionnaire de paquets intégré, compatible avec [lip](https://github.com/LiteLDev/lip) : il télécharge la version publiée pour cette plateforme, installe les paquets dont il dépend et l'enregistre dans le `.lip\state.json` de l'instance. Si le mod a besoin de LeviLamina et que celui installé ne convient pas (ou qu'aucun n'est installé), un LeviLamina compatible est installé d'abord. Ces mods peuvent être mis à jour et supprimés comme des paquets. |
| Un paquet `.mcmod` (ou un `.zip`) | Il l'extrait dans un nouveau dossier de `mods\`. L'archive doit contenir un `manifest.json`. |
| Un simple `.dll` | Il le place dans un nouveau dossier de `mods\` et écrit un `manifest.json` pour lui : par défaut le nom du fichier comme nom, `preload-native` comme type et `0.0.0` comme version. |

Un paquet indique où il s'exécute avec `side` (`client` ou `server`) et `platform` (par exemple `win-x64`), dans son `lip.toml` et dans `.lip\state.json`. Pour le client, LeviLauncher installe la variante `client` d'un mod s'il en a une, sinon sa variante par défaut. Voir [Mods & Intégrations](../guide/mods-integrations) pour les détails, y compris la migration des anciens paquets.

## Android <Badge platform="android" />

La version Android charge des mods natifs : des bibliothèques `.so` qui s'exécutent dans le processus du jeu. Gardez les configurations moddées dans des versions isolées et n'installez que des mods de sources fiables. Pour en créer un, suivez [Android native mods](https://levimc.org/LeviLamina/developer_guides/android/) dans la documentation de LeviLamina.

## Pages liées

- [Mods & Intégrations](../guide/mods-integrations)
- [Instances & versions du jeu](./instances)
- [Ligne de commande](../reference/command-line)
