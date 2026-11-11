import { useState, type ChangeEvent, type DragEvent } from "react";
import { MAX_ADJUNTO_MB } from "../lib/archivos";
import { describirError } from "../lib/api";
import type { EstadoTranscripcion } from "../hooks/useTranscripcion";

interface Props {
  onArchivo: (archivo: File) => void;
  estado: EstadoTranscripcion;
  error: unknown;
  nombre: string | null;
  proveedor: string | null;
}

export function SubidaArchivo({
  onArchivo,
  estado,
  error,
  nombre,
  proveedor,
}: Props) {
  const [arrastrando, setArrastrando] = useState(false);
  const transcribiendo = estado === "transcribiendo";

  function manejarArchivo(archivo: File | undefined) {
    if (!archivo || transcribiendo) {
      return;
    }

    onArchivo(archivo);
  }

  function cambiar(evento: ChangeEvent<HTMLInputElement>) {
    manejarArchivo(evento.target.files?.[0]);
    // Permite volver a elegir el mismo archivo.
    evento.target.value = "";
  }

  function soltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastrando(false);
    manejarArchivo(evento.dataTransfer.files?.[0]);
  }

  return (
    <div className="subida">
      <label
        className={`subida__zona${arrastrando ? " subida__zona--activa" : ""}${
          transcribiendo ? " subida__zona--ocupada" : ""
        }`}
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltar}
      >
        <span className="subida__titulo">
          {transcribiendo ? "Transcribiendo…" : "Subir imagen o PDF"}
        </span>
        <span className="subida__ayuda">
          JPG, PNG, WebP o PDF · máximo {MAX_ADJUNTO_MB} MB · también puedes
          arrastrarlo aquí
        </span>
        <input
          className="subida__input"
          type="file"
          accept="image/*,application/pdf"
          onChange={cambiar}
          disabled={transcribiendo}
        />
      </label>

      {transcribiendo && (
        <p className="nota" role="status">
          Leyendo «{nombre ?? "el archivo"}». Puede tardar unos segundos.
        </p>
      )}

      {estado === "error" && error !== null && (
        <p className="subida__error" role="alert">
          {describirError(error).mensaje}
        </p>
      )}

      {estado === "listo" && (
        <p className="nota subida__ok" role="status">
          Transcripción añadida al relato. Revísala y corrige lo que haga falta
          antes de generar.
        </p>
      )}

      {proveedor === "gemini" && (
        <p className="nota">
          El archivo se envía a Gemini solo para transcribirlo. Usa supuestos
          docentes o anonimizados.
        </p>
      )}
    </div>
  );
}
