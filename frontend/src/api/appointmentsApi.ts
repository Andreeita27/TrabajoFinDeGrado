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
