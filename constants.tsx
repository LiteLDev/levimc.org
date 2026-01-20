import React from 'react';
import { Code, Layers, Terminal, Cpu, Globe, Zap, Rocket, Shield, Smartphone, Sparkles, GamepadDirectionalIcon } from 'lucide-react';
import { Project, Feature, NavItem } from './types';
import { useI18n } from './i18n';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: 'home' },
  { label: 'Projects', href: 'projects' },
  { label: 'Features', href: 'features' },
  { label: 'Community', href: 'community' },
];

// Project configuration - stars/forks will be fetched dynamically from GitHub
export const PROJECT_CONFIGS: {
  id: string;
  owner: string;
  repo: string;
  icon: React.ReactNode;
  customDescription?: string;
}[] = [
    {
      id: 'levilamina',
      owner: 'LiteLDev',
      repo: 'LeviLamina',
      icon: <Layers className="w-8 h-8 text-lite-400" />,
    },
    {
      id: 'legacyscriptengine',
      owner: 'LiteLDev',
      repo: 'LegacyScriptEngine',
      icon: <Code className="w-8 h-8 text-lite-400" />,
    },
    {
      id: 'levilaunchroid',
      owner: 'LiteLDev',
      repo: 'LeviLaunchroid',
      icon: <Smartphone className="w-8 h-8 text-lite-400" />,
    },
    {
      id: 'levilauncher',
      owner: 'LiteLDev',
      repo: 'LeviLauncher',
      icon: <Rocket className="w-8 h-8 text-lite-400" />,
    },
    {
      id: 'levioptimize',
      owner: 'LiteLDev',
      repo: 'LeviOptimize',
      icon: <Zap className="w-8 h-8 text-lite-400" />,
    },
    {
      id: 'levianticheat',
      owner: 'LiteLDev',
      repo: 'LeviAntiCheat',
      icon: <Shield className="w-8 h-8 text-lite-400" />,
    },
    {
      id: 'moredimensions',
      owner: 'LiteLDev',
      repo: 'MoreDimensions',
      icon: <GamepadDirectionalIcon className="w-8 h-8 text-lite-400" />,
    },
  ];

// Fallback static data in case API fails; useProjects is a hook so translations are read inside a hook/component
export function useProjects(): Project[] {
  const { t } = useI18n();

  return [
    {
      id: 'levilamina',
      name: 'LeviLamina',
      description: t.projects_desc.levilamina,
      icon: <Layers className="w-8 h-8 text-lite-400" />,
      tags: ['Mod Loader'],
      link: 'https://github.com/LiteLDev/LeviLamina',
    },
    {
      id: 'legacyscriptengine',
      name: 'LegacyScriptEngine',
      description: t.projects_desc.legacyscriptengine,
      icon: <Code className="w-8 h-8 text-lite-400" />,
      tags: ['Script Engine'],
      link: 'https://github.com/LiteLDev/LegacyScriptEngine',
    },
    {
      id: 'levilaunchroid',
      name: 'LeviLaunchroid',
      description: t.projects_desc.levilaunchroid,
      icon: <Smartphone className="w-8 h-8 text-lite-400" />,
      tags: ['Android'],
      link: 'https://github.com/LiteLDev/LeviLaunchroid',
    },
    {
      id: 'levilauncher',
      name: 'LeviLauncher',
      description: t.projects_desc.levilauncher,
      icon: <Rocket className="w-8 h-8 text-lite-400" />,
      tags: ['Windows'],
      link: 'https://github.com/LiteLDev/LeviLauncher',
    },
    {
      id: 'levioptimize',
      name: 'LeviOptimize',
      description: t.projects_desc.levioptimize,
      icon: <Zap className="w-8 h-8 text-lite-400" />,
      tags: ['Performance'],
      link: 'https://github.com/LiteLDev/LeviOptimize',
    },
    {
      id: 'levianticheat',
      name: 'LeviAntiCheat',
      description: t.projects_desc.levianticheat,
      icon: <Shield className="w-8 h-8 text-lite-400" />,
      tags: ['Security'],
      link: 'https://github.com/LiteLDev/LeviAntiCheat',
    },
    {
      id: 'moredimensions',
      name: 'MoreDimensions',
      description: t.projects_desc.moredimensions,
      icon: <GamepadDirectionalIcon className="w-8 h-8 text-lite-400" />,
      tags: ['Functionality'],
      link: 'https://github.com/LiteLDev/MoreDimensions',
    },
  ];
}
