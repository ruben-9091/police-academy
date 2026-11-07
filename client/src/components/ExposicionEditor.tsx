import type { Exposicion } from "@policia/shared";
import {
  actualizarParrafo,
  anadirParrafo,
  eliminarParrafo,
  moverParrafo,
  sustituirMarcador,
} from "../lib/exposicion";
import { ParrafoEditor } from "./ParrafoEditor";

interface Props {
  exposicion: Exposicion;
  onCambiar: (exposicion: Exposicion) => void;
  onDescargar: () => void;
  descargando: boolean;
}

export function ExposicionEditor({
  exposicion,
  onCambiar,
  onDescargar,
  descargando,
}: Props) {
  return (
    <section className="panel editor" aria-labelledby="editor-titulo">
      <div className="panel__cabecera">
        <div>
          <h2 id="editor-titulo">Exposición</h2>
          <p className="panel__ayuda">
            Cada párrafo debe empezar por <code>Que …</code>. Pulsa un
            marcador resaltado para concretarlo.
          </p>
        </div>
        <div className="panel__acciones">
          <button
            type="button"
            className="boton-secundario"
            onClick={() => onCambiar(anadirParrafo(exposicion))}
          >
            Añadir párrafo
          </button>
          <button
            type="button"
            className="boton-principal boton-principal--pequeno"
            onClick={onDescargar}
            disabled={descargando}
          >
            {descargando ? "Descargando…" : "Descargar .docx"}
          </button>
        </div>
      </div>

      <div className="editor__lista">
        {exposicion.parrafos.map((parrafo, indice) => (
          <ParrafoEditor
            key={parrafo.id}
            parrafo={parrafo}
            indice={indice}
            total={exposicion.parrafos.length}
            onGuardar={(texto) =>
              onCambiar(actualizarParrafo(exposicion, parrafo.id, texto))
            }
            onBorrar={() =>
              onCambiar(eliminarParrafo(exposicion, parrafo.id))
            }
            onMover={(direccion) =>
              onCambiar(moverParrafo(exposicion, parrafo.id, direccion))
            }
            onSustituirMarcador={(marcador, valor) =>
              onCambiar(sustituirMarcador(exposicion, marcador, valor))
            }
          />
        ))}
      </div>

      {exposicion.parrafos.length === 0 && (
        <p className="panel__ayuda">
          No quedan párrafos. Añade uno para continuar.
        </p>
      )}
    </section>
  );
}
