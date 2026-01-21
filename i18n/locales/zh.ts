// Chinese translations
const zh = {
  // Navigation
  nav: {
    home: '首页',
    projects: '项目',
    features: '特性',
    about: '关于我们',
    community: '社区',
    support: '支持我们',
    mods: '模组',
  },

  // Hero section
  hero: {
    badge: '已发布',
    title1: '随心所欲',
    title2: '开发模组。',
    description: '轻量、模块化的模组加载器，适用于',
    descriptionHighlight: 'Minecraft 基岩版',
    descriptionEnd: '。使用',
    descriptionLanguages: '开发，或通过 LegacyScriptEngine 使用',
    descriptionLSE: '。',
    getStarted: '快速开始',
    documentation: '文档',
    stars: 'GitHub 星标',
    forks: 'Forks',
    languages: '开发语言',
  },

  // About page
  about: {
    pageTitle: '关于 LeviMC',
    pageSubtitle: '一个无名小团队的故事。',
    intro: 'LeviMC(原LiteLDev)起始于2021年1月27日，最初的目的是开发一款替代BedrockX的Bedrock Dedicated Server插件加载器，也就是LiteLoaderBDS，起初只有三人。后来LiteXLoader开发团队的成员也加入了LeviMC，随着时间的推移，团队逐渐壮大。在2021年12月9日，LiteLoaderBDS迭代到了v2.0版本，将LiteXLoader并入了LiteLoaderBDS，开始从BedrockX的技术路线上开始发展创新，首次引入了延迟加载机制实现了无需在头文件中调用符号查找函数实现函数的调用，以及完成了自研的头文件生成系统。后来由于LiteLoaderBDS的代码库中的历史遗留问题，LeviMC决定从头开始开发一款全新的模组加载器，2023年12月1日，LeviLamina发布了，吸取了LiteLoaderBDS过于耦合的经验教训，采用了模块化的设计理念，极大的提升了加载器的可维护性和扩展性，并且进一步优化了头文件生成，进一步优化了Hook，引入了诸多新特性。',
    missionTitle: '使命',
    missionBody: '让基岩版模组开发变得触手可及。',
    valuesTitle: '我们在乎什么',
    valueOneTitle: '开发者优先',
    valueOneBody: '为基岩版模组开发者提供海量原版API，并封装易用的接口，确保模组开发体验顺畅。',
    valueTwoTitle: '开源 DNA',
    valueTwoBody: 'LeviMC的发展壮大离不开开源社区，欢迎所有开发者加入我们。',
    teamTitle: '团队成员',
    teamSubtitle: '认识我们的团队成员。',
  },

  // Projects section
  projects: {
    label: '生态系统',
    title: '核心项目',
    viewAll: '查看全部',
    allProjectsTitle: '所有项目',
    allProjectsDesc: '基岩版服务器开发的完整工具集。',
    moreOnGitHub: '更多项目请访问 GitHub',
    explore: '探索',
  },

  // Features section
  features: {
    label: '为何选择 LEVIMC',
    title1: '按你的方式',
    title2: '开发模组。',
    description: '无论你偏好原生 C++ 的性能，还是脚本语言的灵活性，LeviMC 都能满足你。一个为可靠性和开发体验设计的模块化生态。',
    cta: '准备好构建令人惊叹的项目了吗？',
    ctaDesc: '几分钟内即可开始使用 LeviLamina。',
    readDocs: '阅读文档',
    // Feature items
    nativeCpp: '原生 C++ 模组',
    nativeCppDesc: '使用现代 C++ 编写高性能模组。通过全面的 API 完全访问 BDS 内部。',
    multiLang: '多语言支持',
    multiLangDesc: '使用 LegacyScriptEngine 支持 JavaScript、Lua 或 Python。更低的入门门槛，同样的能力。',
    openSource: '开源',
    openSourceDesc: 'LGPL-3.0 许可证。完全透明，社区驱动。欢迎在 GitHub 上贡献。',
    community: '活跃社区',
    communityDesc: '在 Discord 获取帮助，阅读文档，加入不断壮大的开发者社区。',
  },

  // Community section
  community: {
    title1: '加入',
    title2: '社区。',
    description: '与构建基岩版模组未来的开发者们交流。获取帮助、分享你的模组、为生态做贡献。',
    joinDiscord: '加入 Discord',
    online: '在线',
    discordMembers: 'Discord 成员',
    totalStars: '总星标数',
    onlineNow: '当前在线',
    coreProjects: '核心项目',
    // Community page
    pageTitle: '参与进来',
    pageDesc: '与 LeviMC 社区建立联系。',
    discordTitle: 'Discord',
    discordDesc: '获取实时帮助，分享你的模组，与核心团队和社区成员交流。',
    telegramTitle: 'Telegram',
    telegramDesc: '加入我们的 Telegram 群组参与讨论和获取更新。',
    telegramLabel: '社区群组',
    joinTelegram: '加入 Telegram',
    githubTitle: 'GitHub',
    githubDesc: '为项目做贡献、报告问题、浏览源代码。',
    viewOnGitHub: '在 GitHub 查看',
    qqTitle: 'QQ 群组',
    qqDesc: '加入我们的 QQ 群或频道与中文社区交流。',
    qqGroups: '交流群',
    qqChannel: '官方频道',
  },

  // Support page
  support: {
    pageTitle: '支持 LeviMC',
    pageDesc: '帮助我们建设基岩版模组生态——贡献代码或资助项目。',
    contributeTitle: '贡献代码',
    contributeDesc: '挑选一个 Issue、完善文档或添加新特性。每个 PR 都能帮助社区。',
    contributeCta: '查看贡献指南',
    donateTitle: '捐助项目',
    donateDesc: '你的支持能帮助我们维持基础设施，并投入更多时间开发新功能。',
    donateChannels: '捐助渠道',
    channelAfdian: '爱发电',
    channelOpenCollective: 'OpenCollective',
    donorList: '捐赠者列表',
  },

  // Footer
  footer: {
    tagline: '构建 Minecraft 基岩版服务器模组的未来。社区驱动的开源工具。',
    resources: '资源',
    ll_documentation: 'LeviLamina文档',
    lse_documentation: 'LegacyScriptEngine文档',
    blog: '博客',
    connect: '联系我们',
    copyright: 'LeviMC',
  },

  // Project descriptions
  projects_desc: {
    levilamina: '轻量、模块化且功能丰富的 Minecraft 基岩版模组加载器。',
    legacyscriptengine: '在 LeviLamina 上运行 JavaScript、Lua 和 Python 插件。',
    levilaunchroid: '适用于 Android 的 Minecraft 基岩版启动器。',
    levilauncher: '适用于 Windows 的 Minecraft 基岩版 GDK 启动器。',
    levioptimize: '为 LeviLamina 服务器提供性能优化的模组。',
    levianticheat: '为 LeviLamina 服务器提供反作弊解决方案。',
    moredimensions: '为 Minecraft 基岩版世界添加新的维度和生物群系。',
  }
};

export default zh;
