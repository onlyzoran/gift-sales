/** Prod API base path — preview UI is static, API stays on prod Next.js. */
export const API_BASE_PATH = "/gift-sales";

export function apiUrl(path: string): string {
  return `${API_BASE_PATH}${path}`;
}
