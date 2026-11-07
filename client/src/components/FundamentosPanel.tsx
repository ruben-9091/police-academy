import type { FundamentoNormativo } from "@policia/shared";

interface Props {
  fundamentos: FundamentoNormativo[];
}

export function FundamentosPanel({ fundamentos }: Props) {
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
        <ul className="lista-simple">
          {fundamentos.map((fundamento, indice) => (
            <li key={`${fundamento.norma}-${indice}`} className="lista-simple__item">
              <strong>{fundamento.norma}</strong>
              <p>{fundamento.porQueAplica}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
