import { apiFetch } from "./apiFetch";
import type { AvailabilitySlotDto } from "../types/availability";

export type AvailabilityResponseDto = {
  slots: AvailabilitySlotDto[];
  hasPublishedWindows: boolean;
  hasBlocksInRange: boolean;
  blockReasons: string[];
};

export type MonthlyAvailabilityDayDto = {
  date: string;
  status: "AVAILABLE" | "BLOCKED" | "NO_WINDOWS" | "FULL" | "WEEKEND";
  weekend: boolean;
  past: boolean;
  reason?: string | null;
};

export type MonthlyAvailabilitySummaryDto = {
  month: string;
  days: MonthlyAvailabilityDayDto[];
};

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

  return apiFetch<AvailabilityResponseDto>(`/availability?${qs.toString()}`, {
    method: "GET",
    token,
  });
}

export function getAvailabilityMonthSummary(
  token: string,
  params: {
    professionalId: number;
    month: string;
    durationMinutes?: number;
    stepMinutes?: number;
  }
) {
  const qs = new URLSearchParams();
  qs.set("professionalId", String(params.professionalId));
  qs.set("month", params.month);
  if (typeof params.durationMinutes === "number") qs.set("durationMinutes", String(params.durationMinutes));
  if (typeof params.stepMinutes === "number") qs.set("stepMinutes", String(params.stepMinutes));

  return apiFetch<MonthlyAvailabilitySummaryDto>(`/availability/month-summary?${qs.toString()}`, {
    method: "GET",
    token,
  });
}