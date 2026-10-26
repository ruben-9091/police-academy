# Exposiciones de Hechos

Aplicación docente para transformar el relato en bruto de una intervención policial en una **Exposición de Hechos** formal, cronológica y editable, lista para descargar en Word.

> Finalidad exclusivamente docente. No sustituye documentación oficial real. No introduzcas datos personales reales: usa casos anonimizados.

La especificación funcional completa está en [proyecto-exposiciones-policiales.md](./proyecto-exposiciones-policiales.md).

## Estructura

```text
client/   Vite + React
server/   API Express
shared/   tipos, esquemas y constantes compartidas
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
```

Sin clave, el proveedor `mock` permite desarrollar sin llamadas externas.

## Comandos

```bash
npm run dev          # cliente + API
npm run dev:client   # solo Vite
npm run dev:server   # solo Express
npm run build        # typecheck + build del cliente
npm run lint         # ESLint de todo el repo
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

- Límite por función síncrona: 60 s.
- Petición buffered: 6 MB (unos 4,5 MB binarios).
- Plan Free: 300 créditos al mes; cada deploy de producción consume 15.

El sitio aún no está enlazado ni desplegado. Cuando lo esté, el despliegue será `netlify deploy --build --prod` desde la raíz.

## Estado

El cliente sigue siendo el starter de Vite. La interfaz real, la generación con IA y la exportación `.docx` se implementan en las siguientes fases. Consulta [AGENTS.md](./AGENTS.md) para las reglas de trabajo del repositorio.
