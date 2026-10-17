import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getSessionUserId } from "./services/session.js";

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
  }
}

// ログイン中 (セッション Cookie が有効) でなければ 401 を返す
export const requireAuth = createMiddleware(async (c, next) => {
  const userId = await getSessionUserId(c);
  if (!userId) {
    throw new HTTPException(401, { message: "Not logged in" });
  }
  c.set("userId", userId);
  await next();
});

export function getUserId(c: Context) {
  return c.get("userId");
}
