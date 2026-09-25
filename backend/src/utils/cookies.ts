/**
 * Utility to parse Cookie header into a key-value record without third-party dependencies
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const items = cookieHeader.split(';');

  for (const item of items) {
    const idx = item.indexOf('=');
    if (idx < 0) continue;
    const key = item.slice(0, idx).trim();
    const val = item.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }

  return cookies;
}
