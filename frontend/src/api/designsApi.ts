import { apiFetch } from "./apiFetch";
import type { DesignDto, DesignInDto } from "../types/design";

export function getDesigns() {
  return apiFetch<DesignDto[]>("/designs");
}

export function getAdminDesigns(token: string) {
  return apiFetch<DesignDto[]>("/admin/designs", { method: "GET", token });
}

export function createDesign(token: string, payload: DesignInDto) {
  return apiFetch<DesignDto>("/designs", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function toggleDesign(token: string, id: number) {
  return apiFetch<DesignDto>(`/designs/${id}/toggle`, { method: "POST", token });
}

export function deleteDesign(token: string, id: number) {
  return apiFetch<void>(`/designs/${id}`, { method: "DELETE", token });
}