import type { GenerarExposicionRequest } from "@policia/shared";

export interface ProveedorIA {
  readonly nombre: string;
  /**
   * Devuelve la exposición sin validar. El servicio es quien valida el JSON
   * contra el contrato compartido antes de exponerlo a la API.
   */
  generarExposicion(input: GenerarExposicionRequest): Promise<unknown>;
}

export class ProveedorNoDisponibleError extends Error {
  constructor(readonly proveedor: string) {
    super(`Proveedor de IA no disponible: ${proveedor}`);
    this.name = "ProveedorNoDisponibleError";
  }
}
