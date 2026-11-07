import { APP_NAME } from "@policia/shared";

interface Props {
  modoDemo: boolean;
}

export function CabeceraApp({ modoDemo }: Props) {
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
      {modoDemo && (
        <span
          className="insignia-demo"
          title="El servidor está usando el proveedor determinista de desarrollo, no un modelo de IA."
        >
          Modo demostración
        </span>
      )}
    </header>
  );
}
