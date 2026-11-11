import DecryptedText from "./texto/DecryptedText";

const TITULO = "La exposición aparecerá aquí";

const PASOS = [
  "Pega el relato en bruto o carga el ejemplo.",
  "Rellena, si los conoces, los datos del caso.",
  "Pulsa «Generar exposición».",
  "Revisa los marcadores y las alertas antes de exportar.",
];

/** Cada paso entra un poco después del anterior para que la lectura fluya. */
const RETARDO_PASO = 140;

const EFECTO = {
  effect: "scramble",
  animateOn: "view",
  sequential: true,
  revealDirection: "start",
  speed: 45,
  maxIterations: 12,
  scrambleColor: "#3d6fbe",
  characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  loop: false,
} as const;

export function EstadoVacio() {
  return (
    <div className="panel estado-vacio">
      <h3>
        <DecryptedText text={TITULO} {...EFECTO} />
      </h3>
      <ol>
        {PASOS.map((paso, indice) => (
          <li key={paso}>
            <DecryptedText
              text={paso}
              delay={(indice + 1) * RETARDO_PASO}
              {...EFECTO}
            />
          </li>
        ))}
      </ol>
      <p className="panel__ayuda">
        En esta fase responde un proveedor de demostración determinista: no
        llama a ningún modelo externo y no inventa hechos ni artículos.
      </p>
    </div>
  );
}
