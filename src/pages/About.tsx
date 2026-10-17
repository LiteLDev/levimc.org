import { Badge, BrandIcon, PixelIcon, type PixelIconName } from "../../kit/components";
import { isLatin } from "../components/ui";
import { useI18n } from "../i18n";

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  github: string;
  avatar: string;
};

const teamMembers: TeamMember[] = [
  {
    name: "OEOTYAN",
    role: "Team Lead",
    bio: "Leads the LeviMC project, and ensures the project stays on course. Maintainer of LeviLamina.",
    github: "https://github.com/OEOTYAN",
    avatar: "https://avatars.githubusercontent.com/u/58554322?v=4",
  },
  {
    name: "GX",
    role: "Author of Launcher",
    bio: "Author of LeviLauncher and LeviLaunchroid. Developer of LeviLamina.",
    github: "https://github.com/dreamguxiang",
    avatar: "https://avatars.githubusercontent.com/u/62042544?v=4",
  },
  {
    name: "NahidaChan",
    role: "Maintainer of Header Generator",
    bio: "Maintains the header generation system, ensuring efficient and accurate header files. Author of LeviAntiCheat.",
    github: "https://github.com/KawaiiNahida",
    avatar: "https://avatars.githubusercontent.com/u/42824603?v=4",
  },
  {
    name: "RimuruChan",
    role: "Maintainer of Header Generator",
    bio: "Maintains the header generation system, ensuring efficient and accurate header files.",
    github: "https://github.com/RimuruChan",
    avatar: "https://avatars.githubusercontent.com/u/42002296?v=4",
  },
  {
    name: "Dofes",
    role: "Author of LeviOptimize",
    bio: "Creates and maintains LeviOptimize, a performance optimization mod for LeviLamina. Developer of LeviLamina and LegacyScriptEngine.",
    github: "https://github.com/Dofes",
    avatar: "https://avatars.githubusercontent.com/u/91889957?v=4",
  },
  {
    name: "Zijian Zhang",
    role: "Author of lip",
    bio: "Develops and maintains lip, the package manager for LeviLamina. Developer of LegacyScriptEngine",
    github: "https://github.com/futrime",
    avatar: "https://avatars.githubusercontent.com/u/35801754?v=4",
  },
  {
    name: "Vincent",
    role: "Author of Endstone",
    bio: "Creates and maintains Endstone, a popular plugin loader for Bedrock Dedicated Server. Provides support for LeviStone.",
    github: "https://github.com/wu-vincent",
    avatar: "https://avatars.githubusercontent.com/u/8433134?v=4",
  },
  {
    name: "Qiuzhizhe",
    role: "Author of MoreDimensions",
    bio: "Brings new dimensions to Minecraft Bedrock Edition with the MoreDimensions mod. Developer of LeviLamina, author of LiteLoaderBDS 1.16.40.",
    github: "https://github.com/quizhizhe",
    avatar: "https://avatars.githubusercontent.com/u/42761326?v=4",
  },
  {
    name: "CuteKitten",
    role: "Maintainer of LeviLamina",
    bio: "Maintains LeviLamina, contributing to its development and community support.",
    github: "https://github.com/Lovelylavender4",
    avatar: "https://avatars.githubusercontent.com/u/94376005?v=4",
  },
  {
    name: "zimuya4153",
    role: "Developer of LeviLamina",
    bio: "Contributes to the development of LeviLamina.",
    github: "https://github.com/zimuya4153",
    avatar: "https://avatars.githubusercontent.com/u/163636894?v=4",
  },
  {
    name: "PA733",
    role: "Server Administrator",
    bio: "Manages servers and infrastructure. Developer of LeviLamina and LiteLoaderBDS.",
    github: "https://github.com/PA733",
    avatar: "https://avatars.githubusercontent.com/u/67588574?v=4",
  },
  {
    name: "ShrBox",
    role: "Creator of LeviMC(LiteLDev)",
    bio: "Original creator of LiteLDev(now LeviMC) and a contributor to LegacyScriptEngine and LeviLamina.",
    github: "https://github.com/ShrBox",
    avatar: "https://avatars.githubusercontent.com/u/53301243?v=4",
  },
  {
    name: "YQ",
    role: "Author of LiteXLoader",
    bio: "Creates LiteXLoader and contributes to LiteLoaderBDS.",
    github: "https://github.com/yqs112358",
    avatar: "https://avatars.githubusercontent.com/u/37969157?v=4",
  },
  {
    name: "xiaoqch",
    role: "Developer of LeviLamina",
    bio: "Contributes to the development of LeviLamina and LiteLoaderBDS.",
    github: "https://github.com/xiaoqch",
    avatar: "https://avatars.githubusercontent.com/u/37901097?v=4",
  },
  {
    name: "wzy",
    role: "Developer of LiteLoaderBDS",
    bio: "Contributes to the development of LiteLoaderBDS and LiteXLoader.",
    github: "https://github.com/wzyyyyyyy",
    avatar: "https://avatars.githubusercontent.com/u/59381521?v=4",
  },
  {
    name: "twoone3",
    role: "Developer of LLSE Python engine",
    bio: "Provides Python scripting capabilities for Bedrock mods. Author of PythonRunner, developer of LiteLoaderBDS.",
    github: "https://github.com/twoone-3",
    avatar: "https://avatars.githubusercontent.com/u/62778573?v=4",
  },
  {
    name: "ddf8196",
    role: "Developer of LeviLamina",
    bio: "Contributes to the development of LeviLamina.",
    github: "https://github.com/ddf8196",
    avatar: "https://avatars.githubusercontent.com/u/73578766?v=4",
  },
  {
    name: "Pd",
    role: "Author of LiteLoader.NET",
    bio: "Provides .NET scripting support for LiteLoaderBDS.",
    github: "https://github.com/Pd233",
    avatar: "https://avatars.githubusercontent.com/u/69450129?v=4",
  },
  {
    name: "Jacie ZYT",
    role: "Developer of LeviLamina",
    bio: "Makes contributions to LeviLamina and LiteLoaderBDS.",
    github: "https://github.com/Jaciezyt",
    avatar: "https://avatars.githubusercontent.com/u/66063199?v=4",
  },
  {
    name: "CanXue",
    role: "Developer of many LiteLoaderBDS plugins",
    bio: "Provides various plugins for LiteLoaderBDS to enhance server functionality.",
    github: "https://github.com/cryx233",
    avatar: "https://avatars.githubusercontent.com/u/104246753?v=4",
  },
];

