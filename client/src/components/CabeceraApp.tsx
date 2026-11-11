import { APP_NAME } from "@policia/shared";

interface Props {
  proveedor: string | null;
}

const NOMBRES_PROVEEDOR: Record<string, string> = {
  gemini: "Gemini",
};

export function CabeceraApp({ proveedor }: Props) {
  const esDemo = proveedor === "mock";
  const nombre = proveedor ? (NOMBRES_PROVEEDOR[proveedor] ?? proveedor) : "";

  return (
    <header className="cabecera">
      <div>
        <p className="cabecera__contexto">
          Formación · Policía Local de Alicante
        </p>
        <h1 className="cabecera__titulo">{APP_NAME}</h1>
        <p className="cabecera__subtitulo">
          De relato en bruto a exposición formal, editable y revisable.
        </p>
      </div>
      {proveedor !== null && (
        <span
          className={
            esDemo ? "insignia-demo" : "insignia-demo insignia-demo--ia"
          }
          title={
            esDemo
              ? "El servidor está usando el proveedor determinista de desarrollo, no un modelo de IA."
              : `El servidor está usando ${nombre} para redactar y revisar la exposición.`
          }
        >
          {esDemo ? "Modo demostración" : `IA: ${nombre}`}
        </span>
      )}
    </header>
  );
}
