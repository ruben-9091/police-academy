import { describe, expect, it } from "vitest";
import {
  casoSchema,
  exposicionSchema,
  exportarDocxRequestSchema,
  generarExposicionRequestSchema,
  type Exposicion,
} from "./index";
import {
  esMarcadorDatoPendiente,
  extraerMarcadoresDatoPendiente,
} from "./constants";

const casoMinimo = {
  id: "caso-1",
  creadoEn: "2026-10-26T10:00:00.000Z",
  relatoBruto: "  Los agentes observaron a una persona.  ",
};

const opcionesPorDefecto = {
  incluirCabecera: false,
  encabezadoManifiesta: "MANIFIESTA",
  subtitulo: "(Comparecencia de detención)",
};

const exposicionValida: Exposicion = {
  parrafos: [
    { id: "p1", texto: "Que los agentes actuantes observaron a una persona." },
    { id: "p2", texto: "Que en ese contexto, le dieron el alto policial." },
  ],
  datosPendientes: [],
  fundamentosNormativos: [],
  alertasRevision: [],
};

describe("casoSchema", () => {
  it("aplica los valores por defecto y normaliza el relato", () => {
    const caso = casoSchema.parse(casoMinimo);

    expect(caso.relatoBruto).toBe("Los agentes observaron a una persona.");
    expect(caso.adjuntos).toEqual([]);
    expect(caso.datos).toEqual({});
    expect(caso.opciones).toEqual(opcionesPorDefecto);
  });

  it("convierte campos opcionales vacíos en undefined y recorta los informados", () => {
    const caso = casoSchema.parse({
      ...casoMinimo,
      datos: {
        atestado: "   ",
        dependencia: "  ALICANTE  ",
        agentes: [{ nip: " G428 " }],
      },
    });

    expect(caso.datos.atestado).toBeUndefined();
    expect(caso.datos.dependencia).toBe("ALICANTE");
    expect(caso.datos.agentes).toEqual([{ nip: "G428" }]);
  });

  it("acepta un caso completo con adjuntos y exposición", () => {
    const caso = casoSchema.parse({
      ...casoMinimo,
      adjuntos: [{ nombre: "atestado.pdf", tipo: "pdf" }],
      datos: {
        atestado: "XXXXX/AA",
        eurocop: "XXXXX/AAAA",
        dependencia: "ALICANTE",
        lugarFecha: "En Alicante, a las 10:00 horas.",
        indicativo: "PLAYAS POSTIGUET",
        agentes: [{ nip: "G428" }, { nip: "G617" }],
        personaPresentada: "Persona de prueba",
        entrega: "Mochila",
      },
      opciones: {
        incluirCabecera: true,
        encabezadoManifiesta: "MANIFIESTAN",
        subtitulo: "(Comparecencia de detención)",
      },
      exposicion: exposicionValida,
    });

    expect(caso.exposicion).toEqual(exposicionValida);
    expect(caso.opciones.incluirCabecera).toBe(true);
    expect(caso.opciones.encabezadoManifiesta).toBe("MANIFIESTAN");
  });

  it("rechaza relatos vacíos, fechas no ISO y adjuntos desconocidos", () => {
    expect(
      casoSchema.safeParse({ ...casoMinimo, relatoBruto: "   " }).success,
    ).toBe(false);
    expect(
      casoSchema.safeParse({ ...casoMinimo, creadoEn: "26/10/2026" }).success,
    ).toBe(false);
    expect(
      casoSchema.safeParse({
        ...casoMinimo,
        adjuntos: [{ nombre: "audio.mp3", tipo: "audio" }],
      }).success,
    ).toBe(false);
  });
});

