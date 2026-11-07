import { dividirTextoPorMarcadores } from "@policia/shared";

interface Props {
  texto: string;
  onMarcador?: (marcador: string) => void;
}

export function MarcadorTexto({ texto, onMarcador }: Props) {
  const tramos = dividirTextoPorMarcadores(texto);

  if (tramos.length === 0) {
    return <span className="parrafo__vacio">Párrafo vacío…</span>;
  }

  return (
    <>
      {tramos.map((tramo, indice) =>
        tramo.tipo === "marcador" ? (
          <button
            type="button"
            className="marcador"
            key={indice}
            onClick={() => onMarcador?.(tramo.valor)}
            title="Pulsa para concretar este dato"
          >
            {tramo.valor}
          </button>
        ) : (
          <span key={indice}>{tramo.valor}</span>
        ),
      )}
    </>
  );
}
