import { ApiError, GoogleGenAI } from "@google/genai";
import {
  generarExposicionResponseSchema,
  type AlertaRevision,
  type Exposicion,
  type GenerarExposicionRequest,
} from "@policia/shared";
import {
  ESQUEMA_EXPOSICION,
  ESQUEMA_REVISION,
  type EsquemaJson,
} from "./esquemaGemini";
import { normalizarAlertas, normalizarExposicion } from "./normalizarExposicion";
import {
  PROMPT_SISTEMA_REDACCION,
  PROMPT_SISTEMA_REPARACION,
  PROMPT_SISTEMA_REVISION,
  construirEntradaRedaccion,
  construirEntradaReparacion,
  construirEntradaRevision,
} from "./prompts";
import {
  ProveedorConfiguracionError,
  ProveedorError,
  ProveedorLimiteError,
  ProveedorRespuestaInvalidaError,
  ProveedorTiempoAgotadoError,
  type ProveedorIA,
} from "./provider";

export interface RespuestaInteraccion {
  output_text?: string;
}

export interface ParametrosInteraccion {
  model: string;
  input: string;
  system_instruction?: string;
  response_format?: {
    type: "text";
    mime_type: "application/json";
    schema: EsquemaJson;
  };
  generation_config?: {
    thinking_level?: "minimal" | "low" | "medium" | "high";
    max_output_tokens?: number;
  };
  store?: boolean;
}

export interface ClienteInteracciones {
  interactions: {
    create(params: ParametrosInteraccion): Promise<RespuestaInteraccion>;
  };
}

export interface OpcionesProveedorGemini {
  cliente?: ClienteInteracciones;
  apiKey?: string;
  modelo?: string;
  presupuestoMs?: number;
  timeoutRedaccionMs?: number;
  timeoutRevisionMs?: number;
  timeoutReparacionMs?: number;
  ahora?: () => number;
}

const MODELO_POR_DEFECTO = "gemini-3.8-flash";
const PRESUPUESTO_POR_DEFECTO = 48_000;
const MARGEN_MS = 3_000;
const MIN_LLAMADA_MS = 4_000;
const MIN_REVISION_MS = 8_000;

type Validacion =
  | { ok: true; data: Exposicion }
  | { ok: false; issues: string[] };

function validar(salida: unknown): Validacion {
  const resultado = generarExposicionResponseSchema.safeParse(salida);

  if (resultado.success) {
    return { ok: true, data: resultado.data };
  }

  return {
    ok: false,
    issues: resultado.error.issues.map(
      (issue) => `${issue.path.join(".") || "(raíz)"}: ${issue.message}`,
    ),
  };
}

function parsearSalida(respuesta: RespuestaInteraccion): unknown {
  const texto = respuesta.output_text?.trim();

  if (!texto) {
    return { error: "La respuesta del modelo estaba vacía." };
  }

  try {
    return JSON.parse(texto);
  } catch {
    return {
      error: "La respuesta del modelo no era JSON válido.",
      contenido: texto.slice(0, 4_000),
    };
  }
}

function conLimite<T>(promesa: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) {
    return Promise.reject(new ProveedorTiempoAgotadoError());
  }

  return new Promise<T>((resolve, reject) => {
    const temporizador = setTimeout(
      () => reject(new ProveedorTiempoAgotadoError()),
      ms,
    );

    promesa.then(
      (valor) => {
        clearTimeout(temporizador);
        resolve(valor);
      },
      (error: unknown) => {
        clearTimeout(temporizador);
        reject(error);
      },
    );
  });
}

