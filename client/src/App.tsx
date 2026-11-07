import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  datosCasoSchema,
  opcionesExposicionSchema,
  type DatosCaso,
  type GenerarExposicionRequest,
  type OpcionesExposicion,
} from "@policia/shared";
import { AvisoDocente } from "./components/AvisoDocente";
import { CabeceraApp } from "./components/CabeceraApp";
import { DatosCasoForm, type CampoTextoDatos } from "./components/DatosCasoForm";
import { DatosPendientesPanel } from "./components/DatosPendientesPanel";
import { EstadoVacio } from "./components/EstadoVacio";
import { ExposicionEditor } from "./components/ExposicionEditor";
import { AlertasRevisionPanel } from "./components/AlertasRevisionPanel";
import { BannerError } from "./components/BannerError";
import { FundamentosPanel } from "./components/FundamentosPanel";
import { InicioDocumento } from "./components/InicioDocumento";
import { OpcionesForm } from "./components/OpcionesForm";
import { RelatoForm } from "./components/RelatoForm";
import { RELATO_EJEMPLO } from "./data/ejemplo";
import { useGeneracion } from "./hooks/useGeneracion";
import {
  descargarDocx,
  guardarArchivo,
  obtenerEstado,
} from "./lib/api";
import "./App.css";

function App() {
  const [relatoBruto, setRelatoBruto] = useState("");
  const [datos, setDatos] = useState<DatosCaso>(() => datosCasoSchema.parse({}));
  const [opciones, setOpciones] = useState<OpcionesExposicion>(() =>
    opcionesExposicionSchema.parse({}),
  );
  const [modoDemo, setModoDemo] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<unknown>(null);

  const { exposicion, estado, error, version, generar, actualizarExposicion } =
    useGeneracion();

  const resultadoRef = useRef<HTMLHeadingElement>(null);
  const estadoAnteriorRef = useRef(estado);

  useEffect(() => {
    let activo = true;

    obtenerEstado().then((estadoApi) => {
      if (activo) {
        setModoDemo(estadoApi?.provider === "mock");
      }
    });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (estado === "listo" && estadoAnteriorRef.current === "generando") {
      resultadoRef.current?.focus();
    }

    estadoAnteriorRef.current = estado;
  }, [estado]);

  function cambiarDato(campo: CampoTextoDatos, valor: string) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor || undefined }));
  }

  function cambiarAgentes(agentes: DatosCaso["agentes"]) {
    setDatos((actuales) => ({ ...actuales, agentes }));
  }

  function cambiarOpciones(cambios: Partial<OpcionesExposicion>) {
    setOpciones((actuales) => ({ ...actuales, ...cambios }));
  }

  function crearDatos(): DatosCaso {
    const agentes = (datos.agentes ?? [])
      .map((agente) => ({ nip: agente.nip.trim() }))
      .filter((agente) => agente.nip.length > 0);

    return {
      ...datos,
      agentes: agentes.length > 0 ? agentes : undefined,
    };
  }

  function crearSolicitud(): GenerarExposicionRequest {
    return {
      relatoBruto: relatoBruto.trim(),
      datos: crearDatos(),
      opciones,
    };
  }

  async function manejarGenerar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!relatoBruto.trim() || estado === "generando") {
      return;
    }

    setErrorDescarga(null);
    await generar(crearSolicitud());
  }

  async function reintentar() {
    if (!relatoBruto.trim()) {
      return;
    }

    setErrorDescarga(null);
    await generar(crearSolicitud());
  }

  async function manejarDescargar() {
    if (!exposicion || descargando) {
      return;
    }

    if (
      exposicion.parrafos.length === 0 ||
      exposicion.parrafos.some((parrafo) => !parrafo.texto.trim())
    ) {
      setErrorDescarga(
        new Error(
          "Completa o elimina los párrafos vacíos antes de descargar el documento.",
        ),
      );
      return;
    }

    setDescargando(true);
    setErrorDescarga(null);

    try {
      const documento = await descargarDocx({
        datos: crearDatos(),
        opciones,
        exposicion,
      });
      guardarArchivo(documento, "exposicion-hechos.docx");
    } catch (fallo) {
      setErrorDescarga(fallo);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="aplicacion">
      <CabeceraApp modoDemo={modoDemo} />
      <AvisoDocente />

      <main className="disposicion">
        <form className="columna-formulario" onSubmit={manejarGenerar}>
          <RelatoForm
            valor={relatoBruto}
            onCambiar={setRelatoBruto}
            onCargarEjemplo={() => setRelatoBruto(RELATO_EJEMPLO)}
          />

          <DatosCasoForm
            datos={datos}
            onCambiar={cambiarDato}
            onCambiarAgentes={cambiarAgentes}
          />

          <OpcionesForm opciones={opciones} onCambiar={cambiarOpciones} />

          <div className="panel acciones-generar">
            <button
              type="submit"
              className="boton-principal"
              disabled={!relatoBruto.trim() || estado === "generando"}
            >
              {estado === "generando"
                ? "Generando…"
                : exposicion
                  ? "Volver a generar"
                  : "Generar exposición"}
            </button>
            <p className="nota">
              Los cambios en el formulario no modifican una exposición ya
              generada: vuelve a generar para aplicarlos.
            </p>
          </div>
        </form>

        <section
          className="columna-resultado"
          aria-labelledby="resultado-titulo"
          aria-busy={estado === "generando"}
        >
          <h2
            id="resultado-titulo"
            ref={resultadoRef}
            tabIndex={-1}
            className="resultado__titulo"
          >
            Resultado
          </h2>

          {error !== null && (
            <BannerError error={error} onReintentar={reintentar} />
          )}

          {!exposicion && estado !== "generando" && <EstadoVacio />}

          {estado === "generando" && !exposicion && (
            <p className="panel cargando" role="status">
              Generando exposición…
            </p>
          )}

          {exposicion && (
            <>
              <InicioDocumento opciones={opciones} />

              {errorDescarga !== null && (
                <BannerError error={errorDescarga} />
              )}

              <ExposicionEditor
                key={version}
                exposicion={exposicion}
                onCambiar={actualizarExposicion}
                onDescargar={manejarDescargar}
                descargando={descargando}
              />

              <div className="paneles">
                <DatosPendientesPanel exposicion={exposicion} />
                <AlertasRevisionPanel alertas={exposicion.alertasRevision} />
                <FundamentosPanel
                  fundamentos={exposicion.fundamentosNormativos}
                />
              </div>

              {estado === "generando" && (
                <p className="nota" role="status">
                  Regenerando la exposición…
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
