export function EstadoVacio() {
  return (
    <div className="panel estado-vacio">
      <h3>La exposición aparecerá aquí</h3>
      <ol>
        <li>Pega el relato en bruto o carga el ejemplo.</li>
        <li>Rellena, si los conoces, los datos del caso.</li>
        <li>Pulsa «Generar exposición».</li>
        <li>Revisa los marcadores y las alertas antes de exportar.</li>
      </ol>
      <p className="panel__ayuda">
        En esta fase responde un proveedor de demostración determinista: no
        llama a ningún modelo externo y no inventa hechos ni artículos.
      </p>
    </div>
  );
}
