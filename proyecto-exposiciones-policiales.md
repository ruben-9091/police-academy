# Proyecto: App de Exposiciones de Hechos Policiales

> **Finalidad exclusivamente docente / formativa.** La app no sustituye documentación oficial real.
> Basada en el *Prompt Maestro* de la Policía Local de Alicante y en la skill `/policia`.

---

## 0. Cómo usar este documento con OpenCode

Pasa este archivo entero a OpenCode con una instrucción como:

```
Lee PROYECTO.md completo. Antes de escribir código:
1. Resume en 10 líneas lo que entendiste.
2. Propón la arquitectura y la estructura de carpetas (sección 11 y 12 son una propuesta, puedes mejorarla).
3. Lista las dudas abiertas (sección 15).
Cuando yo confirme, crea el esqueleto del proyecto y empieza por el MVP (sección 5).
```

---

## 1. Qué es la app

Una aplicación web en la que el usuario introduce el relato en bruto de una intervención policial (texto pegado, o foto/PDF de una comparecencia o atestado) y recibe una **Exposición de Hechos** formal, cronológica, objetiva y técnicamente rigurosa, lista para editar y descargar en **Word (.docx)**.

El objetivo no es solo narrar, sino que un tercero que no estuvo presente (instructor, Policía Judicial, Fiscalía, defensa o autoridad judicial) pueda reconstruir:

> qué observaron los agentes → por qué intervinieron → qué órdenes impartieron → cómo reaccionó cada persona → qué medidas adoptaron → por qué fueron necesarias → cómo se ejecutaron → cuándo cesaron → qué garantías se ofrecieron → cómo terminó la actuación.

La exposición sirve como modelo de: exposición de hechos, comparecencia policial, minuta, parte de intervención, base narrativa de un atestado, ejercicio práctico de Policía Judicial y análisis posterior de la legalidad de una intervención.

---

## 2. Reglas de oro (resumen)

1. **Describir primero, calificar después.** Nunca sustituir una conducta observable por un concepto jurídico.
2. **Prohibido inventar** cualquier dato no proporcionado. Si falta algo imprescindible: `[DATO QUE CONVENDRÍA CONCRETAR: ...]`. Si no es imprescindible: se omite.
3. **Nunca completar una laguna** para que la intervención parezca jurídicamente correcta.
4. **Cronología completa** y reconstruible sin saltos.
5. **Normativa solo si aporta utilidad real** al caso concreto, no por sistema.
6. **Tercera persona, tono técnico-administrativo**, verbos de acción concretos, sin adjetivos valorativos innecesarios.
7. **Sin escudos ni logotipos oficiales**: la cabecera institucional, si se usa, va solo en texto.

---

## 3. Decisión de formato: cómo empieza la exposición

La exposición **empieza como el texto de referencia de la sección 9**, es decir, directamente con:

```
- MANIFIESTA:

- Que los agentes actuantes, con NIP {nip1} y {nip2}, componentes del indicativo {indicativo} de la Policía Local de Alicante, encontrándose de servicio debidamente uniformados, hacen constar que, siendo aproximadamente las {hora} horas del día {fecha o "de hoy"}, mientras {contexto de la actuación}, ...
```

Pautas de estilo que se deducen del ejemplo:

- Cada párrafo empieza por `- Que ...` (guion en negrita, resto en texto normal).
- **Párrafo 1**: identificación de los agentes (NIP, indicativo, servicio uniformados), hora aproximada, dispositivo o contexto, lugar, finalidad y qué observaron los agentes al inicio.
- **Párrafo 2** (`Que en ese contexto, ...`): qué conducta observable de la persona motivó la intervención y cómo se identificaron los agentes (el alto policial).
- **Párrafo 3** (`Que el individuo, ...`): reacción de la persona, requerimientos realizados, respuesta, medida adoptada, uso de la fuerza si lo hubo (con el detalle de cómo y que no hubo lesiones, **solo si el usuario lo ha dicho**).
- Párrafos siguientes: continuar la cronología hasta el desenlace, garantías (derechos, asistencia) y cese de la medida.
- Citas textuales entre comillas dobles, renderizadas en **cursiva**.

