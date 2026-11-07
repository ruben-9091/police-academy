import {
  extraerMarcadoresDatoPendiente,
  type Exposicion,
} from "@policia/shared";

interface Props {
  exposicion: Exposicion;
}

export function DatosPendientesPanel({ exposicion }: Props) {
  const marcadores = [
    ...new Set(
      exposicion.parrafos.flatMap((parrafo) =>
        extraerMarcadoresDatoPendiente(parrafo.texto),
      ),
    ),
  ];

  return (
    <section className="panel panel--compacto" aria-labelledby="pendientes-titulo">
      <h3 id="pendientes-titulo" className="panel__titulo">
        Datos pendientes
        <span className="contador-badge">{marcadores.length}</span>
      </h3>

      {marcadores.length === 0 ? (
        <p className="panel__ayuda">
          No hay marcadores pendientes en la exposición.
        </p>
      ) : (
        <>
          <p className="panel__ayuda">
            Pulsa cada marcador resaltado en el texto para sustituirlo.
          </p>
          <ul className="lista-simple">
            {marcadores.map((marcador) => {
              const dato = exposicion.datosPendientes.find(
                (pendiente) => pendiente.marcador === marcador,
              );

              return (
                <li key={marcador} className="lista-simple__item">
                  <code>{marcador}</code>
                  {dato?.motivo && <p>{dato.motivo}</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
