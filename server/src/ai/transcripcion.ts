import type { TipoAdjunto } from "@policia/shared";

export interface ArchivoTranscripcion {
  nombre: string;
  mime: string;
  tipo: TipoAdjunto;
  datos: Buffer;
}

export interface ProveedorTranscripcion {
  readonly nombre: string;
  /** Devuelve el texto literal. Lanza `ProveedorError` si no hay texto legible. */
  transcribir(archivo: ArchivoTranscripcion): Promise<string>;
}

/**
 * Transcripción determinista para desarrollo y tests. No intenta leer el
 * archivo: deja claro que el contenido no se ha transcrito.
 */
export const proveedorTranscripcionMock: ProveedorTranscripcion = {
  nombre: "mock",
  async transcribir(archivo) {
    return `[Transcripción de demostración: el archivo «${archivo.nombre}» no se ha leído. Configura AI_PROVIDER=gemini para transcribir su contenido.]`;
  },
};
