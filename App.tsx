import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProjectCard from './components/ProjectCard';
import Features from './components/Features';
import Footer from './components/Footer';
import Support from './components/Support';
import About from './components/About';
import { useProjects, PROJECT_CONFIGS } from './constants';
import { ArrowRight } from 'lucide-react';
import { getMultipleRepos, RepoInfo, getDiscordInfo, DiscordInfo } from './services/githubService';
import { I18nContext, useI18nProvider, useI18n } from './i18n';
import { ThemeContext, useThemeProvider, useTheme } from './theme';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const Background: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-stone-50' : 'bg-zinc-950'
      }`}>
      {/* Gradient blobs - work in both themes */}
      <div className={`absolute top-20 left-10 w-80 h-80 rounded-full blur-3xl animate-blob transition-all duration-500 ${theme === 'light'
        ? 'bg-gradient-to-br from-emerald-200/40 to-teal-200/30'
        : 'bg-lite-500/10 mix-blend-screen'
        }`}></div>
      <div className={`absolute top-40 right-10 w-80 h-80 rounded-full blur-3xl animate-blob animation-delay-2000 transition-all duration-500 ${theme === 'light'
        ? 'bg-gradient-to-br from-sky-200/30 to-indigo-200/25'
        : 'bg-blue-500/10 mix-blend-screen'
        }`}></div>
      <div className={`absolute -bottom-8 left-1/2 w-96 h-96 rounded-full blur-3xl animate-blob animation-delay-4000 transition-all duration-500 ${theme === 'light'
        ? 'bg-gradient-to-br from-lime-200/30 to-emerald-200/25'
        : 'bg-emerald-500/10 mix-blend-screen'
        }`}></div>

      {/* Light mode - subtle noise texture */}
      {theme === 'light' && (
        <>
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-300/50 to-transparent"></div>
          {/* Subtle dot pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #78716c 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}></div>
          {/* Soft vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-100/50"></div>
        </>
      )}
    </div>
  );
};

// Hook to fetch GitHub repo data and Discord info
function useExternalData() {
  const [repoData, setRepoData] = useState<Map<string, RepoInfo>>(new Map());
  const [discordInfo, setDiscordInfo] = useState<DiscordInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all data in parallel
    Promise.all([
      // GitHub repos
      getMultipleRepos(PROJECT_CONFIGS.map(p => ({ owner: p.owner, repo: p.repo }))),
      // Discord info - use server ID for widget API
      getDiscordInfo('849252980430864384'),
    ]).then(([repos, discord]) => {
      setRepoData(repos);
      setDiscordInfo(discord);
      setLoading(false);
    });
  }, []);

  return { repoData, discordInfo, loading };
}

interface HomeProps {
  repoData?: Map<string, RepoInfo>;
  discordInfo?: DiscordInfo | null;
  loading?: boolean;
}

const Home: React.FC<HomeProps> = ({ repoData, discordInfo, loading }) => {
  const { t, locale } = useI18n();
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <>
      <Hero />

      {/* Projects section with unique layout */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section header */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 text-sm text-zinc-500 mb-4">
                <div className="w-8 h-px bg-zinc-700"></div>
                {t.projects.label}
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                {t.projects.title}
              </h2>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { navigate('/projects'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
              >
                <span>{t.projects.viewAll}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {useProjects().slice(0, 4).map((project) => {
              const data = repoData?.get(project.id);
              return (
                <ProjectCard
                  key={project.id}
                  project={{
                    ...project,
                    description: data?.description || project.description,
                  }}
                  stars={data?.stars}
                  language={data?.language}
                  loading={loading}
                />
              );
            })}
          </div>
        </div>
      </section>

      <Features />

      {/* Community CTA with unique design */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`relative overflow-hidden rounded-3xl border ${theme === 'light'
            ? 'border-stone-200 bg-white'
            : 'border-zinc-800 bg-zinc-900/50'
            }`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${theme === 'light' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)'} 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>

            <div className="relative px-8 py-16 lg:px-16 lg:py-20">
              {/* Header */}
              <div className="text-center mb-12">
                <h2 className={`text-4xl lg:text-5xl font-bold mb-4 leading-tight ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>
                  {t.community.title1}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 ml-2">
                    {t.community.title2}
                  </span>
                </h2>
                <p className={`text-lg max-w-2xl mx-auto ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>
                  {t.community.description}
                </p>
              </div>

              {/* Community cards */}
              <div className={`grid gap-6 max-w-4xl mx-auto ${locale === 'zh' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                {/* Discord Card */}
                <a
                  href="https://discord.gg/v5R5P4vRZk"
                  target="_blank"
                  rel="noreferrer"
                  className={`group relative rounded-2xl p-6 border transition-all hover:scale-[1.02] ${theme === 'light'
                    ? 'bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100'
                    : 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30 hover:border-indigo-500/60'
                    }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>Discord</h3>
                      {discordInfo && (
                        <div className={`flex items-center gap-1.5 text-sm ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-300'}`}>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          {discordInfo.onlineCount} {t.community.online}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm mb-4 ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.community.discordDesc}</p>
                  <div className={`flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
                    {t.community.joinDiscord}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </a>

                {/* Telegram Card */}
                <a
                  href="https://t.me/LiteLoader"
                  target="_blank"
                  rel="noreferrer"
                  className={`group relative rounded-2xl p-6 border transition-all hover:scale-[1.02] ${theme === 'light'
                    ? 'bg-sky-50 border-sky-200 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-100'
                    : 'bg-gradient-to-br from-sky-600/20 to-cyan-600/20 border-sky-500/30 hover:border-sky-500/60'
                    }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>Telegram</h3>
                      <div className={`text-sm ${theme === 'light' ? 'text-sky-600' : 'text-sky-300'}`}>{t.community.telegramLabel}</div>
                    </div>
                  </div>
                  <p className={`text-sm mb-4 ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.community.telegramDesc}</p>
                  <div className={`flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all ${theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`}>
                    {t.community.joinTelegram}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </a>

                {/* QQ Card - Only show in Chinese */}
                {locale === 'zh' && (
                  <div className={`group relative rounded-2xl p-6 border ${theme === 'light'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/30'
                    }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29 0 2.213.43 6.29.686 6.29 0 0-.687-1.77-1.182-1.77-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.747 2.072.111 0 .281-.36.281-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z" /></svg>
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.community.qqTitle}</h3>
                        <div className={`text-sm ${theme === 'light' ? 'text-red-600' : 'text-red-300'}`}>{t.community.qqGroups}</div>
                      </div>
                    </div>
                    <p className={`text-sm mb-4 ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.community.qqDesc}</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=ndxRXO1HARA8ing7OunMClOz3cQTogL0&authKey=D7QTcqnzhBzuh3zc%2F70FjgklsVvkCImTjSRqHMwYGCLwIFpxzp%2FflC97Y7AUG%2Fpy&noverify=0&group_code=656669024"
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === 'light'
                          ? 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
                          : 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
                          }`}
                      >
                        656669024
                      </a>
                      <a
                        href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=1u0nmmUIZOB716neFTlbyj_2aOQn_TV-&authKey=1lBqM20oOfdKjDnxkq09DjR729fqFfWVnaLQ7VjrDB%2FAg6qwvw6QCwdwYoRUrewU&noverify=0&group_code=937236109"
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === 'light'
                          ? 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
                          : 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
                          }`}
                      >
                        937236109
                      </a>
                      <a
                        href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=3Fxt0gwMYkoLPani_vQ9tsNfYrnVy4hK&authKey=2A%2BNk3jmRaK%2FO1FBQSjTIbStAU1kbZWkjEkyh2RTVA015eTg6c4CvVhfByc1BtGZ&noverify=0&group_code=850517473"
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === 'light'
                          ? 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
                          : 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30'
                          }`}
                      >
                        850517473
                      </a>
                      <a
                        href="https://pd.qq.com/s/a13gu04rv"
                        target="_blank"
                        rel="noreferrer"
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'light'
                          ? 'bg-orange-100 border border-orange-300 text-orange-700 hover:bg-orange-200'
                          : 'bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30'
                          }`}
                      >
                        {t.community.qqChannel}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* GitHub link */}
              <div className="text-center mt-8">
                <a
                  href="https://github.com/LiteLDev"
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 transition-colors text-sm ${theme === 'light' ? 'text-stone-500 hover:text-stone-900' : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                  {t.community.viewOnGitHub}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const ProjectsPage: React.FC<{ repoData?: Map<string, RepoInfo>; loading?: boolean }> = ({ repoData, loading }) => {
  const { t } = useI18n();

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 text-sm text-zinc-500 mb-4">
            <div className="w-8 h-px bg-zinc-700"></div>
            {t.projects.label}
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{t.projects.allProjectsTitle}</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            {t.projects.allProjectsDesc}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useProjects().map((project) => {
            const data = repoData?.get(project.id);
            return (
              <ProjectCard
                key={project.id}
                project={{
                  ...project,
                  description: data?.description || project.description,
                }}
                stars={data?.stars}
                language={data?.language}
                loading={loading}
              />
            );
          })}
          {/* Placeholder */}
          <div className="relative bg-zinc-900/30 backdrop-blur-sm border-2 border-dashed border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center hover:border-zinc-700 transition-colors min-h-[200px]">
            <p className="text-zinc-500 mb-4 text-center">{t.projects.moreOnGitHub}</p>
            <a href="https://github.com/LiteLDev" target="_blank" rel="noreferrer" className="text-lite-400 hover:text-white flex items-center gap-2 text-sm">
              {t.projects.explore} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturesPage: React.FC = () => (
  <div className="pt-32 pb-24 min-h-screen">
    <Features />
  </div>
);

const CommunityPage: React.FC = () => {
  const { t, locale } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className={`inline-flex items-center gap-2 text-sm mb-4 ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'}`}>
            <div className={`w-8 h-px ${theme === 'light' ? 'bg-stone-300' : 'bg-zinc-700'}`}></div>
            {t.nav.community.toUpperCase()}
          </div>
          <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.community.pageTitle}</h1>
          <p className={`text-lg ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.community.pageDesc}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Discord Card */}
          <a
            href="https://discord.gg/v5R5P4vRZk"
            target="_blank"
            rel="noreferrer"
            className={`group relative rounded-2xl p-6 border transition-all hover:scale-[1.02] ${theme === 'light'
              ? 'bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100'
              : 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30 hover:border-indigo-500/60'
              }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>Discord</h3>
                <div className={`text-sm ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-300'}`}>{t.community.telegramLabel}</div>
              </div>
            </div>
            <p className={`text-sm mb-4 ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.community.discordDesc}</p>
            <div className={`flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>
              {t.community.joinDiscord}
              <ArrowRight className="w-4 h-4" />
            </div>
          </a>

          {/* Telegram Card */}
          <a
            href="https://t.me/LiteLoader"
            target="_blank"
            rel="noreferrer"
            className={`group relative rounded-2xl p-6 border transition-all hover:scale-[1.02] ${theme === 'light'
              ? 'bg-sky-50 border-sky-200 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-100'
              : 'bg-gradient-to-br from-sky-600/20 to-cyan-600/20 border-sky-500/30 hover:border-sky-500/60'
              }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-sky-500 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>Telegram</h3>
                <div className={`text-sm ${theme === 'light' ? 'text-sky-600' : 'text-sky-300'}`}>{t.community.telegramLabel}</div>
              </div>
            </div>
            <p className={`text-sm mb-4 ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.community.telegramDesc}</p>
            <div className={`flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all ${theme === 'light' ? 'text-sky-600' : 'text-sky-400'}`}>
              {t.community.joinTelegram}
              <ArrowRight className="w-4 h-4" />
            </div>
          </a>

          {/* GitHub Card */}
          <a
            href="https://github.com/LiteLDev"
            target="_blank"
            rel="noreferrer"
            className={`group relative rounded-2xl p-6 border transition-all hover:scale-[1.02] ${theme === 'light'
              ? 'bg-stone-50 border-stone-200 hover:border-stone-400 hover:shadow-lg hover:shadow-stone-100'
              : 'bg-gradient-to-br from-zinc-700/20 to-zinc-600/20 border-zinc-600/30 hover:border-zinc-500/60'
              }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-zinc-700`}>
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>GitHub</h3>
                <div className={`text-sm ${theme === 'light' ? 'text-stone-500' : 'text-zinc-400'}`}>LiteLDev</div>
              </div>
            </div>
            <p className={`text-sm mb-4 ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.community.githubDesc}</p>
            <div className={`flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all ${theme === 'light' ? 'text-stone-700' : 'text-zinc-300'}`}>
              {t.community.viewOnGitHub}
              <ArrowRight className="w-4 h-4" />
            </div>
          </a>

          {/* QQ Card - Only show in Chinese */}
          {locale === 'zh' && (
            <div className={`group relative rounded-2xl p-6 border ${theme === 'light'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gradient-to-br from-blue-600/20 to-orange-600/20 border-blue-500/30'
              }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29 0 2.213.43 6.29.686 6.29 0 0-.687-1.77-1.182-1.77-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.747 2.072.111 0 .281-.36.281-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z" /></svg>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.community.qqTitle}</h3>
                  <div className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-300'}`}>{t.community.qqGroups}</div>
                </div>
              </div>
              <p className={`text-sm mb-4 ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.community.qqDesc}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=ndxRXO1HARA8ing7OunMClOz3cQTogL0&authKey=D7QTcqnzhBzuh3zc%2F70FjgklsVvkCImTjSRqHMwYGCLwIFpxzp%2FflC97Y7AUG%2Fpy&noverify=0&group_code=656669024"
                  target="_blank"
                  rel="noreferrer"
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === 'light'
                    ? 'bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200'
                    : 'bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
                    }`}
                >
                  656669024
                </a>
                <a
                  href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=1u0nmmUIZOB716neFTlbyj_2aOQn_TV-&authKey=1lBqM20oOfdKjDnxkq09DjR729fqFfWVnaLQ7VjrDB%2FAg6qwvw6QCwdwYoRUrewU&noverify=0&group_code=937236109"
                  target="_blank"
                  rel="noreferrer"
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === 'light'
                    ? 'bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200'
                    : 'bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
                    }`}
                >
                  937236109
                </a>
                <a
                  href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=3Fxt0gwMYkoLPani_vQ9tsNfYrnVy4hK&authKey=2A%2BNk3jmRaK%2FO1FBQSjTIbStAU1kbZWkjEkyh2RTVA015eTg6c4CvVhfByc1BtGZ&noverify=0&group_code=850517473"
                  target="_blank"
                  rel="noreferrer"
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${theme === 'light'
                    ? 'bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200'
                    : 'bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
                    }`}
                >
                  850517473
                </a>
                <a
                  href="https://pd.qq.com/s/a13gu04rv"
                  target="_blank"
                  rel="noreferrer"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${theme === 'light'
                    ? 'bg-orange-100 border border-orange-300 text-orange-700 hover:bg-orange-200'
                    : 'bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30'
                    }`}
                >
                  {t.community.qqChannel}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { repoData, discordInfo, loading } = useExternalData();
  const i18n = useI18nProvider();
  const themeProvider = useThemeProvider();

  return (
    <ThemeContext.Provider value={themeProvider}>
      <I18nContext.Provider value={i18n}>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-lite-500/30 selection:text-lite-200 flex flex-col relative">
          <Background />
          <Header />

          {/* Main content with z-index to sit above background */}
          <main className="flex-grow relative z-10">
            <Routes>
              <Route
                path="/"
                element={<Home repoData={repoData} discordInfo={discordInfo} loading={loading} />}
              />
              <Route path="/projects" element={<ProjectsPage repoData={repoData} loading={loading} />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/support" element={<Support />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </I18nContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
