export const APP_NAME = "Exposiciones de Hechos";

export const TIPOS_ADJUNTO = ["imagen", "pdf"] as const;
export type TipoAdjunto = (typeof TIPOS_ADJUNTO)[number];

export const TIPOS_ALERTA_REVISION = [
  "calificacion_sin_conducta",
  "dato_inventado",
  "laguna_cronologica",
  "articulo_relleno",
  "formato",
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
