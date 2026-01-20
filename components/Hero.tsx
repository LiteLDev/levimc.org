import React, { useState, useEffect } from 'react';
import { ArrowRight, Blocks, BookOpen } from 'lucide-react';
import { getLatestRelease, getRepoInfo, formatStarCount } from '../services/githubService';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

interface HeroProps {
  onNavigate: (page: string) => void;
}

// Code examples for different languages
const CODE_EXAMPLES = {
  cpp: {
    name: 'main.cpp',
    icon: 'C++',
    content: (
      <>
        <div className="text-zinc-500">// Listen to player join events</div>
        <div>
          <span className="text-purple-400">using</span>
          <span className="text-zinc-300"> namespace </span>
          <span className="text-blue-400">ll</span>
          <span className="text-zinc-300">::</span>
          <span className="text-blue-400">event</span>
          <span className="text-zinc-300">;</span>
        </div>
        <div>
          <span className="text-purple-400">auto</span>
          <span className="text-zinc-300">&amp; eventBus = </span>
          <span className="text-blue-400">EventBus</span>
          <span className="text-zinc-300">::</span>
          <span className="text-blue-400">getInstance</span>
          <span className="text-zinc-300">();</span>
        </div>
        <div className="pt-2">
          <span className="text-zinc-300">eventBus.</span>
          <span className="text-blue-400">emplaceListener</span>
          <span className="text-zinc-300">&lt;</span>
          <span className="text-yellow-400">PlayerJoinEvent</span>
          <span className="text-zinc-300">&gt;(</span>
        </div>
        <div className="pl-4">
          <span className="text-zinc-300">[](</span>
          <span className="text-yellow-400">PlayerJoinEvent</span>
          <span className="text-zinc-300">&amp; ev) {'{'}</span>
        </div>
        <div className="pl-8">
          <span className="text-purple-400">auto</span>
          <span className="text-zinc-300">&amp; player = ev.</span>
          <span className="text-blue-400">self</span>
          <span className="text-zinc-300">();</span>
        </div>
        <div className="pl-8">
          <span className="text-zinc-300">player.</span>
          <span className="text-blue-400">sendMessage</span>
          <span className="text-zinc-300">(</span>
          <span className="text-lite-400">"Welcome!"</span>
          <span className="text-zinc-300">);</span>
        </div>
        <div className="pl-4"><span className="text-zinc-300">{'}'}</span></div>
        <div><span className="text-zinc-300">);</span></div>
      </>
    ),
  },
  js: {
    name: 'main.js',
    icon: 'JS',
    content: (
      <>
        <div className="text-zinc-500">// LegacyScriptEngine - JavaScript</div>
        <div>
          <span className="text-purple-400">mc</span>
          <span className="text-zinc-300">.</span>
          <span className="text-blue-400">listen</span>
          <span className="text-zinc-300">(</span>
          <span className="text-lite-400">"onJoin"</span>
          <span className="text-zinc-300">, (</span>
          <span className="text-orange-400">player</span>
          <span className="text-zinc-300">) =&gt; {'{'}</span>
        </div>
        <div className="pl-4">
          <span className="text-orange-400">player</span>
          <span className="text-zinc-300">.</span>
          <span className="text-blue-400">tell</span>
          <span className="text-zinc-300">(</span>
          <span className="text-lite-400">"Welcome to the server!"</span>
          <span className="text-zinc-300">);</span>
        </div>
        <div className="pl-4">
          <span className="text-purple-400">log</span>
          <span className="text-zinc-300">(</span>
          <span className="text-lite-400">`${'{'}player.name{'}'} joined`</span>
          <span className="text-zinc-300">);</span>
        </div>
        <div><span className="text-zinc-300">{'}'})</span>;</div>
      </>
    ),
  },
  lua: {
    name: 'main.lua',
    icon: 'Lua',
    content: (
      <>
        <div className="text-zinc-500">-- LegacyScriptEngine - Lua</div>
        <div>
          <span className="text-purple-400">mc</span>
          <span className="text-zinc-300">.</span>
          <span className="text-blue-400">listen</span>
          <span className="text-zinc-300">(</span>
          <span className="text-lite-400">"onJoin"</span>
          <span className="text-zinc-300">,</span>
        </div>
        <div className="pl-4">
          <span className="text-purple-400">function</span>
          <span className="text-zinc-300">(</span>
          <span className="text-orange-400">player</span>
          <span className="text-zinc-300">)</span>
        </div>
        <div className="pl-8">
          <span className="text-orange-400">player</span>
          <span className="text-zinc-300">:</span>
          <span className="text-blue-400">tell</span>
          <span className="text-zinc-300">(</span>
          <span className="text-lite-400">"Welcome!"</span>
          <span className="text-zinc-300">)</span>
        </div>
        <div className="pl-8">
          <span className="text-blue-400">log</span>
          <span className="text-zinc-300">(</span>
          <span className="text-orange-400">player</span>
          <span className="text-zinc-300">.name .. </span>
          <span className="text-lite-400">" joined"</span>
          <span className="text-zinc-300">)</span>
        </div>
        <div className="pl-4"><span className="text-purple-400">end</span></div>
        <div><span className="text-zinc-300">)</span></div>
      </>
    ),
  },
};

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'cpp' | 'js' | 'lua'>('cpp');
  const [version, setVersion] = useState<string | null>(null);
  const [stats, setStats] = useState<{ stars: number; forks: number } | null>(null);
  const { t } = useI18n();
  const { theme } = useTheme();

  useEffect(() => {
    // Fetch latest release version
    getLatestRelease('LiteLDev', 'LeviLamina').then(release => {
      if (release) {
        setVersion(release.tagName);
      }
    });

    // Fetch repo stats
    getRepoInfo('LiteLDev', 'LeviLamina').then(info => {
      if (info) {
        setStats({ stars: info.stars, forks: info.forks });
      }
    });
  }, []);

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden">
      {/* Decorative grid background */}
      <div className={`absolute inset-0 ${theme === 'light' ? 'opacity-[0.04]' : 'opacity-[0.03]'}`} style={{
        backgroundImage: `linear-gradient(rgba(34,197,94,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}></div>

      {/* Floating blocks decoration */}
      <div className={`absolute top-1/4 right-[10%] w-20 h-20 border rounded-lg rotate-12 animate-blob ${theme === 'light' ? 'border-lite-500/30' : 'border-lite-500/20'
        }`}></div>
      <div className={`absolute top-1/3 right-[20%] w-12 h-12 rounded-lg -rotate-6 animate-blob animation-delay-2000 ${theme === 'light' ? 'bg-lite-500/15' : 'bg-lite-500/10'
        }`}></div>
      <div className={`absolute bottom-1/4 left-[5%] w-16 h-16 border rounded-lg rotate-45 animate-blob animation-delay-4000 ${theme === 'light' ? 'border-emerald-500/30' : 'border-emerald-500/20'
        }`}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Main content - takes 7 columns */}
          <div className="lg:col-span-7 space-y-8">
            {/* Version badge - dynamic */}
            <a
              href="https://github.com/LiteLDev/LeviLamina/releases/latest"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border transition-colors ${theme === 'light'
                ? 'bg-white/80 border-stone-200 hover:border-stone-300'
                : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lite-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lite-500"></span>
              </span>
              <span className={`text-sm ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>
                LeviLamina{' '}
                {version ? (
                  <span className="text-lite-500 font-mono">{version}</span>
                ) : (
                  <span className={`inline-block w-12 h-4 rounded animate-pulse align-middle ${theme === 'light' ? 'bg-stone-200' : 'bg-zinc-700'
                    }`}></span>
                )}
                {' '}{t.hero.badge}
              </span>
            </a>

            {/* Title with unique styling */}
            <div className="space-y-2">
              <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.9] ${theme === 'light' ? 'text-stone-900' : 'text-white'
                }`}>
                {t.hero.title1}
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.9]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lite-400 via-emerald-400 to-teal-400">
                  {t.hero.title2}
                </span>
              </h1>
            </div>

            <p className={`text-lg sm:text-xl max-w-xl leading-relaxed ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>
              {t.hero.description} <span className={`font-medium ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.hero.descriptionHighlight}</span>{t.hero.descriptionEnd}{' '}
              <span className="text-lite-500">C++</span>{t.hero.descriptionLanguages} <span className="text-lite-500">JavaScript</span>, <span className="text-lite-500">Lua</span>, <span className="text-lite-500">Python</span> {t.hero.descriptionLSE}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="https://lamina.levimc.org/quickstart/"
                target="_blank"
                rel="noreferrer"
                className="group px-6 py-3 rounded-lg bg-gradient-to-r from-lite-500 to-emerald-500 text-white font-semibold shadow-lg shadow-lite-500/25 hover:shadow-lite-500/40 hover:from-lite-600 hover:to-emerald-600 transition-all flex items-center gap-2"
              >
                {t.hero.getStarted}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://lamina.levimc.org"
                target="_blank"
                rel="noreferrer"
                className={`px-6 py-3 rounded-lg border font-medium transition-all flex items-center gap-2 ${theme === 'light'
                  ? 'bg-white border-stone-200 hover:border-stone-300 text-stone-900'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white'
                  }`}
              >
                <BookOpen className="w-4 h-4" /> {t.hero.documentation}
              </a>
            </div>

            {/* Stats row - dynamic */}
            <div className={`flex flex-wrap items-center gap-8 pt-8 border-t ${theme === 'light' ? 'border-stone-200/50' : 'border-zinc-800/50'
              }`}>
              <div>
                {stats ? (
                  <div className={`text-2xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{formatStarCount(stats.stars)}</div>
                ) : (
                  <div className={`w-12 h-7 rounded animate-pulse ${theme === 'light' ? 'bg-stone-200' : 'bg-zinc-700'}`}></div>
                )}
                <div className={`text-sm ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'}`}>{t.hero.stars}</div>
              </div>
              <div>
                {stats ? (
                  <div className={`text-2xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{stats.forks}+</div>
                ) : (
                  <div className={`w-12 h-7 rounded animate-pulse ${theme === 'light' ? 'bg-stone-200' : 'bg-zinc-700'}`}></div>
                )}
                <div className={`text-sm ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'}`}>{t.hero.forks}</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>4</div>
                <div className={`text-sm ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'}`}>{t.hero.languages}</div>
              </div>
            </div>
          </div>

          {/* Right side - Code examples with tabs */}
          <div className="lg:col-span-5 relative">
            {/* Background card */}
            <div className={`absolute top-4 left-4 right-0 bottom-0 rounded-2xl border ${theme === 'light'
              ? 'bg-stone-100/50 border-stone-200/50'
              : 'bg-zinc-800/30 border-zinc-700/30'
              }`}></div>

            {/* Main card - Code example */}
            <div className={`relative backdrop-blur-xl rounded-2xl border overflow-hidden shadow-2xl ${theme === 'light'
              ? 'bg-white border-stone-200'
              : 'bg-zinc-900/95 border-zinc-800'
              }`}>
              {/* Tab bar */}
              <div className={`flex items-center gap-1 px-4 py-3 border-b overflow-x-auto ${theme === 'light'
                ? 'bg-stone-50 border-stone-200'
                : 'bg-zinc-900 border-zinc-800'
                }`}>
                {Object.entries(CODE_EXAMPLES).map(([key, example]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as 'cpp' | 'js' | 'lua')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap border ${activeTab === key
                      ? theme === 'light'
                        ? 'bg-white text-lite-600 shadow-sm border-stone-200'
                        : 'bg-zinc-700/50 text-lite-400 border-transparent'
                      : theme === 'light'
                        ? 'text-stone-500 hover:text-stone-700 border-transparent hover:bg-stone-100'
                        : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                      }`}
                  >
                    <span className="text-xs font-medium">
                      {example.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Code content */}
              <div className={`p-5 font-mono text-sm space-y-1 min-h-[200px] ${theme === 'light' ? 'code-light-theme' : ''
                }`}>
                {CODE_EXAMPLES[activeTab].content}
              </div>
            </div>

            {/* Floating mini card */}
            <div className={`absolute -bottom-6 -left-6 backdrop-blur-xl rounded-xl border p-4 shadow-xl ${theme === 'light'
              ? 'bg-white/95 border-stone-200'
              : 'bg-zinc-900/95 border-zinc-800'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lite-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Blocks className="w-5 h-5 text-lite-500" />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>Multi-Language</div>
                  <div className={`text-xs ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'}`}>C++, JS, Lua, Python</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
