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

function validar(salida: unknown):
  | { ok: true; exposicion: Exposicion }
  | { ok: false; issues: string[] } {
  const resultado = generarExposicionResponseSchema.safeParse(salida);

  if (resultado.success) {
    return { ok: true, exposicion: resultado.data };
  }

  return {
    ok: false,
    issues: resultado.error.issues.map(
      (issue) => issue.path.join(".") || "(raíz)",
    ),
  };
}

/**
 * Pide la exposición al proveedor y la valida contra el contrato compartido.
 *
 * Si el proveedor puede reparar una salida inválida, se usa esa vía para no
 * repetir toda la pipeline. El mock, que no la implementa, conserva el
 * reintento completo de la spec §14.4.
 */
export async function generarExposicion(
  proveedor: ProveedorIA,
  input: GenerarExposicionRequest,
): Promise<Exposicion> {
  let salida = await proveedor.generarExposicion(input);
  let resultado = validar(salida);

  if (resultado.ok) {
    return resultado.exposicion;
  }

  if (proveedor.repararExposicion) {
    const reparada = await proveedor.repararExposicion(
      input,
      salida,
      resultado.issues,
    );
    const validada = validar(reparada);

    if (validada.ok) {
      return validada.exposicion;
    }

    throw new ExposicionInvalidaError(validada.issues);
  }

  for (let intento = 2; intento <= MAX_INTENTOS; intento += 1) {
    salida = await proveedor.generarExposicion(input);
    resultado = validar(salida);

    if (resultado.ok) {
      return resultado.exposicion;
    }
  }

  throw new ExposicionInvalidaError(resultado.issues);
}
