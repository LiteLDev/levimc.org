// Traditional Chinese translations (the kit chrome's words: 專案, 社群, 網誌, 文檔)
import type en from "./en";

const zhHant: typeof en = {
  // Navigation
  nav: {
    home: "首頁",
    projects: "專案",
    about: "關於",
    community: "社群",
    support: "支持我們",
  },

  // Hero section
  hero: {
    badge: "現已推出",
    title1: "隨心所欲",
    title2: "開發模組。",
    description: "輕量、模組化、多功能的模組載入器，適用於",
    descriptionHighlight: "Minecraft 基岩版",
    descriptionEnd: "。使用",
    descriptionLanguages: "開發，或透過 LegacyScriptEngine 使用",
    listSeparator: "、",
    descriptionLSE: "。",
    getStarted: "快速開始",
    documentation: "文檔",
    stars: "GitHub 星標",
    forks: "Forks",
    languages: "開發語言",
  },

  // About page
  about: {
    pageTitle: "關於 LeviMC",
    pageSubtitle: "一個小團隊的故事。",
    intro:
      "LeviMC(原LiteLDev)起始於2021年1月27日，最初的目的是開發一款替代BedrockX的基岩版專用伺服器（Bedrock Dedicated Server）外掛載入器，也就是LiteLoaderBDS，起初只有三人。\n\n後來LiteXLoader開發團隊的成員也加入了LeviMC，隨著時間的推移，團隊逐漸壯大。\n\n在2021年12月9日，LiteLoaderBDS迭代到了v2.0版本，將LiteXLoader併入了LiteLoaderBDS，開始從BedrockX的技術路線上開始發展創新，首次引入了延遲載入機制實現了無需在標頭檔中呼叫符號查詢函式實現函式的呼叫，以及完成了自研的標頭檔生成系統。\n\n後來由於LiteLoaderBDS的程式碼庫中的歷史遺留問題，LeviMC決定從頭開始開發一款全新的模組載入器，2023年12月1日，LeviLamina發佈了，吸取了LiteLoaderBDS過於耦合的經驗教訓，採用了模組化的設計理念，極大的提升了載入器的可維護性和擴展性，並且進一步優化了標頭檔生成，進一步優化了鉤子（Hook），引入了諸多新特性。",
    question1Title: "LeviLamina來自哪裡？",
    question1Body:
      "LeviLamina從基岩版專用伺服器的深處出現，從LiteLoaderBDS專案的種子中發芽。\n\nMinecraft 基岩版的最初版本缺乏Minecraft Java版中存在的廣泛的模組和伺服器外掛生態系統，從而限制了其遊戲可能性。一群精通基岩版專用伺服器的C++愛好者，進行了分析，並利用逆向工程技術和鉤子注入機制，干預了遊戲伺服器的執行，從而開創了第一套伺服器模組的開發。\n\n然而，這種開發範式遇到了一些挑戰。首先，缺乏底層框架的支援，使得模組開發過程中需要依賴各種低階工具來進行符號分析、注入實現、鉤子註冊等功能。這導致了不同模組之間的程式碼冗餘和重複，以及潛在的衝突。其次，缺乏明確的型別定義，迫使開發者在建立模組時進行逆向工程分析，導致了開發門檻的提高和效率的降低。\n\n為了應對這些困境，前期專案LiteLoaderBDS的維護者，構建了一個基於注入的模組載入引擎和一個模組開發框架。此外，他們還提供了型別資訊，使模組開發者無需深入瞭解底層原理就能建立模組。這大大降低了模組開發的入門難度，促進了模組生態系統的繁榮。\n\n然而，隨著LiteLoaderBDS的進展，一些問題也暴露出來。早期的設計沒有考慮到未來的發展，使得許多方面過時和難以使用現代化的工具，從而無法滿足最新的效能要求。此外，它的緊耦合設計在適應新版本的基岩版專用伺服器時也需要付出巨大的努力。因此，LeviMC決定從頭開始，利用現有的專業知識，進行全面的框架重設計，培育一個對維護者、開發者和使用者都友好的模組引擎。",
    question2Title: "為什麼LiteLoaderBDS更名為LeviLamina？",
    question2Body:
      "哦，這真是一個故事！您看，LiteLoaderBDS一開始只是一個小笑話，一個有趣的實驗。但你瞧，它的生長速度比服用類固醇的苦力怕還要快！\n\n起初，我們注意到LiteLoaderBDS這個名字聽起來與Minecraft Java版的模組載入器LiteLoader驚人地相似。因此，我們靈機一動，在其上加上了“BDS”後綴，以凸顯自己的特色。聰明吧？\n\n但隨著LiteLoaderBDS2.0的擴展，它開始像自助餐上的小豬一樣膨脹起來。它的效能急劇下降，讓我們摸不著頭腦。\n\n就在那時，我們做出了一個大膽的決定，從頭開始重建整個專案。隨著我們更深入地研究改造過程，很明顯，一個新的開始值得一個全新的綽號。因此，我們涉足了拉丁語根源的古老藝術，保留了人們喜愛的縮寫“ll”，瞧！LeviLamina誕生了，這個名字與我們宏偉的創造相稱。",
    valueOneTitle: "開發者優先",
    teamTitle: "團隊成員",
    teamSubtitle: "認識我們的團隊成員。",
    badgeWhere: "起源",
    badgeWhy: "緣由",
    members: {
      "OEOTYAN": { role: "團隊負責人", bio: "領導 LeviMC 專案，把握專案方向。LeviLamina 維護者。" },
      "dreamguxiang": { role: "啟動器作者", bio: "LeviLauncher（Windows 版與 Android 版）的作者，LeviLamina 開發者。" },
      "KawaiiNahida": { role: "標頭檔產生器維護者", bio: "維護標頭檔產生系統，確保標頭檔高效準確。LeviAntiCheat 作者。" },
      "RimuruChan": { role: "標頭檔產生器維護者", bio: "維護標頭檔產生系統，確保標頭檔高效準確。" },
      "Dofes": { role: "LeviOptimize 作者", bio: "開發並維護 LeviOptimize——為 LeviLamina 伺服器和用戶端提供效能優化的模組。LeviLamina 與 LegacyScriptEngine 開發者。" },
      "futrime": { role: "lip 作者", bio: "開發並維護通用套件安裝器 lip。LegacyScriptEngine 開發者。" },
      "wu-vincent": { role: "Endstone 作者", bio: "開發並維護 Endstone——廣受歡迎的基岩版專用伺服器外掛載入器。為 LeviStone 提供支援。" },
      "quizhizhe": { role: "MoreDimensions 作者", bio: "透過 MoreDimensions API 為 Minecraft 基岩版帶來自訂維度。LeviLamina 開發者，LiteLoaderBDS 1.16.40 作者。" },
      "Lovelylavender4": { role: "LeviLamina 維護者", bio: "維護 LeviLamina，參與開發與社群支援。" },
      "zimuya4153": { role: "LeviLamina 開發者", bio: "參與 LeviLamina 的開發。" },
      "PA733": { role: "伺服器管理員", bio: "管理伺服器與基礎設施。LeviLamina 與 LiteLoaderBDS 開發者。" },
      "ShrBox": { role: "LeviMC（原 LiteLDev）創始人", bio: "LiteLDev（現 LeviMC）的創始人，LegacyScriptEngine 與 LeviLamina 貢獻者。" },
      "yqs112358": { role: "LiteXLoader 作者", bio: "開發了 LiteXLoader，並為 LiteLoaderBDS 做出貢獻。" },
      "xiaoqch": { role: "LeviLamina 開發者", bio: "參與 LeviLamina 與 LiteLoaderBDS 的開發。" },
      "wzyyyyyyy": { role: "LiteLoaderBDS 開發者", bio: "參與 LiteLoaderBDS 與 LiteXLoader 的開發。" },
      "twoone-3": { role: "LLSE Python 引擎開發者", bio: "為 LLSE 外掛提供 Python 腳本支援。PythonRunner 作者，LiteLoaderBDS 開發者。" },
      "ddf8196": { role: "LeviLamina 開發者", bio: "參與 LeviLamina 的開發。" },
      "Pd233": { role: "LiteLoader.NET 作者", bio: "為 LiteLoaderBDS 提供 .NET 腳本支援。" },
      "Jaciezyt": { role: "LeviLamina 開發者", bio: "為 LeviLamina 與 LiteLoaderBDS 做出貢獻。" },
      "cryx233": { role: "眾多 LiteLoaderBDS 外掛的開發者", bio: "為 LiteLoaderBDS 提供各類外掛，增強伺服器功能。" },
    },
  },

  // Projects section
  projects: {
    label: "生態系統",
    title: "我們的專案",
    moreOnGitHub: "更多專案請訪問 GitHub",
    explore: "探索",
  },

  // Features section
  features: {
    label: "為何選擇 LeviMC",
    title1: "按你的方式",
    title2: "開發模組。",
    description:
      "無論你偏好原生 C++ 的效能，還是腳本語言的靈活性，LeviMC 都能滿足你。一個為可靠性和開發體驗設計的模組化生態。",
    cta: "準備好構建令人驚歎的專案了嗎？",
    ctaDesc: "幾分鐘內即可開始使用 LeviLamina。",
    readDocs: "閱讀文檔",
    // Feature items
    nativeCpp: "原生 C++ 模組",
    nativeCppDesc:
      "使用現代 C++ 編寫高效能模組。透過全面的 API 完全存取遊戲內部。",
    multiLang: "多語言支援",
    multiLangDesc:
      "使用 LegacyScriptEngine，以 JavaScript、Node.js、Lua 或 Python 編寫外掛。入門門檻更低。",
    openSource: "開源",
    openSourceDesc:
      "開源部分採用 LGPL-3.0 授權條款。社群驅動，歡迎在 GitHub 上貢獻。",
    community: "活躍社群",
    communityDesc: "在 Discord 獲取幫助，閱讀文檔，加入不斷壯大的開發者社群。",
  },

  // Community section
  community: {
    title1: "加入",
    title2: "社群。",
    description:
      "與構建基岩版模組未來的開發者們交流。獲取幫助、分享你的模組、為生態做貢獻。",
    joinDiscord: "加入 Discord",
    online: "線上",
    discordMembers: "Discord 成員",
    totalStars: "總星標數",
    onlineNow: "目前線上",
    coreProjects: "核心專案",
    // Community page
    pageTitle: "參與進來",
    pageDesc: "與 LeviMC 社群建立聯絡。",
    discordTitle: "Discord",
    discordDesc: "獲取即時幫助，分享你的模組，與核心團隊和社群成員交流。",
    telegramTitle: "Telegram",
    telegramDesc: "加入我們的 Telegram 群組參與討論和獲取更新。",
    telegramLabel: "社群群組",
    joinTelegram: "加入 Telegram",
    githubTitle: "GitHub",
    githubDesc: "為專案做貢獻、報告問題、瀏覽原始碼。",
    viewOnGitHub: "在 GitHub 檢視",
    qqTitle: "QQ 群組",
    qqDesc: "加入我們的 QQ 群與中文社群交流。",
    qqGroups: "交流群",
  },

  // Support page
  support: {
    pageTitle: "支持 LeviMC",
    pageDesc: "幫助我們建設基岩版模組生態——貢獻程式碼或資助專案。",
    contributeTitle: "貢獻程式碼",
    contributeDesc:
      "挑選一個 Issue、完善文檔或新增新特性。每個 PR 都能幫助社群。",
    contributeCta: "挑選一個 Issue",
    donateTitle: "捐助專案",
    donateDesc: "你的支持能幫助我們維持基礎設施，並投入更多時間開發新功能。",
    donateChannels: "捐助渠道",
    channelAfdian: "愛發電",
    channelOpenCollective: "OpenCollective",
    donorsSectionTitle: "支持者",
    donorsSectionDesc: "十分感謝以下支持者對 LeviMC 的慷慨支持。",
    donorsLoading: "正在從 CSV 載入捐贈者...",
    donorsErrorTitle: "無法載入捐贈資料",
    donorsError: "無法從 donors.csv 讀取捐贈者列表。",
    donorsEmptyTitle: "還沒有捐贈記錄",
    donorsEmpty: "向 public/donors.csv 中新增一行或多行資料後重新整理頁面即可。",
    donorLinkLabel: "開啟連結",
  },


  // Project descriptions
  projects_desc: {
    levilamina: "輕量、模組化、多功能的 Minecraft 基岩版模組載入器。",
    legacyscriptengine: "在 LeviLamina 上執行以 JavaScript、Node.js、Lua 或 Python 編寫的 LLSE 外掛。",
    lip: "通用套件安裝器：一條命令安裝模組及其依賴。",
    levilauncher: "適用於 Windows（GDK / UWP）與 Android 的 Minecraft 基岩版啟動器。",
    levioptimize: "為 LeviLamina 伺服器和用戶端提供效能優化的模組。",
    levianticheat: "為 LeviLamina 伺服器提供反作弊解決方案。",
    moredimensions: "為 Minecraft 基岩版新增自訂維度的 API。",
    levistone: "在 LeviLamina 上執行 Endstone 外掛的執行時。",
    barelyenoughitems: "Minecraft 基岩版的 JEI：瀏覽所有物品，檢視它們的配方與用途。",
    alleviatedbackpacks: "Minecraft 基岩版的 Sophisticated Backpacks：可以安裝升級的背包。",
    bedstones: "Minecraft 基岩版的 Waystones：建造傳送石，在它們之間傳送。",
    beetrootskin: "Minecraft 基岩版的 AppleSkin：檢視食物能恢復多少飢餓值與飽和度。",
    leviheadlessinput: "用測試腳本驅動 LeviLamina 用戶端，不佔用真實的滑鼠和鍵盤，還能同時執行多個遊戲。",
  },
  // 網誌
  blog: {
    name: "LeviMC's blog",
    tagline: "關於開發的一切",
    eyebrow: "網誌",
    sections: "網誌欄目",
    posts: "文章",
    tags: "標籤",
    categories: "分類",
    archives: "歸檔",
    about: "關於",
    friends: "友情連結",
    rss: "RSS",
    latest: "最新文章",
    readMore: "閱讀全文",
    minutes: (n: number) => `${n} 分鐘`,
    postCount: (n: number) => `${n} 篇文章`,
    tagTitle: (name: string) => `標籤：${name}`,
    categoryTitle: (name: string) => `分類：${name}`,
    monthLabel: (y: string, m: string) => `${y} 年 ${Number(m)} 月`,
    archiveTitle: (y: string, m?: string) => (m ? `歸檔：${y} 年 ${Number(m)} 月` : `歸檔：${y} 年`),
    page: (n: number) => `第 ${n} 頁`,
    previousPost: "上一篇",
    nextPost: "下一篇",
    writtenIn: "簡體中文",
    by: "作者",
    comments: "評論",
    commentsLoading: "正在載入評論…",
    commentsFailed: "評論載入失敗。",
    reload: "文章載入失敗，請重新整理頁面",
    backToBlog: "全部文章",
    date: (iso: string) => `${iso.slice(0, 4)} 年 ${Number(iso.slice(5, 7))} 月 ${Number(iso.slice(8, 10))} 日`,
    monthName: (m: string) => `${Number(m)} 月`,
  },
};

export default zhHant;