function mapearError(error: unknown): Error {
  if (
    error instanceof ProveedorConfiguracionError ||
    error instanceof ProveedorLimiteError ||
    error instanceof ProveedorTiempoAgotadoError ||
    error instanceof ProveedorRespuestaInvalidaError ||
    error instanceof ProveedorError
  ) {
    return error;
  }

  if (error instanceof ApiError) {
    if (error.status === 429) {
      return new ProveedorLimiteError();
    }

    if (error.status === 401 || error.status === 403) {
      return new ProveedorConfiguracionError(
        "La clave de Gemini no es válida o no tiene permisos suficientes.",
      );
    }

    if (error.status === 404) {
      return new ProveedorConfiguracionError(
        "El modelo de Gemini configurado no está disponible.",
      );
    }

    if (error.status === 400) {
      return new ProveedorError(
        "Gemini rechazó la petición de generación.",
        400,
      );
    }

    if (error.status >= 500) {
      return new ProveedorError(
        "Gemini no está disponible en este momento.",
        502,
      );
    }
  }

  if (
    error instanceof Error &&
    /timeout|timed out|aborted|etimedout/i.test(error.message)
  ) {
    return new ProveedorTiempoAgotadoError();
  }

  return new ProveedorError("No se pudo completar la generación con Gemini.");
}

function leerPresupuesto(): number {
  const valor = Number(process.env.GEMINI_PRESUPUESTO_MS);

  if (!Number.isFinite(valor) || valor <= 0) {
    return PRESUPUESTO_POR_DEFECTO;
  }

  return Math.min(Math.max(valor, 10_000), 55_000);
}

function alertasDe(salida: unknown): unknown {
  if (typeof salida !== "object" || salida === null) {
    return undefined;
  }

  return (salida as Record<string, unknown>).alertasRevision;
}

function mezclarAlertas(
  exposicion: Exposicion,
  nuevas: AlertaRevision[],
): Exposicion {
  return {
    ...exposicion,
    alertasRevision: normalizarAlertas([
      ...exposicion.alertasRevision,
      ...nuevas,
    ]),
  };
}

function conRevisionIncompleta(
  exposicion: Exposicion,
  sugerencia: string,
): Exposicion {
  return mezclarAlertas(exposicion, [
    {
      tipo: "revision_incompleta",
      fragmento: "Autorrevisión automática",
      sugerencia,
    },
  ]);
}

function motivoRevisionOmitida(error: unknown): string {
  if (error instanceof ProveedorTiempoAgotadoError) {
    return "La autorrevisión automática agotó el tiempo disponible. Revisa el documento manualmente antes de exportarlo.";
  }

  if (error instanceof ProveedorLimiteError) {
    return "No se pudo completar la autorrevisión por límite de cuota. Revisa el documento manualmente antes de exportarlo.";
  }

  return "No se pudo completar la autorrevisión automática. Revisa el documento manualmente antes de exportarlo.";
}

