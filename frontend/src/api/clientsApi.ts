import { apiFetch } from "./apiFetch";
import type { ClientDto } from "../types/client";

export function getClients(
  token: string,
  params?: { clientName?: string; clientSurname?: string; }
) {
  const sp = new URLSearchParams();
  if (params?.clientName) sp.set("clientName", params.clientName);
  if (params?.clientSurname) sp.set("clientSurname", params.clientSurname);

  const qs = sp.toString();
  return apiFetch<ClientDto[]>(`/clients${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token,
  });
}

export async function searchClients(token: string, q: string) {
  const cleaned = q.trim().replace(/\s+/g, " ");
  if (!cleaned) return [];

  const parts = cleaned.split(" ");
  const clientName = parts[0] ?? "";
  const clientSurname = parts.slice(1).join(" ").trim();

  return getClients(token, {
    clientName,
    clientSurname: clientSurname || undefined,
  });
}