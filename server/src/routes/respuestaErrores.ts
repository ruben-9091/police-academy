import type { Response } from "express";
import {
  ProveedorConfiguracionError,
  ProveedorError,
  ProveedorLimiteError,
  ProveedorNoDisponibleError,
  ProveedorRespuestaInvalidaError,
  ProveedorTiempoAgotadoError,
} from "../ai/provider";

export type OperacionIA = "generación" | "transcripción";

const MENSAJES: Record<
  OperacionIA,
  {
    invalida: string;
    tiempo: string;
  }
> = {
  generación: {
    invalida: "La IA devolvió una exposición no válida. Vuelve a intentarlo.",
    tiempo:
      "La generación ha superado el tiempo máximo. Vuelve a intentarlo; si persiste, acorta el relato.",
  },
  transcripción: {
    invalida:
      "La IA devolvió una transcripción no válida. Vuelve a intentarlo.",
    tiempo:
      "La transcripción ha superado el tiempo máximo. Vuelve a intentarlo con un archivo más pequeño.",
  },
};

/**
 * Traduce los errores del proveedor de IA a respuestas HTTP. Devuelve `false`
 * cuando el error no es del proveedor y debe seguir su curso.
 */
export function responderErrorIA(
  response: Response,
  error: unknown,
  operacion: OperacionIA,
): boolean {
  const mensajes = MENSAJES[operacion];

  if (error instanceof ProveedorRespuestaInvalidaError) {
    console.error(
      "AI output rejected after repair. Invalid paths:",
      error.issues.join(", "),
    );
    response.status(502).json({ error: mensajes.invalida });
    return true;
  }

  if (error instanceof ProveedorLimiteError) {
    console.warn("Gemini rate limit reached");
    response.status(429).json({
      error:
        "Se ha alcanzado el límite de uso de Gemini. Espera unos minutos y vuelve a intentarlo.",
    });
    return true;
  }

  if (error instanceof ProveedorTiempoAgotadoError) {
    console.warn(`Gemini ${operacion} timed out`);
    response.status(504).json({ error: mensajes.tiempo });
    return true;
  }

  if (error instanceof ProveedorConfiguracionError) {
    console.error("Gemini configuration error:", error.message);
    response.status(503).json({ error: error.message });
    return true;
  }

  if (error instanceof ProveedorNoDisponibleError) {
    console.error("AI provider unavailable:", error.proveedor);
    response.status(503).json({ error: "Proveedor de IA no disponible" });
    return true;
  }

  if (error instanceof ProveedorError) {
    console.error("Gemini provider error:", error.message);
    response.status(error.status ?? 502).json({ error: error.message });
    return true;
  }

  return false;
}
