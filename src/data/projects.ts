import type { PixelIconName } from '../../kit/components/PixelIcon';
import { useI18n } from '../i18n';

export interface Project {
  id: string;
  name: string;
  description: string;
  /** Pixel sprite shown in the card's inventory slot. */
  icon: PixelIconName;
  tags: string[];
  link: string;
  docs?: string;
  stars?: number;
}

// Project configuration - stars/forks will be fetched dynamically from GitHub
export const PROJECT_CONFIGS: { id: string; owner: string; repo: string }[] = [
  { id: 'levilamina', owner: 'LiteLDev', repo: 'LeviLamina' },
  { id: 'legacyscriptengine', owner: 'LiteLDev', repo: 'LegacyScriptEngine' },
  { id: 'levilaunchroid', owner: 'LiteLDev', repo: 'LeviLaunchroid' },
  { id: 'levilauncher', owner: 'LiteLDev', repo: 'LeviLauncher' },
  { id: 'levioptimize', owner: 'LiteLDev', repo: 'LeviOptimize' },
  { id: 'levianticheat', owner: 'LiteLDev', repo: 'LeviAntiCheat' },
  { id: 'moredimensions', owner: 'LiteLDev', repo: 'MoreDimensions' },
];

// Fallback static data in case API fails; useProjects is a hook so translations are read inside a hook/component
export function useProjects(): Project[] {
  const { t } = useI18n();

  return [
    {
      id: 'levilamina',
      name: 'LeviLamina',
      description: t.projects_desc.levilamina,
      icon: 'grass',
      tags: ['Mod Loader'],
      link: 'https://github.com/LiteLDev/LeviLamina',
      docs: 'https://docs.levimc.org/LeviLamina/',
    },
    {
      id: 'legacyscriptengine',
      name: 'LegacyScriptEngine',
      description: t.projects_desc.legacyscriptengine,
      icon: 'bookQuill',
      tags: ['Script Engine'],
      link: 'https://github.com/LiteLDev/LegacyScriptEngine',
      docs: 'https://docs.levimc.org/LegacyScriptEngine/',
    },
    {
      id: 'levilaunchroid',
      name: 'LeviLaunchroid',
      description: t.projects_desc.levilaunchroid,
      icon: 'pickaxe',
      tags: ['Android'],
      link: 'https://github.com/LiteLDev/LeviLaunchroid',
      docs: 'https://docs.levimc.org/LeviLaunchroid/',
    },
    {
      id: 'levilauncher',
      name: 'LeviLauncher',
      description: t.projects_desc.levilauncher,
      icon: 'map',
      tags: ['Windows'],
      link: 'https://github.com/LiteLDev/LeviLauncher',
      docs: 'https://docs.levimc.org/LeviLauncher/',
    },
    {
      id: 'levioptimize',
      name: 'LeviOptimize',
      description: t.projects_desc.levioptimize,
      icon: 'potion',
      tags: ['Performance'],
      link: 'https://github.com/LiteLDev/LeviOptimize',
    },
    {
      id: 'levianticheat',
      name: 'LeviAntiCheat',
      description: t.projects_desc.levianticheat,
      icon: 'torch',
      tags: ['Security'],
      link: 'https://github.com/LiteLDev/LeviAntiCheat',
    },
    {
      id: 'moredimensions',
      name: 'MoreDimensions',
      description: t.projects_desc.moredimensions,
      icon: 'compass',
      tags: ['Functionality'],
      link: 'https://github.com/LiteLDev/MoreDimensions',
    },
  ];
}
