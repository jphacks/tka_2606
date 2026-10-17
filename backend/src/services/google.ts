import { verifyWithJwks } from "hono/jwt";
import { env } from "../env.js";

// Google の OAuth 2.0 (OpenID Connect) の認可コードフロー
// https://developers.google.com/identity/openid-connect/openid-connect

// Google Cloud Console の「承認済みのリダイレクト URI」に登録したものと同じにする
export const GOOGLE_REDIRECT_PATH = "/callback";
export const GOOGLE_REDIRECT_URI = `${env.BACKEND_URL}${GOOGLE_REDIRECT_PATH}`;

export function buildGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// 認可コードを ID トークンに交換し、検証したうえで Google アカウントの情報を返す
export async function fetchGoogleAccount(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }
  const { id_token } = (await res.json()) as { id_token: string };

  const payload = await verifyWithJwks(id_token, {
    jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
    allowedAlgorithms: ["RS256"],
    verification: {
      iss: /^(https:\/\/)?accounts\.google\.com$/,
      aud: env.GOOGLE_CLIENT_ID,
    },
  });

  return {
    googleId: payload.sub as string,
    email: payload.email as string | undefined,
  };
}
