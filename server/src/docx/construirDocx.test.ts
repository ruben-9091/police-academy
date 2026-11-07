import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  exportarDocxRequestSchema,
  type ExportarDocxRequest,
  type ExportarDocxRequestInput,
} from "@policia/shared";
import { construirDocx } from "./construirDocx";

const exposicion = {
  parrafos: [
    {
      id: "p1",
      texto:
        'Que los agentes actuantes observaron a una persona que manifestó: "no llevo nada".',
    },
    {
      id: "p2",
      texto:
        "Que en ese contexto le dieron el alto policial. [DATO QUE CONVENDRÍA CONCRETAR: número de atestado]",
    },
  ],
  datosPendientes: [
    {
      marcador: "[DATO QUE CONVENDRÍA CONCRETAR: número de atestado]",
      motivo: "No consta en los datos del caso.",
    },
  ],
  fundamentosNormativos: [
    {
      norma: "Art. 17 CE",
      porQueAplica: "Regula la privación de libertad y sus garantías.",
    },
  ],
  alertasRevision: [],
};

function solicitud(
  cambios: Partial<ExportarDocxRequestInput> = {},
): ExportarDocxRequest {
  return exportarDocxRequestSchema.parse({
    datos: {},
    opciones: {},
    exposicion,
    ...cambios,
  });
}

async function xmlDelDocumento(
  input: ExportarDocxRequest,
): Promise<string> {
  const buffer = await construirDocx(input);
  const zip = await JSZip.loadAsync(buffer);
  const archivo = zip.file("word/document.xml");

  if (!archivo) {
    throw new Error("El .docx no contiene word/document.xml");
  }

  return archivo.async("string");
}

describe("construirDocx", () => {
  it("empieza en - MANIFIESTA: y omite la cabecera por defecto", async () => {
    const xml = await xmlDelDocumento(solicitud());

    expect(xml).toContain("- MANIFIESTA:");
    expect(xml).not.toContain("MINISTERIO DEL INTERIOR");
    expect(xml).not.toContain("EXPOSICIÓN DE HECHOS");
    expect(xml.indexOf("- MANIFIESTA:")).toBeLessThan(
      xml.indexOf("Que los agentes actuantes"),
    );
  });

  it("incluye todos los párrafos, citas, cierre y pie docente", async () => {
    const xml = await xmlDelDocumento(solicitud());

    expect(xml).toContain(
      "Que los agentes actuantes observaron a una persona que manifestó: ",
    );
    expect(xml).toContain("&quot;no llevo nada&quot;");
    expect(xml).toContain("Que en ese contexto le dieron el alto policial.");
    expect(xml).toContain("CONSTE Y CERTIFICO.");
    expect(xml).toContain("finalidad exclusivamente docente / formativa");
  });

  it("añade la cabecera, la tabla y el bloque inicial cuando se activa", async () => {
    const xml = await xmlDelDocumento(
      solicitud({
        datos: {
          atestado: "123/2026",
          eurocop: "456/2026",
          dependencia: "ALICANTE",
          lugarFecha: "En Alicante, siendo las 22:10 horas del día 12/03/2026.",
          indicativo: "2-14",
          agentes: [{ nip: "G428" }, { nip: "G617" }],
          personaPresentada: "J. P. G.",
          entrega: "un teléfono móvil",
        },
        opciones: {
          incluirCabecera: true,
          encabezadoManifiesta: "MANIFIESTA",
          subtitulo: "(Comparecencia de detención)",
        },
      }),
    );

    expect(xml).toContain("MINISTERIO DEL INTERIOR");
    expect(xml).toContain("EXPOSICIÓN DE HECHOS");
    expect(xml).toContain("Atestado nº: ");
    expect(xml).toContain("123/2026");
    expect(xml).toContain("EUROCOP: ");
    expect(xml).toContain("Dependencia: ");
    expect(xml).toContain("COMPARECEN: Los funcionarios");
    expect(xml).toContain("carnés profesionales números G428 y G617");
    expect(xml).toContain("PRESENTAN a J. P. G.");
    expect(xml).toContain("HACEN ENTREGA de un teléfono móvil.");
  });

  it("respeta el encabezado MANIFIESTAN", async () => {
    const xml = await xmlDelDocumento(
      solicitud({
        opciones: {
          incluirCabecera: false,
          encabezadoManifiesta: "MANIFIESTAN",
          subtitulo: "(Comparecencia de detención)",
        },
      }),
    );

    expect(xml).toContain("- MANIFIESTAN:");
    expect(xml).not.toContain("- MANIFIESTA:");
  });

  it("incluye fundamentos y datos pendientes solo cuando existen", async () => {
    const xml = await xmlDelDocumento(solicitud());

    expect(xml).toContain("Fundamentos normativos aplicables");
    expect(xml).toContain("Art. 17 CE");
    expect(xml).toContain("Datos pendientes de concretar");
    expect(xml).toContain("número de atestado");
  });

  it("omite las secciones vacías", async () => {
    const xml = await xmlDelDocumento(
      solicitud({
        exposicion: {
          ...exposicion,
          parrafos: [{ id: "p1", texto: "Que no queda ningún marcador." }],
          datosPendientes: [],
          fundamentosNormativos: [],
        },
      }),
    );

    expect(xml).not.toContain("Fundamentos normativos aplicables");
    expect(xml).not.toContain("Datos pendientes de concretar");
  });

  it("deriva los datos pendientes de los marcadores que siguen en el texto", async () => {
    const sinMarcadorEnTexto = await xmlDelDocumento(
      solicitud({
        exposicion: {
          ...exposicion,
          parrafos: [{ id: "p1", texto: "Que ya no queda ningún marcador." }],
        },
      }),
    );

    expect(sinMarcadorEnTexto).not.toContain("Datos pendientes de concretar");

    const marcadorSinEntrada = await xmlDelDocumento(
      solicitud({
        exposicion: {
          ...exposicion,
          parrafos: [
            {
              id: "p1",
              texto:
                "Que falta [DATO QUE CONVENDRÍA CONCRETAR: la hora exacta].",
            },
          ],
          datosPendientes: [],
        },
      }),
    );

    expect(marcadorSinEntrada).toContain("Datos pendientes de concretar");
    expect(marcadorSinEntrada).toContain("la hora exacta");
  });
});