**Cabecera institucional opcional** (cabecera textual + tabla gris Atestado/Dependencia + título "EXPOSICIÓN DE HECHOS" + bloque COMPARECEN/PRESENTAN/HACEN ENTREGA): disponible como opción activable en la interfaz, **desactivada por defecto**, para que el documento comience por `- MANIFIESTA:`. Si se activa, se usa el formato validado de la sección 10.

> Nota sobre el encabezado: en el original transcrito aparece `MANIIESTA` (errata). La app usa `MANIFIESTA:` (singular, como en el ejemplo). El formato validado anterior usaba `MANIFIESTAN:`; dejarlo configurable (ver sección 15).

---

## 4. Usuarios y flujo

Usuario principal: una sola persona (instructor o alumno) que redacta ejercicios docentes. No hay roles en el MVP.

Flujo:

1. **Nuevo caso** → pega el relato en bruto, o sube foto/PDF.
2. Si es imagen/PDF → la app **transcribe** el texto y se lo muestra para corregirlo.
3. Rellena (opcional) los datos del caso: atestado, EUROCOP, dependencia, lugar, fecha y hora, indicativo, NIP de los agentes, persona detenida, objeto entregado.
4. Pulsa **Generar exposición**.
5. Ve la exposición en un **editor** con los marcadores `[DATO QUE CONVENDRÍA CONCRETAR: ...]` resaltados y un panel de **alertas de revisión**.
6. Corrige, rellena los marcadores y **descarga el .docx**.

---

## 5. Funcionalidades

### MVP

- Entrada de texto y subida de imagen/PDF con transcripción.
- Formulario de datos del caso (todos opcionales).
- Generación de la exposición con IA siguiendo el Prompt Maestro (sección 8).
- Editor de la exposición por párrafos (editar, borrar, reordenar, añadir).
- Marcadores `[DATO QUE CONVENDRÍA CONCRETAR: ...]` resaltados y rellenables.
- Panel de alertas de revisión (sección 7.4).
- Fundamentos normativos aplicables (solo los útiles) y apartado "Datos pendientes de concretar" si hay marcadores.
- Exportar a **.docx** con el formato de la sección 10.
- Aviso visible de finalidad docente.

### Versión 2

- Historial de casos guardados.
- Ajustes: indicativo, dependencia y NIP por defecto.
- Modo "Analizar relato" que muestre solo el análisis previo (estructura, catalogación, lagunas, calificaciones sin conducta).
- Comparar el relato original con la exposición generada (diff).
- Exportar también a PDF.
- Biblioteca de ejemplos de "evitar / preferir" ampliable por el usuario.

---

## 6. Modelo de datos

```ts
type Caso = {
  id: string;
  creadoEn: string;
  relatoBruto: string;                // texto pegado o transcrito
  adjuntos: { nombre: string; tipo: "imagen" | "pdf" }[];
  datos: {
    atestado?: string;
    eurocop?: string;
    dependencia?: string;
    lugarFecha?: string;
    indicativo?: string;
    agentes?: { nip: string }[];
    personaPresentada?: string;
    entrega?: string;
  };
  opciones: {
    incluirCabecera: boolean;         // por defecto false
    encabezadoManifiesta: "MANIFIESTA" | "MANIFIESTAN"; // por defecto MANIFIESTA
    subtitulo: string;                // por defecto "(Comparecencia de detención)", adaptable
  };
  exposicion?: Exposicion;
};

type Exposicion = {
  parrafos: { id: string; texto: string }[];           // cada uno empieza por "Que ..."
  datosPendientes: { marcador: string; motivo?: string }[];
  fundamentosNormativos: { norma: string; porQueAplica: string }[];
  alertasRevision: {
    tipo: "calificacion_sin_conducta" | "dato_inventado" | "laguna_cronologica" | "articulo_relleno" | "formato";
    fragmento: string;
    sugerencia: string;
  }[];
};
```

---

## 7. Pipeline de IA

La generación se hace en pasos separados, todos en el backend (la API key nunca llega al navegador).

### 7.1 Transcripción (solo si hay imagen o PDF)

