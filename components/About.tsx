import React from 'react';
import { Github, ArrowRight, Sparkles, Target, Users } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

type TeamMember = {
    name: string;
    role: string;
    bio: string;
    github: string;
    avatar: string;
};

const teamMembers: TeamMember[] = [
    {
        name: 'OEOTYAN',
        role: 'Team Lead',
        bio: 'Leads the LeviMC project, and ensures the project stays on course. Maintainer of LeviLamina.',
        github: 'https://github.com/OEOTYAN',
        avatar: 'https://avatars.githubusercontent.com/u/58554322?v=4',
    },
    {
        name: 'GX',
        role: 'Author of Launcher',
        bio: 'Author of LeviLauncher and LeviLaunchroid. Developer of LeviLamina.',
        github: 'https://github.com/dreamguxiang',
        avatar: 'https://avatars.githubusercontent.com/u/62042544?v=4',
    },
    {
        name: 'NahidaChan',
        role: 'Maintainer of Header Generator',
        bio: 'Maintains the header generation system, ensuring efficient and accurate header files. Author of LeviAntiCheat.',
        github: 'https://github.com/KawaiiNahida',
        avatar: 'https://avatars.githubusercontent.com/u/42824603?v=4',
    },
    {
        name: 'RimuruChan',
        role: 'Maintainer of Header Generator',
        bio: 'Maintains the header generation system, ensuring efficient and accurate header files.',
        github: 'https://github.com/RimuruChan',
        avatar: 'https://avatars.githubusercontent.com/u/42002296?v=4',
    },
    {
        name: 'Dofes',
        role: 'Author of LeviOptimize',
        bio: 'Creates and maintains LeviOptimize, a performance optimization mod for LeviLamina. Developer of LeviLamina and LegacyScriptEngine.',
        github: 'https://github.com/Dofes',
        avatar: 'https://avatars.githubusercontent.com/u/91889957?v=4',
    },
    {
        name: 'Zijian Zhang',
        role: 'Author of lip',
        bio: 'Develops and maintains lip, the package manager for LeviLamina. Developer of LegacyScriptEngine',
        github: 'https://github.com/futrime',
        avatar: 'https://avatars.githubusercontent.com/u/35801754?v=4',
    },
    {
        name: 'Vincent',
        role: 'Author of Endstone',
        bio: 'Creates and maintains Endstone, a popular plugin loader for Bedrock Dedicated Server. Provides support for LeviStone.',
        github: 'https://github.com/wu-vincent',
        avatar: 'https://avatars.githubusercontent.com/u/8433134?v=4',
    },
    {
        name: 'Qiuzhizhe',
        role: 'Author of MoreDimensions',
        bio: 'Brings new dimensions to Minecraft Bedrock Edition with the MoreDimensions mod. Developer of LeviLamina, author of LiteLoaderBDS 1.16.40.',
        github: 'https://github.com/quizhizhe',
        avatar: 'https://avatars.githubusercontent.com/u/42761326?v=4',
    },
    {
        name: 'CuteKitten',
        role: 'Maintainer of LeviLamina',
        bio: 'Maintains LeviLamina, contributing to its development and community support.',
        github: 'https://github.com/Lovelylavender4',
        avatar: 'https://avatars.githubusercontent.com/u/94376005?v=4',
    },
    {
        name: 'PA733',
        role: 'Server Administrator',
        bio: 'Manages servers and infrastructure. Developer of LeviLamina and LiteLoaderBDS.',
        github: 'https://github.com/PA733',
        avatar: 'https://avatars.githubusercontent.com/u/67588574?v=4',
    },
    {
        name: 'ShrBox',
        role: 'Creator of LeviMC(LiteLDev)',
        bio: 'Original creator of LiteLDev(now LeviMC) and a contributor to LegacyScriptEngine and LeviLamina.',
        github: 'https://github.com/ShrBox',
        avatar: 'https://avatars.githubusercontent.com/u/53301243?v=4',
    },
    {
        name: 'YQ',
        role: 'Author of LiteXLoader',
        bio: 'Creates LiteXLoader and contributes to LiteLoaderBDS.',
        github: 'https://github.com/yqs112358',
        avatar: 'https://avatars.githubusercontent.com/u/37969157?v=4',
    },
    {
        name: 'xiaoqch',
        role: 'Developer of LeviLamina',
        bio: 'Contributes to the development of LeviLamina and LiteLoaderBDS.',
        github: 'https://github.com/xiaoqch',
        avatar: 'https://avatars.githubusercontent.com/u/37901097?v=4',
    },
    {
        name: 'wzy',
        role: 'Developer of LiteLoaderBDS',
        bio: 'Contributes to the development of LiteLoaderBDS and LiteXLoader.',
        github: 'https://github.com/wzyyyyyyy',
        avatar: 'https://avatars.githubusercontent.com/u/59381521?v=4',
    },
    {
        name: 'twoone3',
        role: 'Developer of LLSE Python engine',
        bio: 'Provides Python scripting capabilities for Bedrock mods. Author of PythonRunner, developer of LiteLoaderBDS.',
        github: 'https://github.com/twoone-3',
        avatar: 'https://avatars.githubusercontent.com/u/62778573?v=4',
    },
    {
        name: 'ddf8196',
        role: 'Developer of LeviLamina',
        bio: 'Contributes to the development of LeviLamina.',
        github: 'https://github.com/ddf8196',
        avatar: 'https://avatars.githubusercontent.com/u/73578766?v=4',
    },
    {
        name: 'Pd',
        role: 'Author of LiteLoader.NET',
        bio: 'Provides .NET scripting support for LiteLoaderBDS.',
        github: 'https://github.com/Pd233',
        avatar: 'https://avatars.githubusercontent.com/u/69450129?v=4',
    },
    {
        name: 'Jacie ZYT',
        role: 'Developer of LeviLamina',
        bio: 'Makes contributions to LeviLamina and LiteLoaderBDS.',
        github: 'https://github.com/Jaciezyt',
        avatar: 'https://avatars.githubusercontent.com/u/66063199?v=4',
    },
    {
        name: 'CanXue',
        role: 'Developer of many LiteLoaderBDS plugins',
        bio: 'Provides various plugins for LiteLoaderBDS to enhance server functionality.',
        github: 'https://github.com/cryx233',
        avatar: 'https://avatars.githubusercontent.com/u/104246753?v=4',
    },
];

