import { Router } from "express";
import { exportarDocxRequestSchema } from "@policia/shared";
import { construirDocx } from "../docx/construirDocx";

export const exportarRouter = Router();

exportarRouter.post("/exportar-docx", async (request, response, next) => {
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
});