export default function About() {
  const { t } = useI18n();

  const storyCards: {
    title: string;
    body: string;
    icon: PixelIconName;
    badge: string;
    number: string;
    wide?: boolean;
  }[] = [
    {
      title: t.about.pageSubtitle,
      body: t.about.intro,
      icon: "bookQuill",
      badge: t.about.pageTitle,
      number: "01",
      wide: true,
    },
    {
      title: t.about.question1Title,
      body: t.about.question1Body,
      icon: "map",
      badge: "Where",
      number: "02",
    },
    {
      title: t.about.question2Title,
      body: t.about.question2Body,
      icon: "question",
      badge: "Why",
      number: "03",
    },
  ];

  return (
    <div className="lm-page lm-container lm-container-mid">
      <section className="lm-story-grid">
        {storyCards.map((card, index) => {
          // The first card introduces the page, so its title is the page heading.
          const Title = index === 0 ? "h1" : "h2";
          return (
            <article key={card.number} className={card.wide ? "px-card lm-story lm-story-wide" : "px-card lm-story"}>
              <div className="lm-story-lead">
                <div className="lm-story-head">
                  <span className="kit-slot lm-story-slot" aria-hidden="true">
                    <PixelIcon name={card.icon} size={32} />
                  </span>
                  <div className="lm-story-meta">
                    <Badge tone="grass" pixel={isLatin(card.badge)}>
                      {card.badge}
                    </Badge>
                    <p className="kit-pixel-label lm-story-number">{card.number}</p>
                  </div>
                </div>
                <Title className="lm-story-title">{card.title}</Title>
              </div>
              <p className="lm-story-body">{card.body}</p>
            </article>
          );
        })}
      </section>

      <section className="lm-team">
        <div className="lm-team-head">
          <h2 className="lm-title lm-title-sm">{t.about.teamTitle}</h2>
          <p className="lm-lead">{t.about.teamSubtitle}</p>
        </div>

        <div className="lm-grid-3">
          {teamMembers.map((member) => (
            <div key={member.name} className="px-card lm-member">
              <div className="lm-member-head">
                <span className="lm-avatar">
                  {/* s=112: a 2x avatar instead of the full-size original (~17 KB instead of ~240 KB) */}
                  <img src={`${member.avatar}&s=112`} alt={member.name} width={56} height={56} loading="lazy" decoding="async" />
                </span>
                <div className="lm-member-id">
                  <p className="lm-member-name">{member.name}</p>
                  <p className="lm-member-role">{member.role}</p>
                </div>
              </div>
              <p className="lm-member-bio">{member.bio}</p>
              <a href={member.github} target="_blank" rel="noopener" className="lm-member-link">
                <BrandIcon name="github" size={16} />
                GitHub
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
