// English translations
const en = {
  // Navigation
  nav: {
    home: "Home",
    projects: "Projects",
    features: "Features",
    about: "About",
    community: "Community",
    support: "Support Us",
    mods: "Mods",
  },

  // Hero section
  hero: {
    badge: "available",
    title1: "Mod Bedrock",
    title2: "your way.",
    description: "A lightweight, modular mod loader for",
    descriptionHighlight: "Minecraft Bedrock Edition",
    descriptionEnd: ". Write mods in",
    descriptionLanguages: ", or use",
    descriptionLSE: "with LegacyScriptEngine.",
    getStarted: "Get Started",
    documentation: "Documentation",
    stars: "GitHub Stars",
    forks: "Forks",
    languages: "Languages",
  },

  // About page
  about: {
    pageTitle: "About LeviMC",
    pageSubtitle: "The story of a small team.",
    intro:
      "LeviMC (formerly LiteLDev) began on January 27, 2021.\n\n It started as a project to develop a Bedrock Dedicated Server plugin loader to replace BedrockX—LiteLoaderBDS—with an initial team of three.\n\n Later, members of the LiteXLoader team joined and the team grew. On December 9, 2021, LiteLoaderBDS reached v2.0, merging LiteXLoader and introducing innovations beyond the BedrockX approach, including a delay-loading mechanism that enabled function calls without requiring symbol lookup in headers and a custom header-generation system.\n\n Due to legacy issues in the codebase, the team decided to rebuild the mod loader from scratch. On December 1, 2023, LeviLamina was released, adopting a modular design to improve maintainability and extensibility, while further optimizing header generation, hooks, and adding many new features.",
    question1Title: "Where does LeviLamina come from?",
    question1Body:
      "LeviLamina emerges from the depths of Minecraft Bedrock Server, sprouting forth from the seeds of the LiteLoaderBDS project.\n\nThe initial versions of Minecraft Bedrock Edition lacked the extensive mod and server plugin ecosystem present in Minecraft Java Edition, thereby limiting its gameplay possibilities. A collective of C++ enthusiasts, well-versed in Minecraft Bedrock Server, conducted an analysis and utilized reverse engineering techniques and hook injection mechanisms to intervene in the operation of the game server, thus pioneering the development of the first set of server mods.\n\nHowever, this development paradigm encountered several challenges. Primarily, the absence of underlying framework support necessitated the reliance on diverse low-level tools for symbol analysis, injection implementation, hook registration, and other functionalities during mod development. Consequently, this led to code redundancy and duplication across different mods, as well as the potential for unforeseen conflicts among them. Moreover, the lack of explicit type definitions compelled developers to engage in reverse engineering analysis while creating mods, resulting in elevated development barriers and diminished efficiency.\n\nIn response to these predicaments, the maintainers of the precursor project, LiteLoaderBDS, constructed an injection-based mod loading engine and a mod development framework. In addition, they provided type information, enabling mod developers to create mods without requiring an exhaustive comprehension of the underlying principles. This significantly mitigated the entry barriers for mod development and facilitated the flourishing of the mod ecosystem.\n\nNevertheless, as LiteLoaderBDS progressed, certain issues came to the fore. The early design failed to account for future advancements, rendering many aspects obsolete and impeding the utilization of contemporary tools, thereby falling short of meeting the latest performance requirements. Furthermore, its tightly coupled design engendered substantial efforts when adapting to new iterations of Minecraft Bedrock Server. Consequently, LeviMC made the decision to commence from scratch, leveraging existing expertise, and undertaking a comprehensive framework redesign to cultivate a mod engine that promotes user-friendliness for maintainers, developers, and users alike.",
    question2Title: "Why was LiteLoaderBDS renamed to LeviLamina?",
    question2Body:
      "Oh, it's quite a tale! You see, LiteLoaderBDS started off as a little joke, a playful experiment. But lo and behold, it grew faster than a creeper on steroids!\n\nAt first, we noticed that the name LiteLoaderBDS sounded strikingly similar to a mod launcher project in the Minecraft Java version. So, in a moment of genius, we slapped a \"BDS\" suffix on it to differentiate ourselves. Clever, right?\n\nBut as LiteLoaderBDS 2.0 expanded, it started bulking up like a piglet at an all-you-can-eat buffet. Its performance took a nosedive, leaving us scratching our heads.\n\nThat's when we made a bold decision to rebuild the entire project from scratch. And as we delved deeper into the revamping process, it became clear that a fresh start deserved a brand-new moniker. So, we dabbled in the ancient arts of Latin roots, preserving the beloved abbreviation `ll`, and voila! LeviLamina was born, a name befitting our magnificent creation.",
    valueOneTitle: "Developers first",
    teamTitle: "Team members",
    teamSubtitle: "Meet our team members.",
  },

  // Projects section
  projects: {
    label: "ECOSYSTEM",
    title: "Core projects.",
    viewAll: "View all",
    allProjectsTitle: "All Projects",
    allProjectsDesc: "The complete toolkit for Bedrock server development.",
    moreOnGitHub: "More projects on GitHub",
    explore: "Explore",
    docs: "Docs",
    github: "GitHub",
  },

  // Features section
  features: {
    label: "WHY LEVIMC",
    title1: "Build mods",
    title2: "your way.",
    description:
      "Whether you prefer native C++ performance or the flexibility of scripting languages, LeviMC has you covered. A modular ecosystem designed for reliability and developer experience.",
    cta: "Ready to build something amazing?",
    ctaDesc: "Get started with LeviLamina in minutes.",
    readDocs: "Read the Docs",
    // Feature items
    nativeCpp: "Native C++ Mods",
    nativeCppDesc:
      "Write high-performance mods with modern C++. Full access to BDS internals via comprehensive API.",
    multiLang: "Multi-Language",
    multiLangDesc:
      "Use LegacyScriptEngine for JavaScript, Lua, or Python. Lower barrier to entry, same capabilities.",
    openSource: "Open Source",
    openSourceDesc:
      "LGPL-3.0 licensed. Fully transparent, community-driven. Contribute on GitHub.",
    community: "Active Community",
    communityDesc:
      "Get help on Discord, read the docs, and join a growing ecosystem of developers.",
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
    contributeCta: "View contributing guide",
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

  // Footer
  footer: {
    tagline:
      "Building the future of Minecraft Bedrock Server modding. Open source tools for the community, by the community.",
    resources: "Resources",
    ll_documentation: "LeviLamina Documentation",
    lse_documentation: "LegacyScriptEngine Documentation",
    blog: "Blog",
    connect: "Connect",
    copyright: "LeviMC",
  },

  // Project descriptions
  projects_desc: {
    levilamina:
      "A lightweight, modular and versatile mod loader for Minecraft Bedrock Edition.",
    legacyscriptengine:
      "Run JavaScript, Lua, and Python plugins on LeviLamina.",
    levilaunchroid: "A launcher for Minecraft Bedrock Edition on Android.",
    levilauncher: "Minecraft Bedrock Edition GDK Launcher for Windows.",
    levioptimize: "Performance optimization mod for LeviLamina servers.",
    levianticheat: "Anti-cheating solution for LeviLamina servers..",
    moredimensions:
      "Expand your Minecraft Bedrock world with new dimensions and biomes.",
  },
};

export default en;
