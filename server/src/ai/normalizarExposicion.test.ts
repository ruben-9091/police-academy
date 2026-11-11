import { describe, expect, it } from "vitest";
import {
  normalizarAlertas,
  normalizarExposicion,
  normalizarMarcadores,
  normalizarTextoParrafo,
} from "./normalizarExposicion";

describe("normalizarTextoParrafo", () => {
  it("quita guiones y deja el párrafo empezando por Que", () => {
    expect(normalizarTextoParrafo("- Que los agentes observaron.")).toBe(
      "Que los agentes observaron.",
    );
    expect(normalizarTextoParrafo("  los agentes observaron.  ")).toBe(
      "Que los agentes observaron.",
    );
  });

  it("conserva las siglas al pasar la primera letra a minúscula", () => {
    expect(normalizarTextoParrafo("NIP G428 y G617 comparecen.")).toBe(
      "Que NIP G428 y G617 comparecen.",
    );
  });

  it("canoniza las variantes del marcador", () => {
    expect(
      normalizarTextoParrafo(
        "Que falta [dato que convenDRIA concretar: la hora exacta].",
      ),
    ).toBe(
      "Que falta [DATO QUE CONVENDRÍA CONCRETAR: la hora exacta].",
    );
  });
});

describe("normalizarMarcadores", () => {
  it("corrige mayúsculas, acentos y espacios sobrantes", () => {
    const texto =
      "[DATO QUE CONVENDRIA CONCRETAR: hora] y [ DATO QUE CONVENDRÍA CONCRETAR : lugar ]";

    expect(normalizarMarcadores(texto)).toBe(
      "[DATO QUE CONVENDRÍA CONCRETAR: hora] y [DATO QUE CONVENDRÍA CONCRETAR: lugar]",
    );
  });

  it("elimina marcadores sin detalle", () => {
    expect(normalizarMarcadores("Que falta [DATO QUE CONVENDRÍA CONCRETAR: ].")).toBe(
      "Que falta .",
    );
  });
});

describe("normalizarExposicion", () => {
  it("renumera ids, deriva marcadores y elimina duplicados", () => {
    const salida = normalizarExposicion({
      parrafos: [
        { id: "repetido", texto: "- Que los agentes observaron." },
        { id: "repetido", texto: "la persona emprendió la huida" },
        {
          id: "p3",
          texto:
            "Que falta [DATO QUE CONVENDRIA CONCRETAR: la hora exacta].",
        },
      ],
      datosPendientes: [
        {
          marcador: "[DATO QUE CONVENDRÍA CONCRETAR: la hora exacta]",
          motivo: "No consta en el relato.",
        },
        {
          marcador: "[DATO QUE CONVENDRÍA CONCRETAR: un dato huérfano]",
          motivo: "No aparece en ningún párrafo.",
        },
      ],
      fundamentosNormativos: [
        { norma: "Art. 17 CE", porQueAplica: "Limita la detención." },
        { norma: "art. 17 ce", porQueAplica: "Duplicado." },
      ],
      alertasRevision: [
        {
          tipo: "formato",
          fragmento: "Un párrafo no empieza por Que.",
          sugerencia: "Corregirlo.",
        },
        {
          tipo: "formato",
          fragmento: "Un párrafo no empieza por Que.",
          sugerencia: "Corregirlo.",
        },
        {
          tipo: "tipo_inventado",
          fragmento: "Algo.",
          sugerencia: "Algo.",
        },
      ],
    });

    expect(salida).toEqual({
      parrafos: [
        { id: "p1", texto: "Que los agentes observaron." },
        { id: "p2", texto: "Que la persona emprendió la huida" },
        {
          id: "p3",
          texto:
            "Que falta [DATO QUE CONVENDRÍA CONCRETAR: la hora exacta].",
        },
      ],
      datosPendientes: [
        {
          marcador: "[DATO QUE CONVENDRÍA CONCRETAR: la hora exacta]",
          motivo: "No consta en el relato.",
        },
      ],
      fundamentosNormativos: [
        { norma: "Art. 17 CE", porQueAplica: "Limita la detención." },
      ],
      alertasRevision: [
        {
          tipo: "formato",
          fragmento: "Un párrafo no empieza por Que.",
          sugerencia: "Corregirlo.",
        },
      ],
    });
  });

  it("devuelve la salida tal cual si no es un objeto", () => {
    expect(normalizarExposicion("texto")).toBe("texto");
    expect(normalizarExposicion(null)).toBe(null);
  });
});

describe("normalizarAlertas", () => {
  it("descarta alertas vacías o con tipo desconocido", () => {
    expect(
      normalizarAlertas([
        {
          tipo: "laguna_cronologica",
          fragmento: "No consta la hora.",
          sugerencia: "Añadir la hora aproximada.",
        },
        { tipo: "otra", fragmento: "x", sugerencia: "y" },
        { tipo: "formato", fragmento: "", sugerencia: "y" },
      ]),
    ).toEqual([
      {
        tipo: "laguna_cronologica",
        fragmento: "No consta la hora.",
        sugerencia: "Añadir la hora aproximada.",
      },
    ]);
  });
});
