import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  crearLimitePeticiones,
  ipDe,
  leerMaximo,
  leerVentanaMs,
} from "./limitePeticiones";

interface RespuestaFalsa {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  setHeader(nombre: string, valor: string): void;
  status(codigo: number): RespuestaFalsa;
  json(cuerpo: unknown): RespuestaFalsa;
}

function crearRespuesta(): RespuestaFalsa {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(nombre, valor) {
      this.headers[nombre] = valor;
    },
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(cuerpo) {
      this.body = cuerpo;
      return this;
    },
  };
}

function peticion(ip = "1.1.1.1", cabeceras: Record<string, string> = {}) {
  return { ip, headers: cabeceras } as unknown as Request;
}

describe("crearLimitePeticiones", () => {
  it("permite hasta el máximo de la ventana y bloquea la siguiente", () => {
    const momento = 0;
    const limite = crearLimitePeticiones({
      maximo: 2,
      ventanaMs: 1_000,
      ahora: () => momento,
    });
    const siguiente = vi.fn() as unknown as NextFunction;
    const primera = crearRespuesta();
    const segunda = crearRespuesta();
    const tercera = crearRespuesta();

    limite(peticion(), primera as unknown as Response, siguiente);
    limite(peticion(), segunda as unknown as Response, siguiente);
    limite(peticion(), tercera as unknown as Response, siguiente);

    expect(primera.statusCode).toBe(200);
    expect(segunda.statusCode).toBe(200);
    expect(tercera.statusCode).toBe(429);
    expect(tercera.headers["Retry-After"]).toBe("1");
    expect(siguiente).toHaveBeenCalledTimes(2);
  });

  it("reinicia el contador al empezar otra ventana", () => {
    let momento = 0;
    const limite = crearLimitePeticiones({
      maximo: 1,
      ventanaMs: 1_000,
      ahora: () => momento,
    });
    const siguiente = vi.fn() as unknown as NextFunction;

    limite(peticion(), crearRespuesta() as unknown as Response, siguiente);
    limite(peticion(), crearRespuesta() as unknown as Response, siguiente);

    momento = 1_000;

    const despues = crearRespuesta();
    limite(peticion(), despues as unknown as Response, siguiente);

    expect(despues.statusCode).toBe(200);
    expect(siguiente).toHaveBeenCalledTimes(2);
  });

  it("cuenta por separado cada IP", () => {
    const limite = crearLimitePeticiones({ maximo: 1, ventanaMs: 1_000 });
    const siguiente = vi.fn() as unknown as NextFunction;

    limite(peticion("1.1.1.1"), crearRespuesta() as unknown as Response, siguiente);
    const otra = crearRespuesta();
    limite(peticion("2.2.2.2"), otra as unknown as Response, siguiente);

    expect(otra.statusCode).toBe(200);
  });

  it("usa la IP real que escribe Netlify", () => {
    const limite = crearLimitePeticiones({ maximo: 1, ventanaMs: 1_000 });
    const siguiente = vi.fn() as unknown as NextFunction;
    const cabeceras = { "x-nf-client-connection-ip": "9.9.9.9" };

    limite(peticion("1.1.1.1", cabeceras), crearRespuesta() as unknown as Response, siguiente);
    const segunda = crearRespuesta();
    limite(peticion("2.2.2.2", cabeceras), segunda as unknown as Response, siguiente);

    expect(segunda.statusCode).toBe(429);
  });
});

describe("ipDe", () => {
  it("prefiere la cabecera de Netlify y cae en la IP del socket", () => {
    expect(
      ipDe(peticion("1.1.1.1", { "x-nf-client-connection-ip": "8.8.8.8" })),
    ).toBe("8.8.8.8");
    expect(ipDe(peticion("1.1.1.1"))).toBe("1.1.1.1");
  });
});

describe("lectura de configuración", () => {
  it("usa el valor por defecto si la variable no es válida", () => {
    delete process.env.LIMITE_PRUEBA;
    expect(leerMaximo("LIMITE_PRUEBA", 7)).toBe(7);

    process.env.LIMITE_PRUEBA = "0";
    expect(leerMaximo("LIMITE_PRUEBA", 7)).toBe(7);

    process.env.LIMITE_PRUEBA = "3";
    expect(leerMaximo("LIMITE_PRUEBA", 7)).toBe(3);

    expect(leerVentanaMs("LIMITE_PRUEBA_VENTANA", 1_000)).toBe(1_000);

    delete process.env.LIMITE_PRUEBA;
    delete process.env.LIMITE_PRUEBA_VENTANA;
  });
});
