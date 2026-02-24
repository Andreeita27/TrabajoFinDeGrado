import { apiFetch } from "./apiFetch";

export type AvailabilityWindowDto = {
  id: number;
  professionalId: number;
  professionalName: string;
  startDateTime: string;
  endDateTime: string;
  enabled: boolean;
  note?: string;
};

export type AvailabilityWindowInDto = {
  startDateTime: string;
  endDateTime: string;
  note?: string;
};

export type UnavailabilityBlockDto = {
  id: number;
  professionalId: number;
  professionalName: string;
  startDateTime: string;
  endDateTime: string;
  enabled: boolean;
  reason?: string;
};

export type UnavailabilityBlockInDto = {
  startDateTime: string;
  endDateTime: string;
  reason?: string;
};

export function getAvailabilityWindows(token: string, professionalId: number) {
  return apiFetch<AvailabilityWindowDto[]>(
    `/professionals/${professionalId}/availability-windows`,
    { method: "GET", token }
  );
}

export function createAvailabilityWindow(token: string, professionalId: number, payload: AvailabilityWindowInDto) {
  return apiFetch<AvailabilityWindowDto>(
    `/professionals/${professionalId}/availability-windows`,
    { method: "POST", token, body: JSON.stringify(payload) }
  );
}

export function toggleAvailabilityWindow(token: string, windowId: number) {
  return apiFetch<AvailabilityWindowDto>(`/availability-windows/${windowId}/toggle`, {
    method: "PUT",
    token,
  });
}

export function deleteAvailabilityWindow(token: string, windowId: number) {
  return apiFetch<void>(`/availability-windows/${windowId}`, { method: "DELETE", token });
}

//blocks

export function getUnavailabilityBlocks(token: string, professionalId: number) {
  return apiFetch<UnavailabilityBlockDto[]>(
    `/professionals/${professionalId}/unavailability-blocks`,
    { method: "GET", token }
  );
}

export function createUnavailabilityBlock(token: string, professionalId: number, payload: UnavailabilityBlockInDto) {
  return apiFetch<UnavailabilityBlockDto>(
    `/professionals/${professionalId}/unavailability-blocks`,
    { method: "POST", token, body: JSON.stringify(payload) }
  );
}

export function toggleUnavailabilityBlock(token: string, blockId: number) {
  return apiFetch<UnavailabilityBlockDto>(`/unavailability-blocks/${blockId}/toggle`, {
    method: "PUT",
    token,
  });
}

export function deleteUnavailabilityBlock(token: string, blockId: number) {
  return apiFetch<void>(`/unavailability-blocks/${blockId}`, { method: "DELETE", token });
}