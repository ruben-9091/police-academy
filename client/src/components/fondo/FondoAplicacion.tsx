import Lightfall from "./Lightfall";
import "./fondo.css";

const COLORES = ["#dfeaff", "#8ab4ff", "#3d6fbe"];
const AZUL_MARINO = "#0a1a33";

/**
 * Fondo animado de la aplicación. Es decorativo: queda fijado a la ventana,
 * oculto a lectores de pantalla y sin capturar clics (la interacción del
 * componente escucha el puntero en `window`).
 */
export function FondoAplicacion() {
  return (
    <div className="fondo-aplicacion" aria-hidden="true">
      <Lightfall
        colors={COLORES}
        backgroundColor={AZUL_MARINO}
        speed={0.3}
        streakCount={2}
        streakWidth={0.8}
        twinkle={0.3}
        backgroundGlow={0.1}
        headGlow={0.6}
        bloom={0.35}
        mouseInteraction
        holdToWarp
        intro
      />
      <div className="fondo-aplicacion__velo" />
    </div>
  );
}
