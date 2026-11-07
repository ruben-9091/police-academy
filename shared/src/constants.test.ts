import { describe, expect, it } from "vitest";
import { dividirTextoPorMarcadores } from "./constants";

const marcador = "[DATO QUE CONVENDRÍA CONCRETAR: número de atestado]";

describe("dividirTextoPorMarcadores", () => {
  it("devuelve un único tramo de texto cuando no hay marcadores", () => {
    expect(dividirTextoPorMarcadores("Que los agentes actuaron.")).toEqual([
      { tipo: "texto", valor: "Que los agentes actuaron." },
    ]);
  });

  it("separa texto y marcadores conservando el contenido literal", () => {
    expect(
      dividirTextoPorMarcadores(`Que se instruyó el atestado ${marcador} en sede.`),
    ).toEqual([
      { tipo: "texto", valor: "Que se instruyó el atestado " },
      { tipo: "marcador", valor: marcador },
      { tipo: "texto", valor: " en sede." },
    ]);
  });

  it("detecta varios marcadores seguidos", () => {
    const segundo = "[DATO QUE CONVENDRÍA CONCRETAR: indicativo]";

    expect(dividirTextoPorMarcadores(`${marcador} ${segundo}`)).toEqual([
      { tipo: "marcador", valor: marcador },
      { tipo: "texto", valor: " " },
      { tipo: "marcador", valor: segundo },
    ]);
  });

  it("devuelve una lista vacía para un texto vacío", () => {
    expect(dividirTextoPorMarcadores("")).toEqual([]);
  });
});
