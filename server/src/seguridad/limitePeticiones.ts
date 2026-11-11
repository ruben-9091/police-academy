import type { Request, RequestHandler } from "express";

export interface OpcionesLimitePeticiones {
  /** Peticiones permitidas por ventana y clave. */
  maximo: number;
  ventanaMs: number;
  mensaje?: string;
  ahora?: () => number;
  /** Permite agrupar varias rutas bajo el mismo contador. */
  identificar?: (request: Request) => string;
}

interface Registro {
  conteo: number;
  reinicio: number;
}

const VENTANA_POR_DEFECTO_MS = 10 * 60 * 1_000;

/**
 * Netlify escribe la IP real del cliente en esta cabecera y sobrescribe
 * cualquier valor enviado por el navegador. En local se usa la IP del socket.
 */
export function ipDe(request: Request): string {
  const cabecera = request.headers["x-nf-client-connection-ip"];

  if (typeof cabecera === "string" && cabecera.trim()) {
    return cabecera.trim();
  }

  return request.ip ?? "desconocida";
}

/**
 * Límite de frecuencia en memoria. Cada instancia de la función tiene su
 * propio contador: sirve para frenar ráfagas y abusos, no como cuota exacta.
 */
export function crearLimitePeticiones(
  opciones: OpcionesLimitePeticiones,
): RequestHandler {
  const ahora = opciones.ahora ?? Date.now;
  const identificar = opciones.identificar ?? ipDe;
  const registros = new Map<string, Registro>();

  return (request, response, next) => {
    const momento = ahora();
    const clave = identificar(request);
    let registro = registros.get(clave);

    if (!registro || registro.reinicio <= momento) {
      registro = { conteo: 0, reinicio: momento + opciones.ventanaMs };
      registros.set(clave, registro);
    }

    registro.conteo += 1;

    if (registro.conteo > opciones.maximo) {
      const segundos = Math.max(
        1,
        Math.ceil((registro.reinicio - momento) / 1_000),
      );

      response.setHeader("Retry-After", String(segundos));
      response.status(429).json({
        error:
          opciones.mensaje ??
          "Demasiadas peticiones. Espera unos minutos y vuelve a intentarlo.",
      });
      return;
    }

    if (registros.size > 5_000) {
      for (const [claveRegistrada, valor] of registros) {
        if (valor.reinicio <= momento) {
          registros.delete(claveRegistrada);
        }
      }
    }

    next();
  };
}

export function leerMaximo(nombre: string, porDefecto: number): number {
  const valor = Number(process.env[nombre]);

  if (!Number.isInteger(valor) || valor <= 0) {
    return porDefecto;
  }

  return valor;
}

export function leerVentanaMs(nombre: string, porDefecto = VENTANA_POR_DEFECTO_MS): number {
  const valor = Number(process.env[nombre]);

  if (!Number.isFinite(valor) || valor <= 0) {
    return porDefecto;
  }

  return valor;
}

export { VENTANA_POR_DEFECTO_MS };
