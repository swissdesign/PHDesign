export enum ProjectCategory {
  BRAND = 'Brand Systems',
  WEB = 'Web Design',
  PHOTO = 'Photography',
  FILM = 'Film & Motion',
  PRINT = 'Print',
}

export type Theme = 'light' | 'dark';

export interface TransitionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  date: string;
  image: string; // Placeholder for Google Drive ID resolution
  description: string;
  clientUrl?: string;
  tags: string[];
  gridSpan: 'small' | 'medium' | 'large' | 'tall' | 'wide';
}

export interface Service {
  id: string;
  name: string;
  icon: string; // Just using emoji/char for demo simplicity, typically SVG
  bullets: string[];
  startPrice: string;
}

export interface LeadForm {
  step1: string; // Success definition
  step2: string; // ROI definition
  step3: string; // Budget bracket
  email: string;
}