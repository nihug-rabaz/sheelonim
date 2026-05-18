import type { DataStore } from "@/lib/domain/types";
import { createSeedData } from "@/lib/db/seed-data";

const globalStore = globalThis as unknown as { __sheelonimStore?: DataStore };

export function getStore(): DataStore {
  if (!globalStore.__sheelonimStore) {
    globalStore.__sheelonimStore = createSeedData();
  }
  return globalStore.__sheelonimStore;
}

export function resetStore(): void {
  globalStore.__sheelonimStore = createSeedData();
}
