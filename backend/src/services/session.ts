import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { env } from "../env.js";

// ログイン状態は、ユーザーIDを入れた JWT を HttpOnly Cookie に保存して管理する
const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30日

export async function startSession(c: Context, userId: string) {
  const token = await sign(
    { sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC },
    env.SESSION_SECRET,
    "HS256",
  );
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: env.BACKEND_URL.startsWith("https://"),
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

// ログインしていなければ null を返す
export async function getSessionUserId(c: Context) {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  try {
    const payload = await verify(token, env.SESSION_SECRET, "HS256");
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function endSession(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
