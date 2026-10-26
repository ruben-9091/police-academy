# AGENTS.md

## Layout

- `police/` is the actual app: Vite + React 19, JavaScript/JSX. Run all npm commands from this directory.
- Root `package.json` is a stale placeholder (CommonJS, no dependencies, `npm test` always fails). Do not use it or move app config there.
- `proyecto-exposiciones-policiales.md` is the product and domain spec. It is the source of truth for behavior, AI prompts, and `.docx` output.
- `police/README.md` is the default Vite template readme; ignore it.
- The app is still the Vite starter (`src/App.jsx` is the counter demo). The backend, AI pipeline, and `.docx` export described in the spec do not exist yet; don't assume `server/` or API endpoints.

## Confirmed project direction

- Migrate to TypeScript and npm workspaces: `client/` (Vite + React), `server/` (Express), `shared/` (types and zod schemas). `police/` becomes `client/`.
- Deploy the static client and the Express API on Netlify: Express runs through `serverless-http` as a Netlify Function.
- Use Gemini as the real AI provider and a deterministic mock provider for development and tests.
- Netlify Free limits matter: 60 s per synchronous function, 6 MB request (about 4.5 MB binary), 300 credits/month, and no built-in password protection. Protect the site with a Basic Auth Edge Function and iterate locally with `netlify dev`.

## Commands (from `police/` until the Phase 1 restructure)

- `npm run dev` — dev server
- `npm run build` — production build (outputs `dist/`)
- `npm run lint` — ESLint flat config, `**/*.{js,jsx}`, ignores `dist/`
- `npm run preview` — preview built output
- No test runner, typecheck, formatter, or CI is configured. Verify changes with `npm run lint && npm run build`.

## Toolchain notes

- Phase 1 migrates the scaffold to TypeScript; until then the client code is JSX. Do not add new JSX-only code that will need rewriting.
- React Compiler is enabled through `@rolldown/plugin-babel` + `reactCompilerPreset()` in `vite.config.js`. Keep that setup; do not add a separate Babel config or switch to the SWC plugin.
- CSS uses native nesting with no PostCSS/Tailwind config.
- Dependencies are installed under `police/node_modules` (Node 24 / npm 12) until the workspace migration.

## Domain rules (non-negotiable)

- The app generates formal Spanish "Exposiciones de Hechos" for Policía Local de Alicante, strictly for training.
- Never invent facts. For a missing essential datum emit the literal marker `[DATO QUE CONVENDRÍA CONCRETAR: ...]`; omit it if not essential. Never fill a gap to make an intervention look legally correct.
- Describe observable conduct before any legal label. Do not use "actitud agresiva", "resistencia activa", etc. without the supporting physical behavior.
- No official crests or logos. Any institutional header is text only, disabled by default; the document begins at `- MANIFIESTA:`.
- AI calls and keys stay server-side (`GEMINI_API_KEY` in Netlify env or `.env.local`); never call the model from the browser and never use a `VITE_` prefix for secrets.
- The Gemini free tier may use submitted data for product improvement. Keep the visible anonymization warning and never log narrative content.
- When implementing generation/export, follow spec sections 8 (master prompt), 9 (style example), 10 (docx layout), and 11–12 (target architecture). Cite only legal articles that add real value.
- UI copy and generated content are Spanish. Use the spec's Spanish domain names (`relatoBruto`, `datosPendientes`, `alertasRevision`, etc.).
