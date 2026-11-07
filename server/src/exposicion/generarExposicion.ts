import {
  generarExposicionResponseSchema,
  type Exposicion,
  type GenerarExposicionRequest,
} from "@policia/shared";
import type { ProveedorIA } from "../ai/provider";

const MAX_INTENTOS = 2;

export class ExposicionInvalidaError extends Error {
  constructor(readonly issues: string[]) {
    super("La IA devolvió una exposición que no cumple el contrato");
    this.name = "ExposicionInvalidaError";
  }
}

/**
 * Pide la exposición al proveedor y la valida contra el contrato compartido.
 * Si la primera respuesta es inválida, reintenta una vez (spec §14.4).
 */
export async function generarExposicion(
  proveedor: ProveedorIA,
  input: GenerarExposicionRequest,
): Promise<Exposicion> {
  let ultimosIssues: string[] = [];

  for (let intento = 1; intento <= MAX_INTENTOS; intento += 1) {
    const salida = await proveedor.generarExposicion(input);
    const resultado = generarExposicionResponseSchema.safeParse(salida);

    if (resultado.success) {
      return resultado.data;
    }

    ultimosIssues = resultado.error.issues.map(
      (issue) => issue.path.join(".") || "(raíz)",
    );
  }

  throw new ExposicionInvalidaError(ultimosIssues);
}
