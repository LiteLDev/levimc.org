// The app's languages (state, not part of the URL). Shared with vite.config.ts: the pre-paint script hides the
// page while a visitor whose language is not the prerendered English waits for the switch (appLocales).
export const LOCALES = [
  { code: 'en', lang: 'en', label: 'English', title: 'Mod Bedrock', text: 'your way.', tagline: 'Open-source modding for Minecraft Bedrock Edition.', projects: 'Projects' },
  { code: 'zh-CN', lang: 'zh-CN', label: '简体中文', title: '随心改造', text: '基岩版', tagline: '面向 Minecraft 基岩版的开源模组生态。', projects: '项目' },
  { code: 'zh-HK', lang: 'zh-HK', label: '繁體中文', title: '隨心改造', text: '基岩版', tagline: '面向 Minecraft 基岩版的開源模組生態。', projects: '項目' },
] as const;
