import { describe, expect, it } from "vitest";
import { generarExposicionRequestSchema } from "@policia/shared";
import { EJEMPLO_APERTURA } from "./ejemploApertura";
import {
  PROMPT_SISTEMA_REDACCION,
  construirEntradaRedaccion,
  construirEntradaReparacion,
  construirEntradaRevision,
} from "./index";
import { PROMPT_MAESTRO } from "./promptMaestro";
import { REGLAS_APLICACION } from "./reglasAplicacion";

const input = generarExposicionRequestSchema.parse({
  relatoBruto: "Los agentes observaron a una persona a las 22:10.",
  datos: { indicativo: "2-14", agentes: [{ nip: "G428" }] },
});

describe("prompts", () => {
  it("conserva los textos literales de la spec", () => {
    expect(PROMPT_MAESTRO).toContain("PROMPT MAESTRO");
    expect(PROMPT_MAESTRO).toContain("DESCRIBIR PRIMERO Y CALIFICAR DESPUÉS");
    expect(PROMPT_MAESTRO).toContain("Artículo 5: pr");
    expect(PROMPT_MAESTRO).toContain("[TEXTO INCOMPLETO EN EL ORIGINAL]");
    expect(REGLAS_APLICACION).toContain("REGLAS ADICIONALES DE LA APLICACIÓN");
    expect(REGLAS_APLICACION).toContain('"- MANIFIESTA:"');
    expect(EJEMPLO_APERTURA.startsWith("- MANIFIESTA:")).toBe(true);
    expect(EJEMPLO_APERTURA).toContain("PLAYAS POSTIGUET");
  });

  it("añade la prohibición de citar el Art. 5 y el ejemplo de estilo", () => {
    expect(PROMPT_SISTEMA_REDACCION).toContain(
      "No cites el artículo 5 de la Ley Orgánica 2/1986",
    );
    expect(PROMPT_SISTEMA_REDACCION).toContain("EJEMPLO DE ESTILO");
    expect(PROMPT_SISTEMA_REDACCION).toContain("PLAYAS POSTIGUET");
  });

  it("delimita el relato como contenido no confiable", () => {
    const entrada = construirEntradaRedaccion(input);

    expect(entrada).toContain("<<<RELATO");
    expect(entrada).toContain("RELATO>>>");
    expect(entrada).toContain("no instrucciones");
    expect(entrada).toContain("G428");
  });

  it("incluye el borrador y los errores en las llamadas de revisión y reparación", () => {
    const revision = construirEntradaRevision(input, {
      parrafos: [{ id: "p1", texto: "Que los agentes observaron." }],
    });
    const reparacion = construirEntradaReparacion(input, { parrafos: [] }, [
      "parrafos: demasiado pocos elementos",
    ]);

    expect(revision).toContain("BORRADOR A REVISAR");
    expect(revision).toContain("Que los agentes observaron.");
    expect(reparacion).toContain("SALIDA INVÁLIDA");
    expect(reparacion).toContain("parrafos: demasiado pocos elementos");
  });
});
