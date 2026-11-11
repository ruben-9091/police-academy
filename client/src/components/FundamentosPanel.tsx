import type { FundamentoNormativo } from "@policia/shared";

interface Props {
  fundamentos: FundamentoNormativo[];
  onDescartar: (indice: number) => void;
}

export function FundamentosPanel({ fundamentos, onDescartar }: Props) {
  return (
    <section
      className="panel panel--compacto"
      aria-labelledby="fundamentos-titulo"
    >
      <h3 id="fundamentos-titulo" className="panel__titulo">
        Fundamentos normativos
      </h3>

      {fundamentos.length === 0 ? (
        <p className="panel__ayuda">Sin fundamentos normativos propuestos.</p>
      ) : (
        <>
          <p className="panel__ayuda">
            Se incluyen en el .docx. Descarta los que no aporten valor real al
            supuesto.
          </p>
          <ul className="lista-simple">
            {fundamentos.map((fundamento, indice) => (
              <li
                key={`${fundamento.norma}-${indice}`}
                className="lista-simple__item"
              >
                <div className="lista-simple__cabecera">
                  <strong>{fundamento.norma}</strong>
                  <button
                    type="button"
                    className="boton-enlace"
                    onClick={() => onDescartar(indice)}
                  >
                    Descartar
                  </button>
                </div>
                <p>{fundamento.porQueAplica}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