const About: React.FC = () => {
    const { t } = useI18n();
    const { theme } = useTheme();

    return (
        <div className="pt-32 pb-24 min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <section
                    className={`relative overflow-hidden rounded-3xl border px-8 py-12 lg:px-12 ${theme === 'light'
                        ? 'bg-white border-stone-200 shadow-sm'
                        : 'bg-zinc-900/70 border-zinc-800 backdrop-blur'
                        }`}
                >
                    <div className="absolute inset-0 opacity-60" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.15), transparent 30%), radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.12), transparent 25%), radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.12), transparent 35%)',
                    }}></div>
                    <div className="relative max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 text-sm text-lite-300 bg-lite-500/10 border border-lite-500/30 px-3 py-1.5 rounded-full">
                            <Sparkles className="w-4 h-4" />
                            <span>{t.about.pageTitle}</span>
                        </div>
                        <h1 className={`text-4xl lg:text-5xl font-bold leading-tight ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>
                            {t.about.pageSubtitle}
                        </h1>
                        <p className={`${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'} text-lg`}>{t.about.intro}</p>
                    </div>
                </section>

                <section className="grid md:grid-cols-2 gap-6">
                    <div className={`rounded-2xl border p-6 space-y-4 ${theme === 'light'
                        ? 'bg-white border-stone-200'
                        : 'bg-zinc-900/60 border-zinc-800'
                        }`}>
                        <div className="flex items-center gap-3 text-lite-400">
                            <Target className="w-5 h-5" />
                            <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.about.missionTitle}</h2>
                        </div>
                        <p className={`${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'} leading-relaxed`}>{t.about.missionBody}</p>
                    </div>

                    <div className={`rounded-2xl border p-6 space-y-5 ${theme === 'light'
                        ? 'bg-white border-stone-200'
                        : 'bg-zinc-900/60 border-zinc-800'
                        }`}>
                        <div className="flex items-center gap-3 text-lite-400">
                            <Users className="w-5 h-5" />
                            <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.about.valuesTitle}</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className={`text-sm font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.about.valueOneTitle}</p>
                                <p className={`${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.about.valueOneBody}</p>
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.about.valueTwoTitle}</p>
                                <p className={`${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.about.valueTwoBody}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{t.about.teamTitle}</h2>
                            <p className={`${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{t.about.teamSubtitle}</p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teamMembers.map((member) => (
                            <div
                                key={member.name}
                                className={`rounded-2xl border p-5 flex flex-col gap-4 ${theme === 'light'
                                    ? 'bg-white border-stone-200'
                                    : 'bg-zinc-900/60 border-zinc-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border border-lite-500/30 bg-lite-500/10">
                                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className={`text-lg font-semibold ${theme === 'light' ? 'text-stone-900' : 'text-white'}`}>{member.name}</p>
                                        <p className={`text-sm ${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'}`}>{member.role}</p>
                                    </div>
                                </div>
                                <p className={`${theme === 'light' ? 'text-stone-600' : 'text-zinc-400'} text-sm leading-relaxed flex-1`}>{member.bio}</p>
                                <a
                                    href={member.github}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-2 text-sm font-medium ${theme === 'light' ? 'text-lite-600 hover:text-lite-700' : 'text-lite-300 hover:text-lite-200'}`}
                                >
                                    <Github className="w-4 h-4" />
                                    GitHub
                                </a>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About;
