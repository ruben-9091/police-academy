import type { Agente, DatosCaso } from "@policia/shared";

export type CampoTextoDatos =
  | "atestado"
  | "eurocop"
  | "dependencia"
  | "lugarFecha"
  | "indicativo"
  | "personaPresentada"
  | "entrega";

interface Props {
  datos: DatosCaso;
  onCambiar: (campo: CampoTextoDatos, valor: string) => void;
  onCambiarAgentes: (agentes: Agente[]) => void;
}

const CAMPOS: Array<{
  campo: CampoTextoDatos;
  etiqueta: string;
  ayuda?: string;
  placeholder?: string;
}> = [
  {
    campo: "atestado",
    etiqueta: "Atestado",
    placeholder: "Número de atestado",
  },
  {
    campo: "eurocop",
    etiqueta: "EUROCOP",
    placeholder: "Referencia EUROCOP",
  },
  {
    campo: "dependencia",
    etiqueta: "Dependencia",
    placeholder: "Unidad o dependencia",
  },
  {
    campo: "lugarFecha",
    etiqueta: "Lugar, fecha y hora",
    placeholder: "Alicante, 12/03/2026, 23:15",
  },
  {
    campo: "indicativo",
    etiqueta: "Indicativo",
    placeholder: "2-14",
  },
];

export function DatosCasoForm({
  datos,
  onCambiar,
  onCambiarAgentes,
}: Props) {
  const agentes = datos.agentes ?? [];

  function actualizarNip(indice: number, nip: string) {
    onCambiarAgentes(
      agentes.map((agente, posicion) =>
        posicion === indice ? { ...agente, nip } : agente,
      ),
    );
  }

  return (
    <section className="panel" aria-labelledby="datos-titulo">
      <div className="panel__cabecera">
        <div>
          <h2 id="datos-titulo">Datos del caso</h2>
          <p className="panel__ayuda">
            Todos los campos son opcionales. Lo que no informes se marcará en
            la exposición como dato pendiente de concretar.
          </p>
        </div>
      </div>

      <div className="rejilla-campos">
        {CAMPOS.map(({ campo, etiqueta, placeholder }) => (
          <label className="campo" key={campo}>
            <span className="campo__etiqueta">{etiqueta}</span>
            <input
              type="text"
              value={datos[campo] ?? ""}
              placeholder={placeholder}
              onChange={(evento) => onCambiar(campo, evento.target.value)}
            />
          </label>
        ))}

        <label className="campo">
          <span className="campo__etiqueta">Persona presentada</span>
          <input
            type="text"
            value={datos.personaPresentada ?? ""}
            placeholder="Identificación anonimizada"
            onChange={(evento) =>
              onCambiar("personaPresentada", evento.target.value)
            }
          />
        </label>

        <label className="campo">
          <span className="campo__etiqueta">Entrega</span>
          <input
            type="text"
            value={datos.entrega ?? ""}
            placeholder="Objeto, documento o persona entregada"
            onChange={(evento) => onCambiar("entrega", evento.target.value)}
          />
        </label>
      </div>

      <div className="agentes">
        <span className="campo__etiqueta">NIP de los agentes</span>
        <ul className="agentes__lista">
          {agentes.map((agente, indice) => (
            <li className="agentes__fila" key={indice}>
              <input
                type="text"
                aria-label={`NIP del agente ${indice + 1}`}
                value={agente.nip}
                placeholder="NIP"
                onChange={(evento) =>
                  actualizarNip(indice, evento.target.value)
                }
              />
              <button
                type="button"
                className="boton-icono"
                aria-label={`Quitar NIP del agente ${indice + 1}`}
                onClick={() =>
                  onCambiarAgentes(
                    agentes.filter((_, posicion) => posicion !== indice),
                  )
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="boton-secundario boton-secundario--pequeno"
          onClick={() => onCambiarAgentes([...agentes, { nip: "" }])}
        >
          Añadir NIP
        </button>
      </div>
    </section>
  );
}
