import { BrandIcon, PixelIcon } from '../../kit/components';
import Hero from '../components/Hero';
import Features from '../components/Features';
import ProjectCard from '../components/ProjectCard';
import { DiscordCard, GITHUB_URL, QQCard, TelegramCard } from '../components/CommunityCards';
import { Eyebrow } from '../components/ui';
import { useProjects } from '../data/projects';
import { useDiscordInfo, useRepoData } from '../hooks/useExternalData';
import { useI18n } from '../i18n';

export default function Home() {
  const { t, locale } = useI18n();
  const { repoData, loading } = useRepoData();
  const discordInfo = useDiscordInfo();
  const projects = useProjects();

  return (
    <>
      <Hero />

      {/* Every project (the bar's Projects menu lists the same ones) */}
      <section className="lm-section lm-container" id="projects">
        <div className="lm-section-head">
          <div>
            <Eyebrow>{t.projects.label}</Eyebrow>
            <h2 className="lm-title">{t.projects.title}</h2>
          </div>
          <a href={GITHUB_URL} target="_blank" rel="noopener" className="mc-btn mc-btn-ghost lm-view-all">
            <span>{t.projects.moreOnGitHub}</span>
            <PixelIcon name="arrowRight" />
          </a>
        </div>

        <div className="lm-grid-4">
          {projects.map((project) => {
            const data = repoData?.get(project.id);
            return (
              <ProjectCard
                key={project.id}
                project={{ ...project, description: data?.description || project.description }}
                stars={data?.stars}
                language={data?.language}
                loading={loading}
              />
            );
          })}
        </div>
      </section>

      <div className="kit-rule lm-divider" aria-hidden="true" />

      <Features />

      {/* Community call to action */}
      <section className="lm-section lm-container">
        <div className="px-card kit-painted lm-join">
          <div className="lm-join-head">
            <h2 className="lm-title">
              {t.community.title1} <span className="lm-gradient-text">{t.community.title2}</span>
            </h2>
            <p className="lm-lead">{t.community.description}</p>
          </div>

          <div className={locale === 'zh' ? 'lm-join-grid lm-join-grid-3' : 'lm-join-grid'}>
            <DiscordCard info={discordInfo} />
            <TelegramCard />
            {locale === 'zh' && <QQCard />}
          </div>

          <div className="lm-join-foot">
            <a href={GITHUB_URL} target="_blank" rel="noopener" className="mc-btn mc-btn-ghost">
              <BrandIcon name="github" size={16} />
              {t.community.viewOnGitHub}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
