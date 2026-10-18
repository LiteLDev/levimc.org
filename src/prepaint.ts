// Blocking <head> script, inlined into index.html at build time (see vite.config.ts). It runs before the
// stylesheet paints, so neither the theme nor the language ever flashes.
import { themeInitScript, THEME_STORAGE_KEY } from '../kit/components/theme.ts';
import { DEFAULT_LOCALE, LOCALE_PENDING_CLASS, LOCALE_STORAGE_KEY } from './i18n/config.ts';

// The old site stored the theme as localStorage["theme"]; move it to the kit key once.
const migrateLegacyTheme =
  `(function(){try{var s=localStorage,o=s.getItem("theme");if(o!==null){` +
  `if((o==="light"||o==="dark")&&s.getItem(${JSON.stringify(THEME_STORAGE_KEY)})===null)s.setItem(${JSON.stringify(THEME_STORAGE_KEY)},o);` +
  `s.removeItem("theme")}}catch(e){}})();`;

// Same rules as getInitialLocale() in src/i18n: the stored choice, else the browser language. The page is
// prerendered in English; for another locale it stays hidden until React has rendered that locale.
const initLocale =
  `(function(){try{var d=document.documentElement,l=null;try{l=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)})}catch(e){}` +
  `if(l!=="en"&&l!=="zh")l=String(navigator.language||"").split("-")[0]==="zh"?"zh":"en";` +
  `if(l!==${JSON.stringify(DEFAULT_LOCALE)}){d.lang=l;d.classList.add(${JSON.stringify(LOCALE_PENDING_CLASS)})}}catch(e){}})();`;

export const PREPAINT_SCRIPT = migrateLegacyTheme + themeInitScript + initLocale;
