import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type {
  DatosCaso,
  ExportarDocxRequest,
  OpcionesExposicion,
  ParrafoExposicion,
} from "@policia/shared";
import { extraerMarcadoresDatoPendiente } from "@policia/shared";

const FUENTE = "Calibri";
const TAMANO_CUERPO = 22;
const TAMANO_PIE = 16;
const COLOR_SUAVE = "666666";
const ANCHO_CONTENIDO = 9072; // A4 (11906) menos márgenes laterales (1417 x 2)

function parrafoCuerpo(texto: string, indentado = false): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 276 },
    indent: indentado ? { left: 340, hanging: 340 } : undefined,
    children: [new TextRun({ text: texto, font: FUENTE, size: TAMANO_CUERPO })],
  });
}

/** "- Que ..." con el guion en negrita y las citas entre comillas en cursiva. */
function parrafoQue(texto: string): Paragraph {
  const partes = texto.split(/("(?:[^"]|"")*")/g).filter(Boolean);
  const runs = [
    new TextRun({ text: "- ", bold: true, font: FUENTE, size: TAMANO_CUERPO }),
  ];

  for (const parte of partes) {
    runs.push(
      new TextRun({
        text: parte,
        italics: parte.startsWith('"') ? true : undefined,
        font: FUENTE,
        size: TAMANO_CUERPO,
      }),
    );
  }

  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 220, line: 300 },
    children: runs,
  });
}

function parrafoTituloSeccion(texto: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 6 },
    },
    children: [
      new TextRun({
        text: texto,
        bold: true,
        font: FUENTE,
        size: TAMANO_CUERPO,
      }),
    ],
  });
}

function parrafoNota(texto: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [
      new TextRun({
        text: texto,
        italics: true,
        font: FUENTE,
        size: TAMANO_PIE,
        color: COLOR_SUAVE,
      }),
    ],
  });
}

function construirBloqueInicial(datos: DatosCaso): Paragraph[] {
  const bloques: Paragraph[] = [];

  if (datos.lugarFecha) {
    bloques.push(parrafoCuerpo(datos.lugarFecha));
  }

  const nips = (datos.agentes ?? [])
    .map((agente) => agente.nip.trim())
    .filter(Boolean);

  if (datos.indicativo || nips.length > 0) {
    const indicativo = datos.indicativo
      ? ` integrantes del indicativo ${datos.indicativo}`
      : "";
    const carnets =
      nips.length > 0
        ? `, con carnés profesionales números ${nips.join(" y ")}`
        : "";

    bloques.push(
      parrafoCuerpo(
        `COMPARECEN: Los funcionarios de Policía Local de Alicante${indicativo}${carnets}.`,
      ),
    );
  }

  if (datos.personaPresentada) {
    bloques.push(parrafoCuerpo(`PRESENTAN a ${datos.personaPresentada}.`));
  }

  if (datos.entrega) {
    bloques.push(parrafoCuerpo(`HACEN ENTREGA de ${datos.entrega}.`));
  }

  return bloques;
}

/** Cabecera institucional opcional: solo texto, sin escudos ni logotipos. */
function construirCabecera(
  datos: DatosCaso,
  opciones: OpcionesExposicion,
): Array<Paragraph | Table> {
  const contenido: Array<Paragraph | Table> = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "MINISTERIO DEL INTERIOR",
          bold: true,
          font: FUENTE,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "DIRECCIÓN GENERAL DE LA POLICÍA",
          font: FUENTE,
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "COMISARÍA PROVINCIAL ALICANTE · INSPECCIÓN CENTRAL DE GUARDIA",
          font: FUENTE,
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 4 },
      },
      children: [
        new TextRun({
          text: "Documento de trabajo docente — Policía Local de Alicante",
          italics: true,
          font: FUENTE,
          size: TAMANO_PIE,
          color: COLOR_SUAVE,
        }),
      ],
    }),
  ];

  const filasReferencia: Paragraph[] = [];

  if (datos.atestado) {
    filasReferencia.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Atestado nº: ",
            bold: true,
            font: FUENTE,
            size: 20,
          }),
          new TextRun({ text: datos.atestado, font: FUENTE, size: 20 }),
        ],
      }),
    );
  }

  if (datos.eurocop) {
    filasReferencia.push(
      new Paragraph({
        children: [
          new TextRun({ text: "EUROCOP: ", bold: true, font: FUENTE, size: 20 }),
          new TextRun({ text: datos.eurocop, font: FUENTE, size: 20 }),
        ],
      }),
    );
  }

  if (datos.dependencia) {
    filasReferencia.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Dependencia: ",
            bold: true,
            font: FUENTE,
            size: 20,
          }),
          new TextRun({ text: datos.dependencia, font: FUENTE, size: 20 }),
        ],
      }),
    );
  }

  if (filasReferencia.length > 0) {
    contenido.push(
      new Table({
        width: { size: ANCHO_CONTENIDO, type: WidthType.DXA },
        columnWidths: [ANCHO_CONTENIDO],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: ANCHO_CONTENIDO, type: WidthType.DXA },
                shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
                children: filasReferencia,
              }),
            ],
          }),
        ],
      }),
    );
  }

  contenido.push(
    new Paragraph({ spacing: { before: 300, after: 100 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "EXPOSICIÓN DE HECHOS",
          bold: true,
          font: FUENTE,
          size: 26,
        }),
      ],
    }),
  );

  if (opciones.subtitulo.trim()) {
    contenido.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: opciones.subtitulo.trim(),
            bold: true,
            font: FUENTE,
            size: TAMANO_CUERPO,
          }),
        ],
      }),
    );
  }

  contenido.push(parrafoNota("Finalidad exclusivamente docente"));
  contenido.push(...construirBloqueInicial(datos));

  return contenido;
}

