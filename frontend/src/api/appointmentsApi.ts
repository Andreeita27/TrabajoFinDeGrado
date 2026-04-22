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

export function rescheduleAppointment(token: string, id: number, startDateTime: string) {
  return apiFetch<AppointmentDto>(`/appointments/${id}/reschedule`, {
    method: "PUT",
    token,
    body: JSON.stringify({ startDateTime }),
  });
}

export async function uploadAppointmentReferenceImage(token: string, appointmentId: number, file: File) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/appointments/${appointmentId}/reference-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Error subiendo imagen");
  }

  return (await res.json()) as { referenceImageUrl: string };
}

export async function fetchAppointmentReferenceImageUrl(token: string, appointmentId: number) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

  const res = await fetch(`${BASE_URL}/appointments/${appointmentId}/reference-image`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("No se pudo cargar la imagen");

  return (await res.json()) as { referenceImageUrl: string };
}