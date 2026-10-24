import { Star } from 'lucide-react';
import { LINKS, PixelIcon } from '../../kit/components';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  stars?: number;
  language?: string;
  loading?: boolean;
  /** 3 under a section heading (Home), 2 directly under the page h1 (/projects/). */
  headingLevel?: 2 | 3;
}

/** One project in the home grid: no frame, a hairline above it; logo, name, one line of meta. The whole card links to the project's home page. */
export default function ProjectCard({ project, stars, language, loading, headingLevel = 3 }: ProjectCardProps) {
  const Name = headingLevel === 2 ? 'h2' : 'h3';
  const displayStars = stars ?? project.stars;
  const kind = language ?? project.tags[0];
  // LeviMC Mods pages stay in this tab; docs and repositories open beside it, as before
  const external = !project.link.startsWith(LINKS.home);

  return (
    <article className="lm-project">
      <img className="lm-project-icon lm-project-logo" src={project.logo} alt="" width={56} height={56} loading="lazy" decoding="async" />
      <Name className="lm-project-name">
        <a href={project.link} className="lm-project-link" {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
          {project.name}
          <PixelIcon name="arrowRight" />
        </a>
      </Name>
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

    </article>
  );
}
