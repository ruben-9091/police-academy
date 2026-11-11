import { MAX_ADJUNTO_BYTES, esMimeAdmitido } from "@policia/shared";

export const MAX_ADJUNTO_MB = Math.round(MAX_ADJUNTO_BYTES / (1024 * 1024));

export const MENSAJE_FORMATO =
  "Formato no admitido. Sube una imagen JPG, PNG o WebP, o un PDF.";

export interface ArchivoValidable {
  name: string;
  size: number;
  type: string;
}

/**
 * Devuelve el motivo por el que el archivo no se puede subir, o `null` si es
 * válido. Se comprueba antes de enviarlo para no gastar una petición.
 */
export function validarArchivo(archivo: ArchivoValidable): string | null {
  if (archivo.size <= 0) {
    return "El archivo está vacío.";
  }

  if (archivo.size > MAX_ADJUNTO_BYTES) {
    return `El archivo ocupa ${formatearTamano(archivo.size)} y el máximo es ${MAX_ADJUNTO_MB} MB.`;
  }

  if (!esMimeAdmitido(archivo.type)) {
    return MENSAJE_FORMATO;
  }

  return null;
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
