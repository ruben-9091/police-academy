import { Router } from "express";
import multer from "multer";
import {
  MAX_ADJUNTO_BYTES,
  esMimeAdmitido,
  tipoAdjuntoDeMime,
} from "@policia/shared";
import { obtenerProveedorTranscripcion } from "../ai";
import {
  crearLimitePeticiones,
  leerMaximo,
  leerVentanaMs,
} from "../seguridad/limitePeticiones";
import { responderErrorIA } from "./respuestaErrores";

const TIPO_NO_ADMITIDO = "TIPO_NO_ADMITIDO";

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ADJUNTO_BYTES, files: 1 },
  fileFilter: (_request, archivo, aceptar) => {
    if (esMimeAdmitido(archivo.mimetype)) {
      aceptar(null, true);
      return;
    }

    aceptar(new Error(TIPO_NO_ADMITIDO));
  },
}).single("archivo");

export const transcribirRouter = Router();

const limiteTranscripcion = crearLimitePeticiones({
  maximo: leerMaximo("LIMITE_TRANSCRIBIR", 10),
  ventanaMs: leerVentanaMs("LIMITE_TRANSCRIBIR_VENTANA_MS"),
  mensaje:
    "Has subido demasiados archivos seguidos. Espera unos minutos antes de volver a intentarlo.",
});

transcribirRouter.post(
  "/transcribir",
  limiteTranscripcion,
  (request, response, next) => {
    subida(request, response, async (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          response.status(413).json({
            error: `El archivo supera el máximo de ${Math.round(
              MAX_ADJUNTO_BYTES / (1024 * 1024),
            )} MB.`,
          });
          return;
        }

        response.status(400).json({
          error: "No se ha podido leer el archivo enviado.",
        });
        return;
      }

      if (error) {
        if (error.message === TIPO_NO_ADMITIDO) {
          response.status(415).json({
            error: "Formato no admitido. Sube una imagen JPG, PNG o WebP, o un PDF.",
          });
          return;
        }

        next(error);
        return;
      }

      const archivo = request.file;

      if (!archivo) {
        response.status(400).json({
          error: "Adjunta una imagen o un PDF en el campo «archivo».",
        });
        return;
      }

      const tipo = tipoAdjuntoDeMime(archivo.mimetype);

      if (!tipo) {
        response.status(415).json({
          error: "Formato no admitido. Sube una imagen JPG, PNG o WebP, o un PDF.",
        });
        return;
      }

      try {
        const texto = await obtenerProveedorTranscripcion().transcribir({
          nombre: archivo.originalname,
          mime: archivo.mimetype,
          tipo,
          datos: archivo.buffer,
        });

        response.json({ texto });
      } catch (fallo) {
        if (responderErrorIA(response, fallo, "transcripción")) {
          return;
        }

        next(fallo);
      }
    });
  },
);
