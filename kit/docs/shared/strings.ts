// Docs-engine labels that are not part of the shared chrome strings (components/i18n.ts): the header's
// resources slot and the 404 title. Same 9 UI languages as the chrome; resolved with resolveUiLocale.
import { resolveUiLocale, type UiLocale } from '../../components/i18n.ts';

export interface DocsStrings {
  /** Heading of the resources list in the drawer. */
  resources: string;
  download: string;
  changelog: string;
  /** Accessible name of the repository icon: '{name}' = the project. */
  onGithub: string;
  /** <title> of the 404 page: 'Page not found - <site>' (D7). */
  pageNotFound: string;
}

const STRINGS: Record<UiLocale, DocsStrings> = {
  en: { resources: 'Resources', download: 'Download', changelog: 'Changelog', onGithub: '{name} on GitHub', pageNotFound: 'Page not found' },
  'zh-CN': { resources: '资源', download: '下载', changelog: '更新日志', onGithub: 'GitHub 上的 {name}', pageNotFound: '页面未找到' },
  'zh-HK': { resources: '資源', download: '下載', changelog: '更新日誌', onGithub: 'GitHub 上的 {name}', pageNotFound: '找不到頁面' },
  es: { resources: 'Recursos', download: 'Descargar', changelog: 'Cambios', onGithub: '{name} en GitHub', pageNotFound: 'Página no encontrada' },
  ru: { resources: 'Ресурсы', download: 'Скачать', changelog: 'Изменения', onGithub: '{name} на GitHub', pageNotFound: 'Страница не найдена' },
  de: { resources: 'Ressourcen', download: 'Download', changelog: 'Änderungen', onGithub: '{name} auf GitHub', pageNotFound: 'Seite nicht gefunden' },
  ja: { resources: 'リソース', download: 'ダウンロード', changelog: '変更履歴', onGithub: 'GitHub の {name}', pageNotFound: 'ページが見つかりません' },
  ko: { resources: '리소스', download: '다운로드', changelog: '변경 사항', onGithub: 'GitHub의 {name}', pageNotFound: '페이지를 찾을 수 없음' },
  fr: { resources: 'Ressources', download: 'Télécharger', changelog: 'Nouveautés', onGithub: '{name} sur GitHub', pageNotFound: 'Page introuvable' },
};

export function docsStrings(lang: string | undefined): DocsStrings {
  return STRINGS[resolveUiLocale(lang)];
}
