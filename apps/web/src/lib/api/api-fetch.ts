export class ApiError extends Error {
  status: number;
  mensaje: string;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
    this.mensaje = mensaje;
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { token = null, headers, ...rest } = options;

  const authToken = token ?? localStorage.getItem("auth_token");

  const config: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.mensaje ?? errorBody.message ?? errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}