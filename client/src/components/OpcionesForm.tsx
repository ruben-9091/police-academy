import {
  ENCABEZADOS_MANIFIESTA,
  type OpcionesExposicion,
} from "@policia/shared";

interface Props {
  opciones: OpcionesExposicion;
  onCambiar: (cambios: Partial<OpcionesExposicion>) => void;
}

export function OpcionesForm({ opciones, onCambiar }: Props) {
  return (
    <section className="panel" aria-labelledby="opciones-titulo">
      <div className="panel__cabecera">
        <div>
          <h2 id="opciones-titulo">Opciones del documento</h2>
          <p className="panel__ayuda">
            Por defecto el documento empieza en <code>- MANIFIESTA:</code>, sin
            cabecera institucional ni escudos.
          </p>
        </div>
      </div>

      <label className="opcion-casilla">
        <input
          type="checkbox"
          checked={opciones.incluirCabecera}
          onChange={(evento) =>
            onCambiar({ incluirCabecera: evento.target.checked })
          }
        />
        <span>
          Incluir cabecera institucional (solo texto)
          <small>
            Se aplicará al exportar el documento; desactivada por defecto.
          </small>
        </span>
      </label>

      <fieldset className="grupo-radio">
        <legend className="campo__etiqueta">Encabezado</legend>
        {ENCABEZADOS_MANIFIESTA.map((encabezado) => (
          <label className="opcion-radio" key={encabezado}>
            <input
              type="radio"
              name="encabezado"
              value={encabezado}
              checked={opciones.encabezadoManifiesta === encabezado}
              onChange={() => onCambiar({ encabezadoManifiesta: encabezado })}
            />
            <span>{encabezado}</span>
          </label>
        ))}
      </fieldset>

      <label className="campo">
        <span className="campo__etiqueta">Subtítulo</span>
        <input
          type="text"
          value={opciones.subtitulo}
          onChange={(evento) => onCambiar({ subtitulo: evento.target.value })}
          placeholder="(Comparecencia de detención)"
        />
      </label>
    </section>
  );
}
