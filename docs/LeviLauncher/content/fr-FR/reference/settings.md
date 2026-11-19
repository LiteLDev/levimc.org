---
platforms: [windows]
---
# Tous les paramètres

Tous les paramètres de la page **Paramètres** de la version Windows, onglet par onglet, d'après LeviLauncher 1.1.0, avec la clé `config` qui les modifie depuis la [ligne de commande](./command-line) quand elle existe. Le champ de recherche en haut de la page trouve un paramètre par son nom. Pour des conseils sur ce qu'il faut modifier, voir [Paramètres & Personnalisation](../guide/settings-personalization).

## Paramètres généraux

| Paramètre | Ce qu'il fait | Clé |
| --- | --- | --- |
| **Chemins du contenu → Racine de base** | La racine de données : le dossier qui contient les instances, les téléchargements et les sauvegardes (voir [Dossiers & fichiers](./files)). **Appliquer** enregistre un nouveau dossier, **Réinitialiser** revient à celui par défaut. Les dossiers **Installateurs** et **Versions** sont affichés en dessous. Les données existantes ne sont pas déplacées. | `data-root` |
| **Langue** | La langue du lanceur. | — |
| **Discord Rich Presence** | Affiche votre statut de jeu sur Discord. Activé par défaut. | `discord` |
| **Au lancement de Minecraft** | Ce que fait le lanceur quand Minecraft démarre : **Minimiser le lanceur** (par défaut), **Masquer le lanceur**, **Fermer le lanceur** ou **Laisser le lanceur ouvert**. | `on-game-launch` |
| **À la fermeture de Minecraft** | Ce que fait le lanceur quand Minecraft se ferme : **Rouvrir le lanceur** (par défaut), **Ne rien faire** ou **Fermer le lanceur**. | `on-game-exit` |
| **Masquer dans la zone de notification à la fermeture** | Le bouton de fermeture masque le lanceur dans la zone de notification au lieu de le quitter ; le bouton de réduction réduit toujours dans la barre des tâches. Désactivé par défaut. | `close-to-tray` |

## Personnalisation

L'onglet comporte quatre parties. Les paramètres de personnalisation (couleurs, opacité, etc.) sont enregistrés séparément pour le thème clair et le thème sombre (**Paramètres par mode**) : choisissez **Mode clair** ou **Mode sombre** pour modifier l'un des deux.

### Thème et couleurs

| Paramètre | Ce qu'il fait |
| --- | --- |
| **Mode du thème** | **Mode clair**, **Mode sombre**, **Programmation manuelle** (sombre entre une **Heure de début du mode sombre** et une **Heure de fin du mode sombre**), **Lever/Coucher du soleil** (d'après les heures locales de lever et de coucher du soleil, calculées sur l'appareil) ou **Suivre le système** (le réglage de Windows). |
| **Couleur du thème** | La couleur d'accent : l'une des **Couleurs prédéfinies**, l'une de **Plus de couleurs**, ou une **Couleur personnalisée**. |
| **Mode de base** | Une couleur unie sous l'image d'arrière-plan, pour le contraste : **Aucun**, **Suivre la couleur du thème** ou **Couleur personnalisée**, avec son **Opacité de base**. |

### Disposition et animations

| Paramètre | Ce qu'il fait |
| --- | --- |
| **Utiliser la barre de navigation supérieure** | Une barre de navigation en haut au lieu de la barre latérale verticale. |
| **Désactiver les animations** | Désactive les animations de transition de l'interface. |

### Fond d'écran

| Paramètre | Ce qu'il fait |
| --- | --- |
| **Image d'arrière-plan** | Un dossier d'images à utiliser comme arrière-plan : **Sélectionner un dossier**, **Ouvrir le dossier**, **Effacer le dossier**, et **Image suivante** quand le dossier contient plusieurs images. |
| **Mode d'ajustement** | **Intelligent**, **Centré**, **Ajuster**, **Étirer**, **Mosaïque**, **Haut gauche** ou **Haut droit**. |
| **Ordre de lecture** | **Aléatoire** ou **Séquentiel** (ordre naturel des noms de fichiers). |
| **Flou d'arrière-plan**, **Luminosité de l'arrière-plan**, **Opacité de l'arrière-plan** | La façon dont l'image est affichée. |

### Matériaux et lisibilité

| Paramètre | Ce qu'il fait |
| --- | --- |
| **Matériau de l'interface** | L'aspect de la navigation, des cartes, des onglets, des contrôles et des fenêtres contextuelles au-dessus du fond d'écran. **Préréglages de matériau** : **Équilibré** (par défaut), **Transparent** ou **Opaque**. |
| **Opacité de l'interface**, **Flou de l'interface**, **Voile sur le fond d'écran** | Affinent le matériau. |
| **Protection de la lisibilité** | Garde le texte lisible grâce à une teinte minimale des surfaces, selon le thème, la luminosité de l'image et le flou. |
| **Réinitialiser ce thème** | Restaure le matériau du thème en cours de modification. |

