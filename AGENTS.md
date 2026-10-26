# AGENTS.md

## Layout

- `client/` — Vite + React 19 + TypeScript.
- `server/` — Express API. `src/app.ts` exports the app; `src/index.ts` starts it locally with `tsx`.
- `shared/` — types, schemas and constants imported as `@policia/shared`.
- `netlify/` — Netlify Functions and Edge Functions (wired in the deployment commit).
- `proyecto-exposiciones-policiales.md` is the product and domain spec. It is the source of truth for behavior, AI prompts, and `.docx` output.
- The client is still the Vite starter and the API only exposes `/api/health`. The AI pipeline and `.docx` export do not exist yet.

## Commands (from the repo root)

- `npm install` — installs every workspace. Do not run installs inside the individual packages.
- `npm run dev` — client on `:5173` plus API on `:3001`; Vite proxies `/api` to the API.
- `npm run dev:client` / `npm run dev:server` — run one side only.
- `npm run build` — typecheck all workspaces, then build the client to `client/dist`.
- `npm run lint` — ESLint across client, server, shared and Netlify code.
- `npm run typecheck` — TypeScript for every workspace.
- `npm run preview` — preview the client build.
- No test runner is configured yet; it arrives with the domain/API phases. Until then verify with `npm run lint && npm run typecheck && npm run build`.

## Netlify and AI direction

- Deploy the static client and the Express API on Netlify; Express runs through `serverless-http` as a Netlify Function.
- Use Gemini as the real AI provider and a deterministic mock provider for development and tests.
- Netlify Free limits: 60 s per synchronous function, 6 MB request (about 4.5 MB binary), 300 credits/month, and no built-in password protection. Protect the site with a Basic Auth Edge Function and iterate locally with `netlify dev`.

## Toolchain notes

- TypeScript is strict and uses `moduleResolution: "Bundler"`. Import shared code as `@policia/shared`; the client Vite config aliases it to the workspace source.
- React Compiler is enabled through `@rolldown/plugin-babel` + `reactCompilerPreset()` in `client/vite.config.ts`. Keep that setup; do not add a separate Babel config or switch to the SWC plugin.
- CSS uses native nesting with no PostCSS/Tailwind config.
- Node 24 / npm 12. npm may warn that esbuild's postinstall script is blocked by `allowScripts`; Vite and `tsx` currently work despite it. Only run `npm install-scripts approve esbuild` if those tools fail.

## Domain rules (non-negotiable)

- The app generates formal Spanish "Exposiciones de Hechos" for Policía Local de Alicante, strictly for training.
- Never invent facts. For a missing essential datum emit the literal marker `[DATO QUE CONVENDRÍA CONCRETAR: ...]`; omit it if not essential. Never fill a gap to make an intervention look legally correct.
- Describe observable conduct before any legal label. Do not use "actitud agresiva", "resistencia activa", etc. without the supporting physical behavior.
- No official crests or logos. Any institutional header is text only, disabled by default; the document begins at `- MANIFIESTA:`.
- AI calls and keys stay server-side (`GEMINI_API_KEY` in Netlify env or `.env.local`); never call the model from the browser and never use a `VITE_` prefix for secrets.
- The Gemini free tier may use submitted data for product improvement. Keep the visible anonymization warning and never log narrative content.
- When implementing generation/export, follow spec sections 8 (master prompt), 9 (style example), 10 (docx layout), and 11–12 (target architecture). Cite only legal articles that add real value.
- UI copy and generated content are Spanish. Use the spec's Spanish domain names (`relatoBruto`, `datosPendientes`, `alertasRevision`, etc.).
