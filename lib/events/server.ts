import {
  getEventProjectFromCMS,
  getEventProjectSlugsFromCMS,
  getEventProjectsFromCMS,
} from "@/lib/cms/portfolio";

export async function getEventProjectsForPage() {
  return getEventProjectsFromCMS();
}

export async function getEventProjectForPage(slug: string) {
  return getEventProjectFromCMS(slug);
}

export async function getEventSlugsForPage() {
  return getEventProjectSlugsFromCMS();
}
