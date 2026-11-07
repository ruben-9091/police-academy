import { useState } from "react";
import type {
  Exposicion,
  GenerarExposicionRequest,
} from "@policia/shared";
import { generarExposicion as pedirExposicion } from "../lib/api";

export type EstadoGeneracion = "inicial" | "generando" | "listo" | "error";

export function useGeneracion() {
  const [exposicion, setExposicion] = useState<Exposicion | null>(null);
  const [estado, setEstado] = useState<EstadoGeneracion>("inicial");
  const [error, setError] = useState<unknown>(null);

  async function generar(input: GenerarExposicionRequest) {
    setEstado("generando");
    setError(null);

    try {
      const resultado = await pedirExposicion(input);
      setExposicion(resultado);
      setEstado("listo");
      return resultado;
    } catch (fallo) {
      setError(fallo);
      setEstado("error");
      return null;
    }
  }

  function actualizarExposicion(siguiente: Exposicion) {
    setExposicion(siguiente);
  }

  function reiniciar() {
    setExposicion(null);
    setError(null);
    setEstado("inicial");
  }

  return {
    exposicion,
    estado,
    error,
    generar,
    actualizarExposicion,
    reiniciar,
  };
}
