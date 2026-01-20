import React from 'react';
import { Code, Layers, Terminal, Cpu, Globe, Zap, Rocket, Shield, Smartphone, Sparkles, GamepadDirectionalIcon } from 'lucide-react';
import { Project, Feature, NavItem } from './types';

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
      customDescription: 'Run JavaScript, Lua, and Python plugins on LeviLamina. Perfect for script developers.',
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

// Fallback static data in case API fails
export const PROJECTS: Project[] = [
  {
    id: 'levilamina',
    name: 'LeviLamina',
    description: 'A lightweight, modular and versatile mod loader for Minecraft Bedrock Edition.',
    icon: <Layers className="w-8 h-8 text-lite-400" />,
    tags: ['Mod Loader'],
    link: 'https://github.com/LiteLDev/LeviLamina',
  },
  {
    id: 'legacyscriptengine',
    name: 'LegacyScriptEngine',
    description: 'Run JavaScript, Lua, and Python plugins on LeviLamina.',
    icon: <Code className="w-8 h-8 text-lite-400" />,
    tags: ['Script Engine'],
    link: 'https://github.com/LiteLDev/LegacyScriptEngine',
  },
  {
    id: 'levilaunchroid',
    name: 'LeviLaunchroid',
    description: 'A launcher for Minecraft Bedrock Edition on Android.',
    icon: <Smartphone className="w-8 h-8 text-lite-400" />,
    tags: ['Android'],
    link: 'https://github.com/LiteLDev/LeviLaunchroid',
  },
  {
    id: 'levilauncher',
    name: 'LeviLauncher',
    description: 'Minecraft Bedrock Edition GDK Launcher for Windows.',
    icon: <Rocket className="w-8 h-8 text-lite-400" />,
    tags: ['Windows'],
    link: 'https://github.com/LiteLDev/LeviLauncher',
  },
  {
    id: 'levioptimize',
    name: 'LeviOptimize',
    description: 'Performance optimization mod for LeviLamina servers.',
    icon: <Zap className="w-8 h-8 text-lite-400" />,
    tags: ['Performance'],
    link: 'https://github.com/LiteLDev/LeviOptimize',
  },
  {
    id: 'levianticheat',
    name: 'LeviAntiCheat',
    description: 'Anti-cheating solution for LeviLamina servers.',
    icon: <Shield className="w-8 h-8 text-lite-400" />,
    tags: ['Security'],
    link: 'https://github.com/LiteLDev/LeviAntiCheat',
  },
  {
    id: 'moredimensions',
    name: 'MoreDimensions',
    description: 'Multi dimensions on for Minecraft Bedrock Edition.',
    icon: <GamepadDirectionalIcon className="w-8 h-8 text-lite-400" />,
    tags: ['Functionality'],
    link: 'https://github.com/LiteLDev/MoreDimensions',
  },
];

export const FEATURES: Feature[] = [
  {
    title: 'Native C++ Mods',
    description: 'Write high-performance mods in modern C++. Full access to BDS internals with comprehensive API.',
    icon: <Cpu className="w-6 h-6" />
  },
  {
    title: 'Multi-Language Scripts',
    description: 'Use LegacyScriptEngine to write plugins in JavaScript, Lua, or Python. Lower barrier, same power.',
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    title: 'Open Source',
    description: 'LGPL-3.0 licensed. Fully transparent, community-driven. Fork it, extend it, make it yours.',
    icon: <Globe className="w-6 h-6" />
  },
  {
    title: 'Developer First',
    description: 'Powerful event system, extensive documentation, and active community support.',
    icon: <Terminal className="w-6 h-6" />
  }
];
