// The data of the pictures of the tutorial "Play with mods on Windows", over LeviLauncher's own UI preview fixture
// (frontend/e2e/support/ui-fixture.js, window.__audit). It runs right after that fixture, before the app: it sets the
// language, the theme and the state of the launcher for the scene in the URL, and answers the calls of the bindings
// it knows with fake data (an instance "Survival" under D:\LeviLauncher, no Microsoft account signed in, the real
// catalogues of data/catalogues.json), passing every other call to LeviLauncher's fixture.
//
// URL parameters: ?scenario=normal&lang=en_US&scene=<scene>. Scenes (see capture.mjs):
//   onboarding     first launch: nothing set up yet
//   prerequisite   installed (below), but GameInput is missing
//   fresh          set up, nothing downloaded or installed
//   downloaded     the newest version with LeviLamina is downloaded, not installed
//   installed      the instance "Survival" is installed with LeviLamina
//   mod            ... and LeviOptimize is installed in it
(() => {
  const params = new URLSearchParams(location.search);
  const scene = params.get('scene') || 'installed';
  const audit = window.__audit;
  const fixtureCall = audit.call;
  const data = window.__levimcShotsData; // set by capture.mjs (versions, the instance, the mod)
  if (!data) throw new Error('levimc-shots: no window.__levimcShotsData; run capture.mjs.');
  const ROOT = 'D:\\LeviLauncher';
  const INSTANCE = data.instance; // { name, gameVersion, leviLamina }
  const installedScenes = ['prerequisite', 'installed', 'mod'];
  const installed = installedScenes.includes(scene);
  // The name the Download page gives the file: "<type> <version>.msixvc", in the folder of the installers.
  const downloadedName = `Release ${INSTANCE.gameVersion}.msixvc`;
  const downloadedFile = `${ROOT}\\installers\\${downloadedName}`;

  // The launcher: its language and the light theme. LeviLauncher's fixture has already answered the terms and the
  // analytics, and set no wallpaper.
  localStorage.setItem('i18nextLng', params.get('lang') || 'en_US');
  localStorage.setItem('app.themeMode', 'light');
  localStorage.removeItem('download.filters');
  if (scene === 'onboarding') localStorage.removeItem('ll.onboarded');
  if (installed) localStorage.setItem('ll.currentVersionName', INSTANCE.name);
  else localStorage.removeItem('ll.currentVersionName');
  audit.baseRoot = ROOT;
  audit.processes = [];

  const meta = () => ({
    name: INSTANCE.name, gameVersion: INSTANCE.gameVersion, type: 'release', packageType: 'gdk',
    enableIsolation: true, enableConsole: false, enableEditorMode: false, launchArgs: '', envVars: '',
    createdAt: '2026-11-12T10:00:00Z', registered: false,
  });
  const leviLamina = () => (installed ? INSTANCE.leviLamina : '');
  const mods = () => (scene === 'mod' ? [{
    name: 'LeviOptimize', entry: 'LeviOptimize.dll', version: data.mod.version, type: 'native', author: 'LiteLDev',
    folder: 'LeviOptimize', description: data.mod.description,
  }] : []);
  const contentRoot = `${ROOT}\\versions\\${INSTANCE.name}\\Minecraft Bedrock`;

  // A finished download, as LeviLauncher keeps it in its downloads list.
  if (scene === 'downloaded') {
    audit.downloads = {
      [downloadedFile]: {
        dest: downloadedFile, fileName: downloadedName, status: 'done', error: '',
        speed: 0, progress: { downloaded: 1, total: 1 },
        installer: { version: INSTANCE.gameVersion, type: 'Release', isLeviLaminaSupported: true },
      },
    };
  } else {
    audit.downloads = {};
  }

  const handlers = {
    GetAppVersion: () => '1.1.0',
    GetIsBeta: () => false,
    GetBaseRoot: () => audit.baseRoot,
    SetBaseRoot: (root) => { audit.baseRoot = root; return ''; },
    ResetBaseRoot: () => { audit.baseRoot = ROOT; return ''; },
    CanWriteToDir: () => true,
    GetInstallerDir: () => `${ROOT}\\installers`,
    GetVersionsDir: () => `${ROOT}\\versions`,
    GetLogsDir: () => `${ROOT}\\logs`,
    GetLanguageNames: () => data.languages.map(([code, language]) => ({ code, language })),
    GetDriveStats: () => ({ total: 512 * 2 ** 30, free: 300 * 2 ** 30 }),
    // No Microsoft account is signed in.
    GetLocalUserId: () => '',
    GetLocalUserGamertag: () => '',
    GetLocalUserGamerPicture: () => '',
    XUserGetState: () => 0,
    GetUserGamertagMap: () => ({}),
    CheckGameLicenses: (xuid) => ({ xuid, release: 'authorized', preview: 'authorized' }),
    RefreshGameLicenses: (xuid) => ({ xuid, release: 'authorized', preview: 'authorized' }),
    // What the game needs: only GameInput is missing in the scene "prerequisite".
    IsGameInputInstalled: () => scene !== 'prerequisite',
    IsGamingServicesInstalled: () => true,
    IsVcRuntimeInstalled: () => true,
    IsMirrorEnabled: () => false,
    NeedsLoaderMigration: () => false,
    CheckUpdate: () => ({ isUpdate: false }),
    TakeSponsorPrompt: () => 0,
    ListMinecraftProcesses: () => [],
    // The catalogues: Minecraft's GDK releases and the LeviLamina versions of each game version.
    FetchHistoricalVersions: () => ({ releaseVersions: data.releaseVersions, previewVersions: [] }),
    FetchLeviLaminaVersionDB: () => data.leviLaminaVersionDB,
    // Made-up latencies, the same every time: the first mirror is the fastest.
    TestMirrorLatencies: (urls) => (urls || []).map((url, i) => ({ url, latencyMs: 38 + i * 23, ok: true })),
    // The instance.
    ListVersionMetas: () => (installed ? [meta()] : []),
    ListVersionMetasWithRegistered: () => (installed ? [meta()] : []),
    GetLocalVersionNames: () => (installed ? [INSTANCE.name] : []),
    GetVersionMeta: () => meta(),
    ListInheritableVersionNames: () => [],
    GetVersionMenuDetails: () => (installed ? [{ name: INSTANCE.name, registered: false, leviLaminaInstalled: true, logoDataUrl: '' }] : []),
    GetVersionLogoDataUrl: () => '',
    ValidateVersionFolderName: () => '',
    GetContentRoots: () => ({
      base: contentRoot, comMojangRoot: `${contentRoot}\\games\\com.mojang`, usersRoot: `${contentRoot}\\users`,
      isIsolation: true, isPreview: false, packageType: 'gdk',
      worlds: `${contentRoot}\\games\\com.mojang\\minecraftWorlds`, resourcePacks: `${contentRoot}\\resource_packs`,
      behaviorPacks: `${contentRoot}\\behavior_packs`, skinPacks: `${contentRoot}\\skin_packs`, screenshots: `${contentRoot}\\Screenshots`,
    }),
    GetContentCounts: () => ({ worlds: 0, resourcePacks: 0, behaviorPacks: 0, skinPacks: 0, screenshots: 0 }),
    ListDir: () => [],
    ListServers: () => [],
    GetAllVersionsStatus: (items) => (items || []).map((item) => ({
      version: item.short, type: item.type, packageType: item.packageType,
      isDownloaded: (scene === 'downloaded' || installed) && item.short === INSTANCE.gameVersion,
      isInstalled: installed && item.short === INSTANCE.gameVersion,
    })),
    GetVersionStatusForPackage: (version, type, packageType) => ({
      version, type, packageType,
      isDownloaded: (scene === 'downloaded' || installed) && version === INSTANCE.gameVersion,
      isInstalled: installed && version === INSTANCE.gameVersion,
    }),
    ResolveDownloadedMsixvc: (version) => (version === INSTANCE.gameVersion && scene !== 'fresh' ? downloadedFile : ''),
    // Mods and LeviLamina in the instance.
    GetMods: () => mods(),
    IsModEnabled: () => true,
    GetLIPPackageInstallStates: (target, keys) =>
      (keys || []).map((identifierKey) => ({ identifierKey, state: handlers.GetLIPPackageInstallState(target, identifierKey) })),
    GetLIPPackageInstallState: (_target, identifierKey) => {
      const isLL = /levilamina/i.test(identifierKey || '');
      const isMod = /levioptimize/i.test(identifierKey || '') && scene === 'mod';
      const on = (isLL && installed) || isMod;
      return { installed: on, explicitInstalled: on, installedVersion: on ? (isLL ? leviLamina() : data.mod.version) : '', error: '' };
    },
    GetLipGithubProxy: () => '',
  };

  audit.call = async (name, ...args) => {
    if (Object.hasOwn(handlers, name)) {
      audit.calls = [...(audit.calls || []), { name, args }];
      await Promise.resolve(); // answers right away, as the Go bindings of these calls do
      return handlers[name](...args);
    }
    return fixtureCall(name, ...args);
  };

  // LeviLauncher's fixture adds a panel of the preview at the bottom right: not part of the launcher.
  const hide = document.createElement('style');
  hide.textContent = 'aside:has(#audit-recover) { display: none !important; }';
  document.head.append(hide);
})();
