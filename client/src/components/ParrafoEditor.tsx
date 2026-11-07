import { useState } from "react";
import type { ParrafoExposicion } from "@policia/shared";
import { MarcadorTexto } from "./MarcadorTexto";

interface Props {
  parrafo: ParrafoExposicion;
  indice: number;
  total: number;
  onGuardar: (texto: string) => void;
  onBorrar: () => void;
  onMover: (direccion: -1 | 1) => void;
  onSustituirMarcador: (marcador: string, valor: string) => void;
}

export function ParrafoEditor({
  parrafo,
  indice,
  total,
  onGuardar,
  onBorrar,
  onMover,
  onSustituirMarcador,
}: Props) {
  const [editando, setEditando] = useState(() => parrafo.texto === "");
  const [borrador, setBorrador] = useState(parrafo.texto);
  const [marcadorActivo, setMarcadorActivo] = useState<string | null>(null);
  const [valorMarcador, setValorMarcador] = useState("");

  function comenzarEdicion() {
    setBorrador(parrafo.texto);
    setEditando(true);
  }

  function guardar() {
    if (!borrador.trim()) {
      return;
    }

    onGuardar(borrador.trim());
    setEditando(false);
  }

  function concretar() {
    if (!marcadorActivo || !valorMarcador.trim()) {
      return;
    }

    onSustituirMarcador(marcadorActivo, valorMarcador.trim());
    setMarcadorActivo(null);
    setValorMarcador("");
  }

  return (
    <article className="parrafo">
      <div className="parrafo__cabecera">
        <span className="parrafo__numero">Párrafo {indice + 1}</span>
        <div className="parrafo__acciones">
          <button
            type="button"
            className="boton-icono"
            aria-label={`Subir párrafo ${indice + 1}`}
            disabled={indice === 0}
            onClick={() => onMover(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="boton-icono"
            aria-label={`Bajar párrafo ${indice + 1}`}
            disabled={indice === total - 1}
            onClick={() => onMover(1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="boton-secundario boton-secundario--pequeno"
            onClick={comenzarEdicion}
            disabled={editando}
          >
            Editar
          </button>
          <button
            type="button"
            className="boton-icono boton-icono--peligro"
            aria-label={`Eliminar párrafo ${indice + 1}`}
            disabled={total === 1}
            onClick={onBorrar}
          >
            ×
          </button>
        </div>
      </div>

      {editando ? (
        <form
          className="parrafo__editor"
          onSubmit={(evento) => {
            evento.preventDefault();
            guardar();
          }}
        >
          <textarea
            rows={4}
            autoFocus
            aria-label={`Texto del párrafo ${indice + 1}`}
            value={borrador}
            onChange={(evento) => setBorrador(evento.target.value)}
          />
          <div className="parrafo__editor-acciones">
            <button
              type="submit"
              className="boton-principal boton-principal--pequeno"
              disabled={!borrador.trim()}
            >
              Guardar
            </button>
            <button
              type="button"
              className="boton-secundario boton-secundario--pequeno"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <p className="parrafo__texto">
          <MarcadorTexto
            texto={parrafo.texto}
            onMarcador={(marcador) => {
              setMarcadorActivo(marcador);
              setValorMarcador("");
            }}
          />
        </p>
      )}

      {marcadorActivo && (
        <form
          className="concretar"
          onSubmit={(evento) => {
            evento.preventDefault();
            concretar();
          }}
        >
          <label className="campo">
            <span className="campo__etiqueta">
              Concretar el dato pendiente
            </span>
            <input
              type="text"
              autoFocus
              value={valorMarcador}
              placeholder="Escribe el dato que falta"
              onChange={(evento) => setValorMarcador(evento.target.value)}
            />
          </label>
          <code className="concretar__marcador">{marcadorActivo}</code>
          <div className="parrafo__editor-acciones">
            <button
              type="submit"
              className="boton-principal boton-principal--pequeno"
              disabled={!valorMarcador.trim()}
            >
              Sustituir
            </button>
            <button
              type="button"
              className="boton-secundario boton-secundario--pequeno"
              onClick={() => setMarcadorActivo(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