Modelo con visión. Devuelve el texto literal, sin corregir ni resumir. Si algo no se lee: `[ilegible]`. El usuario puede editar la transcripción antes de continuar.

### 7.2 Análisis previo

Sobre el relato, identificar:

- **Estructura**: orden en que cuenta los hechos (cronológico, por bloques o mezclado).
- **Catalogación de hechos**: observación inicial, motivo de la intervención, órdenes, reacción, medidas, resultado.
- **Lagunas**: horas, distancias, cacheos, lectura de derechos, testigos, etc.
- **Calificaciones sin describir**: "actitud agresiva", "resistencia activa", "desobedeció gravemente".

Este análisis guía la redacción. Solo se muestra al usuario si pulsa "Analizar relato" (v2).

### 7.3 Redacción

Con el Prompt Maestro como *system prompt* (sección 8) y el ejemplo de apertura (sección 9) como referencia de estilo. Salida **en JSON** con la forma de `Exposicion` (sección 6), sin texto fuera del JSON.

### 7.4 Autorrevisión

Segunda llamada que revisa el borrador con estas preguntas y rellena `alertasRevision`:

- ¿Hay alguna calificación jurídica o valorativa sin la conducta observable que la sustente?
- ¿Hay algún dato que el usuario no proporcionó? → eliminarlo o marcarlo.
- ¿La cronología es reconstruible de principio a fin, sin saltos ni ambigüedades?
- ¿Los artículos citados aportan utilidad real o son relleno?
- ¿El motivo de la intervención se apoya en conductas observables descritas? (por ejemplo, si el relato menciona rasgos físicos de la persona, comprobar que el motivo de la intervención descansa en la conducta y no solo en esos rasgos).
- ¿El documento sigue el formato (sección 3 y 10)?

---

## 8. Prompt Maestro (system prompt de la IA)

### 8.1 Texto original (no modificar)

> El original que se facilitó termina de forma incompleta: el Artículo 5 de la LO 2/1986 está cortado ("Artículo 5: pr") y la sección final "Relato policial / Con fines didácticos" está vacía. Ver sección 15.

