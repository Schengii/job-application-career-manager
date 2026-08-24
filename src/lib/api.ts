// -----------------------------------------------------------------------------
// Kleiner Fetch-Client für die REST-API. Wird von SWR (Datenabruf + Echtzeit-
// Revalidierung) und von Formularen/Aktionen (Mutationen) genutzt.
// -----------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Fehler ${response.status}`, response.status, body.details);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/** SWR-Fetcher: `useSWR("/api/applications", fetcher)` */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return handleResponse<T>(response);
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await fetch(url, { method: "DELETE" });
  return handleResponse<T>(response);
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetch(url, { method: "POST", body: formData });
  return handleResponse<T>(response);
}