export function crearProveedorGemini(
  opciones: OpcionesProveedorGemini = {},
): ProveedorIA {
  const apiKey = (opciones.apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
  const modelo =
    (opciones.modelo ?? process.env.GEMINI_MODEL_TEXT ?? "").trim() ||
    MODELO_POR_DEFECTO;

  if (!opciones.cliente && !apiKey) {
    throw new ProveedorConfiguracionError(
      "Falta GEMINI_API_KEY en el servidor. Configura la clave o usa AI_PROVIDER=mock.",
    );
  }

  const presupuestoMs = opciones.presupuestoMs ?? leerPresupuesto();
  const timeoutRedaccionMs = opciones.timeoutRedaccionMs ?? 30_000;
  const timeoutRevisionMs = opciones.timeoutRevisionMs ?? 15_000;
  const timeoutReparacionMs = opciones.timeoutReparacionMs ?? 15_000;
  const ahora = opciones.ahora ?? Date.now;

  const cliente =
    opciones.cliente ??
    new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: presupuestoMs + 5_000 },
    });

  const inicios = new WeakMap<object, number>();

  async function llamar(
    parametros: Omit<ParametrosInteraccion, "store">,
    timeoutMs: number,
  ): Promise<unknown> {
    try {
      const respuesta = await conLimite(
        cliente.interactions.create({ ...parametros, store: false }),
        timeoutMs,
      );

      return parsearSalida(respuesta);
    } catch (error) {
      throw mapearError(error);
    }
  }

  async function reparar(
    input: GenerarExposicionRequest,
    salidaInvalida: unknown,
    issues: string[],
    timeoutMs: number,
  ): Promise<unknown> {
    return llamar(
      {
        model: modelo,
        input: construirEntradaReparacion(input, salidaInvalida, issues),
        system_instruction: PROMPT_SISTEMA_REPARACION,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: ESQUEMA_EXPOSICION,
        },
        generation_config: {
          thinking_level: "low",
          max_output_tokens: 8_192,
        },
      },
      timeoutMs,
    );
  }

  function restante(inicio: number): number {
    return presupuestoMs - (ahora() - inicio) - MARGEN_MS;
  }

  return {
    nombre: "gemini",

    async generarExposicion(input) {
      const inicio = ahora();
      inicios.set(input, inicio);

      const timeoutBorrador = Math.min(
        timeoutRedaccionMs,
        restante(inicio),
      );

      if (timeoutBorrador < MIN_LLAMADA_MS) {
        throw new ProveedorTiempoAgotadoError();
      }

      const borrador = normalizarExposicion(
        await llamar(
          {
            model: modelo,
            input: construirEntradaRedaccion(input),
            system_instruction: PROMPT_SISTEMA_REDACCION,
            response_format: {
              type: "text",
              mime_type: "application/json",
              schema: ESQUEMA_EXPOSICION,
            },
            generation_config: {
              thinking_level: "low",
              max_output_tokens: 8_192,
            },
          },
          timeoutBorrador,
        ),
      );

      let validacion = validar(borrador);

      if (!validacion.ok) {
        const timeoutReparacion = Math.min(
          timeoutReparacionMs,
          restante(inicio),
        );

        if (timeoutReparacion < MIN_LLAMADA_MS) {
          throw new ProveedorTiempoAgotadoError();
        }

        const reparada = normalizarExposicion(
          await reparar(
            input,
            borrador,
            validacion.issues,
            timeoutReparacion,
          ),
        );

        validacion = validar(reparada);

        if (!validacion.ok) {
          throw new ProveedorRespuestaInvalidaError(validacion.issues);
        }
      }

      let exposicion = validacion.data;
      const timeoutRevision = Math.min(
        timeoutRevisionMs,
        restante(inicio),
      );

      if (timeoutRevision < MIN_REVISION_MS) {
        exposicion = conRevisionIncompleta(
          exposicion,
          motivoRevisionOmitida(new ProveedorTiempoAgotadoError()),
        );
      } else {
        try {
          const revision = await llamar(
            {
              model: modelo,
              input: construirEntradaRevision(input, exposicion),
              system_instruction: PROMPT_SISTEMA_REVISION,
              response_format: {
                type: "text",
                mime_type: "application/json",
                schema: ESQUEMA_REVISION,
              },
              generation_config: {
                thinking_level: "low",
                max_output_tokens: 2_048,
              },
            },
            timeoutRevision,
          );

          exposicion = mezclarAlertas(
            exposicion,
            normalizarAlertas(alertasDe(revision)),
          );
        } catch (error) {
          const mapeado = mapearError(error);
          console.warn(
            `[gemini] autorrevisión omitida (${mapeado.name}). Se devuelve el borrador.`,
          );
          exposicion = conRevisionIncompleta(
            exposicion,
            motivoRevisionOmitida(mapeado),
          );
        }
      }

      const final = validar(exposicion);

      if (!final.ok) {
        throw new ProveedorRespuestaInvalidaError(final.issues);
      }

      return final.data;
    },

    async repararExposicion(input, salidaInvalida, issues) {
      const inicio = inicios.get(input) ?? ahora();
      const timeoutReparacion = Math.min(
        timeoutReparacionMs,
        restante(inicio),
      );

      if (timeoutReparacion < MIN_LLAMADA_MS) {
        throw new ProveedorTiempoAgotadoError();
      }

      return normalizarExposicion(
        await reparar(input, salidaInvalida, issues, timeoutReparacion),
      );
    },
  };
}
