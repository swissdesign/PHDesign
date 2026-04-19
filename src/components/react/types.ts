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
  image: string; // Raw Google Drive ID or URL
  optimizedSrc?: string;
  optimizedSrcSet?: string;
  description: string;
  clientUrl?: string;
  tags: string[];
  gridSpan: 'small' | 'medium' | 'large' | 'tall' | 'wide';
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  teaser: string;
  description: string;
  categoryLabel: string;
  bullets: string[];
  startPrice: string;
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
