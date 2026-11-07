import { Router } from "express";
import { generarExposicionRequestSchema } from "@policia/shared";
import { obtenerProveedor } from "../ai";
import { ProveedorNoDisponibleError } from "../ai/provider";
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
        "AI output rejected after retry. Invalid paths:",
        error.issues.join(", "),
      );
      response
        .status(502)
        .json({ error: "La IA devolvió una exposición no válida" });
      return;
    }

    if (error instanceof ProveedorNoDisponibleError) {
      console.error("AI provider unavailable:", error.proveedor);
      response.status(500).json({ error: "Proveedor de IA no disponible" });
      return;
    }

    next(error);
  }
});
