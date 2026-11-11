import { z } from "zod";
import {
  ENCABEZADOS_MANIFIESTA,
  MAX_RELATO_CARACTERES,
  OPCIONES_EXPOSICION_POR_DEFECTO,
  TIPOS_ADJUNTO,
  TIPOS_ALERTA_REVISION,
  esMarcadorDatoPendiente,
} from "./constants";

const textoRequerido = (campo: string) =>
  z.string().trim().min(1, `${campo} no puede estar vacío`);

const relatoSchema = textoRequerido("El relato bruto").max(
  MAX_RELATO_CARACTERES,
  `El relato no puede superar los ${MAX_RELATO_CARACTERES} caracteres`,
);

const textoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const adjuntoSchema = z.object({
  nombre: textoRequerido("El nombre del adjunto"),
  tipo: z.enum(TIPOS_ADJUNTO),
});

export const agenteSchema = z.object({
  nip: textoRequerido("El NIP del agente"),
});

export const datosCasoSchema = z
  .object({
    atestado: textoOpcional,
    eurocop: textoOpcional,
    dependencia: textoOpcional,
    lugarFecha: textoOpcional,
    indicativo: textoOpcional,
    agentes: z.array(agenteSchema).optional(),
    personaPresentada: textoOpcional,
    entrega: textoOpcional,
  })
  .prefault({});

export const opcionesExposicionSchema = z
  .object({
    incluirCabecera: z
      .boolean()
      .default(OPCIONES_EXPOSICION_POR_DEFECTO.incluirCabecera),
    encabezadoManifiesta: z
      .enum(ENCABEZADOS_MANIFIESTA)
      .default(OPCIONES_EXPOSICION_POR_DEFECTO.encabezadoManifiesta),
    subtitulo: z
      .string()
      .trim()
      .default(OPCIONES_EXPOSICION_POR_DEFECTO.subtitulo),
  })
  .prefault({});

export const parrafoExposicionSchema = z.object({
  id: textoRequerido("El id del párrafo"),
  texto: textoRequerido("El texto del párrafo"),
});

export const datoPendienteSchema = z.object({
  marcador: textoRequerido("El marcador").refine(
    esMarcadorDatoPendiente,
    "El marcador debe tener el formato [DATO QUE CONVENDRÍA CONCRETAR: ...]",
  ),
  motivo: textoOpcional,
});

export const fundamentoNormativoSchema = z.object({
  norma: textoRequerido("La norma"),
  porQueAplica: textoRequerido("El motivo de aplicación"),
});

export const alertaRevisionSchema = z.object({
  tipo: z.enum(TIPOS_ALERTA_REVISION),
  fragmento: textoRequerido("El fragmento"),
  sugerencia: textoRequerido("La sugerencia"),
});

export const exposicionSchema = z
  .object({
    parrafos: z
      .array(parrafoExposicionSchema)
      .min(1, "La exposición debe tener al menos un párrafo"),
    datosPendientes: z.array(datoPendienteSchema),
    fundamentosNormativos: z.array(fundamentoNormativoSchema),
    alertasRevision: z.array(alertaRevisionSchema),
  })
  .superRefine((exposicion, context) => {
    const ids = new Set<string>();

    exposicion.parrafos.forEach((parrafo, index) => {
      if (ids.has(parrafo.id)) {
        context.addIssue({
          code: "custom",
          message: "Los ids de párrafo deben ser únicos",
          path: ["parrafos", index, "id"],
        });
      }

      ids.add(parrafo.id);

      if (!parrafo.texto.startsWith("Que ")) {
        context.addIssue({
          code: "custom",
          message: 'El párrafo debe empezar por "Que ..."',
          path: ["parrafos", index, "texto"],
        });
      }
    });
  });

export const casoSchema = z.object({
  id: textoRequerido("El id del caso"),
  creadoEn: z.iso.datetime({ offset: true }),
  relatoBruto: relatoSchema,
  adjuntos: z.array(adjuntoSchema).default([]),
  datos: datosCasoSchema,
  opciones: opcionesExposicionSchema,
  exposicion: exposicionSchema.optional(),
});

export const generarExposicionRequestSchema = z.object({
  relatoBruto: relatoSchema,
  datos: datosCasoSchema,
  opciones: opcionesExposicionSchema,
});

export const transcribirResponseSchema = z.object({
  texto: textoRequerido("La transcripción"),
});

export const generarExposicionResponseSchema = exposicionSchema;

export const exportarDocxRequestSchema = z.object({
  datos: datosCasoSchema,
  opciones: opcionesExposicionSchema,
  exposicion: exposicionSchema,
});


export type Adjunto = z.infer<typeof adjuntoSchema>;
export type Agente = z.infer<typeof agenteSchema>;
export type DatosCaso = z.infer<typeof datosCasoSchema>;
export type OpcionesExposicion = z.infer<typeof opcionesExposicionSchema>;
export type ParrafoExposicion = z.infer<typeof parrafoExposicionSchema>;
export type DatoPendiente = z.infer<typeof datoPendienteSchema>;
export type FundamentoNormativo = z.infer<typeof fundamentoNormativoSchema>;
export type AlertaRevision = z.infer<typeof alertaRevisionSchema>;
export type Exposicion = z.infer<typeof exposicionSchema>;
export type Caso = z.infer<typeof casoSchema>;
export type CasoInput = z.input<typeof casoSchema>;
export type GenerarExposicionRequest = z.infer<
  typeof generarExposicionRequestSchema
>;
export type GenerarExposicionRequestInput = z.input<
  typeof generarExposicionRequestSchema
>;
export type GenerarExposicionResponse = z.infer<
  typeof generarExposicionResponseSchema
>;
export type ExportarDocxRequest = z.infer<typeof exportarDocxRequestSchema>;
export type ExportarDocxRequestInput = z.input<
  typeof exportarDocxRequestSchema
>;
export type TranscribirResponse = z.infer<typeof transcribirResponseSchema>;
