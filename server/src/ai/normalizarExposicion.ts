import {
  MARCADOR_DATO_PENDIENTE_PREFIJO,
  TIPOS_ALERTA_REVISION,
  extraerMarcadoresDatoPendiente,
  type AlertaRevision,
  type DatoPendiente,
  type FundamentoNormativo,
  type TipoAlertaRevision,
} from "@policia/shared";

const PATRON_MARCADOR_VARIANTE =
  /\[\s*DATO\s+QUE\s+CONVENDR[IÍ]A\s+CONCRETAR\s*:\s*([^\]]*?)\s*\]/gi;

const ACRONIMO = /^[A-ZÁÉÍÓÚÜÑ]{2,}/;
const TIPOS_ALERTA = new Set<string>(TIPOS_ALERTA_REVISION);

/** Corrige variantes habituales del marcador sin cambiar su contenido. */
export function normalizarMarcadores(texto: string): string {
  return texto.replace(PATRON_MARCADOR_VARIANTE, (_coincidencia, detalle) => {
    const limpio = String(detalle).trim();

    if (!limpio) {
      return "";
    }

    return `${MARCADOR_DATO_PENDIENTE_PREFIJO} ${limpio}]`;
  });
}

function minusculaInicial(texto: string): string {
  if (ACRONIMO.test(texto)) {
    return texto;
  }

  return texto.charAt(0).toLocaleLowerCase("es") + texto.slice(1);
}

/** Deja el párrafo con la forma "Que ..." y sin guiones ni numeración. */
export function normalizarTextoParrafo(texto: string): string {
  let limpio = normalizarMarcadores(texto).replace(/\s+/g, " ").trim();

  limpio = limpio.replace(/^[-–—]\s*/, "").trim();

  const yaEmpiezaPorQue = /^que\s+(.*)$/i.exec(limpio);

  if (yaEmpiezaPorQue) {
    return `Que ${yaEmpiezaPorQue[1]}`.trim();
  }

  if (!limpio) {
    return limpio;
  }

  return `Que ${minusculaInicial(limpio)}`;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function textoNoVacio(valor: unknown): string | undefined {
  if (typeof valor !== "string") {
    return undefined;
  }

  const limpio = valor.trim();
  return limpio ? limpio : undefined;
}

function normalizarParrafos(valor: unknown): Array<{ id: string; texto: string }> {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor.flatMap((elemento) => {
    if (!esObjeto(elemento)) {
      return [];
    }

    const texto = textoNoVacio(elemento.texto);

    if (!texto) {
      return [];
    }

    return [{ id: "", texto: normalizarTextoParrafo(texto) }];
  }).map((parrafo, indice) => ({
    ...parrafo,
    id: `p${indice + 1}`,
  }));
}

function motivosPorMarcador(valor: unknown): Map<string, string | undefined> {
  const motivos = new Map<string, string | undefined>();

  if (!Array.isArray(valor)) {
    return motivos;
  }

  for (const elemento of valor) {
    if (!esObjeto(elemento)) {
      continue;
    }

    const marcador = textoNoVacio(elemento.marcador);

    if (!marcador) {
      continue;
    }

    const canonico = normalizarMarcadores(marcador).trim();

    if (canonico) {
      motivos.set(canonico, textoNoVacio(elemento.motivo));
    }
  }

  return motivos;
}

function normalizarDatosPendientes(
  valor: unknown,
  parrafos: Array<{ texto: string }>,
): DatoPendiente[] {
  const motivos = motivosPorMarcador(valor);
  const marcadores = [
    ...new Set(
      parrafos.flatMap((parrafo) =>
        extraerMarcadoresDatoPendiente(parrafo.texto),
      ),
    ),
  ];

  return marcadores.map((marcador) => ({
    marcador,
    motivo: motivos.get(marcador),
  }));
}

function normalizarFundamentos(valor: unknown): FundamentoNormativo[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  const vistos = new Set<string>();
  const fundamentos: FundamentoNormativo[] = [];

  for (const elemento of valor) {
    if (!esObjeto(elemento)) {
      continue;
    }

    const norma = textoNoVacio(elemento.norma);
    const porQueAplica = textoNoVacio(elemento.porQueAplica);

    if (!norma || !porQueAplica) {
      continue;
    }

    const clave = norma.toLocaleLowerCase("es");

    if (vistos.has(clave)) {
      continue;
    }

    vistos.add(clave);
    fundamentos.push({ norma, porQueAplica });
  }

  return fundamentos;
}

export function normalizarAlertas(valor: unknown): AlertaRevision[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  const vistos = new Set<string>();
  const alertas: AlertaRevision[] = [];

  for (const elemento of valor) {
    if (!esObjeto(elemento)) {
      continue;
    }

    const tipo = textoNoVacio(elemento.tipo);
    const fragmento = textoNoVacio(elemento.fragmento);
    const sugerencia = textoNoVacio(elemento.sugerencia);

    if (!tipo || !TIPOS_ALERTA.has(tipo) || !fragmento || !sugerencia) {
      continue;
    }

    const clave = `${tipo}|${fragmento}`;

    if (vistos.has(clave)) {
      continue;
    }

    vistos.add(clave);
    alertas.push({
      tipo: tipo as TipoAlertaRevision,
      fragmento,
      sugerencia,
    });
  }

  return alertas;
}

/**
 * Deja la salida del modelo en la forma más cercana posible al contrato.
 * No inventa contenido: solo corrige formato, ids, marcadores y duplicados.
 */
export function normalizarExposicion(salida: unknown): unknown {
  if (!esObjeto(salida)) {
    return salida;
  }

  const parrafos = normalizarParrafos(salida.parrafos);

  return {
    parrafos,
    datosPendientes: normalizarDatosPendientes(salida.datosPendientes, parrafos),
    fundamentosNormativos: normalizarFundamentos(
      salida.fundamentosNormativos,
    ),
    alertasRevision: normalizarAlertas(salida.alertasRevision),
  };
}
