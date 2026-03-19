import AsyncStorage from "@react-native-async-storage/async-storage";

const SECTIONS_KEY = "@ocrecipes_home_sections";
const RECENT_KEY = "@ocrecipes_recent_actions";
const MAX_RECENT = 4;

export type SectionKey = "scanning" | "nutrition" | "recipes" | "planning";

type SectionState = Record<SectionKey, boolean>;

const DEFAULT_SECTIONS: SectionState = {
  scanning: true,
  nutrition: true,
  recipes: true,
  planning: true,
};

// In-memory caches for synchronous reads after init
let sectionCache: SectionState | null = null;
let recentCache: string[] | null = null;

export async function initHomeActionsCache(): Promise<void> {
  const [sectionsRaw, recentRaw] = await Promise.all([
    AsyncStorage.getItem(SECTIONS_KEY).catch(() => null),
    AsyncStorage.getItem(RECENT_KEY).catch(() => null),
  ]);

  try {
    sectionCache = sectionsRaw
      ? { ...DEFAULT_SECTIONS, ...JSON.parse(sectionsRaw) }
      : { ...DEFAULT_SECTIONS };
  } catch {
    sectionCache = { ...DEFAULT_SECTIONS };
  }

  try {
    recentCache = recentRaw ? JSON.parse(recentRaw) : [];
  } catch {
    recentCache = [];
  }
}

export function getSectionState(): SectionState {
  return sectionCache ?? { ...DEFAULT_SECTIONS };
}

export async function setSectionExpanded(
  key: SectionKey,
  expanded: boolean,
): Promise<void> {
  const state = getSectionState();
  state[key] = expanded;
  sectionCache = { ...state };
  await AsyncStorage.setItem(SECTIONS_KEY, JSON.stringify(sectionCache));
}

export function getRecentActions(): string[] {
  return recentCache ?? [];
}

export async function pushRecentAction(actionId: string): Promise<void> {
  const current = getRecentActions().filter((id) => id !== actionId);
  const updated = [actionId, ...current].slice(0, MAX_RECENT);
  recentCache = updated;
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}
