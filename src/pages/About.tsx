import { BrandIcon, type PixelIconName } from "../../kit/components";
import { isLatin } from "../components/ui";
import { useI18n } from "../i18n";

type TeamMember = {
  name: string;
  /** GitHub profile; its login keys the role and bio in `t.about.members`. */
  github: string;
  avatar: string;
};

const teamMembers: TeamMember[] = [
  {
    name: "OEOTYAN",
    github: "https://github.com/OEOTYAN",
    avatar: "https://avatars.githubusercontent.com/u/58554322?v=4",
  },
  {
    name: "GX",
    github: "https://github.com/dreamguxiang",
    avatar: "https://avatars.githubusercontent.com/u/62042544?v=4",
  },
  {
    name: "NahidaChan",
    github: "https://github.com/KawaiiNahida",
    avatar: "https://avatars.githubusercontent.com/u/42824603?v=4",
  },
  {
    name: "RimuruChan",
    github: "https://github.com/RimuruChan",
    avatar: "https://avatars.githubusercontent.com/u/42002296?v=4",
  },
  {
    name: "Dofes",
    github: "https://github.com/Dofes",
    avatar: "https://avatars.githubusercontent.com/u/91889957?v=4",
  },
  {
    name: "Zijian Zhang",
    github: "https://github.com/futrime",
    avatar: "https://avatars.githubusercontent.com/u/35801754?v=4",
  },
  {
    name: "Vincent",
    github: "https://github.com/wu-vincent",
    avatar: "https://avatars.githubusercontent.com/u/8433134?v=4",
  },
  {
    name: "Qiuzhizhe",
    github: "https://github.com/quizhizhe",
    avatar: "https://avatars.githubusercontent.com/u/42761326?v=4",
  },
  {
    name: "CuteKitten",
    github: "https://github.com/Lovelylavender4",
    avatar: "https://avatars.githubusercontent.com/u/94376005?v=4",
  },
  {
    name: "zimuya4153",
    github: "https://github.com/zimuya4153",
    avatar: "https://avatars.githubusercontent.com/u/163636894?v=4",
  },
  {
    name: "PA733",
    github: "https://github.com/PA733",
    avatar: "https://avatars.githubusercontent.com/u/67588574?v=4",
  },
  {
    name: "ShrBox",
    github: "https://github.com/ShrBox",
    avatar: "https://avatars.githubusercontent.com/u/53301243?v=4",
  },
  {
    name: "YQ",
    github: "https://github.com/yqs112358",
    avatar: "https://avatars.githubusercontent.com/u/37969157?v=4",
  },
  {
    name: "xiaoqch",
    github: "https://github.com/xiaoqch",
    avatar: "https://avatars.githubusercontent.com/u/37901097?v=4",
  },
  {
    name: "wzy",
    github: "https://github.com/wzyyyyyyy",
    avatar: "https://avatars.githubusercontent.com/u/59381521?v=4",
  },
  {
    name: "twoone3",
    github: "https://github.com/twoone-3",
    avatar: "https://avatars.githubusercontent.com/u/62778573?v=4",
  },
  {
    name: "ddf8196",
    github: "https://github.com/ddf8196",
    avatar: "https://avatars.githubusercontent.com/u/73578766?v=4",
  },
  {
    name: "Pd",
    github: "https://github.com/Pd233",
    avatar: "https://avatars.githubusercontent.com/u/69450129?v=4",
  },
  {
    name: "Jacie ZYT",
    github: "https://github.com/Jaciezyt",
    avatar: "https://avatars.githubusercontent.com/u/66063199?v=4",
  },
  {
    name: "CanXue",
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
  }[] = [
    {
      title: t.about.pageSubtitle,
      body: t.about.intro,
      icon: "bookQuill",
      badge: t.about.pageTitle,
      number: "01",
    },
    {
      title: t.about.question1Title,
      body: t.about.question1Body,
      icon: "map",
      badge: t.about.badgeWhere,
      number: "02",
    },
    {
      title: t.about.question2Title,
      body: t.about.question2Body,
      icon: "question",
      badge: t.about.badgeWhy,
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
            <article key={card.number} className="lm-story">
              <div className="lm-story-lead">
                <p className={isLatin(card.badge) ? 'kit-pixel-label lm-story-meta' : 'lm-story-meta lm-eyebrow-cjk'}>
                  <span className="lm-story-number">{card.number}</span>
                  {card.badge}
                </p>
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
          {teamMembers.map((member) => {
            const { role, bio } = t.about.members[member.github.slice("https://github.com/".length)]!;
            return (
            <div key={member.name} className="lm-member">
              <div className="lm-member-head">
                <span className="lm-avatar">
                  {/* s=112: a 2x avatar instead of the full-size original (~17 KB instead of ~240 KB) */}
                  <img src={`${member.avatar}&s=112`} alt={member.name} width={56} height={56} loading="lazy" decoding="async" />
                </span>
                <div className="lm-member-id">
                  <p className="lm-member-name">{member.name}</p>
                  <p className="lm-member-role">{role}</p>
                </div>
              </div>
              <p className="lm-member-bio">{bio}</p>
              <a href={member.github} target="_blank" rel="noopener" className="lm-member-link">
                <BrandIcon name="github" size={16} />
                GitHub
              </a>
            </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
