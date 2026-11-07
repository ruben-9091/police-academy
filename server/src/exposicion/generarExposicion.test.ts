import { describe, expect, it } from "vitest";
import {
  generarExposicionRequestSchema,
  type Exposicion,
} from "@policia/shared";
import {
  ExposicionInvalidaError,
  generarExposicion,
} from "./generarExposicion";
import type { ProveedorIA } from "../ai/provider";

const input = generarExposicionRequestSchema.parse({
  relatoBruto: "Los agentes observaron a una persona a las 22:10 horas.",
});

const valida: Exposicion = {
  parrafos: [
    { id: "p1", texto: "Que los agentes observaron a una persona." },
  ],
  datosPendientes: [],
  fundamentosNormativos: [],
  alertasRevision: [],
};

function proveedorConSalidas(...salidas: unknown[]): ProveedorIA {
  let indice = 0;

  return {
    nombre: "falso",
    async generarExposicion() {
      const salida = salidas[Math.min(indice, salidas.length - 1)];
      indice += 1;
      return salida;
    },
  };
}

describe("generarExposicion", () => {
  it("devuelve la exposición validada", async () => {
    const resultado = await generarExposicion(
      proveedorConSalidas(valida),
      input,
    );

    expect(resultado).toEqual(valida);
  });

  it("reintenta una vez si la primera respuesta no cumple el contrato", async () => {
    const proveedor = proveedorConSalidas(
      { parrafos: "no es un array" },
      valida,
    );

    await expect(generarExposicion(proveedor, input)).resolves.toEqual(valida);
  });

  it("lanza un error con las rutas inválidas tras dos intentos", async () => {
    const proveedor = proveedorConSalidas({}, {});

    await expect(generarExposicion(proveedor, input)).rejects.toBeInstanceOf(
      ExposicionInvalidaError,
    );
  });
});
