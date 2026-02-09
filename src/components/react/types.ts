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
  slug?: string;
  title: string;
  category: string;
  date: string;
  image: string; // Placeholder for Google Drive ID resolution
  description: string;
  clientUrl?: string;
  tags: string[];
  title_de?: string;
  title_en?: string;
  title_fr?: string;
  title_it?: string;
  description_de?: string;
  description_en?: string;
  description_fr?: string;
  description_it?: string;
  gridSpan: 'small' | 'medium' | 'large' | 'tall' | 'wide';
}

export interface Service {
  id: string;
  name: string;
  icon: string; // Just using emoji/char for demo simplicity, typically SVG
  teaser: string; // Short one-liner for hover/active previews
  bullets: string[];
  startPrice: string;
  categoryId?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  order: number;
}

export interface LeadForm {
  step1: string; // Success definition
  step2: string; // ROI definition
  step3: string; // Budget bracket
  email: string;
}
