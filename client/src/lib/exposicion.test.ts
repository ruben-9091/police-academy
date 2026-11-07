import { describe, expect, it } from "vitest";
import type { Exposicion } from "@policia/shared";
import {
  actualizarParrafo,
  anadirParrafo,
  contarMarcadores,
  eliminarParrafo,
  moverParrafo,
  sustituirMarcador,
} from "./exposicion";

const marcador = "[DATO QUE CONVENDRÍA CONCRETAR: número de atestado]";

function crearExposicion(): Exposicion {
  return {
    parrafos: [
      { id: "p1", texto: "Que los agentes observaron a una persona." },
      { id: "p2", texto: `Que se instruyó el atestado ${marcador}.` },
      { id: "p3", texto: "Que se informó a la persona de sus derechos." },
    ],
    datosPendientes: [{ marcador, motivo: "Falta el número." }],
    fundamentosNormativos: [],
    alertasRevision: [],
  };
}

describe("helpers de la exposición", () => {
  it("actualiza el texto de un párrafo sin tocar el resto", () => {
    const resultado = actualizarParrafo(
      crearExposicion(),
      "p1",
      "Que los agentes observaron a dos personas.",
    );

    expect(resultado.parrafos[0]?.texto).toBe(
      "Que los agentes observaron a dos personas.",
    );
    expect(resultado.parrafos[1]).toEqual(crearExposicion().parrafos[1]);
  });

  it("añade un párrafo vacío con un id único", () => {
    const original = crearExposicion();
    const resultado = anadirParrafo(original);
    const nuevo = resultado.parrafos.at(-1);

    expect(resultado.parrafos).toHaveLength(4);
    expect(nuevo?.texto).toBe("");
    expect(original.parrafos.map((parrafo) => parrafo.id)).not.toContain(
      nuevo?.id,
    );
  });

  it("elimina un párrafo por id", () => {
    const resultado = eliminarParrafo(crearExposicion(), "p2");

    expect(resultado.parrafos.map((parrafo) => parrafo.id)).toEqual([
      "p1",
      "p3",
    ]);
  });

  it("mueve un párrafo y respeta los límites", () => {
    const subido = moverParrafo(crearExposicion(), "p3", -1);
    expect(subido.parrafos.map((parrafo) => parrafo.id)).toEqual([
      "p1",
      "p3",
      "p2",
    ]);

    const original = crearExposicion();
    expect(moverParrafo(original, "p1", -1)).toBe(original);
    expect(moverParrafo(original, "p3", 1)).toBe(original);
  });

  it("sustituye todas las apariciones de un marcador y lo quita del panel", () => {
    const exposicion = crearExposicion();
    exposicion.parrafos[2] = {
      id: "p3",
      texto: `Que se remitió el atestado ${marcador} a la unidad.`,
    };

    const resultado = sustituirMarcador(exposicion, marcador, " 123/2026 ");

    expect(resultado.datosPendientes).toEqual([]);
    for (const parrafo of resultado.parrafos) {
      expect(parrafo.texto).not.toContain(marcador);
    }
    expect(resultado.parrafos[1]?.texto).toContain("123/2026");
    expect(resultado.parrafos[2]?.texto).toContain("123/2026");
  });

  it("ignora una sustitución vacía", () => {
    const exposicion = crearExposicion();

    expect(sustituirMarcador(exposicion, marcador, "   ")).toBe(exposicion);
  });

  it("cuenta marcadores únicos en toda la exposición", () => {
    const exposicion = crearExposicion();
    exposicion.parrafos[2] = {
      id: "p3",
      texto: `Que se remitió el atestado ${marcador} a la unidad.`,
    };

    expect(contarMarcadores(exposicion)).toBe(1);
  });
});
