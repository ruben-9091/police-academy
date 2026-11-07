interface Props {
  valor: string;
  onCambiar: (valor: string) => void;
  onCargarEjemplo: () => void;
}

export function RelatoForm({ valor, onCambiar, onCargarEjemplo }: Props) {
  return (
    <section className="panel" aria-labelledby="relato-titulo">
      <div className="panel__cabecera">
        <div>
          <h2 id="relato-titulo">Relato en bruto</h2>
          <p className="panel__ayuda">
            Pega el relato de la intervención tal y como lo contarías. La
            exposición se construirá solo con lo que aparezca aquí y en los
            datos del caso.
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

      <p className="contador">{valor.trim().length} caracteres</p>
    </section>
  );
}
