import type { OpcionesExposicion } from "@policia/shared";

interface Props {
  opciones: OpcionesExposicion;
}

export function InicioDocumento({ opciones }: Props) {
  return (
    <section
      className="panel inicio-documento"
      aria-labelledby="inicio-titulo"
    >
      <h3 id="inicio-titulo" className="panel__titulo">
        Inicio del documento
      </h3>
      <p className="inicio-documento__linea">
        - {opciones.encabezadoManifiesta}:{" "}
        {opciones.subtitulo.trim() || "(sin subtítulo)"}
      </p>
      {opciones.incluirCabecera && (
        <p className="panel__ayuda">
          Cabecera institucional activada (solo texto). Se aplicará al exportar
          el documento; ahora mismo no forma parte del editor.
        </p>
      )}
    </section>
  );
}