[Paramètres & Personnalisation](../guide/settings-personalization#fond-d-ecran-et-materiau-de-l-interface) explique chacun d'eux.

## Gestion des paquets

| Paramètre | Ce qu'il fait | Clé |
| --- | --- | --- |
| **Nettoyer le cache** | Supprime les fichiers de paquets téléchargés par le gestionnaire de paquets ; à utiliser quand des téléchargements de paquets échouent. | `cache clean packages` |
| **Utiliser des miroirs** | Télécharge les mises à jour du lanceur, les paquets et les listes de versions depuis des miroirs hébergés en Chine continentale. Activé par défaut pour les utilisateurs de Chine continentale. | `mirror` |
| **Proxy GitHub** | Le proxy GitHub utilisé pour télécharger les paquets, affiché tant que **Utiliser des miroirs** est activé : un préréglage, ou **Personnalisé** pour saisir une URL. Vide rétablit la valeur par défaut (`https://gh-proxy.org/https://github.com`). | `github-proxy` |

## Autres

| Paramètre | Ce qu'il fait |
| --- | --- |
| **Gestionnaire de processus → Scanner les processus** | Liste les processus Minecraft en cours ; **Terminer la tâche** en termine un, **Terminer tous les processus** les termine tous. La progression de jeu non sauvegardée peut être perdue. |
| **Fonctionnalités expérimentales → Sauvegarde d'instance (Expérimental)** | Ajoute des actions de sauvegarde et de restauration aux **Paramètres de l'instance**. Un avertissement s'affiche d'abord à l'activation. |

## Confidentialité

| Paramètre | Ce qu'il fait |
| --- | --- |
| **Statistiques d’utilisation (Google Analytics)** | Envoie des statistiques d'utilisation qui aident à améliorer le lanceur. Vous pouvez le désactiver à tout moment. Avec des liens vers les **Conditions de Google Analytics** et les **Règles de confidentialité de Google**. |

## Mises à jour

| Paramètre | Ce qu'il fait | Clé |
| --- | --- | --- |
| **Recevoir les mises à jour Bêta** | Propose aussi les préversions du lanceur. Désactivé par défaut. | `beta-updates` |
| **Version actuelle → Vérifier la mise à jour** | Affiche la version du lanceur et en cherche une plus récente. | `self-update --check` |

## À propos

Les crédits du lanceur et des liens vers LiteLDev sur GitHub et vers la communauté Discord.

## Clés de la ligne de commande {#command-line-keys}

`LeviLauncher.exe config list` affiche chaque clé avec sa valeur et l'origine de la valeur : `set` (enregistrée), `default` (par défaut), `auto` (détectée) ou `lip` (le propre `config.toml` de lip). `config set <key> <value>` modifie une clé, `config unset <key>` lui rend sa valeur par défaut.

| Clé | Valeurs | Signification |
| --- | --- | --- |
| `data-root` | un dossier | L'emplacement des instances, téléchargements et sauvegardes (les données existantes ne sont pas déplacées) |
| `default-instance` | une instance | L'instance utilisée par les commandes quand aucune n'est indiquée (comme `use`) |
| `mirror` | `on`, `off` | Télécharger depuis des miroirs en Chine continentale (non défini : détecté selon la région) |
| `github-proxy` | une URL http(s) | Proxy GitHub pour les téléchargements de mods (utilisé tant que les miroirs sont activés, sauf s'il est défini) |
| `beta-updates` | `on`, `off` | Proposer les préversions du lanceur (par défaut `off`) |
| `discord` | `on`, `off` | Afficher Discord Rich Presence pendant le jeu, depuis la fenêtre du lanceur uniquement (par défaut `on`) |
| `on-game-launch` | `minimize`, `hide`, `close`, `keep` | Ce que fait la fenêtre du lanceur au démarrage du jeu (par défaut `minimize`) |
| `on-game-exit` | `reopen`, `keep`, `close` | Ce que fait la fenêtre du lanceur à la fermeture du jeu (par défaut `reopen`) |
| `close-to-tray` | `on`, `off` | Fermer la fenêtre du lanceur le garde dans la zone de notification (par défaut `off`) |

Clés en lecture seule, affichées par `config list` et `config get` : `instances-dir`, `installers-dir`, `backups-dir`, `cache-dir`, `logs-dir` (les dossiers de [Dossiers & fichiers](./files)) et `config-file` (le fichier des paramètres, `%APPDATA%\LeviLauncher\config.json`).
