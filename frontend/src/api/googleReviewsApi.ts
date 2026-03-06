import { apiFetch } from "./apiFetch";
import type { GoogleReviewsResponseDto } from "../types/googleReview";

export function getGoogleReviews() {
  return apiFetch<GoogleReviewsResponseDto>("/google-reviews");
}