```
PROMPT MAESTRO

REDACCIÓN DE EXPOSICIONES DE HECHOS, COMPARECENCIAS Y RELATOS POLICIALES

Policía Local de Alicante · Finalidad exclusivamente docente

I. FUNCIÓN Y OBJETIVO

Actúa como especialista en Derecho penal, Derecho procesal penal, seguridad ciudadana, Policía Judicial y operativa policial española, con especial atención a las actuaciones desarrolladas por la Policía Local.

A partir exclusivamente de los hechos que se faciliten, redacta una EXPOSICIÓN DE HECHOS POLICIALES completa, cronológica, objetiva, técnicamente rigurosa y jurídicamente coherente, concebida como material docente para formación policial.

El documento debe poder servir como modelo de:

- exposición de hechos;
- comparecencia policial;
- minuta;
- parte de intervención;
- base narrativa de un atestado;
- ejercicio práctico de Policía Judicial;
- análisis posterior de la legalidad de una intervención.

El objetivo no es únicamente narrar qué ocurrió, sino conseguir que un tercero que no estuvo presente —instructor, Policía Judicial, Ministerio Fiscal, defensa o autoridad judicial— pueda reconstruir:

qué observaron los agentes → por qué intervinieron → qué órdenes impartieron → cómo reaccionó cada persona → qué medidas adoptaron → por qué fueron necesarias → cómo se ejecutaron → cuándo cesaron → qué garantías se ofrecieron → y cómo terminó la actuación.

II. PRINCIPIO FUNDAMENTAL: LOS HECHOS ANTES QUE LAS CALIFICACIONES

La regla esencial de toda exposición será:

«DESCRIBIR PRIMERO Y CALIFICAR DESPUÉS.»

No sustituir conductas observables por conceptos jurídicos.

EVITAR:
"Mostró una actitud agresiva."
PREFERIR:
"Se aproximó rápidamente al agente con los puños cerrados, elevando el brazo derecho y lanzándole un golpe..."

EVITAR:
"Se resistió activamente."
PREFERIR:
"Contrajo ambos brazos contra el pecho, trató de zafarse de la sujeción y realizó movimientos de tracción en sentido contrario a los agentes..."

EVITAR:
"Desobedeció gravemente."
PREFERIR:
"Pese a ser requerido en tres ocasiones para que permaneciera en el lugar, continuó alejándose y posteriormente emprendió la huida..."

La autoridad judicial debe poder obtener la eventual calificación jurídica a partir de los hechos descritos, y no tener que aceptar una etiqueta policial carente de descripción.

III. PROHIBICIÓN ABSOLUTA DE INVENTAR

Nunca inventes:

- órdenes policiales;
- manifestaciones;
- insultos;
- amenazas;
- golpes;
- resistencia;
- lesiones;
- armas;
- efectos;
- síntomas;
- testigos;
- antecedentes;
- reconocimientos médicos;
- lectura de derechos;
- engrilletamiento;
- cacheos;
- resultados de registros;
- horarios;
- distancias;
- contenido de mochilas;
- daños;
- comunicaciones por emisora;
- ni ninguna otra circunstancia no proporcionada.

Cuando falte un elemento relevante:

[DATO QUE CONVENDRÍA CONCRETAR: ...]

o déjalo fuera si no es imprescindible.

Nunca completar una laguna fáctica para conseguir que una intervención parezca jurídicamente correcta.

IV. MARCO NORMATIVO GENERAL

Antes de redactar, analiza qué normas son aplicables al supuesto.

No es necesario insertar todos los artículos en cada exposición. Citar únicamente aquellos que aporten verdadera utilidad.

1. CONSTITUCIÓN ESPAÑOLA

Tener particularmente presentes:

Artículo 10 CE
- dignidad de la persona;
- derechos inviolables.

Artículo 15 CE
- derecho a la vida e integridad física y moral.

Artículo 17 CE
- derecho a la libertad y seguridad;
- garantías de la detención;
- duración estrictamente necesaria;
- información de derechos y razones de la detención.

Artículo 18 CE
- intimidad;
- inviolabilidad domiciliaria;
- secreto de comunicaciones.

Artículo 24 CE
- tutela judicial efectiva;
- derecho de defensa;
- garantías procesales;
- presunción de inocencia.

Artículo 104 CE
- misión constitucional de las Fuerzas y Cuerpos de Seguridad.

V. LEY ORGÁNICA 2/1986, DE FUERZAS Y CUERPOS DE SEGURIDAD

Artículo 5: pr

[TEXTO INCOMPLETO EN EL ORIGINAL]

Relato policial
Con fines didácticos
[SECCIÓN SIN CONTENIDO EN EL ORIGINAL]
```

### 8.2 Añadidos del proyecto (se anexan al system prompt)

```
REGLAS ADICIONALES DE LA APLICACIÓN

1. Apertura. La exposición comienza directamente por "- MANIFIESTA:" y continúa con párrafos que empiezan por "- Que ...". El primer párrafo identifica a los agentes (NIP, indicativo, de servicio y debidamente uniformados), la hora aproximada, el dispositivo o contexto, el lugar, la finalidad y lo que observaron los agentes. Sigue el estilo del ejemplo de referencia, pero usa únicamente los datos del caso actual.

2. Los datos del ejemplo de referencia (NIP, lugar, hora, descripción de personas, objetos) NO se reutilizan. Son solo un modelo de estilo.

3. Citas textuales entre comillas dobles.

4. Si el relato original contiene calificaciones sin conducta descrita (p. ej. "actitud agresiva", "resistencia pasiva", "desobediencia"), descríbelas con la conducta observable que el relato aporte. Si el relato no aporta esa conducta, NO la inventes: marca [DATO QUE CONVENDRÍA CONCRETAR: ...].

5. Si el relato menciona rasgos físicos o étnicos de una persona, incluirlos solo como dato descriptivo e identificativo. El motivo de la intervención debe sostenerse en la conducta observable que el relato describa; si no la describe, señálalo en las alertas de revisión.

6. Devuelve ÚNICAMENTE un JSON válido con la forma:
{
  "parrafos": [{ "id": "p1", "texto": "Que ..." }],
  "datosPendientes": [{ "marcador": "[DATO QUE CONVENDRÍA CONCRETAR: ...]", "motivo": "..." }],
  "fundamentosNormativos": [{ "norma": "Art. 17 CE", "porQueAplica": "..." }],
  "alertasRevision": [{ "tipo": "...", "fragmento": "...", "sugerencia": "..." }]
}
Sin texto antes ni después, sin bloques de código.
```

