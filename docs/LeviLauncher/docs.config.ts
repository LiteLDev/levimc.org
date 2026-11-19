// LeviLauncher user documentation — levimc-kit site config. Built from this folder by levimc.org's deploy since
// 2026-11-16 (before: LiteLDev/LeviLauncher's docs/) and published language first: English at /LeviLauncher/,
// the other languages at /<language>/LeviLauncher/ (/zh-Hans/, /zh-Hant/, /es/, /ru/, /de/, /ja/, /ko/, /fr/); the
// URLs before (/LeviLauncher/zh-CN/…, /LeviLauncher/ja-JP/…) redirect (formerPrefixes).
// One guide for both versions of LeviLauncher (Windows: LiteLDev/LeviLauncher; Android: LiteLDev/LeviLauncher-Android), organised
// by task like mainstream multi-platform docs: where the platforms differ, a page shows `=== "Windows"` /
// `=== "Android"` tabs (one site-wide choice: the visitor's device, their last pick or ?platform=), sections that
// apply to one platform carry a <Badge platform="…" />, and whole pages a `platforms:` frontmatter.
import { defineDocsConfig, type LocaleConfig, type NavEntry } from './kit/docs/node/config.ts';

const repo = 'https://github.com/LiteLDev/LeviLauncher';

// --- Navigation -----------------------------------------------------------------------------------
// The LeviMC navigation model (kit/README.md "Navigation model"), the same four sections on every project's site:
//   Overview  - the home page (what LeviLauncher is, both downloads, a short example), no pages below it;
//   Guides    - one task per page: Core Workflows (the Download page first), Advanced, then the Help group
//               (troubleshooting, community & feedback);
//   Concepts  - how it works: instances and game versions, instance isolation, how mods are loaded;
//   Reference - the complete interface: the Windows command line, every setting, the folders and files, the Android
//               Quick Launch URIs, and the Android app's privacy policy.
// Guide pages stay in guide/ (their URLs are unchanged); the new pages are in concepts/ and reference/. The Download
// page is also in the resources slot of the site column (`header.links`), next to the repository's GitHub link
// (`repo`). Every label is translated in the tables below, for each of the nine locales.

interface SidebarLabels {
  coreWorkflows: string;
  versions: string;
  downloads: string;
  content: string;
  advanced: string;
  mods: string;
  worldTools: string;
  settings: string;
  help: string;
  troubleshooting: string;
  faq: string;
  accounts: string;
  privacy: string;
  instances: string;
  isolation: string;
  modLoading: string;
  commandLine: string;
  allSettings: string;
  files: string;
  quickLaunchUri: string;
}

/** The sections of one locale; `prefix` is the locale's route prefix ('/' or '/ja/'). */
function buildNav(prefix: string, t: SidebarLabels, n: NavLabels): NavEntry[] {
  return [
    // the home page: what LeviLauncher is and where to get it (no pages below it)
    { text: n.overview, link: prefix },
    { text: n.guides, items: buildGuides(`${prefix}guide/`, prefix, t, n) },
    {
      text: n.concepts,
      items: [
        { text: t.instances, link: `${prefix}concepts/instances` },
        { text: t.isolation, link: `${prefix}concepts/isolation` },
        { text: t.modLoading, link: `${prefix}concepts/mod-loading` },
      ],
    },
    {
      text: n.reference,
      items: [
        // Windows
        { text: t.commandLine, link: `${prefix}reference/command-line` },
        { text: t.allSettings, link: `${prefix}reference/settings` },
        { text: t.files, link: `${prefix}reference/files` },
        // Android
        { text: t.quickLaunchUri, link: `${prefix}reference/quick-launch-uri` },
        // the Android app's privacy policy (English, at the site's root; every locale shows it through i18n.fallback)
        { text: t.privacy, link: `${prefix}privacy-policy` },
      ],
    },
  ];
}

