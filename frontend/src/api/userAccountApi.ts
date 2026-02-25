import { apiFetch } from "./apiFetch";
import type { ChangePasswordDto, UserAccountDto, UserAccountUpdateDto } from "../types/userAccount";

export function getMe(token: string) {
  return apiFetch<UserAccountDto>("/me", { method: "GET", token });
}

export function updateMe(token: string, payload: UserAccountUpdateDto) {
  return apiFetch<UserAccountDto>("/me", {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export function changeMyPassword(token: string, payload: ChangePasswordDto) {
  return apiFetch<void>("/me/password", {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}