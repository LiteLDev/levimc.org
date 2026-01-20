import { ReactNode } from 'react';

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  tags: string[];
  link: string;
  stars?: number;
}

export interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}
