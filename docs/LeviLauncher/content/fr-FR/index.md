# LeviLauncher

Lanceur Minecraft Bedrock pour Windows et Android : installez, gérez, isolez, moddez et lancez Minecraft Bedrock Edition sur votre PC Windows ou votre appareil Android.

**Télécharger :** [LeviLauncher pour Windows](https://github.com/LiteLDev/LeviLauncher/releases/latest) · [LeviLauncher pour Android](https://github.com/LiteLDev/LeviLauncher-Android/releases/latest) · la page [Téléchargements](./download) indique ce dont chaque version a besoin et les autres sources de téléchargement.

::: info Windows et Android
LeviLauncher existe en **version Windows** pour Minecraft Bedrock Edition (GDK / UWP) et en **version Android** pour le Minecraft officiel de Google Play. Les deux nécessitent une **licence officielle** du jeu. Il n'existe pas de version iOS, et aucune n'est prévue.
:::

::: tip Commencez ici
Vous découvrez LeviLauncher ? Le tutoriel [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/) (en anglais) vous guide du téléchargement de LeviLauncher jusqu'à votre première partie avec des mods.
:::

## Ce que fait LeviLauncher

- **Axé sur les versions.** Installez, renommez, lancez et supprimez des builds Release ou Preview de Minecraft tout en gardant chaque configuration sous contrôle. Chaque copie installée est une *instance* : voir [Gestion des versions](./guide/version-management) et [Instances & versions du jeu](./concepts/instances).
- **Isolation propre.** Gardez les mondes, les packs et les fichiers du jeu séparés de votre installation AppData par défaut lorsque vous voulez un espace de travail plus sûr : voir [Isolation des instances](./concepts/isolation).
- **Gestion du contenu.** Gérez les mondes, les packs de ressources, les packs de comportements, les packs de skins, les captures d'écran et les listes de serveurs depuis un seul endroit : voir [Gestion du contenu](./guide/content-management).
- **Capacités de Mods.** Importez des paquets de Mods `.mcmod`, parcourez CurseForge et installez LeviLamina et des paquets LIP avec le gestionnaire de paquets intégré pour les configurations avancées : voir [Mods & Intégrations](./guide/mods-integrations) et [Chargement des mods](./concepts/mod-loading).
- **Outils pour les mondes.** Exportez des sauvegardes, consultez les données du monde et modifiez certains champs de `level.dat` sans quitter le lanceur : voir [Outils pour les mondes](./guide/world-tools).
- **Paramètres utilisateur.** Ajustez la langue, l'apparence, le comportement des téléchargements, les choix de confidentialité, les canaux de mise à jour et la gestion des paquets : voir [Paramètres & Personnalisation](./guide/settings-personalization) et [Tous les paramètres](./reference/settings).
- **Extras Android.** Changement de compte Xbox et actions URI de lancement rapide, dans le même lanceur : voir [Comptes & Lancement rapide](./guide/accounts-quick-launch).

## Un court exemple

Sous Windows, tout ce que fait la fenêtre du lanceur peut aussi se faire depuis un terminal. Ces trois commandes installent la dernière build Release de Minecraft comme nouvelle instance avec LeviLamina et en font l'instance par défaut, y ajoutent un mod de [LeviMC Mods](https://levimc.org/mods/), puis lancent le jeu :

```text
LeviLauncher.exe install latest --loader --use
LeviLauncher.exe mod install LiteLDev/LegacyMoney
LeviLauncher.exe play
```

Installer une build GDK nécessite d'être connecté à un compte Microsoft qui possède Minecraft (`LeviLauncher.exe account login`). Dans la fenêtre, les mêmes étapes correspondent à la page **Télécharger**, à la page **LeviMC Mods** et au bouton **Lancer**. La référence [Ligne de commande](./reference/command-line) liste toutes les commandes.

## Contenu de ce site

Cette documentation s'adresse aux **utilisateurs finaux**, et non aux mainteneurs ou développeurs.

- **Guides** : une tâche par page. Obtenez l'application sur la page [Téléchargements](./download), puis gérez les [versions](./guide/version-management), les [téléchargements et miroirs](./guide/downloads-mirrors), le [contenu](./guide/content-management), les [comptes et le lancement rapide](./guide/accounts-quick-launch) (Android), les [mods](./guide/mods-integrations), les [mondes](./guide/world-tools) et les [paramètres](./guide/settings-personalization). Le groupe Aide traite des [mises à jour et du dépannage](./guide/update-troubleshooting) et de la [communauté et des retours](./guide/faq-community-feedback).
- **Concepts** : le fonctionnement de LeviLauncher : [instances et versions du jeu](./concepts/instances) (Release et Preview, GDK et UWP, Windows et Android), [isolation des instances](./concepts/isolation) et [chargement des mods](./concepts/mod-loading).
- **Référence** : la [ligne de commande](./reference/command-line), [tous les paramètres](./reference/settings), les [dossiers et fichiers](./reference/files) qu'utilise LeviLauncher, les [URI de lancement rapide](./reference/quick-launch-uri) d'Android et la [politique de confidentialité](./privacy-policy) de la version Android.

Ordre de lecture recommandé : le tutoriel [Play with mods on Windows](https://levimc.org/tutorials/play/play-with-mods/), puis [Gestion des versions](./guide/version-management) et [Gestion du contenu](./guide/content-management).

## Sources de téléchargement

- **GitHub Releases (Téléchargements de LeviLauncher) :** [LiteLDev/LeviLauncher Releases](https://github.com/LiteLDev/LeviLauncher/releases)
- **Miroir Lanzou Cloud :** [levimc.lanzoue.com/b016ke39hc](https://levimc.lanzoue.com/b016ke39hc) — Mot de passe : `levi`
- **Version Android :** [LiteLDev/LeviLauncher-Android Releases](https://github.com/LiteLDev/LeviLauncher-Android/releases)

## Communauté et retour

- **Discord officiel :** [discord.gg/v5R5P4vRZk](https://discord.gg/v5R5P4vRZk)
- **Serveur Discord personnel :** [discord.gg/VqQaC8vWz8](https://discord.gg/VqQaC8vWz8)
- **Groupe QQ :** [458083875](https://qm.qq.com/q/1z791rJgJG)
- **Signaler un problème :** [GitHub Issues](https://github.com/LiteLDev/LeviLauncher/issues)