function construirFundamentos(
  fundamentos: ExportarDocxRequest["exposicion"]["fundamentosNormativos"],
): Paragraph[] {
  if (fundamentos.length === 0) {
    return [];
  }

  const parrafos = [parrafoTituloSeccion("Fundamentos normativos aplicables")];

  for (const fundamento of fundamentos) {
    parrafos.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 160, line: 276 },
        indent: { left: 340, hanging: 340 },
        children: [
          new TextRun({
            text: fundamento.norma,
            bold: true,
            font: FUENTE,
            size: TAMANO_CUERPO,
          }),
          new TextRun({
            text: ` — ${fundamento.porQueAplica}`,
            font: FUENTE,
            size: TAMANO_CUERPO,
          }),
        ],
      }),
    );
  }

  return parrafos;
}

/** El documento solo lista marcadores que siguen presentes tras la edición. */
function datosPendientesDelTexto(
  exposicion: ExportarDocxRequest["exposicion"],
): ExportarDocxRequest["exposicion"]["datosPendientes"] {
  const marcadores = [
    ...new Set(
      exposicion.parrafos.flatMap((parrafo) =>
        extraerMarcadoresDatoPendiente(parrafo.texto),
      ),
    ),
  ];

  return marcadores.map((marcador) => ({
    marcador,
    motivo: exposicion.datosPendientes.find(
      (dato) => dato.marcador === marcador,
    )?.motivo,
  }));
}

function construirDatosPendientes(
  datosPendientes: ExportarDocxRequest["exposicion"]["datosPendientes"],
): Paragraph[] {  if (datosPendientes.length === 0) {
    return [];
  }

  const parrafos = [parrafoTituloSeccion("Datos pendientes de concretar")];

  for (const dato of datosPendientes) {
    parrafos.push(
      parrafoCuerpo(
        dato.motivo
          ? `${dato.marcador} — ${dato.motivo}`
          : dato.marcador,
        true,
      ),
    );
  }

  return parrafos;
}

function construirContenido(
  datos: DatosCaso,
  opciones: OpcionesExposicion,
  parrafos: ParrafoExposicion[],
  fundamentos: ExportarDocxRequest["exposicion"]["fundamentosNormativos"],
  datosPendientes: ExportarDocxRequest["exposicion"]["datosPendientes"],
): Array<Paragraph | Table> {
  const contenido: Array<Paragraph | Table> = [];

  if (opciones.incluirCabecera) {
    contenido.push(...construirCabecera(datos, opciones));
  }

  contenido.push(
    new Paragraph({
      spacing: { before: 100, after: 200 },
      children: [
        new TextRun({
          text: `- ${opciones.encabezadoManifiesta}:`,
          bold: true,
          font: FUENTE,
          size: TAMANO_CUERPO,
        }),
      ],
    }),
  );

  contenido.push(...parrafos.map((parrafo) => parrafoQue(parrafo.texto)));

  contenido.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      children: [
        new TextRun({
          text: "CONSTE Y CERTIFICO.",
          bold: true,
          font: FUENTE,
          size: TAMANO_CUERPO,
        }),
      ],
    }),
    ...construirFundamentos(fundamentos),
    ...construirDatosPendientes(datosPendientes),
    parrafoNota(
      "— Documento elaborado con finalidad exclusivamente docente / formativa —",
    ),
  );

  return contenido;
}

export async function construirDocx(
  input: ExportarDocxRequest,
): Promise<Buffer> {
  const { datos, opciones, exposicion } = input;

  const documento = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1134, bottom: 1134, left: 1417, right: 1417 },
          },
        },
        children: construirContenido(
          datos,
          opciones,
          exposicion.parrafos,
          exposicion.fundamentosNormativos,
          datosPendientesDelTexto(exposicion),
        ),
      },
    ],
  });

  return Packer.toBuffer(documento);
}