function buildGuides(guide: string, prefix: string, t: SidebarLabels, n: NavLabels): NavEntry[] {
  return [
    {
      text: t.coreWorkflows,
      items: [
        // the Download page offers both versions and selects the visitor's (tabs named after the platforms)
        { text: n.download, link: `${prefix}download` },
        { text: t.versions, link: `${guide}version-management` },
        { text: t.downloads, link: `${guide}downloads-mirrors` },
        { text: t.content, link: `${guide}content-management` },
        { text: t.accounts, link: `${guide}accounts-quick-launch` },
      ],
    },
    {
      text: t.advanced,
      items: [
        { text: t.mods, link: `${guide}mods-integrations` },
        { text: t.worldTools, link: `${guide}world-tools` },
        { text: t.settings, link: `${guide}settings-personalization` },
      ],
    },
    {
      text: t.help,
      items: [
        { text: t.troubleshooting, link: `${guide}update-troubleshooting` },
        { text: t.faq, link: `${guide}faq-community-feedback` },
      ],
    },
  ];
}

const SIDEBAR: Record<string, SidebarLabels> = {
  'en-US': {
    coreWorkflows: 'Core Workflows',
    versions: 'Version Management',
    downloads: 'Downloads & Mirrors',
    content: 'Content Management',
    advanced: 'Advanced Features',
    mods: 'Mods & Integrations',
    worldTools: 'World Tools',
    settings: 'Settings & Personalization',
    help: 'Help',
    troubleshooting: 'Update & Troubleshooting',
    faq: 'Community & Feedback',
    accounts: 'Accounts & Quick Launch',
    privacy: 'Privacy Policy (Android)',
    instances: 'Instances & Game Versions',
    isolation: 'Instance Isolation',
    modLoading: 'How Mods Are Loaded',
    commandLine: 'Command Line',
    allSettings: 'All Settings',
    files: 'Folders & Files',
    quickLaunchUri: 'Quick Launch URIs (Android)',
  },
  'es-ES': {
    coreWorkflows: 'Flujos principales',
    versions: 'Gestión de versiones',
    downloads: 'Descargas y espejos',
    content: 'Gestión de contenido',
    advanced: 'Funciones avanzadas',
    mods: 'Mods e integraciones',
    worldTools: 'Herramientas para mundos',
    settings: 'Ajustes y personalización',
    help: 'Ayuda',
    troubleshooting: 'Actualizaciones y solución de problemas',
    faq: 'Preguntas frecuentes, comunidad y comentarios',
    accounts: 'Cuentas e inicio rápido',
    privacy: 'Política de privacidad (Android)',
    instances: 'Instancias y versiones del juego',
    isolation: 'Aislamiento de instancias',
    modLoading: 'Cómo se cargan los mods',
    commandLine: 'Línea de comandos',
    allSettings: 'Todos los ajustes',
    files: 'Carpetas y archivos',
    quickLaunchUri: 'URI de inicio rápido (Android)',
  },
  'zh-CN': {
    coreWorkflows: '核心功能',
    versions: '版本管理',
    downloads: '下载与镜像',
    content: '内容管理',
    advanced: '高级功能',
    mods: '模组与集成',
    worldTools: '世界工具',
    settings: '设置与个性化',
    help: '帮助',
    troubleshooting: '更新与故障排查',
    faq: '社区与反馈',
    accounts: '账号与快速启动',
    privacy: '隐私政策（Android）',
    instances: '实例与游戏版本',
    isolation: '实例隔离',
    modLoading: '模组如何加载',
    commandLine: '命令行',
    allSettings: '全部设置',
    files: '文件夹与文件',
    quickLaunchUri: '快速启动 URI（Android）',
  },
  'zh-HK': {
    coreWorkflows: '核心功能',
    versions: '版本管理',
    downloads: '下載與鏡像',
    content: '內容管理',
    advanced: '進階功能',
    mods: '模組與整合',
    worldTools: '世界工具',
    settings: '設定與個人化',
    help: '協助',
    troubleshooting: '更新與故障排查',
    faq: '社群與回饋',
    accounts: '帳號與快速啟動',
    privacy: '私隱政策（Android）',
    instances: '實例與遊戲版本',
    isolation: '實例隔離',
    modLoading: '模組如何載入',
    commandLine: '命令列',
    allSettings: '全部設定',
    files: '資料夾與檔案',
    quickLaunchUri: '快速啟動 URI（Android）',
  },
  'ru-RU': {
    coreWorkflows: 'Основные рабочие процессы',
    versions: 'Управление версиями',
    downloads: 'Загрузки и зеркала',
    content: 'Управление контентом',
    advanced: 'Расширенные функции',
    mods: 'Моды и интеграции',
    worldTools: 'Инструменты для миров',
    settings: 'Настройки и персонализация',
    help: 'Помощь',
    troubleshooting: 'Обновление и устранение неполадок',
    faq: 'ЧаВО, сообщество и обратная связь',
    accounts: 'Аккаунты и быстрый запуск',
    privacy: 'Политика конфиденциальности (Android)',
    instances: 'Инстансы и версии игры',
    isolation: 'Изоляция инстансов',
    modLoading: 'Как загружаются моды',
    commandLine: 'Командная строка',
    allSettings: 'Все настройки',
    files: 'Папки и файлы',
    quickLaunchUri: 'URI быстрого запуска (Android)',
  },
  'de-DE': {
    coreWorkflows: 'Kernabläufe',
    versions: 'Versionsverwaltung',
    downloads: 'Downloads & Spiegel',
    content: 'Inhaltsverwaltung',
    advanced: 'Erweiterte Funktionen',
    mods: 'Mods & Integrationen',
    worldTools: 'Welt-Tools',
    settings: 'Einstellungen & Personalisierung',
    help: 'Hilfe',
    troubleshooting: 'Update & Fehlerbehebung',
    faq: 'FAQ, Community & Feedback',
    accounts: 'Konten & Schnellstart',
    privacy: 'Datenschutzerklärung (Android)',
    instances: 'Instanzen & Spielversionen',
    isolation: 'Instanz-Isolierung',
    modLoading: 'Wie Mods geladen werden',
    commandLine: 'Befehlszeile',
    allSettings: 'Alle Einstellungen',
    files: 'Ordner & Dateien',
    quickLaunchUri: 'Schnellstart-URIs (Android)',
  },
  'ja-JP': {
    coreWorkflows: 'コア機能',
    versions: 'バージョン管理',
    downloads: 'ダウンロードとミラー',
    content: 'コンテンツ管理',
    advanced: '高度な機能',
    mods: 'Mod と統合',
    worldTools: 'ワールドツール',
    settings: '設定とカスタマイズ',
    help: 'ヘルプ',
    troubleshooting: '更新とトラブルシューティング',
    faq: 'FAQ、コミュニティ、フィードバック',
    accounts: 'アカウントとクイック起動',
    privacy: 'プライバシーポリシー（Android）',
    instances: 'インスタンスとゲームバージョン',
    isolation: 'インスタンスの隔離',
    modLoading: 'Mod の読み込み',
    commandLine: 'コマンドライン',
    allSettings: 'すべての設定',
    files: 'フォルダーとファイル',
    quickLaunchUri: 'クイック起動 URI（Android）',
  },
  'ko-KR': {
    coreWorkflows: '핵심 워크플로우',
    versions: '버전 관리',
    downloads: '다운로드 및 미러',
    content: '콘텐츠 관리',
    advanced: '고급 기능',
    mods: '모드 및 통합',
    worldTools: '월드 도구',
    settings: '설정 및 개인화',
    help: '도움말',
    troubleshooting: '업데이트 및 문제 해결',
    faq: '자주 묻는 질문, 커뮤니티 및 피드백',
    accounts: '계정 및 빠른 실행',
    privacy: '개인정보 처리방침(Android)',
    instances: '인스턴스와 게임 버전',
    isolation: '인스턴스 격리',
    modLoading: '모드 로드 방식',
    commandLine: '명령줄',
    allSettings: '모든 설정',
    files: '폴더 및 파일',
    quickLaunchUri: '빠른 실행 URI(Android)',
  },
  'fr-FR': {
    coreWorkflows: 'Fonctionnalités principales',
    versions: 'Gestion des versions',
    downloads: 'Téléchargements & Miroirs',
    content: 'Gestion du contenu',
    advanced: 'Fonctionnalités avancées',
    mods: 'Mods & Intégrations',
    worldTools: 'Outils pour les mondes',
    settings: 'Paramètres & Personnalisation',
    help: 'Aide',
    troubleshooting: 'Mises à jour & Dépannage',
    faq: 'FAQ, communauté & Retour',
    accounts: 'Comptes & Lancement rapide',
    privacy: 'Politique de confidentialité (Android)',
    instances: 'Instances & versions du jeu',
    isolation: 'Isolation des instances',
    modLoading: 'Chargement des mods',
    commandLine: 'Ligne de commande',
    allSettings: 'Tous les paramètres',
    files: 'Dossiers & fichiers',
    quickLaunchUri: 'URI de lancement rapide (Android)',
  },
};

