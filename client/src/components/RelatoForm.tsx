import { MAX_RELATO_CARACTERES } from "@policia/shared";
import { SubidaArchivo } from "./SubidaArchivo";
import type { EstadoTranscripcion } from "../hooks/useTranscripcion";

interface Props {
  valor: string;
  onCambiar: (valor: string) => void;
  onCargarEjemplo: () => void;
  onArchivo: (archivo: File) => void;
  estadoTranscripcion: EstadoTranscripcion;
  errorTranscripcion: unknown;
  nombreTranscripcion: string | null;
  proveedor: string | null;
}

export function RelatoForm({
  valor,
  onCambiar,
  onCargarEjemplo,
  onArchivo,
  estadoTranscripcion,
  errorTranscripcion,
  nombreTranscripcion,
  proveedor,
}: Props) {
  return (
    <section className="panel" aria-labelledby="relato-titulo">
      <div className="panel__cabecera">
        <div>
          <h2 id="relato-titulo">Relato en bruto</h2>
          <p className="panel__ayuda">
            Pega el relato de la intervención tal y como lo contarías, o súbelo
            en una foto o un PDF y corrígelo después. La exposición se
            construirá solo con lo que aparezca aquí y en los datos del caso.
          </p>
        </div>
        <button
          type="button"
          className="boton-secundario"
          onClick={onCargarEjemplo}
        >
          Cargar ejemplo
        </button>
      </div>

      <SubidaArchivo
        onArchivo={onArchivo}
        estado={estadoTranscripcion}
        error={errorTranscripcion}
        nombre={nombreTranscripcion}
        proveedor={proveedor}
      />

      <label className="campo">
        <span className="campo__etiqueta">
          Relato de la intervención
          <span className="campo__obligatorio">obligatorio</span>
        </span>
        <textarea
          rows={12}
          value={valor}
          onChange={(evento) => onCambiar(evento.target.value)}
          placeholder="Ejemplo: sobre las 22:30 horas, los agentes del indicativo…"
        />
      </label>

      <p
        className={`contador${
          valor.trim().length > MAX_RELATO_CARACTERES
            ? " contador--excedido"
            : ""
        }`}
      >
        {valor.trim().length.toLocaleString("es-ES")} /{" "}
        {MAX_RELATO_CARACTERES.toLocaleString("es-ES")} caracteres
      </p>
    </section>
  );
}
