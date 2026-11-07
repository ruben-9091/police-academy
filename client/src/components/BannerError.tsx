import { describirError } from "../lib/api";

interface Props {
  error: unknown;
  onReintentar?: () => void;
}

export function BannerError({ error, onReintentar }: Props) {
  const { mensaje, issues } = describirError(error);

  return (
    <div className="banner-error" role="alert">
      <div>
        <strong>No se pudo completar la operación.</strong>
        <p>{mensaje}</p>
        {issues.length > 0 && (
          <ul>
            {issues.map((issue) => (
              <li key={`${issue.path}-${issue.message}`}>
                <code>{issue.path}</code>: {issue.message}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onReintentar && (
        <button
          type="button"
          className="boton-secundario boton-secundario--pequeno"
          onClick={onReintentar}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
