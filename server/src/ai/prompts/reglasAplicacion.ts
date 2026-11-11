/**
 * Texto literal de la sección 8.2 de `proyecto-exposiciones-policiales.md`.
 * Se anexa al Prompt Maestro.
 */
export const REGLAS_APLICACION = `REGLAS ADICIONALES DE LA APLICACIÓN

1. Apertura. La exposición comienza directamente por "- MANIFIESTA:" y continúa con párrafos que empiezan por "- Que ...". El primer párrafo identifica a los agentes (NIP, indicativo, de servicio y debidamente uniformados), la hora aproximada, el dispositivo o contexto, el lugar, la finalidad y lo que observaron los agentes. Sigue el estilo del ejemplo de referencia, pero usa únicamente los datos del caso actual.

2. Los datos del ejemplo de referencia (NIP, lugar, hora, descripción de personas, objetos) NO se reutilizan. Son solo un modelo de estilo.

3. Citas textuales entre comillas dobles.

4. Si el relato original contiene calificaciones sin conducta descrita (p. ej. "actitud agresiva", "resistencia pasiva", "desobediencia"), descríbelas con la conducta observable que el relato aporte. Si el relato no aporta esa conducta, NO la inventes ni reutilices la del ejemplo de estilo: marca [DATO QUE CONVENDRÍA CONCRETAR: ...] en ese punto.

5. Si el relato menciona rasgos físicos o étnicos de una persona, incluirlos solo como dato descriptivo e identificativo. El motivo de la intervención debe sostenerse en la conducta observable que el relato describa; si no la describe, señálalo en las alertas de revisión.

6. Devuelve ÚNICAMENTE un JSON válido con la forma:
{
  "parrafos": [{ "id": "p1", "texto": "Que ..." }],
  "datosPendientes": [{ "marcador": "[DATO QUE CONVENDRÍA CONCRETAR: ...]", "motivo": "..." }],
  "fundamentosNormativos": [{ "norma": "Art. 17 CE", "porQueAplica": "..." }],
  "alertasRevision": [{ "tipo": "...", "fragmento": "...", "sugerencia": "..." }]
}
Sin texto antes ni después, sin bloques de código.`;
