import type {
  AlertaRevision,
  TipoAlertaRevision,
} from "@policia/shared";

interface Props {
  alertas: AlertaRevision[];
}

const ETIQUETAS: Record<TipoAlertaRevision, string> = {
  calificacion_sin_conducta: "Calificación sin conducta",
  dato_inventado: "Dato no aportado",
  laguna_cronologica: "Laguna cronológica",
  articulo_relleno: "Artículo de relleno",
  formato: "Formato",
  revision_incompleta: "Revisión incompleta",
};

export function AlertasRevisionPanel({ alertas }: Props) {
  return (
    <section className="panel panel--compacto" aria-labelledby="alertas-titulo">
      <h3 id="alertas-titulo" className="panel__titulo">
        Alertas de revisión
        <span className="contador-badge contador-badge--alerta">
          {alertas.length}
        </span>
      </h3>

      {alertas.length === 0 ? (
        <p className="panel__ayuda">No hay alertas de revisión.</p>
      ) : (
        <ul className="lista-alertas">
          {alertas.map((alerta, indice) => (
            <li
              key={`${alerta.tipo}-${indice}`}
              className="lista-alertas__item"
            >
              <span className="etiqueta-alerta">
                {ETIQUETAS[alerta.tipo]}
              </span>
              <blockquote>{alerta.fragmento}</blockquote>
              <p>{alerta.sugerencia}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
