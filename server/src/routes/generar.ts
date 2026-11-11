import { Router } from "express";
import { generarExposicionRequestSchema } from "@policia/shared";
import { obtenerProveedor } from "../ai";
import {
  ExposicionInvalidaError,
  generarExposicion,
} from "../exposicion/generarExposicion";
import {
  crearLimitePeticiones,
  leerMaximo,
  leerVentanaMs,
} from "../seguridad/limitePeticiones";
import { responderErrorIA } from "./respuestaErrores";

export const generarRouter = Router();

const limiteGeneracion = crearLimitePeticiones({
  maximo: leerMaximo("LIMITE_GENERAR", 10),
  ventanaMs: leerVentanaMs("LIMITE_GENERAR_VENTANA_MS"),
  mensaje:
    "Has generado demasiadas exposiciones seguidas. Espera unos minutos antes de volver a intentarlo.",
});

generarRouter.post("/generar", limiteGeneracion, async (request, response, next) => {
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

    if (responderErrorIA(response, error, "generación")) {
      return;
    }

    next(error);
  }
});
