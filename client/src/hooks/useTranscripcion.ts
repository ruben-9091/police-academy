import { useState } from "react";
import { transcribirArchivo as pedirTranscripcion } from "../lib/api";
import { validarArchivo } from "../lib/archivos";

export type EstadoTranscripcion = "inactivo" | "transcribiendo" | "listo" | "error";

export function useTranscripcion() {
  const [estado, setEstado] = useState<EstadoTranscripcion>("inactivo");
  const [error, setError] = useState<unknown>(null);
  const [nombre, setNombre] = useState<string | null>(null);

  async function transcribir(archivo: File): Promise<string | null> {
    if (estado === "transcribiendo") {
      return null;
    }

    const problema = validarArchivo(archivo);

    setNombre(archivo.name);

    if (problema) {
      setError(new Error(problema));
      setEstado("error");
      return null;
    }

    setEstado("transcribiendo");
    setError(null);

    try {
      const texto = await pedirTranscripcion(archivo);
      setEstado("listo");
      return texto;
    } catch (fallo) {
      setError(fallo);
      setEstado("error");
      return null;
    }
  }

  function reiniciar() {
    setEstado("inactivo");
    setError(null);
    setNombre(null);
  }

  return { estado, error, nombre, transcribir, reiniciar };
}
