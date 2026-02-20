import { apiFetch } from "./apiFetch";
import type { ClientDto, ClientInDto } from "../types/client";

export function getClients(
  token: string,
  params?: { clientName?: string; clientSurname?: string; showPhoto?: boolean }
) {
  const sp = new URLSearchParams();
  if (params?.clientName) sp.set("clientName", params.clientName);
  if (params?.clientSurname) sp.set("clientSurname", params.clientSurname);
  if (typeof params?.showPhoto === "boolean") sp.set("showPhoto", String(params.showPhoto));

  const qs = sp.toString();
  return apiFetch<ClientDto[]>(`/clients${qs ? `?${qs}` : ""}`, {
    method: "GET",
    token,
  });
}

export function createClient(token: string, payload: ClientInDto) {
  return apiFetch<ClientDto>("/clients", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}