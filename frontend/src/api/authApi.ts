import { apiFetch } from "./apiFetch";
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from "../types/auth";

export function loginApi(payload: LoginRequestDto) {
  return apiFetch<AuthResponseDto>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerApi(payload: RegisterRequestDto) {
  return apiFetch<AuthResponseDto>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
