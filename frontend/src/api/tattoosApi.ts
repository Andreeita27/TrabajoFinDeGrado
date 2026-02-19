import { apiFetch } from "./apiFetch";
import type { TattooDto } from "../types/tattoo";

export function getAllTattoos() {
  return apiFetch<TattooDto[]>("/tattoos");
}

export function createTattoo(token: string, data: Omit<TattooDto, "id">) {
  return apiFetch<TattooDto>("/tattoos", {
    method: "POST",
    token,
    body: JSON.stringify(data)
  });
}

export function updateTattoo(token: string, id: number, data: TattooDto) {
  return apiFetch<TattooDto>(`/tattoos/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(data)
  });
}

export function deleteTattoo(token: string, id: number) {
  return apiFetch<void>(`/tattoos/${id}`, {
    method: "DELETE",
    token
  });
}