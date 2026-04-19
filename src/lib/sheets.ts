import {
  getServices as getCmsServices,
  getProjects as getCmsProjects,
  getCategories as getCmsCategories,
  getHeroExperiments as getCmsHeroExperiments,
  type HeroExperimentRow
} from '../server/modules/cms';
import type { Project, Service, Category } from './components/react/types';

export type SheetsAllResponse = {
  projects: Project[];
  services: Service[];
  categories: Category[];
  heroExperiments: HeroExperimentRow[];
};

export async function getAll(lang: string = 'de'): Promise<SheetsAllResponse> {
  const [projects, services, categories, heroExperiments] = await Promise.all([
    getCmsProjects(lang),
    getCmsServices(lang),
    getCmsCategories(lang),
    getCmsHeroExperiments()
  ]);

  return { projects, services, categories, heroExperiments };
}

export async function getProjects(lang: string = 'de'): Promise<Project[]> {
  return getCmsProjects(lang);
}

export async function getServices(lang: string = 'de'): Promise<Service[]> {
  return getCmsServices(lang);
}

export async function getCategories(lang: string = 'de'): Promise<Category[]> {
  return getCmsCategories(lang);
}

export async function getHeroExperiments(): Promise<HeroExperimentRow[]> {
  return getCmsHeroExperiments();
}