describe("exposicionSchema", () => {
  it("acepta una exposición completa y recorta los textos", () => {
    const exposicion = exposicionSchema.parse({
      ...exposicionValida,
      parrafos: [
        { id: "p1", texto: "  Que los agentes observaron.  " },
        { id: "p2", texto: "Que en ese contexto intervinieron." },
      ],
      datosPendientes: [
        {
          marcador: "[DATO QUE CONVENDRÍA CONCRETAR: la hora exacta]",
          motivo: "No consta en el relato",
        },
      ],
      fundamentosNormativos: [
        {
          norma: "Art. 17 CE",
          porQueAplica: "Limita la detención a un plazo máximo.",
        },
      ],
      alertasRevision: [
        {
          tipo: "laguna_cronologica",
          fragmento: "No consta la hora de la detención.",
          sugerencia: "Concretar la hora aproximada.",
        },
      ],
    });

    expect(exposicion.parrafos[0]?.texto).toBe("Que los agentes observaron.");
    expect(exposicion.datosPendientes).toHaveLength(1);
  });

  it("rechaza párrafos que no empiezan por Que ...", () => {
    const resultado = exposicionSchema.safeParse({
      ...exposicionValida,
      parrafos: [{ id: "p1", texto: "Los agentes observaron." }],
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza ids de párrafo duplicados", () => {
    const resultado = exposicionSchema.safeParse({
      ...exposicionValida,
      parrafos: [
        { id: "p1", texto: "Que los agentes observaron." },
        { id: "p1", texto: "Que en ese contexto intervinieron." },
      ],
    });

    expect(resultado.success).toBe(false);
  });

  it("rechaza listas vacías de párrafos y marcadores mal formados", () => {
    expect(
      exposicionSchema.safeParse({ ...exposicionValida, parrafos: [] }).success,
    ).toBe(false);
    expect(
      exposicionSchema.safeParse({
        ...exposicionValida,
        datosPendientes: [{ marcador: "Falta la hora" }],
      }).success,
    ).toBe(false);
  });

  it("rechaza tipos de alerta desconocidos", () => {
    const resultado = exposicionSchema.safeParse({
      ...exposicionValida,
      alertasRevision: [
        {
          tipo: "otra_alerta",
          fragmento: "Fragmento",
          sugerencia: "Sugerencia",
        },
      ],
    });

    expect(resultado.success).toBe(false);
  });
});

describe("generarExposicionRequestSchema", () => {
  it("aplica datos y opciones por defecto", () => {
    const request = generarExposicionRequestSchema.parse({
      relatoBruto: "  Relato de la intervención.  ",
    });

    expect(request.relatoBruto).toBe("Relato de la intervención.");
    expect(request.datos).toEqual({});
    expect(request.opciones).toEqual(opcionesPorDefecto);
  });

  it("exige el relato bruto", () => {
    expect(
      generarExposicionRequestSchema.safeParse({ relatoBruto: "   " }).success,
    ).toBe(false);
  });
});

describe("exportarDocxRequestSchema", () => {
  it("aplica datos y opciones por defecto y exige la exposición", () => {
    const request = exportarDocxRequestSchema.parse({
      exposicion: exposicionValida,
    });

    expect(request.datos).toEqual({});
    expect(request.opciones).toEqual(opcionesPorDefecto);
  });

  it("rechaza una exposición inválida", () => {
    expect(
      exportarDocxRequestSchema.safeParse({ exposicion: { parrafos: [] } })
        .success,
    ).toBe(false);
  });
});

describe("marcadores de datos pendientes", () => {
  it("reconoce y extrae marcadores válidos", () => {
    const texto =
      "No consta la hora [DATO QUE CONVENDRÍA CONCRETAR: hora exacta]. " +
      "Tampoco consta la distancia [DATO QUE CONVENDRÍA CONCRETAR: distancia].";

    expect(
      esMarcadorDatoPendiente(
        "[DATO QUE CONVENDRÍA CONCRETAR: hora exacta]",
      ),
    ).toBe(true);
    expect(esMarcadorDatoPendiente("hora exacta")).toBe(false);
    expect(extraerMarcadoresDatoPendiente(texto)).toEqual([
      "[DATO QUE CONVENDRÍA CONCRETAR: hora exacta]",
      "[DATO QUE CONVENDRÍA CONCRETAR: distancia]",
    ]);
  });

  it("devuelve una lista vacía si no hay marcadores", () => {
    expect(extraerMarcadoresDatoPendiente("Texto sin marcadores")).toEqual([]);
  });
});
