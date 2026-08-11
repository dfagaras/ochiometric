export const anonymousPlayerCookie = "ochiometric_player";
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<unknown>;
};

export type PlayerDatabase = {
  prepare(sql: string): D1Statement;
};

function cookieValue(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === anonymousPlayerCookie) return value.join("=");
  }
  return null;
}

function createToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function tokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export type AnonymousPlayer = {
  id: string;
  setCookie: string | null;
};

export async function ensureAnonymousPlayer(
  request: Request,
  database: PlayerDatabase,
): Promise<AnonymousPlayer> {
  const existingToken = cookieValue(request);
  const hasValidToken = existingToken !== null && tokenPattern.test(existingToken);
  const token = hasValidToken ? existingToken : createToken();
  const id = await tokenHash(token);

  await database
    .prepare(
      `INSERT INTO anonymous_players (id)
       VALUES (?)
       ON CONFLICT(id) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP`,
    )
    .bind(id)
    .run();

  return {
    id,
    setCookie: hasValidToken
      ? null
      : `${anonymousPlayerCookie}=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
  };
}
