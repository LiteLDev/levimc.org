import React, { useState, useEffect } from 'react';
import { Menu, X, Github, Globe, Sun, Moon } from 'lucide-react';
import { useI18n, localeNames, Locale } from '../i18n';
import { useTheme } from '../theme';

interface HeaderProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const LogoIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-lg border border-lite-500/40 bg-lite-500/10 text-lite-500 flex items-center justify-center">
    <img src={"/icons/logo.svg"} alt="LeviMC logo" className="w-6 h-6" />
  </div>
);

const Header: React.FC<HeaderProps> = ({ activePage, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: t.nav.home, href: 'home' },
    { label: t.nav.projects, href: 'projects' },
    { label: t.nav.features, href: 'features' },
    { label: t.nav.community, href: 'community' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? theme === 'light'
          ? 'bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm'
          : 'bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 shadow-sm'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex-shrink-0 flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <LogoIcon />
            <span className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>
              Levi<span className="text-lite-500">MC</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none ${activePage === item.href
                  ? 'text-lite-500 bg-lite-500/10'
                  : theme === 'light'
                    ? 'text-stone-600 hover:text-lite-600'
                    : 'text-zinc-300 hover:text-lite-400'
                  }`}
              >
                {item.label}
              </button>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`theme-toggle border transition-all ${theme === 'light'
                ? 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300'
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:text-white hover:border-zinc-600'
                }`}
              aria-label="Toggle theme"
            >
              <Sun className="icon sun w-5 h-5" />
              <Moon className="icon moon w-5 h-5" />
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md ${theme === 'light'
                  ? 'text-stone-600 hover:text-stone-900'
                  : 'text-zinc-300 hover:text-white'
                  }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm">{locale.toUpperCase()}</span>
              </button>
              {isLangMenuOpen && (
                <div className={`absolute right-0 mt-2 w-32 border rounded-lg shadow-xl overflow-hidden ${theme === 'light'
                  ? 'bg-white border-stone-200'
                  : 'bg-zinc-900 border-zinc-800'
                  }`}>
                  {(Object.keys(localeNames) as Locale[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => { setLocale(lang); setIsLangMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${locale === lang
                        ? 'bg-lite-500/10 text-lite-500'
                        : theme === 'light'
                          ? 'text-stone-600 hover:bg-stone-50'
                          : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                    >
                      {localeNames[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="https://github.com/LiteLDev"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center transition-colors ${theme === 'light' ? 'text-stone-600 hover:text-stone-900' : 'text-zinc-300 hover:text-white'
                }`}
            >
              <Github className="w-5 h-5" />
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`theme-toggle w-10 h-10 border p-2 focus:outline-none rounded-lg ${theme === 'light'
                ? 'bg-white border-stone-200 text-stone-600'
                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300'
                }`}
              aria-label="Toggle theme"
            >
              <Sun className="icon sun w-5 h-5" />
              <Moon className="icon moon w-5 h-5" />
            </button>
            {/* Mobile Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              className={`p-2 focus:outline-none ${theme === 'light' ? 'text-stone-600' : 'text-zinc-300'
                }`}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 focus:outline-none ${theme === 'light' ? 'text-stone-600' : 'text-zinc-300'
                }`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-b ${theme === 'light' ? 'bg-white border-stone-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium focus:outline-none ${activePage === item.href
                  ? 'text-lite-500 bg-lite-500/10'
                  : theme === 'light'
                    ? 'text-stone-600 hover:text-lite-600'
                    : 'text-zinc-300 hover:text-lite-400'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
