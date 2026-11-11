import { crearProveedorGemini } from "./gemini";
import { proveedorMock } from "./mock";
import { ProveedorNoDisponibleError, type ProveedorIA } from "./provider";

/**
 * Se lee en cada petición: `dotenv` se carga en `index.ts` después de importar
 * `app.ts`, así que resolver el proveedor al importar el módulo dejaría
 * `AI_PROVIDER` sin efecto en desarrollo local.
 */
export function nombreProveedorConfigurado(): string {
  return (process.env.AI_PROVIDER ?? "mock").trim().toLowerCase() || "mock";
}

export function obtenerProveedor(): ProveedorIA {
  const nombre = nombreProveedorConfigurado();

  if (nombre === "mock") {
    return proveedorMock;
  }

  if (nombre === "gemini") {
    return crearProveedorGemini();
  }

  throw new ProveedorNoDisponibleError(nombre);
}
