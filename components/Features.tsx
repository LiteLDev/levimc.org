import React from 'react';
import { Zap, Globe, Cpu, Terminal, ArrowUpRight, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

const Features: React.FC = () => {
  const { t } = useI18n();
  const { theme } = useTheme();

  const features = [
    {
      title: t.features.nativeCpp,
      description: t.features.nativeCppDesc,
      icon: <Cpu className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: t.features.multiLang,
      description: t.features.multiLangDesc,
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: t.features.openSource,
      description: t.features.openSourceDesc,
      icon: <Globe className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: t.features.community,
      description: t.features.communityDesc,
      icon: <Terminal className="w-5 h-5" />,
      color: 'from-lite-500 to-emerald-500'
    }
  ];

  return (
    <section className="py-32 relative">
      {/* Section divider line */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-transparent ${theme === 'light' ? 'via-stone-300' : 'via-zinc-700'
        }`}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with offset layout */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <div>
            <div className={`inline-flex items-center gap-2 text-sm mb-4 ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'}`}>
              <div className={`w-8 h-px ${theme === 'light' ? 'bg-stone-300' : 'bg-zinc-700'}`}></div>
              {t.features.label}
            </div>
            <h2 className={`text-4xl lg:text-5xl font-bold leading-tight ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>
              {t.features.title1}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lite-500 to-emerald-500">
                {t.features.title2}
              </span>
            </h2>
          </div>
          <div className="lg:pt-12">
            <p className={`text-lg leading-relaxed ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>
              {t.features.description}
            </p>
          </div>
        </div>

        {/* Bento-style feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`group relative backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 ${theme === 'light'
                ? 'bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-100/50'
                : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700'
                }`}
            >
              {/* Gradient corner accent */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.color} rounded-tr-2xl rounded-bl-[100px] transition-opacity ${theme === 'light' ? 'opacity-15 group-hover:opacity-20' : 'opacity-5 group-hover:opacity-10'
                }`}></div>

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4`}>
                {feature.icon}
              </div>

              <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${theme === 'light' ? 'text-stone-800' : 'text-white'}`}>
                {feature.title}
                <ArrowUpRight className={`w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all ${theme === 'light' ? 'text-stone-400 group-hover:text-stone-600' : 'text-zinc-600 group-hover:text-zinc-400'
                  }`} />
              </h3>

              <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-stone-600' : 'text-zinc-500'}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom highlight banner */}
        <div className={`mt-16 relative overflow-hidden rounded-2xl border ${theme === 'light'
          ? 'border-stone-200/80 bg-gradient-to-r from-white via-stone-50 to-white'
          : 'border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/50 to-zinc-900'
          }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-lite-500/5 via-transparent to-emerald-500/5"></div>
          <div className="relative px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'light' ? 'text-stone-800' : 'text-white'}`}>{t.features.cta}</h3>
              <p className={theme === 'light' ? 'text-stone-600' : 'text-zinc-500'}>{t.features.ctaDesc}</p>
            </div>
            <a
              href="https://lamina.levimc.org"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors ${theme === 'light'
                ? 'bg-gradient-to-r from-lite-500 to-emerald-500 text-white hover:from-lite-600 hover:to-emerald-600 shadow-lg shadow-lite-500/20'
                : 'bg-white text-zinc-900 hover:bg-zinc-100'
                }`}
            >
              {t.features.readDocs}
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
