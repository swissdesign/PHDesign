import {
  getServices as getCmsServices,
  getProjects as getCmsProjects,
  getCategories as getCmsCategories,
  getHeroExperiments as getCmsHeroExperiments,
  type HeroExperimentRow
} from '../server/modules/cms';

export type SheetsAllResponse = {
  projects: any[];
  services: any[];
  categories: any[];
  heroExperiments: HeroExperimentRow[];
};

export async function getAll(lang: string = 'de'): Promise<SheetsAllResponse> {
  const [projects, services, categories, heroExperiments] = await Promise.all([
    getCmsProjects(),
    getCmsServices(lang),
    getCmsCategories(),
    getCmsHeroExperiments()
  ]);

  return { projects, services, categories, heroExperiments };
}

export async function getProjects(): Promise<any[]> {
  return getCmsProjects();
}

export async function getServices(lang: string = 'de'): Promise<any[]> {
  return getCmsServices(lang);
}

export async function getCategories(): Promise<any[]> {
  return getCmsCategories();
}

export async function getHeroExperiments(): Promise<HeroExperimentRow[]> {
  return getCmsHeroExperiments();
}
