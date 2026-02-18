import { apiFetch } from "./apiFetch";
import type { AvailabilitySlotDto } from "../types/availability";

export function getAvailability(
  token: string,
  params: {
    professionalId: number;
    dateFrom: string;
    dateTo: string;
    durationMinutes?: number;
    stepMinutes?: number;
  }
) {
  const qs = new URLSearchParams();
  qs.set("professionalId", String(params.professionalId));
  qs.set("dateFrom", params.dateFrom);
  qs.set("dateTo", params.dateTo);
  if (typeof params.durationMinutes === "number") qs.set("durationMinutes", String(params.durationMinutes));
  if (typeof params.stepMinutes === "number") qs.set("stepMinutes", String(params.stepMinutes));

  return apiFetch<AvailabilitySlotDto[]>(`/availability?${qs.toString()}`, {
    method: "GET",
    token,
  });
}
