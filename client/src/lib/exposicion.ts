import {
  extraerMarcadoresDatoPendiente,
  type Exposicion,
} from "@policia/shared";

export function actualizarParrafo(
  exposicion: Exposicion,
  id: string,
  texto: string,
): Exposicion {
  return {
    ...exposicion,
    parrafos: exposicion.parrafos.map((parrafo) =>
      parrafo.id === id ? { ...parrafo, texto } : parrafo,
    ),
  };
}

export function anadirParrafo(exposicion: Exposicion): Exposicion {
  const id = `p-${crypto.randomUUID()}`;

  return {
    ...exposicion,
    parrafos: [...exposicion.parrafos, { id, texto: "" }],
  };
}

export function eliminarParrafo(
  exposicion: Exposicion,
  id: string,
): Exposicion {
  return {
    ...exposicion,
    parrafos: exposicion.parrafos.filter((parrafo) => parrafo.id !== id),
  };
}

export function moverParrafo(
  exposicion: Exposicion,
  id: string,
  direccion: -1 | 1,
): Exposicion {
  const indice = exposicion.parrafos.findIndex((parrafo) => parrafo.id === id);
  const destino = indice + direccion;

  if (indice < 0 || destino < 0 || destino >= exposicion.parrafos.length) {
    return exposicion;
  }

  const parrafos = [...exposicion.parrafos];
  const [movido] = parrafos.splice(indice, 1);
  parrafos.splice(destino, 0, movido);

  return { ...exposicion, parrafos };
}

export function sustituirMarcador(
  exposicion: Exposicion,
  marcador: string,
  valor: string,
): Exposicion {
  const limpio = valor.trim();

  if (!limpio) {
    return exposicion;
  }

  return {
    ...exposicion,
    parrafos: exposicion.parrafos.map((parrafo) => ({
      ...parrafo,
      texto: parrafo.texto.split(marcador).join(limpio),
    })),
    datosPendientes: exposicion.datosPendientes.filter(
      (dato) => dato.marcador !== marcador,
    ),
  };
}

export function contarMarcadores(exposicion: Exposicion): number {
  const marcadores = new Set(
    exposicion.parrafos.flatMap((parrafo) =>
      extraerMarcadoresDatoPendiente(parrafo.texto),
    ),
  );

  return marcadores.size;
}
