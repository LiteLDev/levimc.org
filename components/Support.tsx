import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

const Support: React.FC = () => {
    const { t } = useI18n();
    const { theme } = useTheme();

    return (
        <div className="pt-32 pb-24 min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div>
                    <div className={`inline-flex items-center gap-2 text-sm mb-4 ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'}`}>
                        <div className={`w-8 h-px ${theme === 'light' ? 'bg-stone-300' : 'bg-zinc-700'}`}></div>
                        {t.nav.support.toUpperCase()}
                    </div>
                    <h1 className={`text-4xl lg:text-5xl font-bold mb-4 ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.support.pageTitle}</h1>
                    <p className={`text-lg max-w-3xl ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.support.pageDesc}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className={`relative rounded-2xl p-8 border overflow-hidden ${theme === 'light'
                        ? 'bg-white border-stone-200'
                        : 'bg-zinc-900/50 border-zinc-800'
                        }`}>
                        <div className="absolute inset-0 pointer-events-none" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.12), transparent 35%)'
                        }}></div>
                        <div className="relative space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-lite-500/10 text-lite-500 border border-lite-500/30 w-fit">
                                {t.support.contributeTitle}
                            </div>
                            <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.support.contributeTitle}</h3>
                            <p className={`${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'} leading-relaxed`}>{t.support.contributeDesc}</p>
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="https://lamina.levimc.org/maintainer_guides/cpp_style_guide/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-lite-500 to-emerald-500 text-white font-semibold shadow-lg shadow-lite-500/25 hover:shadow-lite-500/40 hover:from-lite-600 hover:to-emerald-600 transition-all"
                                >
                                    {t.support.contributeCta}
                                </a>
                                <a
                                    href="https://github.com/LiteLDev"
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`px-5 py-2.5 rounded-lg border font-medium transition-all ${theme === 'light'
                                        ? 'bg-white border-stone-200 hover:border-stone-300 text-stone-900'
                                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white'
                                        }`}
                                >
                                    GitHub
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className={`relative rounded-2xl p-8 border overflow-hidden ${theme === 'light'
                        ? 'bg-stone-50 border-stone-200'
                        : 'bg-zinc-900/40 border-zinc-800'
                        }`}>
                        <div className="absolute inset-0 pointer-events-none" style={{
                            backgroundImage: 'radial-gradient(circle at 15% 30%, rgba(52,211,153,0.18), transparent 35%), radial-gradient(circle at 85% 10%, rgba(59,130,246,0.14), transparent 30%)'
                        }}></div>
                        <div className="relative space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 w-fit">
                                {t.support.donateTitle}
                            </div>
                            <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.support.donateTitle}</h3>
                            <p className={`${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'} leading-relaxed`}>{t.support.donateDesc}</p>

                            <div className="space-y-3">
                                <div className={`text-sm font-semibold uppercase tracking-wide ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'}`}>
                                    {t.support.donateChannels}
                                </div>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <a
                                        href="https://afdian.com/a/liteldev"
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${theme === 'light'
                                            ? 'bg-white border-stone-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100'
                                            : 'bg-zinc-900 border-zinc-700 hover:border-emerald-400/70 hover:shadow-emerald-500/10'
                                            }`}
                                    >
                                        <span className={`font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.support.channelAfdian}</span>
                                        <ArrowRight className={`w-4 h-4 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`} />
                                    </a>
                                    <a
                                        href="https://opencollective.com/levimc"
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all min-w-[180px] ${theme === 'light'
                                            ? 'bg-white border-stone-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100'
                                            : 'bg-zinc-900 border-zinc-700 hover:border-indigo-400/70 hover:shadow-indigo-500/10'
                                            }`}
                                    >
                                        <span className={`font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.support.channelOpenCollective}</span>
                                        <ArrowRight className={`w-4 h-4 ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`} />
                                    </a>
                                    <br></br>
                                    <a
                                        href="https://5g8svn.sharepoint.com/:x:/s/LiteLDev/EXx2ndbuC-9Bj5SR-FlJ-HUBZWy0wODjQCDb8OkzuKTFJg?e=QBF6nQ"
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${theme === 'light'
                                            ? 'bg-white border-stone-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100'
                                            : 'bg-zinc-900 border-zinc-700 hover:border-purple-400/70 hover:shadow-purple-500/10'
                                            }`}>
                                        <span className={`font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.support.donorList}</span>
                                        <ArrowRight className={`w-4 h-4 ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
