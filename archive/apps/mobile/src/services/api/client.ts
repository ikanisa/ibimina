import Constants from "expo-constants";

import { useAppStore } from "../../providers/store";

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

const requireBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error("Missing API base URL configuration");
  }
  return API_BASE_URL.replace(/\/$/, "");
};

export interface ApiRequestInit extends RequestInit {
  includeAuth?: boolean;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { includeAuth = true, headers, ...rest } = init;
  const token = useAppStore.getState().authToken;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (!(rest.body instanceof FormData)) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] ?? "application/json";
  }

  if (includeAuth && token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${requireBaseUrl()}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      body = await response.text();
    }
    throw new ApiError(`Request failed with status ${response.status}`, response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}
