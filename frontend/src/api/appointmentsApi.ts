import { apiFetch } from "./apiFetch";
import type { AppointmentDto, AppointmentInDto } from "../types/appointment";

export function getMyAppointments(token: string) {
  return apiFetch<AppointmentDto[]>("/appointments/my", { method: "GET", token });
}

export function createAppointment(token: string, payload: AppointmentInDto) {
  return apiFetch<AppointmentDto>("/appointments", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function cancelAppointment(token: string, id: number) {
  return apiFetch<AppointmentDto>(`/appointments/${id}/cancel`, { method: "POST", token });
}

export function confirmDeposit(token: string, id: number) {
  return apiFetch<AppointmentDto>(`/appointments/${id}/confirm-deposit`, { method: "POST", token });
}

export function getAllAppointments(
  token: string,
  params?: {
    state?: string;
    depositPaid?: boolean;
    dateFrom?: string;
    dateTo?: string;
    professionalName?: string;
    clientName?: string;
  }
) {
  const qs = new URLSearchParams();

  if (params?.state) qs.set("state", params.state);
  if (typeof params?.depositPaid === "boolean") qs.set("depositPaid", String(params.depositPaid));
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo) qs.set("dateTo", params.dateTo);

  if (params?.professionalName) qs.set("professionalName", params.professionalName);
  if (params?.clientName) qs.set("clientName", params.clientName);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<AppointmentDto[]>(`/appointments${suffix}`, { method: "GET", token });
}

export function markNoShow(token: string, id: number) {
  return apiFetch<AppointmentDto>(`/appointments/${id}/mark-no-show`, { method: "POST", token });
}

export function markCompleted(token: string, id: number) {
  return apiFetch<AppointmentDto>(`/appointments/${id}/mark-completed`, { method: "POST", token });
}

export function getAppointment(token: string, id: number) {
  return apiFetch<AppointmentDto>(`/appointments/${id}`, { method: "GET", token });
}