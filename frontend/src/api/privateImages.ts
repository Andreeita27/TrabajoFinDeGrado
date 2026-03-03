const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function fetchPrivateImageObjectUrl(path: string, token: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("No se pudo cargar la imagen privada");
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}