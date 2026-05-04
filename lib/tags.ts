const STORAGE_KEY = "nemef_post_tags_v1";

export function loadAllTags(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<string, string[]>;
  } catch {
    return {};
  }
}

export function loadTags(postId: string): string[] {
  const all = loadAllTags();
  return all[postId] ?? [];
}

export function saveTags(postId: string, tags: string[]): void {
  if (typeof window === "undefined") return;
  const all = loadAllTags();
  if (tags.length === 0) {
    delete all[postId];
  } else {
    all[postId] = tags;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getAllUniqueTags(): string[] {
  const all = loadAllTags();
  const set = new Set<string>();
  for (const tags of Object.values(all)) {
    for (const tag of tags) {
      if (tag.trim()) set.add(tag.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
}
