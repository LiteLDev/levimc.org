import { Star } from 'lucide-react';
import { Badge, BrandIcon, PixelIcon } from '../../kit/components';
import type { Project } from '../data/projects';
import { useI18n } from '../i18n';

interface ProjectCardProps {
  project: Project;
  stars?: number;
  language?: string;
  loading?: boolean;
}

export default function ProjectCard({ project, stars, language, loading }: ProjectCardProps) {
  const displayStars = stars ?? project.stars;
  const displayTags = language
    ? [language, ...project.tags.filter((t) => t.toLowerCase() !== language.toLowerCase())].slice(0, 2)
    : project.tags.slice(0, 2);
  const { t } = useI18n();

  return (
    <article className="px-card lm-project">
      <span className="kit-slot lm-project-slot" aria-hidden="true">
        <PixelIcon name={project.icon} size={32} />
      </span>

      <h3 className="lm-project-name">{project.name}</h3>
      <p className="lm-project-desc">{project.description}</p>

      <div className="lm-project-links">
        {project.docs && (
          <a href={project.docs} target="_blank" rel="noopener" className="mc-btn mc-btn-sm">
            <PixelIcon name="bookQuill" />
            {t.projects.docs}
          </a>
        )}
        <a href={project.link} target="_blank" rel="noopener" className="mc-btn mc-btn-sm">
          <BrandIcon name="github" size={14} />
          {t.projects.github}
        </a>
      </div>

      <div className="lm-project-foot">
        <div className="lm-project-tags">
          {displayTags.map((tag, i) => (
            <Badge key={tag} tone={i === 0 && language ? 'pond' : 'grass'}>
              {tag}
            </Badge>
          ))}
        </div>
        <div className="lm-project-stars">
          <Star className="lm-star" aria-hidden="true" />
          {loading ? (
            <span className="lm-skeleton lm-skeleton-xs" />
          ) : displayStars ? (
            displayStars >= 1000 ? `${(displayStars / 1000).toFixed(1)}k` : displayStars
          ) : (
            '—'
          )}
        </div>
      </div>
    </article>
  );
}
