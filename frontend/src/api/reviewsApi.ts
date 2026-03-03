import { apiFetch } from "./apiFetch";
import type { ReviewDto, ReviewInDto } from "../types/review";

export function createReview(token: string, payload: ReviewInDto) {
  return apiFetch<ReviewDto>("/reviews", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}