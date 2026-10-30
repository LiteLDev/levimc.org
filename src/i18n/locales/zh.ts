// Chinese translations
import type en from "./en";

const zh: typeof en = {
  // Navigation
  nav: {
    home: "首页",
    projects: "项目",
    about: "关于",
    community: "社区",
    support: "支持我们",
  },

  // Hero section
  hero: {
    title1: "随心所欲",
    title2: "玩转基岩版。",
    tagline:
      "面向 Minecraft 基岩版的开源工具：给玩家的启动器、给服主的模组加载器，以及给模组开发者的 API。",
    eyebrow: "Open source · Bedrock Edition",
    languages: "开发语言",
  },

  // "我想…"：首页顶部给玩家、服主和开发者的选项卡
  roles: {
    label: "我想…",
    play: "玩游戏",
    host: "开服",
    develop: "开发",
    playDesc:
      "LeviLauncher 在 Windows 和 Android 上启动 Minecraft 基岩版：多个游戏版本互不干扰，管理存档和资源包，加载模组游玩。",
    downloadFor: (platform: string) => `下载 ${platform} 版`,
    otherVersion: (platform: string) => `${platform} 版`,
    reqWindows: "Windows 10 或 11 · 来自 Microsoft Store 的 Minecraft",
    reqAndroid: "Android 9 及以上（ARM64）· 来自 Google Play 的 Minecraft 1.21.80 及以上",
    noVersionHere: "LeviLauncher 支持 Windows 和 Android。",
    allDownloads: "全部下载与国内镜像",
    browseMods: "浏览模组",
    hostDesc:
      "在 Windows 10、11 或 Windows Server 上用 LeviLamina 运行基岩版专用服务器，每个模组和插件只需一条 lip 命令即可安装。",
    setupGuide: "开服教程",
    findMods: "寻找服务器模组",
    getLip: "获取 lip",
    latest: "LeviLamina 最新版",
    developDesc:
      "用 C++ 基于 LeviLamina 编写原生模组，用 JavaScript、Lua 或 Python 基于 LegacyScriptEngine 编写插件，或用 LeviLauncher 的 Preloader API 编写 Android 原生模组。",
    firstMod: "编写第一个模组",
    scripting: "脚本插件",
    apiReference: "API 参考",
    androidMods: "Android 模组",
    copy: "复制命令",
    copied: "已复制！",
    terminalInstall: "# 在空文件夹中执行（需已安装 lip）",
    terminalMods: "# 从 LeviMC Mods 添加模组",
    terminalRun: "# 启动服务器",
    launcherFeatures: [
      { title: "版本隔离", desc: "多个游戏版本，数据各自独立。" },
      { title: "模组", desc: "加载 LeviMC Mods 上的或你自己的模组。" },
      { title: "存档与资源包", desc: "导入、导出和备份存档与资源包。" },
      { title: "账户", desc: "游戏前切换 Xbox 账户。" },
    ],
  },

  // About page
  about: {
    pageTitle: "关于 LeviMC",
    pageSubtitle: "一个小团队的故事。",
    intro:
      "LeviMC(原LiteLDev)起始于2021年1月27日，最初的目的是开发一款替代BedrockX的基岩版专用服务器（Bedrock Dedicated Server）插件加载器，也就是LiteLoaderBDS，起初只有三人。\n\n后来LiteXLoader开发团队的成员也加入了LeviMC，随着时间的推移，团队逐渐壮大。\n\n在2021年12月9日，LiteLoaderBDS迭代到了v2.0版本，将LiteXLoader并入了LiteLoaderBDS，开始从BedrockX的技术路线上开始发展创新，首次引入了延迟加载机制实现了无需在头文件中调用符号查找函数实现函数的调用，以及完成了自研的头文件生成系统。\n\n后来由于LiteLoaderBDS的代码库中的历史遗留问题，LeviMC决定从头开始开发一款全新的模组加载器，2023年12月1日，LeviLamina发布了，吸取了LiteLoaderBDS过于耦合的经验教训，采用了模块化的设计理念，极大的提升了加载器的可维护性和扩展性，并且进一步优化了头文件生成，进一步优化了钩子（Hook），引入了诸多新特性。",
    question1Title: "LeviLamina来自哪里？",
    question1Body:
      "LeviLamina从基岩版专用服务器的深处出现，从LiteLoaderBDS项目的种子中发芽。\n\nMinecraft 基岩版的最初版本缺乏Minecraft Java版中存在的广泛的模组和服务器插件生态系统，从而限制了其游戏可能性。一群精通基岩版专用服务器的C++爱好者，进行了分析，并利用逆向工程技术和钩子注入机制，干预了游戏服务器的运行，从而开创了第一套服务器模组的开发。\n\n然而，这种开发范式遇到了一些挑战。首先，缺乏底层框架的支持，使得模组开发过程中需要依赖各种低级工具来进行符号分析、注入实现、钩子注册等功能。这导致了不同模组之间的代码冗余和重复，以及潜在的冲突。其次，缺乏明确的类型定义，迫使开发者在创建模组时进行逆向工程分析，导致了开发门槛的提高和效率的降低。\n\n为了应对这些困境，前期项目LiteLoaderBDS的维护者，构建了一个基于注入的模组加载引擎和一个模组开发框架。此外，他们还提供了类型信息，使模组开发者无需深入了解底层原理就能创建模组。这大大降低了模组开发的入门难度，促进了模组生态系统的繁荣。\n\n然而，随着LiteLoaderBDS的进展，一些问题也暴露出来。早期的设计没有考虑到未来的发展，使得许多方面过时和难以使用现代化的工具，从而无法满足最新的性能要求。此外，它的紧耦合设计在适应新版本的基岩版专用服务器时也需要付出巨大的努力。因此，LeviMC决定从头开始，利用现有的专业知识，进行全面的框架重设计，培育一个对维护者、开发者和用户都友好的模组引擎。",
    question2Title: "为什么LiteLoaderBDS更名为LeviLamina？",
    question2Body:
      "哦，这真是一个故事！您看，LiteLoaderBDS一开始只是一个小笑话，一个有趣的实验。但你瞧，它的生长速度比服用类固醇的苦力怕还要快！\n\n起初，我们注意到LiteLoaderBDS这个名字听起来与Minecraft Java版的模组加载器LiteLoader惊人地相似。因此，我们灵机一动，在其上加上了“BDS”后缀，以凸显自己的特色。聪明吧？\n\n但随着LiteLoaderBDS2.0的扩展，它开始像自助餐上的小猪一样膨胀起来。它的性能急剧下降，让我们摸不着头脑。\n\n就在那时，我们做出了一个大胆的决定，从头开始重建整个项目。随着我们更深入地研究改造过程，很明显，一个新的开始值得一个全新的绰号。因此，我们涉足了拉丁语根源的古老艺术，保留了人们喜爱的缩写“ll”，瞧！LeviLamina诞生了，这个名字与我们宏伟的创造相称。",
    valueOneTitle: "开发者优先",
    teamTitle: "团队成员",
    teamSubtitle: "认识我们的团队成员。",
    badgeWhere: "起源",
    badgeWhy: "缘由",
    members: {
      "OEOTYAN": { role: "团队负责人", bio: "领导 LeviMC 项目，把握项目方向。LeviLamina 维护者。" },
      "dreamguxiang": { role: "启动器作者", bio: "LeviLauncher（Windows 版与 Android 版）的作者，LeviLamina 开发者。" },
      "KawaiiNahida": { role: "头文件生成器维护者", bio: "维护头文件生成系统，确保头文件高效准确。LeviAntiCheat 作者。" },
      "RimuruChan": { role: "头文件生成器维护者", bio: "维护头文件生成系统，确保头文件高效准确。" },
      "Dofes": { role: "LeviOptimize 作者", bio: "开发并维护 LeviOptimize——为 LeviLamina 服务器和客户端提供性能优化的模组。LeviLamina 与 LegacyScriptEngine 开发者。" },
      "futrime": { role: "lip 作者", bio: "开发并维护通用包安装器 lip。LegacyScriptEngine 开发者。" },
      "wu-vincent": { role: "Endstone 作者", bio: "开发并维护 Endstone——广受欢迎的基岩版专用服务器插件加载器。为 LeviStone 提供支持。" },
      "quizhizhe": { role: "MoreDimensions 作者", bio: "通过 MoreDimensions API 为 Minecraft 基岩版带来自定义维度。LeviLamina 开发者，LiteLoaderBDS 1.16.40 作者。" },
      "Lovelylavender4": { role: "LeviLamina 维护者", bio: "维护 LeviLamina，参与开发与社区支持。" },
      "zimuya4153": { role: "LeviLamina 开发者", bio: "参与 LeviLamina 的开发。" },
      "PA733": { role: "服务器管理员", bio: "管理服务器与基础设施。LeviLamina 与 LiteLoaderBDS 开发者。" },
      "ShrBox": { role: "LeviMC（原 LiteLDev）创始人", bio: "LiteLDev（现 LeviMC）的创始人，LegacyScriptEngine 与 LeviLamina 贡献者。" },
      "yqs112358": { role: "LiteXLoader 作者", bio: "开发了 LiteXLoader，并为 LiteLoaderBDS 做出贡献。" },
      "xiaoqch": { role: "LeviLamina 开发者", bio: "参与 LeviLamina 与 LiteLoaderBDS 的开发。" },
      "wzyyyyyyy": { role: "LiteLoaderBDS 开发者", bio: "参与 LiteLoaderBDS 与 LiteXLoader 的开发。" },
      "twoone-3": { role: "LLSE Python 引擎开发者", bio: "为 LLSE 插件提供 Python 脚本支持。PythonRunner 作者，LiteLoaderBDS 开发者。" },
      "ddf8196": { role: "LeviLamina 开发者", bio: "参与 LeviLamina 的开发。" },
      "Pd233": { role: "LiteLoader.NET 作者", bio: "为 LiteLoaderBDS 提供 .NET 脚本支持。" },
      "Jaciezyt": { role: "LeviLamina 开发者", bio: "为 LeviLamina 与 LiteLoaderBDS 做出贡献。" },
      "cryx233": { role: "众多 LiteLoaderBDS 插件的开发者", bio: "为 LiteLoaderBDS 提供各类插件，增强服务器功能。" },
    },
  },

  // Projects section
  projects: {
    label: "生态系统",
    title: "我们的项目",
    moreOnGitHub: "更多项目请访问 GitHub",
    explore: "探索",
  },

  // Features section
  features: {
    label: "为何选择 LeviMC",
    title1: "一个生态，",
    title2: "服务整个基岩版。",
    description:
      "玩家、服主和模组开发者共享同一套开源工具、同一个模组目录和同一个社区。",
    // Feature items
    platforms: "Windows 与 Android",
    platformsDesc:
      "LeviLauncher 在电脑和手机上都能玩；LeviLamina 在 Windows 服务器和客户端上运行模组。",
    oneCommand: "一条命令安装",
    oneCommandDesc:
      "lip 连同依赖一起安装模组，LeviMC Mods 收录每个模组及其安装命令。",
    multiLang: "你熟悉的语言",
    multiLangDesc:
      "用现代 C++ 编写原生模组，或通过 LegacyScriptEngine 用 JavaScript、Node.js、Lua、Python 编写插件。",
    openSource: "开源",
    openSourceDesc:
      "在 GitHub 上开放开发，Discord、Telegram 和 QQ 群里有活跃的社区随时帮忙。",
  },

  // Community section
  community: {
    title1: "加入",
    title2: "社区。",
    description:
      "与构建基岩版模组未来的开发者们交流。获取帮助、分享你的模组、为生态做贡献。",
    joinDiscord: "加入 Discord",
    online: "在线",
    discordMembers: "Discord 成员",
    totalStars: "总星标数",
    onlineNow: "当前在线",
    coreProjects: "核心项目",
    // Community page
    pageTitle: "参与进来",
    pageDesc: "与 LeviMC 社区建立联系。",
    discordTitle: "Discord",
    discordDesc: "获取实时帮助，分享你的模组，与核心团队和社区成员交流。",
    telegramTitle: "Telegram",
    telegramDesc: "加入我们的 Telegram 群组参与讨论和获取更新。",
    telegramLabel: "社区群组",
    joinTelegram: "加入 Telegram",
    githubTitle: "GitHub",
    githubDesc: "为项目做贡献、报告问题、浏览源代码。",
    viewOnGitHub: "在 GitHub 查看",
    qqTitle: "QQ 群组",
    qqDesc: "加入我们的 QQ 群与中文社区交流。",
    qqGroups: "交流群",
  },

  // Support page
  support: {
    pageTitle: "支持 LeviMC",
    pageDesc: "帮助我们建设基岩版模组生态——贡献代码或资助项目。",
    contributeTitle: "贡献代码",
    contributeDesc:
      "挑选一个 Issue、完善文档或添加新特性。每个 PR 都能帮助社区。",
    contributeCta: "挑选一个 Issue",
    donateTitle: "捐助项目",
    donateDesc: "你的支持能帮助我们维持基础设施，并投入更多时间开发新功能。",
    donateChannels: "捐助渠道",
    channelAfdian: "爱发电",
    channelOpenCollective: "OpenCollective",
    donorsSectionTitle: "支持者",
    donorsSectionDesc: "十分感谢以下支持者对 LeviMC 的慷慨支持。",
    donorsLoading: "正在从 CSV 加载捐赠者...",
    donorsErrorTitle: "无法加载捐赠数据",
    donorsError: "无法从 donors.csv 读取捐赠者列表。",
    donorsEmptyTitle: "还没有捐赠记录",
    donorsEmpty: "向 public/donors.csv 中添加一行或多行数据后刷新页面即可。",
    donorLinkLabel: "打开链接",
  },


  // Project descriptions
  projects_desc: {
    levilamina: "轻量、模块化、多功能的 Minecraft 基岩版模组加载器。",
    legacyscriptengine: "在 LeviLamina 上运行以 JavaScript、Node.js、Lua 或 Python 编写的 LLSE 插件。",
    lip: "通用包安装器：一条命令安装模组及其依赖。",
    levilauncher: "适用于 Windows（GDK / UWP）与 Android 的 Minecraft 基岩版启动器。",
    levioptimize: "为 LeviLamina 服务器和客户端提供性能优化的模组。",
    levianticheat: "为 LeviLamina 服务器提供反作弊解决方案。",
    moredimensions: "为 Minecraft 基岩版添加自定义维度的 API。",
    levistone: "在 LeviLamina 上运行 Endstone 插件的运行时。",
    barelyenoughitems: "Minecraft 基岩版的 JEI：浏览所有物品，查看它们的配方与用途。",
    alleviatedbackpacks: "Minecraft 基岩版的 Sophisticated Backpacks：可以安装升级的背包。",
    bedstones: "Minecraft 基岩版的 Waystones：建造传送石，在它们之间传送。",
    beetrootskin: "Minecraft 基岩版的 AppleSkin：查看食物能恢复多少饥饿值与饱和度。",
    bedd: "用测试脚本驱动 LeviLamina 客户端，不占用真实的鼠标和键盘，还能同时运行多个游戏。",
    bedboo: "Minecraft 基岩版的 Mineflayer：让 mineflayer 机器人和它的插件直接连上基岩版专用服务器（BDS）。",
  },
  // 博客
  blog: {
    name: "LeviMC's blog",
    tagline: "关于开发的一切",
    eyebrow: "博客",
    sections: "博客栏目",
    posts: "文章",
    tags: "标签",
    categories: "分类",
    archives: "归档",
    about: "关于",
    friends: "友情链接",
    rss: "RSS",
    latest: "最新文章",
    readMore: "阅读全文",
    minutes: (n: number) => `${n} 分钟`,
    postCount: (n: number) => `${n} 篇文章`,
    tagTitle: (name: string) => `标签：${name}`,
    categoryTitle: (name: string) => `分类：${name}`,
    monthLabel: (y: string, m: string) => `${y} 年 ${Number(m)} 月`,
    archiveTitle: (y: string, m?: string) => (m ? `归档：${y} 年 ${Number(m)} 月` : `归档：${y} 年`),
    page: (n: number) => `第 ${n} 页`,
    previousPost: "上一篇",
    nextPost: "下一篇",
    writtenIn: "简体中文",
    by: "作者",
    comments: "评论",
    commentsLoading: "正在加载评论…",
    commentsFailed: "评论加载失败。",
    reload: "文章加载失败，请刷新页面",
    backToBlog: "全部文章",
    date: (iso: string) => `${iso.slice(0, 4)} 年 ${Number(iso.slice(5, 7))} 月 ${Number(iso.slice(8, 10))} 日`,
    monthName: (m: string) => `${Number(m)} 月`,
  },

  // LeviChan：首页卡片后探出头的头像，以及她的 3D 空间
  levichan: {
    avatar: "谁在那儿？",
    peekTitle: "LeviChan",
    peekText: "把整个网站折叠进 3D 空间，和 LeviChan 见个面。她会留意你的一举一动——多试试吧。",
    enter: (size: string) => `进入 3D 空间（${size}）`,
    notNow: "下次再说",
    loading: "正在召唤 LeviChan…",
    loadFailed: "LeviChan 加载失败。",
    menuTitle: "LeviChan",
    hint: "她会对你的举动作出反应：摸头、戳戳、绕圈、滚动、复制、走开一会儿……网页照常浏览。",
    lookLabel: "看向鼠标",
    look: { auto: "随她心情", always: "一直看", never: "不看" },
    quiet: "少些小动作",
    flat: "网页正对我",
    exit: "退出 3D 空间",
    say: {
      hello: "你好呀！",
      bye: "拜拜～",
      welcomeBack: "欢迎回来！",
      copied: "收到！",
      dizzy: "晕了晕了…",
      stop: "喂！别戳啦！",
      pat: "嘿嘿…",
      mined: "+1 方块！",
      yawn: "哈啊——",
      look: "看这里！",
    },
  },
};

export default zh;
