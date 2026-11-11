export const APP_NAME = "Exposiciones de Hechos";

export const TIPOS_ADJUNTO = ["imagen", "pdf"] as const;
export type TipoAdjunto = (typeof TIPOS_ADJUNTO)[number];

/**
 * 4 MB binarios: al viajar en base64 crecen un tercio, así que el cuerpo queda
 * por debajo del límite de 6 MB de las Netlify Functions.
 */
export const MAX_ADJUNTO_BYTES = 4 * 1024 * 1024;

export const MAX_RELATO_CARACTERES = 20_000;

export const TIPOS_MIME_ADMITIDOS = {
  "image/jpeg": "imagen",
  "image/png": "imagen",
  "image/webp": "imagen",
  "image/heic": "imagen",
  "image/heif": "imagen",
  "application/pdf": "pdf",
} as const satisfies Record<string, TipoAdjunto>;

export type MimeAdmitido = keyof typeof TIPOS_MIME_ADMITIDOS;

export function esMimeAdmitido(mime: string): mime is MimeAdmitido {
  return Object.hasOwn(TIPOS_MIME_ADMITIDOS, mime);
}

export function tipoAdjuntoDeMime(mime: string): TipoAdjunto | null {
  return esMimeAdmitido(mime) ? TIPOS_MIME_ADMITIDOS[mime] : null;
}

export const TIPOS_ALERTA_REVISION = [
  "calificacion_sin_conducta",
  "dato_inventado",
  "laguna_cronologica",
  "articulo_relleno",
  "formato",
  "revision_incompleta",
] as const;
export type TipoAlertaRevision = (typeof TIPOS_ALERTA_REVISION)[number];

export const ENCABEZADOS_MANIFIESTA = ["MANIFIESTA", "MANIFIESTAN"] as const;
export type EncabezadoManifiesta = (typeof ENCABEZADOS_MANIFIESTA)[number];

export const OPCIONES_EXPOSICION_POR_DEFECTO = {
  incluirCabecera: false,
  encabezadoManifiesta: "MANIFIESTA",
  subtitulo: "(Comparecencia de detención)",
} as const satisfies {
  incluirCabecera: boolean;
  encabezadoManifiesta: EncabezadoManifiesta;
  subtitulo: string;
};

const MARCADOR_DATO_PENDIENTE_FUENTE =
  String.raw`\[DATO QUE CONVENDRÍA CONCRETAR:[^\]]+\]`;

export const MARCADOR_DATO_PENDIENTE_PREFIJO =
  "[DATO QUE CONVENDRÍA CONCRETAR:";

export const MARCADOR_DATO_PENDIENTE_PATRON = new RegExp(
  `^${MARCADOR_DATO_PENDIENTE_FUENTE}$`,
);

export function esMarcadorDatoPendiente(value: string): boolean {
  return MARCADOR_DATO_PENDIENTE_PATRON.test(value.trim());
}

export function extraerMarcadoresDatoPendiente(texto: string): string[] {
  return texto.match(new RegExp(MARCADOR_DATO_PENDIENTE_FUENTE, "g")) ?? [];
}

export type TramoTexto =
  | { tipo: "texto"; valor: string }
  | { tipo: "marcador"; valor: string };

/**
 * Divide un texto en tramos normales y marcadores para poder resaltarlos.
 * Evita reutilizar una regex global con estado (`lastIndex`) entre llamadas.
 */
export function dividirTextoPorMarcadores(texto: string): TramoTexto[] {
  const patron = new RegExp(MARCADOR_DATO_PENDIENTE_FUENTE, "g");
  const tramos: TramoTexto[] = [];
  let ultimoIndice = 0;

  for (const coincidencia of texto.matchAll(patron)) {
    const indice = coincidencia.index ?? 0;

    if (indice > ultimoIndice) {
      tramos.push({ tipo: "texto", valor: texto.slice(ultimoIndice, indice) });
    }

    tramos.push({ tipo: "marcador", valor: coincidencia[0] });
    ultimoIndice = indice + coincidencia[0].length;
  }

  if (ultimoIndice < texto.length) {
    tramos.push({ tipo: "texto", valor: texto.slice(ultimoIndice) });
  }

  return tramos;
}
