import React from 'react';
import { Star, ArrowUpRight } from 'lucide-react';
import { Project } from '../types';
import { useTheme } from '../theme';

interface ProjectCardProps {
  project: Project;
  stars?: number;
  language?: string;
  loading?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, stars, language, loading }) => {
  const displayStars = stars ?? project.stars;
  const displayTags = language ? [language, ...project.tags.filter(t => t.toLowerCase() !== language.toLowerCase())].slice(0, 2) : project.tags.slice(0, 2);
  const { theme } = useTheme();

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noreferrer"
      className={`group relative backdrop-blur-sm border rounded-2xl p-6 flex flex-col transition-all duration-300 ${theme === 'light'
        ? 'bg-white border-stone-200/80 hover:border-lite-500/40 hover:shadow-lg hover:shadow-lite-500/5'
        : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
        }`}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-lite-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className={`p-3 rounded-xl border transition-all duration-300 ${theme === 'light'
            ? 'bg-stone-50 border-stone-200 group-hover:border-lite-500/40 group-hover:bg-lite-50'
            : 'bg-zinc-800/80 border-zinc-700/50 group-hover:border-lite-500/30 group-hover:bg-lite-500/10'
            }`}>
            {project.icon}
          </div>
          <ArrowUpRight className={`w-5 h-5 group-hover:text-lite-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all ${theme === 'light' ? 'text-stone-400' : 'text-zinc-600'
            }`} />
        </div>

        {/* Title */}
        <h3 className={`text-xl font-bold mb-3 group-hover:text-lite-600 transition-colors ${theme === 'light' ? 'text-stone-800' : 'text-white'
          }`}>
          {project.name}
        </h3>

        {/* Description */}
        <p className={`text-sm leading-relaxed line-clamp-3 flex-grow ${theme === 'light' ? 'text-stone-600' : 'text-zinc-500'
          }`}>
          {project.description}
        </p>

        {/* Footer - fixed at bottom */}
        <div className={`flex items-center justify-between pt-4 mt-4 border-t ${theme === 'light' ? 'border-stone-100' : 'border-zinc-800/50'
          }`}>
          <div className="flex items-center gap-1.5 min-w-0">
            {displayTags.map(tag => (
              <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${theme === 'light'
                ? 'bg-stone-100 text-stone-700 border border-stone-200'
                : 'bg-zinc-800/80 text-zinc-400'
                }`}>
                {tag}
              </span>
            ))}
          </div>
          <div className={`flex items-center gap-1 text-xs font-mono ml-2 shrink-0 ${theme === 'light' ? 'text-stone-500' : 'text-zinc-500'
            }`}>
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            {loading ? (
              <span className={`w-6 h-3 rounded animate-pulse ${theme === 'light' ? 'bg-stone-200' : 'bg-zinc-700'}`}></span>
            ) : displayStars ? (
              displayStars >= 1000 ? `${(displayStars / 1000).toFixed(1)}k` : displayStars
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>
    </a>
  );
};

export default ProjectCard;