---

## 9. Apertura de referencia (ejemplo de estilo)

Texto transcrito de un ejemplo real aportado por el usuario. Sirve como **modelo de estilo y estructura de apertura**, no como contenido a reutilizar. (Se corrige la errata `MANIIESTA`.)

```
- MANIFIESTA:

- Que los agentes actuantes, con NIP G428 y G617, componentes del indicativo PLAYAS POSTIGUET de la Policía Local de Alicante, encontrándose de servicio debidamente uniformados, hacen constar que, siendo aproximadamente las 16:10 horas del día de hoy, mientras participaban en un dispositivo operativo específico contra la venta ambulante no autorizada, establecido en las inmediaciones del acceso n.º 2 del Paseo de Gómiz, Playa del Postiguet, con la finalidad de prevenir dicha actividad ilícita y garantizar la seguridad ciudadana, observaron cómo varios vendedores ambulantes emprendían la huida al detectar la presencia policial, abandonando precipitadamente la zona, conducta habitual en este tipo de dispositivos.

- Que en ese contexto, los agentes observaron a un varón de fenotipo subsahariano que portaba una mochila y vestía una camiseta con los colores y diseño de la selección española de fútbol, aparentemente destinada a la venta ambulante por sus características externas. Al no percatarse de la proximidad de la dotación policial, el citado individuo, que inicialmente no había advertido la presencia de los agentes, mostró una actitud visiblemente nerviosa, cambiando bruscamente el sentido de la marcha y efectuando maniobras evasivas, dirigiendo reiteradas miradas hacia los agentes, comportamiento que motivó que éstos procedieran a darle el alto policial, identificándose como agentes de la autoridad mediante su uniforme reglamentario.

- Que el individuo, tras dudar unos instantes, finalmente detuvo su marcha. Requerido acerca de si se dedicaba a la venta ambulante no autorizada, manifestó que no realizaba dicha actividad. Acto seguido, y en el ejercicio de las funciones de prevención y comprobación legalmente atribuidas a los agentes de la autoridad, se le requirió para que exhibiera voluntariamente el contenido de la mochila que portaba. El requerido se negó inicialmente a ello, aferrándose a la misma y ofreciendo una actitud de resistencia pasiva, siendo necesario que el agente actuante procediera a retirársela mediante el empleo de la mínima fuerza imprescindible, necesaria, idónea y proporcionada, sin ocasionarle lesión alguna.
```

Observaciones útiles para el modo "revisión" (v2): el ejemplo contiene expresiones del tipo "actitud visiblemente nerviosa", "resistencia pasiva" o "mínima fuerza imprescindible, necesaria, idónea y proporcionada", que son calificaciones; el Prompt Maestro pide acompañarlas de la conducta física concreta (cómo se aferraba a la mochila, qué hizo el agente para retirársela, etc.). La app debería señalarlo como alerta, no inventar el detalle.

---

## 10. Formato del documento Word (.docx)

Base: plantilla `plantilla_docx.js` de la skill `/policia` (Anexo A), con la librería `docx` de npm.

- Página **A4** (11906 x 16838 DXA), márgenes: superior e inferior 1134, izquierdo y derecho 1417.
- Fuente **Calibri**, cuerpo a 11 pt (size 22), texto **justificado**.
- Párrafos "- Que...": guion en negrita, resto normal, citas entre comillas dobles en cursiva (función `queRun`).

Orden del documento:

1. *(Opcional, desactivada por defecto)* Cabecera institucional **solo en texto**: MINISTERIO DEL INTERIOR / DIRECCIÓN GENERAL DE LA POLICÍA / COMISARÍA PROVINCIAL ALICANTE · INSPECCIÓN CENTRAL DE GUARDIA / "Documento de trabajo docente — Policía Local de Alicante". Nunca escudos ni logotipos.
2. *(Opcional)* Tabla gris con "Atestado nº" (y EUROCOP) y "Dependencia".
3. *(Opcional)* Título centrado "EXPOSICIÓN DE HECHOS", subtítulo "(Comparecencia de detención)" (adaptable si no es una detención) y nota "Finalidad exclusivamente docente".
4. *(Opcional)* Bloque inicial: lugar y fecha, COMPARECEN, PRESENTAN, HACEN ENTREGA.
5. **`- MANIFIESTA:`** seguido de los párrafos `- Que ...`. *(Es donde empieza el documento por defecto.)*
6. Cierre centrado en negrita: **CONSTE Y CERTIFICO.**
7. "Fundamentos normativos aplicables": solo los artículos citados, con una línea de por qué aplican (solo si aporta valor).
8. "Datos pendientes de concretar": solo si hay marcadores.
9. Pie: "— Documento elaborado con finalidad exclusivamente docente / formativa —".

Como la apertura por defecto no lleva cabecera, incluir la nota de finalidad docente en el pie y en la interfaz.

---

## 11. Stack propuesto (modificable)

- **Frontend**: React + Vite + TypeScript. Editor por párrafos, resaltado de marcadores, vista previa.
- **Backend**: Node.js + Express (o Hono) con TypeScript.
- **IA**: API de Anthropic (Claude) desde el backend. Modelo con visión para la transcripción de imágenes y PDF. La API key en variable de entorno (`ANTHROPIC_API_KEY`), nunca en el cliente.
- **Word**: librería `docx` de npm, en el backend, a partir de la plantilla del Anexo A.
- **Persistencia** (v2): SQLite o ficheros JSON locales. En el MVP basta con guardar en memoria o `localStorage` del navegador.
- **Subida de archivos**: `multer` (límite de tamaño y solo imagen/PDF).

---

## 12. Estructura de carpetas sugerida

```
exposiciones-policiales/
├─ PROYECTO.md                  (este documento)
├─ package.json
├─ .env.example                 (ANTHROPIC_API_KEY=)
├─ server/
│  ├─ index.ts
│  ├─ routes/
│  │  ├─ transcribir.ts         (POST /api/transcribir)
│  │  ├─ generar.ts             (POST /api/generar)
│  │  └─ exportar.ts            (POST /api/exportar-docx)
│  ├─ ia/
│  │  ├─ promptMaestro.ts       (texto de la sección 8)
│  │  ├─ ejemploApertura.ts     (texto de la sección 9)
│  │  ├─ analisis.ts
│  │  ├─ redaccion.ts
│  │  └─ revision.ts
│  └─ docx/
│     └─ plantilla.ts           (adaptación del Anexo A)
└─ client/
   ├─ index.html
   └─ src/
      ├─ App.tsx
      ├─ components/
      │  ├─ FormularioCaso.tsx
      │  ├─ SubidaArchivo.tsx
      │  ├─ EditorExposicion.tsx
      │  ├─ MarcadoresPendientes.tsx
      │  ├─ PanelAlertas.tsx
      │  └─ AvisoDocente.tsx
      └─ types.ts               (tipos de la sección 6)
```

---

## 13. Requisitos no funcionales

- **Privacidad**: los relatos pueden contener datos personales. No registrar el contenido en logs, no enviar nada a terceros salvo la llamada a la API de IA, y avisar al usuario de ello. Recomendar usar casos docentes o anonimizados.
- **Seguridad**: la API key solo en el servidor; validar tipo y tamaño de los archivos subidos; limitar la frecuencia de peticiones.
- **Honestidad del sistema**: la app nunca debe "rellenar" huecos. Si el modelo devuelve datos no presentes en el relato, la autorrevisión debe marcarlos.
- **Accesibilidad y uso**: interfaz clara, en español, usable en móvil (el usuario puede subir fotos desde el teléfono).
- **Aviso permanente** de finalidad docente.

---

## 14. Primeras tareas para OpenCode

