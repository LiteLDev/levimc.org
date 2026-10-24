import { Star } from 'lucide-react';
import { PixelIcon } from '../../kit/components';
import type { Project } from '../data/projects';
import { useI18n } from '../i18n';

interface ProjectCardProps {
  project: Project;
  stars?: number;
  language?: string;
  loading?: boolean;
  /** 3 under a section heading (Home), 2 directly under the page h1 (/projects/). */
  headingLevel?: 2 | 3;
}

/** One project in the home grid: no frame, a hairline above it; sprite, name, one line of meta, two text links. */
export default function ProjectCard({ project, stars, language, loading, headingLevel = 3 }: ProjectCardProps) {
  const Name = headingLevel === 2 ? 'h2' : 'h3';
  const displayStars = stars ?? project.stars;
  const kind = language ?? project.tags[0];
  const { t } = useI18n();

  return (
    <article className="lm-project">
      <img className="lm-project-icon lm-project-logo" src={project.logo} alt="" width={56} height={56} loading="lazy" decoding="async" />
      <Name className="lm-project-name">{project.name}</Name>
      <p className="lm-project-desc">{project.description}</p>

      <p className="lm-project-meta">
        {kind ? <span>{kind}</span> : null}
        <span className="lm-project-stars">
          <Star className="lm-star" aria-hidden="true" />
          {loading ? (
            <span className="lm-skeleton lm-skeleton-xs" />
          ) : displayStars ? (
            displayStars >= 1000 ? `${(displayStars / 1000).toFixed(1)}k` : displayStars
          ) : (
            '—'
          )}
        </span>
      </p>

      <div className="lm-project-links">
        {project.docs && (
          <a href={project.docs} target="_blank" rel="noopener" className="lm-text-link">
            {t.projects.docs}
            <PixelIcon name="arrowRight" />
          </a>
        )}
        <a href={project.link} target="_blank" rel="noopener" className="lm-text-link">
          {t.projects.github}
          <PixelIcon name="arrowRight" />
        </a>
      </div>
    </article>
  );
}
