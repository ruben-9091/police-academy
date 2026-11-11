import {
  ProveedorConfiguracionError,
  ProveedorError,
  ProveedorLimiteError,
  ProveedorRespuestaInvalidaError,
  ProveedorTiempoAgotadoError,
} from "./provider";

/** Esperas entre reintentos cuando Gemini responde 503 por alta demanda. */
export const ESPERAS_SOBRECARGA_POR_DEFECTO = [750, 1_500];

export function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Rechaza con `ProveedorTiempoAgotadoError` si la promesa no termina a tiempo. */
export function conLimite<T>(promesa: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) {
    return Promise.reject(new ProveedorTiempoAgotadoError());
  }

  return new Promise<T>((resolve, reject) => {
    const temporizador = setTimeout(
      () => reject(new ProveedorTiempoAgotadoError()),
      ms,
    );

    promesa.then(
      (valor) => {
        clearTimeout(temporizador);
        resolve(valor);
      },
      (error: unknown) => {
        clearTimeout(temporizador);
        reject(error);
      },
    );
  });
}

export function estadoHttp(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const registro = error as Record<string, unknown>;

  for (const clave of ["status", "statusCode"]) {
    if (typeof registro[clave] === "number") {
      return registro[clave] as number;
    }
  }

  return undefined;
}

export interface OpcionesMapeoError {
  /** Mensaje para los fallos que no encajan en ningún caso conocido. */
  mensajeGenerico?: string;
  /** Sustantivo de la operación, para los mensajes de error al usuario. */
  operacion?: string;
}

export function mapearError(
  error: unknown,
  opciones: OpcionesMapeoError = {},
): Error {
  if (
    error instanceof ProveedorConfiguracionError ||
    error instanceof ProveedorLimiteError ||
    error instanceof ProveedorTiempoAgotadoError ||
    error instanceof ProveedorRespuestaInvalidaError ||
    error instanceof ProveedorError
  ) {
    return error;
  }

  const operacion = opciones.operacion ?? "generación";
  const status = estadoHttp(error);

  if (status === 429) {
    return new ProveedorLimiteError();
  }

  if (status === 401 || status === 403) {
    return new ProveedorConfiguracionError(
      "La clave de Gemini no es válida o no tiene permisos suficientes.",
    );
  }

  if (status === 404) {
    return new ProveedorConfiguracionError(
      "El modelo de Gemini configurado no está disponible.",
    );
  }

  if (status === 400) {
    return new ProveedorError(
      `Gemini rechazó la petición de ${operacion}.`,
      400,
    );
  }

  if (status === 503) {
    return new ProveedorError(
      "Gemini no está disponible en este momento. Vuelve a intentarlo en unos minutos.",
      503,
    );
  }

  if (status === 504) {
    return new ProveedorTiempoAgotadoError();
  }

  if (status !== undefined && status >= 500) {
    return new ProveedorError(
      "Gemini no está disponible en este momento.",
      502,
    );
  }

  if (
    error instanceof Error &&
    /timeout|timed out|aborted|etimedout/i.test(error.message)
  ) {
    return new ProveedorTiempoAgotadoError();
  }

  return new ProveedorError(
    opciones.mensajeGenerico ??
      "No se pudo completar la generación con Gemini.",
  );
}
