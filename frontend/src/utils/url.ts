const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

export function withBase(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url}`;
}

/* si no hay URL, devuelve ""
si ya viene completa (http:// o https://), la deja tal cual
si viene relativa (/uploads/...), le antepone el BASE_URL */