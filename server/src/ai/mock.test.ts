import { describe, expect, it } from "vitest";
import {
  extraerMarcadoresDatoPendiente,
  generarExposicionRequestSchema,
  generarExposicionResponseSchema,
  type Exposicion,
  type GenerarExposicionRequest,
  type GenerarExposicionRequestInput,
} from "@policia/shared";
import { proveedorMock } from "./mock";

function entrada(
  relatoBruto: string,
  datos: NonNullable<GenerarExposicionRequestInput["datos"]> = {},
): GenerarExposicionRequest {
  return generarExposicionRequestSchema.parse({ relatoBruto, datos });
}

async function generar(input: GenerarExposicionRequest): Promise<Exposicion> {
  const salida = await proveedorMock.generarExposicion(input);

  return generarExposicionResponseSchema.parse(salida);
}

const relato = [
  "Sobre las 23:15 horas del día 12 de marzo, los agentes del indicativo 2-14 observaron a una persona en la vía pública.",
  "La persona mostró una actitud agresiva hacia los agentes.",
  "Se le requirió en dos ocasiones que se identificara y no atendió.",
  "Fue trasladada a dependencias policiales para su identificación.",
  "Se levantó el correspondiente atestado.",
].join(" ");

describe("proveedorMock", () => {
  it("devuelve una exposición válida contra el contrato compartido", async () => {
    const salida = await generar(entrada(relato));

    expect(generarExposicionResponseSchema.safeParse(salida).success).toBe(true);
  });

  it("es determinista para la misma entrada", async () => {
    const primera = await generar(entrada(relato));
    const segunda = await generar(entrada(relato));

    expect(segunda).toEqual(primera);
  });

  it("antepone 'Que ' a todos los párrafos y conserva ids únicos", async () => {
    const salida = await generar(entrada(relato));

    for (const parrafo of salida.parrafos) {
      expect(parrafo.texto.startsWith("Que ")).toBe(true);
    }

    const ids = new Set(salida.parrafos.map((parrafo) => parrafo.id));
    expect(ids.size).toBe(salida.parrafos.length);
    expect(salida.parrafos[0]?.id).toBe("p1");
  });

  it("inserta marcadores solo para los datos esenciales que faltan", async () => {
    const salida = await generar(entrada(relato));
    const texto = salida.parrafos.map((parrafo) => parrafo.texto).join(" ");
    const marcadoresEnTexto = extraerMarcadoresDatoPendiente(texto);
    const marcadoresEnPanel = salida.datosPendientes.map(
      (dato) => dato.marcador,
    );

    expect(marcadoresEnTexto).toHaveLength(5);
    expect(new Set(marcadoresEnTexto)).toEqual(new Set(marcadoresEnPanel));
    expect(texto).toContain("número de atestado");
    expect(texto).toContain("identidad de la persona presentada");
  });

  it("no añade marcadores cuando los datos están completos", async () => {
    const salida = await generar(
      entrada(relato, {
        atestado: "123/2026",
        lugarFecha: "Alicante, 12/03/2026, 23:15",
        indicativo: "2-14",
        agentes: [{ nip: "G428" }],
        personaPresentada: "J. P. G.",
      }),
    );

    expect(salida.datosPendientes).toEqual([]);
    for (const parrafo of salida.parrafos) {
      expect(extraerMarcadoresDatoPendiente(parrafo.texto)).toEqual([]);
    }
  });

  it("marca las calificaciones sin conducta observable", async () => {
    const salida = await generar(entrada(relato));
    const alerta = salida.alertasRevision.find(
      (item) => item.tipo === "calificacion_sin_conducta",
    );

    expect(alerta?.fragmento.toLowerCase()).toBe("actitud agresiva");
    expect(alerta?.sugerencia).toContain("conducta observable");
  });

  it("señala la laguna cronológica cuando no hay horas", async () => {
    const salida = await generar(
      entrada("Los agentes observaron a una persona y la identificaron."),
    );

    expect(
      salida.alertasRevision.some(
        (alerta) => alerta.tipo === "laguna_cronologica",
      ),
    ).toBe(true);
  });

  it("no cita fundamentos normativos por su cuenta", async () => {
    const salida = await generar(entrada(relato));

    expect(salida.fundamentosNormativos).toEqual([]);
  });
});
