import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app";

const proveedorOriginal = process.env.AI_PROVIDER;

beforeAll(() => {
  process.env.AI_PROVIDER = "mock";
});

afterAll(() => {
  if (proveedorOriginal === undefined) {
    delete process.env.AI_PROVIDER;
  } else {
    process.env.AI_PROVIDER = proveedorOriginal;
  }
});

describe("GET /api/health", () => {
  it("informa del proveedor de IA configurado", async () => {
    const respuesta = await request(app).get("/api/health");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      ok: true,
      provider: "mock",
    });
  });
});

describe("POST /api/generar", () => {
  it("devuelve una exposición válida con el proveedor mock", async () => {
    const respuesta = await request(app)
      .post("/api/generar")
      .send({
        relatoBruto:
          "A las 22:10 horas los agentes observaron a una persona y le dieron el alto.",
      });

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.parrafos)).toBe(true);
    expect(respuesta.body.parrafos[0].texto.startsWith("Que ")).toBe(true);
  });

  it("rechaza un relato vacío con el detalle de los campos inválidos", async () => {
    const respuesta = await request(app)
      .post("/api/generar")
      .send({ relatoBruto: "   " });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toBe("Datos de entrada no válidos");
    expect(respuesta.body.issues[0].path).toBe("relatoBruto");
  });

  it("mantiene el 404 para rutas de API desconocidas", async () => {
    const respuesta = await request(app).get("/api/desconocido");

    expect(respuesta.status).toBe(404);
  });
});

describe("POST /api/exportar-docx", () => {
  const exposicion = {
    parrafos: [
      { id: "p1", texto: "Que los agentes observaron a una persona." },
    ],
    datosPendientes: [],
    fundamentosNormativos: [],
    alertasRevision: [],
  };

  it("devuelve un documento Word descargable", async () => {
    const respuesta = await request(app)
      .post("/api/exportar-docx")
      .send({ exposicion });

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(respuesta.headers["content-disposition"]).toContain(
      "exposicion-hechos.docx",
    );
  });

  it("rechaza una exposición sin párrafos", async () => {
    const respuesta = await request(app)
      .post("/api/exportar-docx")
      .send({ exposicion: { ...exposicion, parrafos: [] } });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toBe("Datos de entrada no válidos");
  });
});
