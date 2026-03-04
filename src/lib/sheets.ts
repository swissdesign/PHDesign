import { getServices as getCmsServices, getProjects as getCmsProjects, getCategories as getCmsCategories } from '../server/modules/cms';

export type SheetsAllResponse = {
  projects: any[];
  services: any[];
  categories: any[];
};

export async function getAll(lang: string = 'de'): Promise<SheetsAllResponse> {
  const [projects, services, categories] = await Promise.all([
    getCmsProjects(),
    getCmsServices(lang),
    getCmsCategories()
  ]);

  return { projects, services, categories };
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
