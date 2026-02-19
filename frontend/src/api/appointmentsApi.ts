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

export function getAppointmentsAdmin(
  token: string,
  params?: { state?: string; clientId?: number; professionalId?: number }
) {
  const qs = new URLSearchParams();
  if (params?.state) qs.set("state", params.state);
  if (typeof params?.clientId === "number") qs.set("clientId", String(params.clientId));
  if (typeof params?.professionalId === "number") qs.set("professionalId", String(params.professionalId));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<AppointmentDto[]>(`/appointments${suffix}`, { method: "GET", token });
}