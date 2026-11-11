import { describe, expect, it } from "vitest";
import { MAX_ADJUNTO_BYTES } from "@policia/shared";
import { MENSAJE_FORMATO, formatearTamano, validarArchivo } from "./archivos";

function archivo(
  nombre: string,
  type: string,
  size: number,
): { name: string; type: string; size: number } {
  return { name: nombre, type, size };
}

describe("validarArchivo", () => {
  it("acepta imágenes y PDF dentro del límite", () => {
    expect(validarArchivo(archivo("parte.png", "image/png", 1_000))).toBeNull();
    expect(
      validarArchivo(archivo("atestado.pdf", "application/pdf", 1_000)),
    ).toBeNull();
  });

  it("rechaza archivos vacíos", () => {
    expect(validarArchivo(archivo("parte.png", "image/png", 0))).toBe(
      "El archivo está vacío.",
    );
  });

  it("rechaza archivos por encima del máximo", () => {
    const mensaje = validarArchivo(
      archivo("parte.pdf", "application/pdf", MAX_ADJUNTO_BYTES + 1),
    );

    expect(mensaje).toContain("4 MB");
  });

  it("rechaza formatos no admitidos", () => {
    expect(validarArchivo(archivo("nota.txt", "text/plain", 10))).toBe(
      MENSAJE_FORMATO,
    );
    expect(validarArchivo(archivo("sin-tipo", "", 10))).toBe(MENSAJE_FORMATO);
  });
});

describe("formatearTamano", () => {
  it("usa bytes, kilobytes o megabytes según el tamaño", () => {
    expect(formatearTamano(512)).toBe("512 B");
    expect(formatearTamano(2_048)).toBe("2 KB");
    expect(formatearTamano(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