// The four sections' names (the site column and the sidebar titles) and the Download page's title.
interface NavLabels {
  overview: string;
  guides: string;
  concepts: string;
  reference: string;
  download: string;
}

const NAV: Record<string, NavLabels> = {
  'en-US': { overview: 'Overview', guides: 'Guides', concepts: 'Concepts', reference: 'Reference', download: 'Download' },
  'es-ES': { overview: 'Resumen', guides: 'Guías', concepts: 'Conceptos', reference: 'Referencia', download: 'Descargas' },
  'zh-CN': { overview: '概览', guides: '指南', concepts: '概念', reference: '参考', download: '下载' },
  'zh-HK': { overview: '概覽', guides: '指南', concepts: '概念', reference: '參考', download: '下載' },
  'ru-RU': { overview: 'Обзор', guides: 'Руководства', concepts: 'Концепции', reference: 'Справочник', download: 'Загрузки' },
  'de-DE': { overview: 'Überblick', guides: 'Anleitungen', concepts: 'Konzepte', reference: 'Referenz', download: 'Downloads' },
  'ja-JP': { overview: '概要', guides: 'ガイド', concepts: '概念', reference: 'リファレンス', download: 'ダウンロード' },
  'ko-KR': { overview: '개요', guides: '가이드', concepts: '개념', reference: '참조', download: '다운로드' },
  'fr-FR': { overview: "Vue d'ensemble", guides: 'Guides', concepts: 'Concepts', reference: 'Référence', download: 'Téléchargements' },
};

