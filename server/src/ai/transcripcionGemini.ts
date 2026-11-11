import { GoogleGenAI } from "@google/genai";
import {
  ESPERAS_SOBRECARGA_POR_DEFECTO,
  conLimite,
  esperar,
  mapearError,
} from "./comun";
import {
  PROMPT_SISTEMA_TRANSCRIPCION,
  RESPUESTA_SIN_TEXTO,
} from "./prompts";
import {
  ProveedorConfiguracionError,
  ProveedorError,
  ProveedorTiempoAgotadoError,
} from "./provider";
import type { ArchivoTranscripcion, ProveedorTranscripcion } from "./transcripcion";

export type ContenidoVision =
  | { type: "text"; text: string }
  | { type: "image"; mime_type: string; data: string }
  | { type: "document"; mime_type: string; data: string };

export interface ParametrosVision {
  model: string;
  input: ContenidoVision[];
  generation_config?: {
    thinking_level?: "minimal" | "low" | "medium" | "high";
    max_output_tokens?: number;
  };
  store?: boolean;
}

export interface OpcionesInteraccionVision {
  retries?: { strategy: "none" };
}

export interface ClienteVision {
  interactions: {
    create(
      params: ParametrosVision,
      options?: OpcionesInteraccionVision,
    ): Promise<{ output_text?: string }>;
  };
}

export interface OpcionesProveedorTranscripcion {
  cliente?: ClienteVision;
  apiKey?: string;
  modelo?: string;
  presupuestoMs?: number;
  timeoutMs?: number;
  /** Esperas entre reintentos si Gemini responde 503. */
  esperasSobrecargaMs?: number[];
}

const MODELO_VISION_POR_DEFECTO = "gemini-3.5-flash-lite";
const PRESUPUESTO_POR_DEFECTO = 35_000;
const TIMEOUT_POR_DEFECTO = 30_000;
const MIN_LLAMADA_MS = 4_000;

/** Quita los bloques de código con los que a veces envuelve la respuesta. */
export function limpiarTranscripcion(texto: string): string {
  const limpio = texto
    .trim()
    .replace(/^```[a-zA-Z]*\s*\n?/u, "")
    .replace(/\n?```$/u, "")
    .trim();

  return limpio;
}

function leerPresupuesto(): number {
  const valor = Number(process.env.GEMINI_PRESUPUESTO_TRANSCRIPCION_MS);

  if (!Number.isFinite(valor) || valor <= 0) {
    return PRESUPUESTO_POR_DEFECTO;
  }

  return Math.min(Math.max(valor, 10_000), 50_000);
}

function textoDe(respuesta: { output_text?: string }): string {
  const texto = limpiarTranscripcion(respuesta.output_text ?? "");

  if (!texto || texto.toUpperCase() === RESPUESTA_SIN_TEXTO) {
    throw new ProveedorError(
      "No se ha podido leer texto en el archivo. Prueba con una imagen más nítida o recorta la zona del texto.",
      422,
    );
  }

  return texto;
}

export function crearProveedorTranscripcionGemini(
  opciones: OpcionesProveedorTranscripcion = {},
): ProveedorTranscripcion {
  const apiKey = (opciones.apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
  const modelo =
    (opciones.modelo ?? process.env.GEMINI_MODEL_VISION ?? "").trim() ||
    MODELO_VISION_POR_DEFECTO;

  if (!opciones.cliente && !apiKey) {
    throw new ProveedorConfiguracionError(
      "Falta GEMINI_API_KEY en el servidor. Configura la clave o usa AI_PROVIDER=mock.",
    );
  }

  const presupuestoMs = opciones.presupuestoMs ?? leerPresupuesto();
  const timeoutMs = Math.min(
    opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO,
    presupuestoMs,
  );
  const esperas =
    opciones.esperasSobrecargaMs ?? ESPERAS_SOBRECARGA_POR_DEFECTO;

  const cliente =
    opciones.cliente ??
    new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: presupuestoMs + 5_000,
        // `image` y `document` solo están disponibles en v1beta.
        apiVersion: "v1beta",
      },
    });

  function contenido(archivo: ArchivoTranscripcion): ContenidoVision[] {
    const base64 = archivo.datos.toString("base64");
    const adjunto: ContenidoVision =
      archivo.tipo === "pdf"
        ? { type: "document", mime_type: archivo.mime, data: base64 }
        : { type: "image", mime_type: archivo.mime, data: base64 };

    return [{ type: "text", text: PROMPT_SISTEMA_TRANSCRIPCION }, adjunto];
  }

  async function llamar(archivo: ArchivoTranscripcion): Promise<string> {
    const inicio = Date.now();
    const maxIntentos = esperas.length + 1;

    for (let intento = 1; ; intento += 1) {
      const restante = timeoutMs - (Date.now() - inicio);

      if (restante < MIN_LLAMADA_MS) {
        throw new ProveedorTiempoAgotadoError();
      }

      try {
        const respuesta = await conLimite(
          cliente.interactions.create(
            {
              model: modelo,
              input: contenido(archivo),
              generation_config: {
                thinking_level: "low",
                max_output_tokens: 4_096,
              },
              store: false,
            },
            { retries: { strategy: "none" } },
          ),
          restante,
        );

        return textoDe(respuesta);
      } catch (error) {
        const mapeado = mapearError(error, {
          operacion: "transcripción",
          mensajeGenerico: "No se pudo transcribir el archivo con Gemini.",
        });
        const esSobrecarga =
          mapeado instanceof ProveedorError && mapeado.status === 503;

        if (!esSobrecarga || intento >= maxIntentos) {
          throw mapeado;
        }

        const espera = esperas[intento - 1] ?? 0;

        if (timeoutMs - (Date.now() - inicio) <= espera) {
          throw mapeado;
        }

        await esperar(espera);
      }
    }
  }

  return {
    nombre: "gemini",
    transcribir: llamar,
  };
}
