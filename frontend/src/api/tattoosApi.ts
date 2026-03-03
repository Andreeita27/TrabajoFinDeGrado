import { apiFetch } from "./apiFetch";
import type { TattooDto, TattooInDto } from "../types/tattoo";

export function getAllTattoos(token: string) {
  return apiFetch<TattooDto[]>("/tattoos", { method: "GET", token });
}

export function getTattoo(token: string, id: number) {
  return apiFetch<TattooDto>(`/tattoos/${id}`, { method: "GET", token });
}

export function createTattoo(token: string, payload: TattooInDto) {
  return apiFetch<TattooDto>("/tattoos", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateTattoo(token: string, id: number, payload: TattooInDto) {
  return apiFetch<TattooDto>(`/tattoos/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteTattoo(token: string, id: number) {
  return apiFetch<void>(`/tattoos/${id}`, { method: "DELETE", token });
}