// --- Locales & UI labels --------------------------------------------------------------------------

// In the order of the LeviMC bar's language menu on every site. levimc.org's one scheme, the language first
// (kit 2.23): /zh-Hans/LeviLauncher/, /zh-Hant/LeviLauncher/, and the short segments of the other languages
// (kit `docsLocales`: /ja/LeviLauncher/ …). The sources stay in their folders (zh-CN/, zh-HK/, ja-JP/ …); every
// prefix a locale was published under after base (/LeviLauncher/zh-Hans/, /LeviLauncher/zh-CN/,
// /LeviLauncher/ja-JP/ …) redirects to the new URLs (formerPrefixes). zh-HK is written by hand, not converted.
const LOCALES: LocaleConfig[] = [
  { code: 'en-US', label: 'English', lang: 'en', prefix: '' },
  { code: 'zh-CN', label: '简体中文', lang: 'zh-Hans', prefix: 'zh-Hans/', folder: 'zh-CN', formerPrefixes: ['zh-Hans/', 'zh-CN/'] },
  { code: 'zh-HK', label: '繁體中文', lang: 'zh-Hant', prefix: 'zh-Hant/', folder: 'zh-HK', formerPrefixes: ['zh-Hant/', 'zh-HK/'] },
  { code: 'es-ES', label: 'Español', lang: 'es', prefix: 'es/', folder: 'es-ES', formerPrefixes: ['es-ES/'] },
  { code: 'ru-RU', label: 'Русский', lang: 'ru', prefix: 'ru/', folder: 'ru-RU', formerPrefixes: ['ru-RU/'] },
  { code: 'de-DE', label: 'Deutsch', lang: 'de', prefix: 'de/', folder: 'de-DE', formerPrefixes: ['de-DE/'] },
  { code: 'ja-JP', label: '日本語', lang: 'ja', prefix: 'ja/', folder: 'ja-JP', formerPrefixes: ['ja-JP/'] },
  { code: 'ko-KR', label: '한국어', lang: 'ko', prefix: 'ko/', folder: 'ko-KR', formerPrefixes: ['ko-KR/'] },
  { code: 'fr-FR', label: 'Français', lang: 'fr', prefix: 'fr/', folder: 'fr-FR', formerPrefixes: ['fr-FR/'] },
];

