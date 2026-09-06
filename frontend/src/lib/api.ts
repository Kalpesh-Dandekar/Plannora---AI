const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface ApiFailure {
  success?: false;
  message?: string;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("plannora_token");
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = (await response.json()) as T & ApiFailure;
  if (!response.ok || data.success === false) {
    throw new Error(data.message ?? "Unable to complete this request.");
  }
  return data;
}

export function notifyDataUpdated(): void {
  window.dispatchEvent(new Event("plannora:data-updated"));
}
