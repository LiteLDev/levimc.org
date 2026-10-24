import { PROJECTS } from '../../kit/components';
import { useI18n } from '../i18n';

export interface Project {
  id: string;
  name: string;
  description: string;
  /** The project's logo (the kit's registry), shown at the top of its card. */
  logo: string;
  tags: string[];
  link: string;
  docs?: string;
  stars?: number;
}

/** Card tag of each project (the kit's project registry holds names, links and icons). */
const TAGS: Record<string, string> = {
  LeviLamina: 'Mod Loader',
  LegacyScriptEngine: 'Script Engine',
  LeviStone: 'Script Engine',
  lip: 'Package Manager',
  LeviLauncher: 'Windows',
  LeviLaunchroid: 'Android',
  LeviOptimize: 'Performance',
  LeviAntiCheat: 'Security',
  MoreDimensions: 'Functionality',
  BarelyEnoughItems: 'Client',
  AlleviatedBackpacks: 'Functionality',
  Bedstones: 'Functionality',
  BeetrootSkin: 'Client',
  LeviHeadlessInput: 'Testing',
};

// GitHub repositories of the projects: stars, language and description are fetched from the GitHub API
export const PROJECT_CONFIGS: { id: string; owner: string; repo: string }[] = PROJECTS.map((p) => {
  const [owner, repo] = new URL(p.repo).pathname.slice(1).split('/') as [string, string];
  return { id: p.id.toLowerCase(), owner, repo };
});

/**
 * Every LeviMC project (the kit's registry, in the order of the bar's Projects menu) with this site's
 * descriptions — the fallback when the GitHub API is unavailable. A hook, so translations are read inside it.
 */
export function useProjects(): Project[] {
  const { t } = useI18n();
  return PROJECTS.map((p) => ({
    id: p.id.toLowerCase(),
    name: p.name,
    description: t.projects_desc[p.id.toLowerCase() as keyof typeof t.projects_desc],
    logo: p.logo,
    tags: [TAGS[p.id] ?? ''],
    link: p.repo,
    docs: p.docs,
  }));
}