// VitePress docFooter / editLink.text / returnToTopLabel / sidebarMenuLabel, as kit UI strings. The LeviMC bar's own
// labels (its theme menu: VitePress's darkModeSwitchLabel) stay the kit's, identical on every LeviMC site.
// `backToTop` (returnToTopLabel) is not rendered: the kit has no back-to-top control; the key is kept so the
// translations apply once it adds one.
interface UiLabels {
  previous: string;
  next: string;
  editPage: string;
  backToTop: string;
  menu: string;
}

const UI: Record<string, UiLabels> = {
  'en-US': { previous: 'Previous page', next: 'Next page', editPage: 'Edit this page on GitHub', backToTop: 'Back to top', menu: 'Menu' },
  'es-ES': { previous: 'Página anterior', next: 'Siguiente página', editPage: 'Editar esta página en GitHub', backToTop: 'Volver arriba', menu: 'Menú' },
  'zh-CN': { previous: '上一页', next: '下一页', editPage: '在 GitHub 上编辑此页', backToTop: '返回顶部', menu: '菜单' },
  'zh-HK': { previous: '上一頁', next: '下一頁', editPage: '在 GitHub 上編輯此頁', backToTop: '返回頂部', menu: '選單' },
  'ru-RU': { previous: 'Предыдущая страница', next: 'Следующая страница', editPage: 'Редактировать эту страницу на GitHub', backToTop: 'Вернуться наверх', menu: 'Меню' },
  'de-DE': { previous: 'Vorherige Seite', next: 'Nächste Seite', editPage: 'Diese Seite auf GitHub bearbeiten', backToTop: 'Zurück nach oben', menu: 'Menü' },
  'ja-JP': { previous: '前のページ', next: '次のページ', editPage: 'GitHub でこのページを編集', backToTop: 'トップに戻る', menu: 'メニュー' },
  'ko-KR': { previous: '이전 페이지', next: '다음 페이지', editPage: 'GitHub에서 이 페이지 편집', backToTop: '맨 위로 돌아가기', menu: '메뉴' },
  'fr-FR': { previous: 'Page précédente', next: 'Page suivante', editPage: 'Modifier cette page sur GitHub', backToTop: 'Retour en haut', menu: 'Menu' },
};


// Old URLs → their new place, under each prefix the locale was published under (formerPrefixes only covers the
// pages that still exist; English: base itself). Relative to base: a redirect under a locale's own prefix also
// answers at its language-first URL (/zh-Hans/LeviLauncher/guide/quick-start as well as
// /LeviLauncher/zh-Hans/guide/quick-start); the new prefixes (/ja/LeviLauncher/ …) never had these pages.
const urlPrefixes = (l: LocaleConfig): string[] => l.formerPrefixes ?? [l.prefix ?? ''];

// The getting-started pages (Quick Start, Requirements & Installation, First Launch) became one tutorial on
// levimc.org, in English, Simplified and Traditional Chinese: levimc.org/tutorials/play/play-with-mods/.
const TUTORIAL: Record<string, string> = {
  'en-US': 'https://levimc.org/tutorials/play/play-with-mods/',
  'zh-CN': 'https://levimc.org/zh-Hans/tutorials/play/play-with-mods/',
  'zh-HK': 'https://levimc.org/zh-Hant/tutorials/play/play-with-mods/',
};
const TUTORIAL_PAGES = ['guide/quick-start', 'guide/requirements-installation', 'guide/first-launch'];

