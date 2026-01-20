import React from 'react';
import { Github, MessageCircle, Hexagon, XIcon, MailIcon, YoutubeIcon, VideoIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import logoUrl from '../icons/logo.svg';

const LogoIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-lg border border-lite-500/40 bg-lite-500/10 text-lite-500 flex items-center justify-center">
    <img src={logoUrl} alt="LeviMC logo" className="w-6 h-6" />
  </div>
);

const Footer: React.FC = () => {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <footer className={`relative z-10 border-t ${theme === 'light' ? 'border-stone-200/80 bg-white' : 'border-zinc-800/50'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <LogoIcon />
              <span className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>
                Levi<span className="text-lite-500">MC</span>
              </span>
            </div>
            <p className={`text-sm leading-relaxed max-w-sm ${theme === 'light' ? 'text-stone-600' : 'text-zinc-500'}`}>
              {t.footer.tagline}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${theme === 'light' ? 'text-stone-500' : 'text-zinc-400'
              }`}>{t.footer.resources}</h4>
            <ul className="space-y-3">
              <li><a href="https://lamina.levimc.org" target="_blank" rel="noreferrer" className={`text-sm transition-colors ${theme === 'light' ? 'text-stone-600 hover:text-stone-900' : 'text-zinc-500 hover:text-white'
                }`}>{t.footer.ll_documentation}</a></li>
              <li><a href="https://lse.levimc.org" target="_blank" rel="noreferrer" className={`text-sm transition-colors ${theme === 'light' ? 'text-stone-600 hover:text-stone-900' : 'text-zinc-500 hover:text-white'
                }`}>{t.footer.lse_documentation}</a></li>
              <li><a href="https://blog.levimc.org" target="_blank" rel="noreferrer" className={`text-sm transition-colors ${theme === 'light' ? 'text-stone-600 hover:text-stone-900' : 'text-zinc-500 hover:text-white'
                }`}>{t.footer.blog}</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${theme === 'light' ? 'text-stone-500' : 'text-zinc-400'
              }`}>{t.footer.connect}</h4>
            <div className="flex gap-4">
              <a href="mailto:contact@levimc.org" target="_blank" rel="noreferrer" className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${theme === 'light'
                ? 'bg-white border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}>
                <MailIcon className="w-5 h-5" />
              </a>
              <a href="https://x.com/levimc_org" target="_blank" rel="noreferrer" className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${theme === 'light'
                ? 'bg-white border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}>
                <XIcon className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@LeviLamina" target="_blank" rel="noreferrer" className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${theme === 'light'
                ? 'bg-white border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-300'
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}>
                <YoutubeIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${theme === 'light' ? 'border-stone-200/80' : 'border-zinc-800/50'
          }`}>
          <p className={`text-sm ${theme === 'light' ? 'text-stone-500' : 'text-zinc-600'}`}>
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
          <p className={`text-xs ${theme === 'light' ? 'text-stone-400' : 'text-zinc-700'}`}>
            Not affiliated with Mojang Studios.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