1. Crear el esqueleto (cliente + servidor) y `.env.example`.
2. Definir los tipos de la sección 6 en `types.ts`.
3. Guardar el Prompt Maestro (8.1 y 8.2) y el ejemplo (sección 9) como constantes en `server/ia/`.
4. Endpoint `POST /api/generar`: recibe `relatoBruto` y `datos`, ejecuta análisis → redacción → autorrevisión y devuelve el JSON de `Exposicion`. Validar el JSON y reintentar una vez si viene mal formado.
5. Pantalla con textarea, formulario de datos y botón "Generar exposición".
6. Editor de la exposición con los marcadores resaltados.
7. Endpoint `POST /api/exportar-docx` con la plantilla del Anexo A (con cabecera opcional) y botón de descarga.
8. Endpoint `POST /api/transcribir` y componente de subida de imagen/PDF.
9. Probar con el ejemplo de la sección 9 como relato de entrada y comprobar que: no se inventa ningún dato, los marcadores aparecen donde faltan datos y el documento empieza por `- MANIFIESTA:`.

---

## 15. Dudas abiertas

- `MANIFIESTA` o `MANIFIESTAN` por defecto (el ejemplo dice singular; el formato validado anterior, plural).
- ¿La cabecera institucional y la tabla se incluyen alguna vez, o siempre se empieza por `- MANIFIESTA:`? (De momento: opcional, desactivada.)
- Texto completo del **Artículo 5 de la LO 2/1986** y sección "Relato policial / Con fines didácticos" del Prompt Maestro, que llegaron incompletos. Completarlos en `promptMaestro.ts` cuando estén disponibles. Mientras tanto, el modelo no debe citar el contenido del Art. 5 de memoria sin que se verifique.
- ¿Más ejemplos de "evitar / preferir" para ampliar el prompt?
- ¿Despliegue local (solo en el PC) o publicado en internet? Condiciona la privacidad y la autenticación.

---

## Anexo A. Plantilla docx-js validada (`plantilla_docx.js`)

Punto de partida para el exportador. Adaptar: cabecera, tabla, título y bloque inicial deben poder omitirse (opción `incluirCabecera`), el encabezado debe ser `MANIFIESTA:`/`MANIFIESTAN:` configurable, y los `queRun(...)` y fundamentos deben generarse a partir del objeto `Exposicion`.

