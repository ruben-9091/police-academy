import { describe, expect, it } from "vitest";
import {
  ProveedorConfiguracionError,
  ProveedorError,
  ProveedorTiempoAgotadoError,
} from "./provider";
import type { ArchivoTranscripcion } from "./transcripcion";
import {
  crearProveedorTranscripcionGemini,
  limpiarTranscripcion,
  type ClienteVision,
  type ParametrosVision,
} from "./transcripcionGemini";

const imagen: ArchivoTranscripcion = {
  nombre: "parte.png",
  mime: "image/png",
  tipo: "imagen",
  datos: Buffer.from("PNG"),
};

const pdf: ArchivoTranscripcion = {
  nombre: "atestado.pdf",
  mime: "application/pdf",
  tipo: "pdf",
  datos: Buffer.from("PDF"),
};

function sobrecarga() {
  return Object.assign(new Error("high demand"), { status: 503 });
}

function clienteFalso(respuestas: unknown[]): {
  cliente: ClienteVision;
  llamadas: ParametrosVision[];
} {
  const llamadas: ParametrosVision[] = [];
  let indice = 0;

  return {
    llamadas,
    cliente: {
      interactions: {
        async create(parametros: ParametrosVision) {
          llamadas.push(parametros);
          const respuesta = respuestas[Math.min(indice, respuestas.length - 1)];
          indice += 1;

          if (respuesta instanceof Error) {
            throw respuesta;
          }

          return respuesta as { output_text?: string };
        },
      },
    },
  };
}

describe("crearProveedorTranscripcionGemini", () => {
  it("envía la imagen en v1beta con las instrucciones de transcripción", async () => {
    const { cliente, llamadas } = clienteFalso([
      { output_text: "Texto transcrito." },
    ]);
    const proveedor = crearProveedorTranscripcionGemini({
      cliente,
      modelo: "gemini-3.5-flash-lite",
    });

    const texto = await proveedor.transcribir(imagen);

    expect(texto).toBe("Texto transcrito.");
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].model).toBe("gemini-3.5-flash-lite");
    expect(llamadas[0].store).toBe(false);
    expect(llamadas[0].input).toEqual([
      expect.objectContaining({ type: "text" }),
      {
        type: "image",
        mime_type: "image/png",
        data: Buffer.from("PNG").toString("base64"),
      },
    ]);
  });

  it("envía los PDF como documento", async () => {
    const { cliente, llamadas } = clienteFalso([{ output_text: "Texto." }]);
    const proveedor = crearProveedorTranscripcionGemini({ cliente });

    await proveedor.transcribir(pdf);

    expect(llamadas[0].input[1]).toEqual({
      type: "document",
      mime_type: "application/pdf",
      data: Buffer.from("PDF").toString("base64"),
    });
  });

  it("limpia los bloques de código de la respuesta", async () => {
    const { cliente } = clienteFalso([
      { output_text: "```text\nSobre las 22:10 horas.\n```" },
    ]);
    const proveedor = crearProveedorTranscripcionGemini({ cliente });

    await expect(proveedor.transcribir(imagen)).resolves.toBe(
      "Sobre las 22:10 horas.",
    );
  });

  it("rechaza una respuesta vacía o sin texto legible", async () => {
    for (const salida of ["", "SIN_TEXTO", "  sin_texto  "]) {
      const { cliente } = clienteFalso([{ output_text: salida }]);
      const proveedor = crearProveedorTranscripcionGemini({ cliente });

      await expect(proveedor.transcribir(imagen)).rejects.toMatchObject({
        name: "ProveedorError",
        status: 422,
      });
    }
  });

  it("reintenta una sobrecarga transitoria", async () => {
    const { cliente, llamadas } = clienteFalso([
      sobrecarga(),
      { output_text: "Texto recuperado." },
    ]);
    const proveedor = crearProveedorTranscripcionGemini({
      cliente,
      esperasSobrecargaMs: [0],
    });

    await expect(proveedor.transcribir(imagen)).resolves.toBe(
      "Texto recuperado.",
    );
    expect(llamadas).toHaveLength(2);
  });

  it("devuelve 503 cuando se agotan los reintentos", async () => {
    const { cliente, llamadas } = clienteFalso([sobrecarga()]);
    const proveedor = crearProveedorTranscripcionGemini({
      cliente,
      esperasSobrecargaMs: [0, 0],
    });

    await expect(proveedor.transcribir(imagen)).rejects.toMatchObject({
      name: "ProveedorError",
      status: 503,
    });
    expect(llamadas).toHaveLength(3);
  });

  it("traduce el 429 a límite de cuota", async () => {
    const { cliente } = clienteFalso([
      Object.assign(new Error("quota"), { status: 429 }),
    ]);
    const proveedor = crearProveedorTranscripcionGemini({ cliente });

    await expect(proveedor.transcribir(imagen)).rejects.toMatchObject({
      name: "ProveedorLimiteError",
    });
  });

  it("no arranca si no queda tiempo suficiente", async () => {
    const { cliente, llamadas } = clienteFalso([{ output_text: "Texto." }]);
    const proveedor = crearProveedorTranscripcionGemini({
      cliente,
      timeoutMs: 1_000,
      presupuestoMs: 5_000,
    });

    await expect(proveedor.transcribir(imagen)).rejects.toBeInstanceOf(
      ProveedorTiempoAgotadoError,
    );
    expect(llamadas).toHaveLength(0);
  });

  it("exige la clave cuando no se inyecta cliente", () => {
    expect(() =>
      crearProveedorTranscripcionGemini({ apiKey: "  " }),
    ).toThrow(ProveedorConfiguracionError);
  });

  it("no deja pasar errores desconocidos como si fueran del proveedor", async () => {
    const { cliente } = clienteFalso([new Error("boom")]);
    const proveedor = crearProveedorTranscripcionGemini({ cliente });

    await expect(proveedor.transcribir(imagen)).rejects.toBeInstanceOf(
      ProveedorError,
    );
  });
});

describe("limpiarTranscripcion", () => {
  it("respeta el contenido y solo recorta espacios y vallas", () => {
    expect(limpiarTranscripcion("  Hola  ")).toBe("Hola");
    expect(limpiarTranscripcion("```\nHola\n```")).toBe("Hola");
    expect(limpiarTranscripcion("[ilegible] y texto")).toBe("[ilegible] y texto");
  });
});
