import { Router } from "express";
import { exportarDocxRequestSchema } from "@policia/shared";
import { construirDocx } from "../docx/construirDocx";
import {
  crearLimitePeticiones,
  leerMaximo,
  leerVentanaMs,
} from "../seguridad/limitePeticiones";

export const exportarRouter = Router();

const limiteExportacion = crearLimitePeticiones({
  maximo: leerMaximo("LIMITE_EXPORTAR", 30),
  ventanaMs: leerVentanaMs("LIMITE_EXPORTAR_VENTANA_MS"),
  mensaje:
    "Has descargado demasiados documentos seguidos. Espera unos minutos antes de volver a intentarlo.",
});

exportarRouter.post(
  "/exportar-docx",
  limiteExportacion,
  async (request, response, next) => {
    const entrada = exportarDocxRequestSchema.safeParse(request.body);

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
      const documento = await construirDocx(entrada.data);

      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      response.setHeader(
        "Content-Disposition",
        'attachment; filename="exposicion-hechos.docx"',
      );
      response.send(documento);
    } catch (error) {
      next(error);
    }
  },
);
