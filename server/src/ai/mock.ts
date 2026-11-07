import {
  MARCADOR_DATO_PENDIENTE_PREFIJO,
  type AlertaRevision,
  type DatoPendiente,
  type Exposicion,
  type GenerarExposicionRequest,
} from "@policia/shared";
import type { ProveedorIA } from "./provider";

/**
 * Proveedor determinista para desarrollo y tests.
 *
 * No redacta hechos nuevos: reutiliza las frases literales del relato, las
 * agrupa y les antepone "Que ". Los marcadores y las alertas se derivan de
 * reglas explícitas sobre el texto y los datos aportados. No cita artículos.
 */

const CALIFICACIONES_SIN_CONDUCTA = [
  "actitud agresiva",
  "actitud chulesca",
  "resistencia activa",
  "desobedeció gravemente",
  "desobediencia grave",
  "menosprecio",
];

const PATRON_HORA = /\b(?:[01]?\d|2[0-3])[:h][0-5]\d\b/;
const MENCIONA_DETENCION = /deten|cacheo|traslad/i;
const ACRONIMO = /^[A-ZÁÉÍÓÚÜÑ]{2,}/;

function crearMarcador(detalle: string): string {
  return `${MARCADOR_DATO_PENDIENTE_PREFIJO} ${detalle}]`;
}

function tieneValor(valor: string | undefined): boolean {
  return Boolean(valor?.trim());
}

function dividirEnFrases(relato: string): string[] {
  return relato
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?;])\s+/)
    .map((frase) => frase.trim())
    .filter((frase) => frase.length > 0);
}

/** Evita convertir siglas (NIP, EUROCOP) en "nIP" o "eUROCOP". */
function minusculaInicial(texto: string): string {
  if (ACRONIMO.test(texto)) {
    return texto;
  }

  return texto.charAt(0).toLocaleLowerCase("es") + texto.slice(1);
}

function comoParrafo(frases: string[]): string {
  const cuerpo = frases.join(" ").replace(/[;,]+$/, "").trim();
  const cierre = /[.!?]$/.test(cuerpo) ? "" : ".";

  return `Que ${minusculaInicial(cuerpo)}${cierre}`;
}

function agruparEnParrafos(relato: string): string[] {
  const frases = dividirEnFrases(relato);

  if (frases.length === 0) {
    return ["Que no consta relato de hechos."];
  }

  const parrafos: string[] = [];

  for (let indice = 0; indice < frases.length; indice += 2) {
    parrafos.push(comoParrafo(frases.slice(indice, indice + 2)));
  }

  return parrafos;
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectarCalificaciones(relato: string): AlertaRevision[] {
  return CALIFICACIONES_SIN_CONDUCTA.flatMap((termino) => {
    const coincidencia = new RegExp(escaparRegex(termino), "i").exec(relato);

    if (!coincidencia) {
      return [];
    }

    return [
      {
        tipo: "calificacion_sin_conducta" as const,
        fragmento: coincidencia[0],
        sugerencia:
          "Sustituir la calificación por la conducta observable concreta (gestos, desplazamientos o manifestaciones verbales) y el momento en que se produjo.",
      },
    ];
  });
}

function detectarLagunas(relato: string): AlertaRevision[] {
  if (PATRON_HORA.test(relato)) {
    return [];
  }

  return [
    {
      tipo: "laguna_cronologica",
      fragmento: "Todo el relato",
      sugerencia:
        "Añadir horas aproximadas que permitan reconstruir la cronología de la intervención de principio a fin.",
    },
  ];
}

export const proveedorMock: ProveedorIA = {
  nombre: "mock",

  async generarExposicion(input: GenerarExposicionRequest) {
    const { relatoBruto, datos } = input;
    const parrafos = agruparEnParrafos(relatoBruto);
    const datosPendientes: DatoPendiente[] = [];

    const anadirMarcador = (
      indiceParrafo: number,
      detalle: string,
      motivo: string,
    ) => {
      const marcador = crearMarcador(detalle);
      parrafos[indiceParrafo] = `${parrafos[indiceParrafo]} ${marcador}`;
      datosPendientes.push({ marcador, motivo });
    };

    if (!tieneValor(datos.lugarFecha)) {
      anadirMarcador(
        0,
        "lugar, fecha y hora exactos de la intervención",
        "No consta en los datos del caso.",
      );
    }

    if (!tieneValor(datos.indicativo)) {
      anadirMarcador(
        0,
        "indicativo de la patrulla",
        "No consta en los datos del caso.",
      );
    }

    if (!datos.agentes?.some((agente) => tieneValor(agente.nip))) {
      anadirMarcador(
        0,
        "NIP de los agentes actuantes",
        "No consta en los datos del caso.",
      );
    }

    if (!tieneValor(datos.atestado)) {
      anadirMarcador(
        parrafos.length - 1,
        "número de atestado",
        "Necesario para identificar el expediente.",
      );
    }

    if (!tieneValor(datos.personaPresentada) && MENCIONA_DETENCION.test(relatoBruto)) {
      anadirMarcador(
        parrafos.length - 1,
        "identidad de la persona presentada",
        "El relato menciona una detención o traslado y no consta la identidad.",
      );
    }

    const alertasRevision = [
      ...detectarCalificaciones(relatoBruto),
      ...detectarLagunas(relatoBruto),
    ];

    const exposicion: Exposicion = {
      parrafos: parrafos.map((texto, indice) => ({
        id: `p${indice + 1}`,
        texto,
      })),
      datosPendientes,
      // El proveedor mock no cita artículos: no se inventa base legal.
      fundamentosNormativos: [],
      alertasRevision,
    };

    return exposicion;
  },
};
