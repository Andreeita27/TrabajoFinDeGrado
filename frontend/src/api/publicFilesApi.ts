import { apiFetch } from "./apiFetch";

export type PublicUploadType = "tattoos" | "designs" | "professionals";

export async function uploadPublicImage(type: PublicUploadType, file: File, token: string) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await apiFetch<{ url: string }>(`/files/public/${type}`, {
    method: "POST",
    body: fd,
    token,
  });

  return res.url;
}