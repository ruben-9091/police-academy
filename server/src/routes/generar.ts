import { Router } from "express";
import { generarExposicionRequestSchema } from "@policia/shared";
import { obtenerProveedor } from "../ai";
import {
  ProveedorConfiguracionError,
  ProveedorError,
  ProveedorLimiteError,
  ProveedorNoDisponibleError,
  ProveedorRespuestaInvalidaError,
  ProveedorTiempoAgotadoError,
} from "../ai/provider";
import {
  ExposicionInvalidaError,
  generarExposicion,
} from "../exposicion/generarExposicion";

export const generarRouter = Router();

generarRouter.post("/generar", async (request, response, next) => {
  const entrada = generarExposicionRequestSchema.safeParse(request.body);

  if (!entrada.success) {
    response.status(400).json({
      error: "Datos de entrada no válidos",
      issues: entrada.error.issues.map((issue) => ({
        path: issue.path.join(".") || "(raíz)",
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const exposicion = await generarExposicion(obtenerProveedor(), entrada.data);
    response.json(exposicion);
  } catch (error) {
    if (error instanceof ExposicionInvalidaError) {
      console.error(
        "AI output rejected after repair. Invalid paths:",
        error.issues.join(", "),
      );
      response.status(502).json({
        error: "La IA devolvió una exposición no válida. Vuelve a intentarlo.",
      });
      return;
    }

    if (error instanceof ProveedorRespuestaInvalidaError) {
      console.error(
        "Gemini returned invalid output after repair. Invalid paths:",
        error.issues.join(", "),
      );
      response.status(502).json({
        error: "La IA devolvió una exposición no válida. Vuelve a intentarlo.",
      });
      return;
    }

    if (error instanceof ProveedorLimiteError) {
      console.warn("Gemini rate limit reached");
      response.status(429).json({
        error:
          "Se ha alcanzado el límite de uso de Gemini. Espera unos minutos y vuelve a intentarlo.",
      });
      return;
    }

    if (error instanceof ProveedorTiempoAgotadoError) {
      console.warn("Gemini generation timed out");
      response.status(504).json({
        error:
          "La generación ha superado el tiempo máximo. Vuelve a intentarlo; si persiste, acorta el relato.",
      });
      return;
    }

    if (error instanceof ProveedorConfiguracionError) {
      console.error("Gemini configuration error:", error.message);
      response.status(503).json({ error: error.message });
      return;
    }

    if (error instanceof ProveedorNoDisponibleError) {
      console.error("AI provider unavailable:", error.proveedor);
      response.status(503).json({ error: "Proveedor de IA no disponible" });
      return;
    }

    if (error instanceof ProveedorError) {
      console.error("Gemini provider error:", error.message);
      response.status(error.status ?? 502).json({ error: error.message });
      return;
    }

    next(error);
  }
});
