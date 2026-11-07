import {
  generarExposicionResponseSchema,
  type Exposicion,
  type ExportarDocxRequest,
  type GenerarExposicionRequest,
} from "@policia/shared";

export interface ApiIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly issues: ApiIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface CuerpoError {
  error?: string;
  issues?: ApiIssue[];
}

async function leerCuerpoError(response: Response): Promise<CuerpoError> {
  try {
    const cuerpo: unknown = await response.json();

    if (typeof cuerpo !== "object" || cuerpo === null) {
      return {};
    }

    return cuerpo as CuerpoError;
  } catch {
    return {};
  }
}

export async function generarExposicion(
  input: GenerarExposicionRequest,
): Promise<Exposicion> {
  const response = await fetch("/api/generar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const cuerpo = await leerCuerpoError(response);
    throw new ApiError(
      cuerpo.error ?? `La generación falló (HTTP ${response.status})`,
      response.status,
      cuerpo.issues ?? [],
    );
  }

  const resultado = generarExposicionResponseSchema.safeParse(
    await response.json(),
  );

  if (!resultado.success) {
    throw new ApiError(
      "La respuesta del servidor no cumple el contrato de la exposición",
      502,
    );
  }

  return resultado.data;
}

export async function descargarDocx(
  input: ExportarDocxRequest,
): Promise<Blob> {
  const response = await fetch("/api/exportar-docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const cuerpo = await leerCuerpoError(response);
    throw new ApiError(
      cuerpo.error ?? `La exportación falló (HTTP ${response.status})`,
      response.status,
      cuerpo.issues ?? [],
    );
  }

  return response.blob();
}

export function guardarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function obtenerEstado(): Promise<{ provider: string } | null> {
  try {
    const response = await fetch("/api/health");

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as { provider: string };
  } catch {
    return null;
  }
}

export function describirError(error: unknown): {
  mensaje: string;
  issues: ApiIssue[];
} {
  if (error instanceof ApiError) {
    return { mensaje: error.message, issues: error.issues };
  }

  if (error instanceof Error) {
    return { mensaje: error.message, issues: [] };
  }

  return { mensaje: "Ha ocurrido un error inesperado.", issues: [] };
}
