import { apiFetch } from "./apiFetch";
import type { ProfessionalDto } from "../types/professional";

export function getProfessional(id: number) {
  return apiFetch<ProfessionalDto>(`/professionals/${id}`, {
    method: "GET",
  });
}

export function createProfessional(token: string, data: Omit<ProfessionalDto, "id">) {
  return apiFetch<ProfessionalDto>("/professionals", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateProfessional(token: string, id: number, data: ProfessionalDto) {
  return apiFetch<ProfessionalDto>(`/professionals/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data),
  });
}

export function deleteProfessional(token: string, id: number) {
  return apiFetch<void>(`/professionals/${id}`, {
    method: "DELETE",
    token,
  });
}