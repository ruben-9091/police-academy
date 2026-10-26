import type { Config, Context } from "@netlify/edge-functions";

const AUTH_REALM = 'Basic realm="Policia", charset="UTF-8"';

function readBasicCredentials(
  header: string | null,
): { user: string; password: string } | null {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separator = decoded.indexOf(":");

    if (separator < 0) {
      return null;
    }

    return {
      user: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

async function equals(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

export default async (
  request: Request,
  context: Context,
): Promise<Response> => {
  const expectedUser = Netlify.env.get("APP_USER");
  const expectedPassword = Netlify.env.get("APP_PASSWORD");

  if (!expectedUser || !expectedPassword) {
    return new Response("Authentication is not configured.", { status: 503 });
  }

  const credentials = readBasicCredentials(
    request.headers.get("authorization"),
  );

  if (
    credentials &&
    (await equals(credentials.user, expectedUser)) &&
    (await equals(credentials.password, expectedPassword))
  ) {
    return context.next();
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": AUTH_REALM,
    },
  });
};

export const config: Config = {
  path: "/*",
};
