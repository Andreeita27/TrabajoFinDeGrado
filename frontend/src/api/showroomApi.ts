import { apiFetch } from "./apiFetch";
import type { TattooDto } from "../types/tattoo";
import type { ProfessionalDto } from "../types/professional";
import type { ReviewDto } from "../types/review";

export function getTattoos(params?: { style?: string; coverUp?: boolean; color?: boolean, professionalId?: number }) {
  const qs = new URLSearchParams();
  if (params?.style) qs.set("style", params.style);
  if (typeof params?.coverUp === "boolean") qs.set("coverUp", String(params.coverUp));
  if (typeof params?.color === "boolean") qs.set("color", String(params.color));
  if (typeof params?.professionalId === "number") qs.set("professionalId", String(params.professionalId));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<TattooDto[]>(`/tattoos${suffix}`);
}

export function getProfessionals(params?: { professionalName?: string; booksOpened?: boolean; yearsExperience?: number }) {
  const qs = new URLSearchParams();
  if (params?.professionalName) qs.set("professionalName", params.professionalName);
  if (typeof params?.booksOpened === "boolean") qs.set("booksOpened", String(params.booksOpened));
  if (typeof params?.yearsExperience === "number") qs.set("yearsExperience", String(params.yearsExperience));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ProfessionalDto[]>(`/professionals${suffix}`);
}

export function getReviews(params?: { rating?: number; professionalId?: number; wouldRecommend?: boolean }) {
  const qs = new URLSearchParams();
  if (typeof params?.rating === "number") qs.set("rating", String(params.rating));
  if (typeof params?.professionalId === "number") qs.set("professionalId", String(params.professionalId));
  if (typeof params?.wouldRecommend === "boolean") qs.set("wouldRecommend", String(params.wouldRecommend));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<ReviewDto[]>(`/reviews${suffix}`);
}

export function getTattooById(id: number) {
  return apiFetch<TattooDto>(`/tattoos/${id}`);
}