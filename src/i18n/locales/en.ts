// English translations
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const en = {
  // Navigation
  nav: {
    home: "Home",
    projects: "Projects",
    about: "About",
    community: "Community",
    support: "Support us",
  },

  // Hero section
  hero: {
    title1: "Mod Bedrock",
    title2: "your way.",
    tagline:
      "Open-source tools for Minecraft Bedrock Edition: a launcher for players, a mod loader for servers, and APIs for mod developers.",
    eyebrow: "Open source · Bedrock Edition",
    languages: "Languages",
  },

  // "I want to…": the hero's tabs for players, server owners and developers
  roles: {
    label: "I want to…",
    play: "Play",
    host: "Run a server",
    develop: "Develop",
    playDesc:
      "LeviLauncher launches Minecraft Bedrock Edition on Windows and Android: keep several game versions side by side, manage worlds and packs, and play with mods.",
    downloadFor: (platform: string) => `Download for ${platform}`,
    otherVersion: (platform: string) => `${platform} version`,
    reqWindows: "Windows 10 or 11 · Minecraft from the Microsoft Store",
    reqAndroid: "Android 9 or later (ARM64) · Minecraft 1.21.80 or later from Google Play",
    noVersionHere: "LeviLauncher runs on Windows and Android.",
    allDownloads: "All downloads & mirrors",
    browseMods: "Browse mods",
    hostDesc:
      "Run Bedrock Dedicated Server with LeviLamina on Windows 10, 11 or Windows Server, then add mods and plugins with one lip command each.",
    setupGuide: "Set up a server",
    findMods: "Find server mods",
    getLip: "Get lip",
    latest: "Latest LeviLamina",
    developDesc:
      "Write native mods in C++ with LeviLamina, plugins in JavaScript, Lua or Python with LegacyScriptEngine, or native Android mods with LeviLauncher's Preloader API.",
    firstMod: "Create your first mod",
    scripting: "Script plugins",
    apiReference: "API reference",
    androidMods: "Android mods",
    copy: "Copy commands",
    copied: "Copied!",
    terminalInstall: "# in an empty folder, with lip installed",
    terminalMods: "# add mods from LeviMC Mods",
    terminalRun: "# start the server",
    launcherFeatures: [
      { title: "Version isolation", desc: "Several game versions, each with its own data." },
      { title: "Mods", desc: "Load mods, from LeviMC Mods or your own." },
      { title: "Worlds & packs", desc: "Import, export and back up worlds and packs." },
      { title: "Accounts", desc: "Switch Xbox accounts before you play." },
    ],
  },

  // About page
  about: {
    pageTitle: "About LeviMC",
    pageSubtitle: "The story of a small team.",
    intro:
      "LeviMC (formerly LiteLDev) began on January 27, 2021.\n\n It started as a project to develop a Bedrock Dedicated Server plugin loader to replace BedrockX—LiteLoaderBDS—with an initial team of three.\n\n Later, members of the LiteXLoader team joined and the team grew. On December 9, 2021, LiteLoaderBDS reached v2.0, merging LiteXLoader and introducing innovations beyond the BedrockX approach, including a delay-loading mechanism that enabled function calls without requiring symbol lookup in headers and a custom header-generation system.\n\n Due to legacy issues in the codebase, the team decided to rebuild the mod loader from scratch. On December 1, 2023, LeviLamina was released. Learning from how tightly coupled LiteLoaderBDS had become, it adopted a modular design that greatly improved maintainability and extensibility, while further optimizing header generation and hooks and adding many new features.",
    question1Title: "Where does LeviLamina come from?",
    question1Body:
      "LeviLamina emerges from the depths of Bedrock Dedicated Server, sprouting forth from the seeds of the LiteLoaderBDS project.\n\nThe initial versions of Minecraft Bedrock Edition lacked the extensive mod and server plugin ecosystem present in Minecraft Java Edition, thereby limiting its gameplay possibilities. A collective of C++ enthusiasts, well-versed in Bedrock Dedicated Server, conducted an analysis and utilized reverse engineering techniques and hook injection mechanisms to intervene in the operation of the game server, thus pioneering the development of the first set of server mods.\n\nHowever, this development paradigm encountered several challenges. Primarily, the absence of underlying framework support necessitated the reliance on diverse low-level tools for symbol analysis, injection implementation, hook registration, and other functionalities during mod development. Consequently, this led to code redundancy and duplication across different mods, as well as the potential for unforeseen conflicts among them. Moreover, the lack of explicit type definitions compelled developers to engage in reverse engineering analysis while creating mods, resulting in elevated development barriers and diminished efficiency.\n\nIn response to these predicaments, the maintainers of the precursor project, LiteLoaderBDS, constructed an injection-based mod loading engine and a mod development framework. In addition, they provided type information, enabling mod developers to create mods without requiring an exhaustive comprehension of the underlying principles. This significantly mitigated the entry barriers for mod development and facilitated the flourishing of the mod ecosystem.\n\nNevertheless, as LiteLoaderBDS progressed, certain issues came to the fore. The early design failed to account for future advancements, rendering many aspects obsolete and impeding the utilization of contemporary tools, thereby falling short of meeting the latest performance requirements. Furthermore, its tightly coupled design engendered substantial efforts when adapting to new versions of Bedrock Dedicated Server. Consequently, LeviMC made the decision to commence from scratch, leveraging existing expertise, and undertaking a comprehensive framework redesign to cultivate a mod engine that promotes user-friendliness for maintainers, developers, and users alike.",
    question2Title: "Why was LiteLoaderBDS renamed to LeviLamina?",
    question2Body:
      "Oh, it's quite a tale! You see, LiteLoaderBDS started off as a little joke, a playful experiment. But lo and behold, it grew faster than a creeper on steroids!\n\nAt first, we noticed that the name LiteLoaderBDS sounded strikingly similar to LiteLoader, a mod loader for Minecraft Java Edition. So, in a moment of genius, we slapped a \"BDS\" suffix on it to differentiate ourselves. Clever, right?\n\nBut as LiteLoaderBDS 2.0 expanded, it started bulking up like a piglet at an all-you-can-eat buffet. Its performance took a nosedive, leaving us scratching our heads.\n\nThat's when we made a bold decision to rebuild the entire project from scratch. And as we delved deeper into the revamping process, it became clear that a fresh start deserved a brand-new moniker. So, we dabbled in the ancient arts of Latin roots, preserving the beloved abbreviation `ll`, and voila! LeviLamina was born, a name befitting our magnificent creation.",
    valueOneTitle: "Developers first",
    teamTitle: "Team members",
    teamSubtitle: "Meet our team members.",
    badgeWhere: "Where",
    badgeWhy: "Why",
    members: {
      "OEOTYAN": { role: "Team Lead", bio: "Leads the LeviMC project, and ensures the project stays on course. Maintainer of LeviLamina." },
      "dreamguxiang": { role: "Author of Launcher", bio: "Author of LeviLauncher (Windows and Android). Developer of LeviLamina." },
      "KawaiiNahida": { role: "Maintainer of Header Generator", bio: "Maintains the header generation system, ensuring efficient and accurate header files. Author of LeviAntiCheat." },
      "RimuruChan": { role: "Maintainer of Header Generator", bio: "Maintains the header generation system, ensuring efficient and accurate header files." },
      "Dofes": { role: "Author of LeviOptimize", bio: "Creates and maintains LeviOptimize, a performance optimization mod for LeviLamina servers and clients. Developer of LeviLamina and LegacyScriptEngine." },
      "futrime": { role: "Author of lip", bio: "Develops and maintains lip, the general package installer. Developer of LegacyScriptEngine." },
      "wu-vincent": { role: "Author of Endstone", bio: "Creates and maintains Endstone, a popular plugin loader for Bedrock Dedicated Server. Provides support for LeviStone." },
      "quizhizhe": { role: "Author of MoreDimensions", bio: "Brings custom dimensions to Minecraft Bedrock Edition with the MoreDimensions API. Developer of LeviLamina, author of LiteLoaderBDS 1.16.40." },
      "Lovelylavender4": { role: "Maintainer of LeviLamina", bio: "Maintains LeviLamina, contributing to its development and community support." },
      "zimuya4153": { role: "Developer of LeviLamina", bio: "Contributes to the development of LeviLamina." },
      "PA733": { role: "Server Administrator", bio: "Manages servers and infrastructure. Developer of LeviLamina and LiteLoaderBDS." },
      "ShrBox": { role: "Creator of LeviMC (formerly LiteLDev)", bio: "Original creator of LiteLDev (now LeviMC) and a contributor to LegacyScriptEngine and LeviLamina." },
      "yqs112358": { role: "Author of LiteXLoader", bio: "Creates LiteXLoader and contributes to LiteLoaderBDS." },
      "xiaoqch": { role: "Developer of LeviLamina", bio: "Contributes to the development of LeviLamina and LiteLoaderBDS." },
      "wzyyyyyyy": { role: "Developer of LiteLoaderBDS", bio: "Contributes to the development of LiteLoaderBDS and LiteXLoader." },
      "twoone-3": { role: "Developer of the LLSE Python engine", bio: "Provides Python scripting for LLSE plugins. Author of PythonRunner, developer of LiteLoaderBDS." },
      "ddf8196": { role: "Developer of LeviLamina", bio: "Contributes to the development of LeviLamina." },
      "Pd233": { role: "Author of LiteLoader.NET", bio: "Provides .NET scripting support for LiteLoaderBDS." },
      "Jaciezyt": { role: "Developer of LeviLamina", bio: "Makes contributions to LeviLamina and LiteLoaderBDS." },
      "cryx233": { role: "Developer of many LiteLoaderBDS plugins", bio: "Provides various plugins for LiteLoaderBDS to enhance server functionality." },
    } as Record<string, { role: string; bio: string }>,
  },

  // Projects section
  projects: {
    label: "ECOSYSTEM",
    title: "Our projects.",
    moreOnGitHub: "More projects on GitHub",
    explore: "Explore",
  },

  // Features section
  features: {
    label: "WHY LEVIMC",
    title1: "One ecosystem",
    title2: "for all of Bedrock.",
    description:
      "Players, server owners and mod developers share the same open-source tools, the same catalogue of mods and the same community.",
    // Feature items
    platforms: "Windows and Android",
    platformsDesc:
      "LeviLauncher plays on PCs and phones; LeviLamina runs mods on Windows servers and clients.",
    oneCommand: "One-command installs",
    oneCommandDesc:
      "lip installs a mod with its dependencies, and LeviMC Mods lists every mod with the command to install it.",
    multiLang: "Your language",
    multiLangDesc:
      "Native mods in modern C++, or plugins in JavaScript, Node.js, Lua or Python with LegacyScriptEngine.",
    openSource: "Open source",
    openSourceDesc:
      "Developed in the open on GitHub, with an active community on Discord and Telegram to help you along.",
  },

  // Community section
  community: {
    title1: "Join the",
    title2: "community.",
    description:
      "Connect with developers building the future of Bedrock modding. Get help, share your mods, and contribute to the ecosystem.",
    joinDiscord: "Join Discord",
    online: "online",
    discordMembers: "Discord Members",
    totalStars: "Total Stars",
    onlineNow: "Online Now",
    coreProjects: "Core Projects",
    // Community page
    pageTitle: "Get Involved",
    pageDesc: "Connect with the LeviMC community.",
    discordTitle: "Discord",
    discordDesc:
      "Get real-time help, share your mods, and chat with the core team and community.",
    telegramTitle: "Telegram",
    telegramDesc: "Join our Telegram group for discussions and updates.",
    telegramLabel: "Community Group",
    joinTelegram: "Join Telegram",
    githubTitle: "GitHub",
    githubDesc:
      "Contribute to the project, report issues, and browse the source code.",
    viewOnGitHub: "View on GitHub",
    qqTitle: "QQ Group",
    qqDesc: "Join our QQ group to communicate with the Chinese community.",
    qqGroups: "Communication Groups",
  },

  // Support page
  support: {
    pageTitle: "Support LeviMC",
    pageDesc:
      "Help us build the Bedrock modding ecosystem—contribute code or support financially.",
    contributeTitle: "Contribute code",
    contributeDesc:
      "Pick an issue, improve docs, or add a feature. Every pull request helps the community.",
    contributeCta: "Find an issue to work on",
    donateTitle: "Donate to the project",
    donateDesc:
      "Your support keeps our infrastructure running and lets us spend more time on features.",
    donateChannels: "Donation channels",
    channelAfdian: "Afdian",
    channelOpenCollective: "OpenCollective",
    donorsSectionTitle: "Supporters",
    donorsSectionDesc:
      "Greatly appreciate the generous support of the following supporters to LeviMC.",
    donorsLoading: "Loading donors from CSV...",
    donorsErrorTitle: "Could not load donor data",
    donorsError: "The donor list could not be loaded from donors.csv.",
    donorsEmptyTitle: "No donor entries yet",
    donorsEmpty:
      "Add one or more rows to public/donors.csv and refresh this page.",
    donorLinkLabel: "Open link",
  },


  // Project descriptions
  projects_desc: {
    levilamina:
      "A lightweight, modular and versatile mod loader for Minecraft Bedrock Edition.",
    legacyscriptengine:
      "Run LLSE plugins written in JavaScript, Node.js, Lua or Python on LeviLamina.",
    lip: "A general package installer: install mods and their dependencies with one command.",
    levilauncher: "A launcher for Minecraft Bedrock Edition on Windows (GDK / UWP) and Android.",
    levioptimize: "Performance optimization mod for LeviLamina servers and clients.",
    levianticheat: "Anti-cheating solution for LeviLamina servers.",
    moredimensions:
      "An API for adding custom dimensions to Minecraft Bedrock Edition.",
    levistone: "A runtime for running Endstone plugins on LeviLamina.",
    barelyenoughitems:
      "Just Enough Items for Minecraft Bedrock Edition: browse every item and look up its recipes and uses.",
    alleviatedbackpacks:
      "Sophisticated Backpacks for Minecraft Bedrock Edition: backpacks with upgrades.",
    bedstones:
      "Waystones for Minecraft Bedrock Edition: build waystones and travel between them.",
    beetrootskin:
      "AppleSkin for Minecraft Bedrock Edition: see the hunger and saturation a food restores.",
    bedd:
      "Drive a LeviLamina client from test scripts without touching the real mouse or keyboard, several games at once.",
    bedboo:
      "Mineflayer for Minecraft Bedrock Edition: run mineflayer bots and their plugins against a Bedrock Dedicated Server.",
  },
  // Blog (levimc.org/blog/) — the chrome around the posts; the posts themselves are in Chinese
  blog: {
    name: "LeviMC's blog",
    tagline: "All about development",
    eyebrow: "Blog",
    sections: "Blog sections",
    posts: "Posts",
    tags: "Tags",
    categories: "Categories",
    archives: "Archives",
    about: "About",
    friends: "Friends",
    rss: "RSS",
    latest: "Latest posts",
    readMore: "Read more",
    minutes: (n: number) => `${n} min read`,
    postCount: (n: number) => (n === 1 ? "1 post" : `${n} posts`),
    tagTitle: (name: string) => `Tag: ${name}`,
    categoryTitle: (name: string) => `Category: ${name}`,
    monthLabel: (y: string, m: string) => `${MONTHS_EN[Number(m) - 1]} ${y}`,
    archiveTitle: (y: string, m?: string) => `Archives: ${m ? `${MONTHS_EN[Number(m) - 1]} ${y}` : y}`,
    page: (n: number) => `Page ${n}`,
    previousPost: "Previous post",
    nextPost: "Next post",
    writtenIn: "Written in Simplified Chinese",
    by: "by",
    comments: "Comments",
    commentsLoading: "Loading comments…",
    commentsFailed: "Comments could not be loaded.",
    reload: "This post could not be loaded — reload the page",
    backToBlog: "All posts",
    date: (iso: string) => `${MONTHS_EN[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}, ${iso.slice(0, 4)}`,
    monthName: (m: string) => MONTHS_EN[Number(m) - 1]!,
  },

  // LeviChan: the avatar peeking from behind the hero card, and her 3D space
  levichan: {
    avatar: "Who's there?",
    peekTitle: "LeviChan",
    peekText: "Fold this site into a 3D space and meet LeviChan. She notices what you do — try a few things.",
    enter: (size: string) => `Enter the 3D space (${size})`,
    notNow: "Not now",
    loading: "Summoning LeviChan…",
    loadFailed: "LeviChan could not be loaded.",
    menuTitle: "LeviChan",
    hint: "She reacts to what you do: pat, poke, circle, scroll, copy, wander off… The page works as usual.",
    lookLabel: "Watch the cursor",
    look: { auto: "Her choice", always: "Always", never: "Never" },
    quiet: "Fewer fidgets",
    flat: "Face the page",
    exit: "Leave the 3D space",
    say: {
      hello: "Hi!",
      bye: "Bye-bye!",
      welcomeBack: "Welcome back!",
      copied: "Got it!",
      dizzy: "@_@",
      stop: "Hey! Stop it!",
      pat: "Ehehe…",
      mined: "+1 block!",
      yawn: "Fwaaah…",
      look: "Look!",
    },
  },
};

export default en;
