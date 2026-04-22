const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type ApiFetchOptions = RequestInit & {
  token?: string | null;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;

  const mergedHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  if (!isFormData && !("Content-Type" in mergedHeaders)) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: mergedHeaders,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const errorData = data as { message?: string; error?: string } | null;

    const message =
      typeof data === "string"
        ? data
        : errorData?.message ||
          errorData?.error ||
          res.statusText;

    throw new ApiError(res.status, message, data);
  }

  return data as T;
}