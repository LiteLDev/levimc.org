// Chinese translations
import type en from "./en";

const zh: typeof en = {
  // Navigation
  nav: {
    home: "首页",
    projects: "项目",
    about: "关于我们",
    community: "社区",
    support: "支持我们",
  },

  // Hero section
  hero: {
    badge: "已发布",
    title1: "随心所欲",
    title2: "开发模组。",
    description: "轻量、模块化的模组加载器，适用于",
    descriptionHighlight: "Minecraft 基岩版",
    descriptionEnd: "。使用",
    descriptionLanguages: "开发，或通过 LegacyScriptEngine 使用",
    descriptionLSE: "。",
    getStarted: "快速开始",
    documentation: "文档",
    stars: "GitHub 星标",
    forks: "Forks",
    languages: "开发语言",
  },

  // About page
  about: {
    pageTitle: "关于 LeviMC",
    pageSubtitle: "一个无名小团队的故事。",
    intro:
      "LeviMC(原LiteLDev)起始于2021年1月27日，最初的目的是开发一款替代BedrockX的Bedrock Dedicated Server插件加载器，也就是LiteLoaderBDS，起初只有三人。\n\n后来LiteXLoader开发团队的成员也加入了LeviMC，随着时间的推移，团队逐渐壮大。\n\n在2021年12月9日，LiteLoaderBDS迭代到了v2.0版本，将LiteXLoader并入了LiteLoaderBDS，开始从BedrockX的技术路线上开始发展创新，首次引入了延迟加载机制实现了无需在头文件中调用符号查找函数实现函数的调用，以及完成了自研的头文件生成系统。\n\n后来由于LiteLoaderBDS的代码库中的历史遗留问题，LeviMC决定从头开始开发一款全新的模组加载器，2023年12月1日，LeviLamina发布了，吸取了LiteLoaderBDS过于耦合的经验教训，采用了模块化的设计理念，极大的提升了加载器的可维护性和扩展性，并且进一步优化了头文件生成，进一步优化了Hook，引入了诸多新特性。",
    question1Title: "LeviLamina来自哪里？",
    question1Body:
      "LeviLamina从Minecraft基岩服务器的深处出现，从LiteLoaderBDS项目的种子中发芽。\n\nMinecraft Bedrock Edition的最初版本缺乏Minecraft Java Edition中存在的广泛的模组和服务器插件生态系统，从而限制了其游戏可能性。一群精通Minecraft Bedrock Server的C++爱好者，进行了分析，并利用逆向工程技术和钩子注入机制，干预了游戏服务器的运行，从而开创了第一套服务器模组的开发。\n\n然而，这种开发范式遇到了一些挑战。首先，缺乏底层框架的支持，使得模组开发过程中需要依赖各种低级工具来进行符号分析、注入实现、钩子注册等功能。这导致了不同模组之间的代码冗余和重复，以及潜在的冲突。其次，缺乏明确的类型定义，迫使开发者在创建模组时进行逆向工程分析，导致了开发门槛的提高和效率的降低。\n\n为了应对这些困境，前期项目LiteLoaderBDS的维护者，构建了一个基于注入的模组加载引擎和一个模组开发框架。此外，他们还提供了类型信息，使模组开发者无需深入了解底层原理就能创建模组。这大大降低了模组开发的入门难度，促进了模组生态系统的繁荣。\n\n然而，随着LiteLoaderBDS的进展，一些问题也暴露出来。早期的设计没有考虑到未来的发展，使得许多方面过时和难以使用现代化的工具，从而无法满足最新的性能要求。此外，它的紧耦合设计在适应新版本的Minecraft Bedrock Server时也需要付出巨大的努力。因此，LeviMC决定从头开始，利用现有的专业知识，进行全面的框架重设计，培育一个对维护者、开发者和用户都友好的模组引擎。。",
    question2Title: "为什么LiteLoaderBDS更名为LeviLamina？",
    question2Body:
      "哦，这真是一个故事！您看，LiteLoaderBDS一开始只是一个小笑话，一个有趣的实验。但你瞧，它的生长速度比服用类固醇的苦力怕还要快！\n\n起初，我们注意到LiteLoaderBDS这个名字听起来与Minecraft Java版本中的mod启动器项目惊人地相似。因此，我们灵机一动，在其上加上了“BDS”后缀，以凸显自己的特色。聪明吧？\n\n但随着LiteLoaderBDS2.0的扩展，它开始像自助餐上的小猪一样膨胀起来。它的性能急剧下降，让我们摸不着头脑。\n\n就在那时，我们做出了一个大胆的决定，从头开始重建整个项目。随着我们更深入地研究改造过程，很明显，一个新的开始值得一个全新的绰号。因此，我们涉足了拉丁语根源的古老艺术，保留了人们喜爱的缩写“ll”，瞧！LeviLamina诞生了，这个名字与我们宏伟的创造相称。",
    valueOneTitle: "开发者优先",
    teamTitle: "团队成员",
    teamSubtitle: "认识我们的团队成员。",
  },

  // Projects section
  projects: {
    label: "生态系统",
    title: "我们的项目",
    moreOnGitHub: "更多项目请访问 GitHub",
    explore: "探索",
    docs: "文档",
    github: "GitHub",
  },

  // Features section
  features: {
    label: "为何选择 LEVIMC",
    title1: "按你的方式",
    title2: "开发模组。",
    description:
      "无论你偏好原生 C++ 的性能，还是脚本语言的灵活性，LeviMC 都能满足你。一个为可靠性和开发体验设计的模块化生态。",
    cta: "准备好构建令人惊叹的项目了吗？",
    ctaDesc: "几分钟内即可开始使用 LeviLamina。",
    readDocs: "阅读文档",
    // Feature items
    nativeCpp: "原生 C++ 模组",
    nativeCppDesc:
      "使用现代 C++ 编写高性能模组。通过全面的 API 完全访问 BDS 内部。",
    multiLang: "多语言支持",
    multiLangDesc:
      "使用 LegacyScriptEngine 支持 JavaScript、Lua 或 Python。更低的入门门槛，同样的能力。",
    openSource: "开源",
    openSourceDesc:
      "LGPL-3.0 许可证。完全透明，社区驱动。欢迎在 GitHub 上贡献。",
    community: "活跃社区",
    communityDesc: "在 Discord 获取帮助，阅读文档，加入不断壮大的开发者社区。",
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
    contributeCta: "查看贡献指南",
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
    levilamina: "轻量、模块化且功能丰富的 Minecraft 基岩版模组加载器。",
    legacyscriptengine: "在 LeviLamina 上运行 JavaScript、Lua 和 Python 插件。",
    lip: "通用包安装器：一条命令安装模组及其依赖。",
    levilaunchroid: "适用于 Android 的 Minecraft 基岩版启动器。",
    levilauncher: "适用于 Windows 的 Minecraft 基岩版 GDK 启动器。",
    levioptimize: "为 LeviLamina 服务器提供性能优化的模组。",
    levianticheat: "为 LeviLamina 服务器提供反作弊解决方案。",
    moredimensions: "为 Minecraft 基岩版世界添加新的维度和生物群系。",
  },
  // 博客
  blog: {
    name: "LeviMC's blog",
    tagline: "Everything about development",
    eyebrow: "博客",
    sections: "博客栏目",
    posts: "文章",
    tags: "标签",
    categories: "分类",
    archives: "归档",
    about: "关于",
    friends: "友链",
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
    writtenIn: "中文",
    by: "作者",
    comments: "评论",
    commentsLoading: "正在加载评论…",
    commentsFailed: "评论加载失败。",
    reload: "文章加载失败，请刷新页面",
    backToBlog: "全部文章",
    date: (iso: string) => `${iso.slice(0, 4)} 年 ${Number(iso.slice(5, 7))} 月 ${Number(iso.slice(8, 10))} 日`,
    monthName: (m: string) => `${Number(m)} 月`,
  },
};

export default zh;
