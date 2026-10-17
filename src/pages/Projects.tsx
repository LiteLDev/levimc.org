import { PixelIcon } from '../../kit/components';
import ProjectCard from '../components/ProjectCard';
import { GITHUB_URL } from '../components/CommunityCards';
import { PageHeader } from '../components/ui';
import { useProjects } from '../data/projects';
import { useRepoData } from '../hooks/useExternalData';
import { useI18n } from '../i18n';

export default function Projects() {
  const { t } = useI18n();
  const { repoData, loading } = useRepoData();

  return (
    <div className="lm-page lm-container">
      <PageHeader eyebrow={t.projects.label} title={t.projects.allProjectsTitle} lead={t.projects.allProjectsDesc} />
      <div className="lm-grid-3">
        {useProjects().map((project) => {
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
        {/* Placeholder */}
        <div className="lm-more">
          <span className="kit-slot lm-more-slot" aria-hidden="true">
            <PixelIcon name="chest" size={32} />
          </span>
          <p className="lm-more-text">{t.projects.moreOnGitHub}</p>
          <a href={GITHUB_URL} target="_blank" rel="noopener" className="mc-btn mc-btn-sm">
            {t.projects.explore}
            <PixelIcon name="arrowRight" />
          </a>
        </div>
      </div>
    </div>
  );
}
