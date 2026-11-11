import type { GenerarExposicionRequest } from "@policia/shared";

export interface ProveedorIA {
  readonly nombre: string;
  /**
   * Devuelve la exposición sin validar. El servicio es quien valida el JSON
   * contra el contrato compartido antes de exponerlo a la API.
   */
  generarExposicion(input: GenerarExposicionRequest): Promise<unknown>;
  /**
   * Repara una salida que no cumple el contrato sin repetir toda la pipeline.
   * Es opcional: el mock sigue reintentando la generación completa.
   */
  repararExposicion?(
    input: GenerarExposicionRequest,
    salidaInvalida: unknown,
    issues: string[],
  ): Promise<unknown>;
}

export class ProveedorNoDisponibleError extends Error {
  constructor(readonly proveedor: string) {
    super(`Proveedor de IA no disponible: ${proveedor}`);
    this.name = "ProveedorNoDisponibleError";
  }
}

export class ProveedorConfiguracionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProveedorConfiguracionError";
  }
}

export class ProveedorLimiteError extends Error {
  constructor(message = "Se ha alcanzado el límite de uso del proveedor de IA.") {
    super(message);
    this.name = "ProveedorLimiteError";
  }
}

export class ProveedorTiempoAgotadoError extends Error {
  constructor(message = "La generación ha superado el tiempo máximo disponible.") {
    super(message);
    this.name = "ProveedorTiempoAgotadoError";
  }
}

export class ProveedorRespuestaInvalidaError extends Error {
  constructor(readonly issues: string[]) {
    super("El proveedor devolvió una exposición que no cumple el contrato");
    this.name = "ProveedorRespuestaInvalidaError";
  }
}

export class ProveedorError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ProveedorError";
  }
}
