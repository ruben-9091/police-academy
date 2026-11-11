import { TIPOS_ALERTA_REVISION } from "@policia/shared";

/**
 * Esquema JSON para la salida estructurada de Gemini.
 *
 * Se escribe a mano en lugar de derivarlo de Zod para controlar las palabras
 * clave que el proveedor admite y para añadir descripciones en español.
 * La validación completa sigue haciéndose con `exposicionSchema`.
 */
export type EsquemaJson = Record<string, unknown>;

const esquemaParrafo: EsquemaJson = {
  type: "object",
  properties: {
    id: {
      type: "string",
      description: "Identificador único y correlativo: p1, p2, p3...",
    },
    texto: {
      type: "string",
      description: 'Párrafo completo que empieza por "Que ".',
    },
  },
  required: ["id", "texto"],
};

const esquemaDatoPendiente: EsquemaJson = {
  type: "object",
  properties: {
    marcador: {
      type: "string",
      description:
        "Marcador literal con el formato [DATO QUE CONVENDRÍA CONCRETAR: detalle].",
    },
    motivo: {
      type: "string",
      description: "Por qué falta el dato y para qué es necesario.",
    },
  },
  required: ["marcador"],
};

const esquemaFundamento: EsquemaJson = {
  type: "object",
  properties: {
    norma: {
      type: "string",
      description: 'Artículo o norma, por ejemplo "Art. 17 CE".',
    },
    porQueAplica: {
      type: "string",
      description: "Explicación breve de por qué aporta utilidad al supuesto.",
    },
  },
  required: ["norma", "porQueAplica"],
};

const esquemaAlerta: EsquemaJson = {
  type: "object",
  properties: {
    tipo: {
      type: "string",
      enum: [...TIPOS_ALERTA_REVISION],
      description: "Categoría de la alerta de revisión.",
    },
    fragmento: {
      type: "string",
      description: "Texto literal que motiva la alerta.",
    },
    sugerencia: {
      type: "string",
      description: "Corrección propuesta sin inventar datos.",
    },
  },
  required: ["tipo", "fragmento", "sugerencia"],
};

export const ESQUEMA_EXPOSICION: EsquemaJson = {
  type: "object",
  properties: {
    parrafos: {
      type: "array",
      minItems: 1,
      description: "Párrafos de la exposición, en orden cronológico.",
      items: esquemaParrafo,
    },
    datosPendientes: {
      type: "array",
      description: "Datos esenciales que no constan y quedan marcados.",
      items: esquemaDatoPendiente,
    },
    fundamentosNormativos: {
      type: "array",
      description: "Solo normas que aporten utilidad real al supuesto.",
      items: esquemaFundamento,
    },
    alertasRevision: {
      type: "array",
      description: "Alertas detectadas durante la redacción.",
      items: esquemaAlerta,
    },
  },
  required: [
    "parrafos",
    "datosPendientes",
    "fundamentosNormativos",
    "alertasRevision",
  ],
};

export const ESQUEMA_REVISION: EsquemaJson = {
  type: "object",
  properties: {
    alertasRevision: {
      type: "array",
      description: "Problemas detectados al revisar el borrador.",
      items: esquemaAlerta,
    },
  },
  required: ["alertasRevision"],
};