```js
// PLANTILLA VALIDADA para generar la EXPOSICIÓN DE HECHOS en .docx
// Formato aprobado por el usuario: cabecera institucional textual (sin escudos),
// tabla gris con Atestado/Dependencia, título centrado, bloque de comparecencia,
// "MANIFIESTAN:" + párrafos "- Que..." (bold en el guion, cursiva en citas
// textuales entrecomilladas), cierre "CONSTE Y CERTIFICO." y bloque final de
// "Fundamentos normativos aplicables".

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType
} = require("docx");

// ---- Datos del caso (sustituir por los del supuesto concreto) ----
const CASO = {
  atestado: "XXXXX/AA",
  eurocop: "XXXXX/AAAA",
  dependencia: "ALICANTE (INSP. CENTRAL DE GUARDIA)",
  lugarFecha: "En Alicante, siendo las HH:MM horas del día DD/MM/AAAA.",
  comparecen: "COMPARECEN: Los funcionarios de Policía Local de Alicante integrantes del indicativo XXXXX, con carnés profesionales números XXX y XXX.",
  presentan: "PRESENTAN, en calidad de persona detenida, a NOMBRE APELLIDOS, nacido/a en LUGAR el DD/MM/AAAA, [domicilio o sin domicilio conocido].",
  entrega: "HACEN ENTREGA de [objeto/documento entregado].",
  outputFile: "exposicion_hechos.docx",
};

const FONT = "Calibri";

function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 276 },
    indent: opts.indent ? { left: 340, hanging: 340 } : undefined,
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}

function queRun(text) {
  // "- Que ..." paragraphs with literal quotes preserved
  const parts = text.split(/("(?:[^"]|"")*")/g).filter(Boolean);
  const runs = [new TextRun({ text: "- ", bold: true, font: FONT, size: 22 })];
  parts.forEach((p) => {
    if (p.startsWith('"')) {
      runs.push(new TextRun({ text: p, italics: true, font: FONT, size: 22 }));
    } else {
      runs.push(new TextRun({ text: p, font: FONT, size: 22 }));
    }
  });
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 220, line: 300 },
    children: runs,
  });
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1134, bottom: 1134, left: 1417, right: 1417 },
        },
      },
      children: [
        // Cabecera institucional (texto, sin escudos oficiales)
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "MINISTERIO DEL INTERIOR", bold: true, font: FONT, size: 20 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "DIRECCIÓN GENERAL DE LA POLICÍA", font: FONT, size: 18 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          children: [
            new TextRun({ text: "COMISARÍA PROVINCIAL ALICANTE · INSPECCIÓN CENTRAL DE GUARDIA", font: FONT, size: 18 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 4 } },
          children: [
            new TextRun({ text: "Documento de trabajo docente — Policía Local de Alicante", italics: true, font: FONT, size: 16, color: "666666" }),
          ],
        }),

        // Tabla de referencia (Atestado / Dependencia)
        new Table({
          width: { size: 9638, type: WidthType.DXA },
          columnWidths: [9638],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 9638, type: WidthType.DXA },
                  shading: { type: ShadingType.CLEAR, fill: "F2F2F2" },
                  margins: { top: 100, bottom: 100, left: 150, right: 150 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Atestado nº: ", bold: true, font: FONT, size: 20 }),
                        new TextRun({ text: `${CASO.atestado}   (EUROCOP: ${CASO.eurocop})`, font: FONT, size: 20 }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Dependencia: ", bold: true, font: FONT, size: 20 }),
                        new TextRun({ text: CASO.dependencia, font: FONT, size: 20 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 300, after: 100 }, children: [new TextRun({ text: "", font: FONT })] }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "EXPOSICIÓN DE HECHOS", bold: true, font: FONT, size: 26 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "(Comparecencia de detención)", bold: true, font: FONT, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "Finalidad exclusivamente docente", italics: true, font: FONT, size: 18, color: "666666" }),
          ],
        }),

        // Bloque inicial (sustituir por los datos reales del caso)
        bodyPara(CASO.lugarFecha),
        bodyPara(CASO.comparecen),
        bodyPara(CASO.presentan),
        bodyPara(CASO.entrega),

        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "MANIFIESTAN:", bold: true, font: FONT, size: 22 })],
        }),

        // ---- Cuerpo de hechos ("- Que...") ----
        // Un queRun(...) por cada párrafo cronológico del caso:
        // observación inicial → motivo de la intervención → órdenes/requerimientos →
        // reacción de cada persona → medidas adoptadas → justificación → ejecución →
        // cese → garantías (derechos) → desenlace.
        // Nunca inventar datos: usar "[DATO QUE CONVENDRÍA CONCRETAR: ...]" si falta algo
        // imprescindible, u omitirlo si no lo es.

        queRun("Que [ejemplo: los agentes actuantes, con NIP ..., hacen constar que, siendo aproximadamente las ... horas, ...]."),

        // ... añadir aquí tantos queRun(...) como bloques de hechos tenga el caso ...

        queRun("Que así conste, se extiende la presente exposición de hechos a los oportunos efectos legales."),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 400 },
          children: [new TextRun({ text: "CONSTE Y CERTIFICO.", bold: true, font: FONT, size: 22 })],
        }),

        // Fundamentos normativos
        new Paragraph({
          spacing: { before: 200, after: 160 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 6 } },
          children: [new TextRun({ text: "Fundamentos normativos aplicables", bold: true, font: FONT, size: 22 })],
        }),
        // Citar SOLO los artículos que aporten utilidad real a este caso concreto.
        bodyPara("[Artículo X — norma y por qué aplica a este supuesto concreto]", { indent: true }),

        new Paragraph({
          spacing: { before: 400 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "— Documento elaborado con finalidad exclusivamente docente / formativa —", italics: true, font: FONT, size: 16, color: "666666" }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync(CASO.outputFile, buf);
  console.log("OK");
});
```
