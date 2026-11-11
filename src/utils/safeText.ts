const restrictedLanguage = [
  /\bpi[\s-]?rads\b/i,
  /\b(?:low|moderate|medium|high|elevated|increased|reduced|decreased)\s+(?:clinical\s+)?risk\b/i,
  /\brisk\b/i,
  /\b(?:malignant|benign)\b/i,
  /\b(?:cancer|lesion|tumou?r|suspicious)\b/i,
  /\b(?:biopsy|treatment|therapy|therapeutic|surgery|medication|prescrib\w*)\b/i,
  /\b(?:recommend(?:s|ed|ation)?|advise[sd]?|advice|suggest(?:s|ed|ion)?)\b/i,
  /\bshould\s+(?:consider|undergo|receive)\b/i,
];

export interface FilteredText {
  text: string;
  removed: boolean;
}

export function filterApiText(value: unknown): FilteredText {
  if (typeof value !== 'string') return { text: '', removed: value != null };
  const fragments = value.match(/[^.!?\n]+(?:[.!?]+|\n|$)/g) ?? [];
  let removed = false;
  const safe = fragments.filter((fragment) => {
    if (restrictedLanguage.some((pattern) => pattern.test(fragment))) {
      removed = true;
      return false;
    }
    return true;
  }).join('').trim();
  return { text: safe, removed };
}

export function filterApiObject(value: unknown): { value: unknown; removed: boolean } {
  if (typeof value === 'string') {
    const filtered = filterApiText(value);
    return { value: filtered.text, removed: filtered.removed };
  }
  if (Array.isArray(value)) {
    const results = value.map(filterApiObject);
    return {
      value: results.flatMap((item) => item.value === '' || item.value == null ? [] : [item.value]),
      removed: results.some((item) => item.removed),
    };
  }
  if (value && typeof value === 'object') {
    let removed = false;
    const safeEntries = Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
      const safeKey = filterApiText(key);
      const safeChild = filterApiObject(child);
      removed ||= safeKey.removed || safeChild.removed;
      if (safeKey.removed || safeChild.value === '') return [];
      return [[safeKey.text, safeChild.value] as const];
    });
    return { value: Object.fromEntries(safeEntries), removed };
  }
  return { value, removed: false };
}
