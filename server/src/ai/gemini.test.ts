import { ApiError } from "@google/genai";
import { describe, expect, it } from "vitest";
import {
  generarExposicionRequestSchema,
  generarExposicionResponseSchema,
  type Exposicion,
} from "@policia/shared";
import {
  crearProveedorGemini,
  type ClienteInteracciones,
  type OpcionesProveedorGemini,
  type ParametrosInteraccion,
} from "./gemini";
import {
  ProveedorConfiguracionError,
  ProveedorLimiteError,
  ProveedorTiempoAgotadoError,
} from "./provider";

const input = generarExposicionRequestSchema.parse({
  relatoBruto:
    "Sobre las 22:10 horas los agentes observaron a una persona y la identificaron.",
  datos: { indicativo: "2-14" },
});

const borrador: Exposicion = {
  parrafos: [
    { id: "p1", texto: "Que los agentes observaron a una persona a las 22:10." },
  ],
  datosPendientes: [],
  fundamentosNormativos: [],
  alertasRevision: [],
};

const revision = {
  alertasRevision: [
    {
      tipo: "laguna_cronologica",
      fragmento: "No consta la hora de la identificación.",
      sugerencia: "Añadir la hora aproximada.",
    },
  ],
};

function clienteFalso(respuestas: unknown[]): {
  cliente: ClienteInteracciones;
  llamadas: ParametrosInteraccion[];
} {
  const llamadas: ParametrosInteraccion[] = [];
  let indice = 0;

  return {
    llamadas,
    cliente: {
      interactions: {
        async create(parametros: ParametrosInteraccion) {
          llamadas.push(parametros);
          const respuesta =
            respuestas[Math.min(indice, respuestas.length - 1)];
          indice += 1;

          if (respuesta instanceof Error) {
            throw respuesta;
          }

          return { output_text: JSON.stringify(respuesta) };
        },
      },
    },
  };
}

function proveedorCon(
  respuestas: unknown[],
  opciones: Partial<OpcionesProveedorGemini> = {},
) {
  const falso = clienteFalso(respuestas);

  return {
    ...falso,
    proveedor: crearProveedorGemini({
      cliente: falso.cliente,
      modelo: "gemini-3.8-flash",
      presupuestoMs: 48_000,
      ...opciones,
    }),
  };
}

describe("crearProveedorGemini", () => {
  it("exige la API key si no se inyecta un cliente", () => {
    expect(() => crearProveedorGemini({ apiKey: "" })).toThrow(
      ProveedorConfiguracionError,
    );
  });

  it("redacta, revisa y mezcla las alertas", async () => {
    const { proveedor, llamadas } = proveedorCon([borrador, revision]);

    const resultado = generarExposicionResponseSchema.parse(
      await proveedor.generarExposicion(input),
    );

    expect(resultado.parrafos).toEqual(borrador.parrafos);
    expect(resultado.alertasRevision).toEqual(revision.alertasRevision);
    expect(llamadas).toHaveLength(2);

    for (const llamada of llamadas) {
      expect(llamada.model).toBe("gemini-3.8-flash");
      expect(llamada.store).toBe(false);
      expect(llamada.response_format?.type).toBe("text");
      expect(llamada.response_format?.mime_type).toBe("application/json");
    }

    expect(llamadas[0]?.system_instruction).toContain("PROMPT MAESTRO");
    expect(llamadas[0]?.system_instruction).toContain(
      "No cites el artículo 5",
    );
    expect(llamadas[0]?.system_instruction).toContain("DESCRIBIR PRIMERO");
    expect(llamadas[0]?.input).toContain("<<<RELATO");
    expect(llamadas[1]?.input).toContain("BORRADOR A REVISAR");
  });

  it("conserva el borrador si la autorrevisión falla", async () => {
    const { proveedor } = proveedorCon([
      borrador,
      new Error("fallo de revisión"),
    ]);

    const resultado = generarExposicionResponseSchema.parse(
      await proveedor.generarExposicion(input),
    );

    expect(resultado.parrafos).toEqual(borrador.parrafos);
    expect(resultado.alertasRevision).toEqual([
      {
        tipo: "revision_incompleta",
        fragmento: "Autorrevisión automática",
        sugerencia:
          "No se pudo completar la autorrevisión automática. Revisa el documento manualmente antes de exportarlo.",
      },
    ]);
  });

  it("omite la revisión si no queda presupuesto suficiente", async () => {
    const { proveedor, llamadas } = proveedorCon([borrador], {
      presupuestoMs: 8_000,
      ahora: () => 0,
    });

    const resultado = generarExposicionResponseSchema.parse(
      await proveedor.generarExposicion(input),
    );

    expect(llamadas).toHaveLength(1);
    expect(resultado.alertasRevision[0]?.tipo).toBe("revision_incompleta");
  });

  it("repara una salida inválida antes de revisar", async () => {
    const { proveedor, llamadas } = proveedorCon([
      { parrafos: [] },
      borrador,
      revision,
    ]);

    const resultado = generarExposicionResponseSchema.parse(
      await proveedor.generarExposicion(input),
    );

    expect(resultado.parrafos).toEqual(borrador.parrafos);
    expect(llamadas).toHaveLength(3);
    expect(llamadas[1]?.system_instruction).toContain("CORRECCIÓN");
    expect(llamadas[1]?.input).toContain("ERRORES DE VALIDACIÓN");
  });

  it("traduce el límite de cuota a un error específico", async () => {
    const { proveedor } = proveedorCon([
      new ApiError({ message: "quota", status: 429 }),
    ]);

    await expect(proveedor.generarExposicion(input)).rejects.toBeInstanceOf(
      ProveedorLimiteError,
    );
  });

  it("no llama al modelo si la redacción no tiene tiempo mínimo", async () => {
    const { proveedor, llamadas } = proveedorCon([borrador], {
      timeoutRedaccionMs: 1,
    });

    await expect(proveedor.generarExposicion(input)).rejects.toBeInstanceOf(
      ProveedorTiempoAgotadoError,
    );
    expect(llamadas).toHaveLength(0);
  });
});
