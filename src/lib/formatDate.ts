export function formatDate(
  iso?: string,
  options?: { month?: 'short' | 'long'; fallback?: string }
): string {
  const fallback = options?.fallback ?? '';
  if (!iso) return fallback;
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString(undefined, {
      month: options?.month ?? 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return fallback;
  }
}
