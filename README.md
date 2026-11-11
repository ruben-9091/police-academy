# Exposiciones de Hechos

Aplicación docente para transformar el relato en bruto de una intervención policial en una **Exposición de Hechos** formal, cronológica y editable, lista para descargar en Word.

> Finalidad exclusivamente docente. No sustituye documentación oficial real. No introduzcas datos personales reales: usa casos anonimizados.

La especificación funcional completa está en [proyecto-exposiciones-policiales.md](./proyecto-exposiciones-policiales.md).

## Estructura

```text
client/   Vite + React
server/   API Express
shared/   tipos, esquemas Zod y constantes compartidas
netlify/  Functions y Edge Functions
```

## Requisitos

- Node.js 24 o superior
- npm 12 o superior

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
npm run dev
```

En PowerShell:

```powershell
Copy-Item .env.example .env.local
```

El cliente queda en `http://localhost:5173` y la API en `http://localhost:3001`. Vite redirige `/api` al servidor local.

Rellena `.env.local` cuando vayas a usar Gemini:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL_TEXT=gemini-3.5-flash-lite
GEMINI_MODEL_VISION=gemini-3.5-flash-lite
```

Los modelos `flash` completos pueden responder `503` con la cuota gratuita. El servidor reintenta brevemente ese error; si persiste, cambia de modelo o espera unos minutos.

La clave se queda en el servidor: nunca uses el prefijo `VITE_`. Sin clave, el proveedor `mock` permite desarrollar y ejecutar los tests sin llamadas externas.

## Comandos

```bash
npm run dev          # cliente + API
npm run dev:client   # solo Vite
npm run dev:server   # solo Express
npm run build        # typecheck + build del cliente
npm run lint         # ESLint de todo el repo
npm test             # tests de Vitest (shared, server y client)
npm run typecheck    # TypeScript de todos los workspaces y Netlify
npm run netlify:dev  # Functions + Edge Functions en :8888
```

## Netlify

El cliente se publica como sitio estático y Express se ejecuta como Netlify Function. `/api/*` se redirige a la Function y una Edge Function de Basic Auth protege todas las rutas.

Para probar el entorno real sin gastar créditos, instala la CLI y levanta el proxy local:

```bash
npm install -g netlify-cli
npm run netlify:dev
```

El sitio queda en `http://localhost:8888` y Vite por detrás en `:5180`. Rellena `APP_USER` y `APP_PASSWORD` en `.env.local`; si faltan, la Edge Function responde `503` y no deja pasar ninguna petición. Usa una contraseña larga y distinta de las credenciales de Netlify.

`netlify dev` inyecta su propia `GEMINI_API_KEY` (la del AI Gateway de Netlify) dentro de la Function, así que en ese entorno `AI_PROVIDER=gemini` falla con un `503` de credenciales: el token del Gateway solo vale contra su URL base, que la app no usa. Para probar el recorrido completo de la Function (Basic Auth, `multipart`, errores) usa `AI_PROVIDER=mock` en `.env.local`; para llamar a Gemini de verdad, `npm run dev` contra la API de `:3001`. En un despliegue real, una `GEMINI_API_KEY` propia definida en la UI de Netlify tiene prioridad sobre la del Gateway.

- Límite por función síncrona: 60 s.
- Petición buffered: 6 MB (unos 4,5 MB binarios).
- Plan Free: 300 créditos al mes; cada deploy de producción consume 15.

El sitio aún no está enlazado ni desplegado. Cuando lo esté, el despliegue será `netlify deploy --build --prod` desde la raíz.

## Estado

La interfaz de trabajo está operativa: relato en bruto, subida de imagen o PDF con transcripción, datos del caso, opciones, editor por párrafos con marcadores, alertas de revisión, datos pendientes, descarte de fundamentos y descarga en `.docx`.

`POST /api/generar` usa el proveedor real de Gemini (`AI_PROVIDER=gemini`) o el determinista `mock` (`AI_PROVIDER=mock`). La generación real hace dos llamadas —redacción y autorrevisión— con salida JSON estructurada, `store: false` y un presupuesto interno de 48 s (configurable con `GEMINI_PRESUPUESTO_MS`) para respetar el límite de 60 s de las Netlify Functions. Si la autorrevisión falla o no queda tiempo, se conserva el borrador con la alerta `revision_incompleta`.

`POST /api/transcribir` recibe un archivo `multipart/form-data` en el campo `archivo`, valida el tipo y el tamaño (máximo 4 MB) y devuelve el texto literal. La llamada usa `store: false`, `GEMINI_MODEL_VISION` (por defecto `gemini-3.5-flash-lite`) y un presupuesto de 35 s (`GEMINI_PRESUPUESTO_TRANSCRIPCION_MS`). Lo que no se lee se marca como `[ilegible]`; si no hay texto legible, el endpoint responde `422`.

Las rutas de IA tienen límite de frecuencia en memoria por IP: 10 generaciones, 10 transcripciones y 30 exportaciones cada 10 minutos (`LIMITE_GENERAR`, `LIMITE_TRANSCRIBIR`, `LIMITE_EXPORTAR`).

La cabecera indica el proveedor activo: «Modo demostración» para `mock` o «IA: Gemini» para el proveedor real. La descarga usa `POST /api/exportar-docx`.

El despliegue en Netlify y la autenticación real siguen pendientes. Consulta [AGENTS.md](./AGENTS.md) para las reglas de trabajo del repositorio.
