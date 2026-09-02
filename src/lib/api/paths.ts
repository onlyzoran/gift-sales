/** Next.js basePath from next.config.ts */
export const BASE_PATH = "/gift-sales";

export function apiUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}