// The separate Android section (android/, live 2026-10-29) became part of the guide; its developer docs moved to
// LeviLamina's (developer_guides/android/).
const LEVILAMINA_ANDROID: Record<string, string> = {
  'en-US': 'https://levimc.org/LeviLamina/developer_guides/android/',
  'zh-CN': 'https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/',
  'zh-HK': 'https://levimc.org/zh-Hant/LeviLamina/developer_guides/android/',
};
const ANDROID_API = ['mod', 'mod-menu', 'config', 'input', 'hook', 'signature', 'patch', 'memory-hook-macros', 'types-and-macros'];
const REDIRECTS: Record<string, string> = Object.fromEntries(
  LOCALES.flatMap((l) => {
    const p = l.prefix ?? '';
    const ll = LEVILAMINA_ANDROID[l.code] ?? LEVILAMINA_ANDROID['en-US']!;
    const tutorial = TUTORIAL[l.code] ?? TUTORIAL['en-US']!;
    return urlPrefixes(l).flatMap((from) => [
      ...TUTORIAL_PAGES.map((page) => [`${from}${page}`, tutorial]),
      [`${from}android/`, `${p}download?platform=android`],
      [`${from}android/guide/getting-started`, `${p}download?platform=android`],
      [`${from}android/guide/features`, `${p}guide/version-management?platform=android`],
      [`${from}android/guide/compatibility`, `${p}guide/faq-community-feedback`],
      [`${from}android/guide/developer`, ll],
      [`${from}android/guide/build`, 'https://github.com/LiteLDev/LeviLauncher-Android#development-setup'],
      [`${from}android/privacy-policy`, `${p}privacy-policy`],
      ...ANDROID_API.map((a) => [`${from}android/api/${a}`, `${ll}api/${a.replace(/-/g, '_')}/`]),
    ]);
  }),
);

const perLocale = <T>(fn: (code: string, prefix: string) => T): Record<string, T> =>
  Object.fromEntries(LOCALES.map((l) => [l.code, fn(l.code, l.prefix ? `/${l.prefix}` : '/')]));

export default defineDocsConfig({
  base: '/LeviLauncher/',
  title: 'LeviLauncher',
  description: 'User documentation for LeviLauncher, the Minecraft Bedrock Edition launcher for Windows (GDK / UWP) and Android.',
  project: 'LeviLauncher',
  // the leaf mark of the app icon, without its tile (public/appicon.png, the full app icon, stays at its URL)
  logo: { src: '/logo.webp', dark: '/logo-dark.webp', alt: 'LeviLauncher' },
  favicon: '/logo.webp',
  ogImage: '/appicon.png',
  contentDir: 'content',
  repo,
  // the sources live here now
  editLink: 'https://github.com/LiteLDev/liteldev.github.io/edit/main/docs/LeviLauncher/content/:path',
  // fallback: a locale without its own page (the Android privacy policy) shows the English one at its own URLs
  i18n: { mode: 'folder', defaultLocale: 'en-US', localeFirst: true, locales: LOCALES, fallback: true },
  urlStyle: 'html',
  cleanUrls: true,
  slug: 'vitepress',
  // MkDocs containers too, for the `=== "Windows"` / `=== "Android"` tabs of the Download page
  markdown: { compat: 'commonmark', lineNumbers: true, containers: { vitepress: true, mkdocs: true } },
  outline: [2, 3],
  lastUpdated: true,
  hostname: 'https://levimc.org',
  sitemap: { hostname: 'https://levimc.org' },
  sidebar: 'tabs',
  nav: perLocale((code, prefix) => buildNav(prefix, SIDEBAR[code]!, NAV[code]!)),
  // the resources slot: Download (this site's page, in the visitor's locale), then the repository's GitHub icon
  header: { links: [{ kind: 'download', link: 'download' }] },
  ui: UI,
  redirects: REDIRECTS,
});
