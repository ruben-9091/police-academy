interface Props {
  proveedor: string | null;
}

export function AvisoDocente({ proveedor }: Props) {
  return (
    <div className="aviso-docente" role="note">
      <p>
        <strong>Finalidad exclusivamente docente.</strong> No sustituye
        documentación oficial real. No introduzcas datos personales reales: usa
        casos anonimizados.
      </p>
      {proveedor === "gemini" && (
        <p className="aviso-docente__privacidad">
          <strong>Privacidad:</strong> el relato y los datos del caso se envían
          a la API de Gemini para redactar y revisar la exposición. No
          registramos su contenido. Con la cuenta gratuita, Google puede usar
          los datos enviados para mejorar sus productos: trabaja siempre con
          casos docentes o anonimizados.
        </p>
      )}
    </div>
  );
}
