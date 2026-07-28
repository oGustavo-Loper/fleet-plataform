export function getDevelopmentCacheKeysForCleanup(keys: string[]) {
  return keys.filter((key) => key.includes("workbox") || key.includes("precache") || key.includes("vite"));
}
