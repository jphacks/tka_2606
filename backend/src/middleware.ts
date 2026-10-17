import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

// TODO: 認証トークンの検証に置き換える。今は X-User-Id ヘッダーをそのまま信用する仮実装
export function getUserId(c: Context) {
  const userId = c.req.header("X-User-Id");
  if (!userId) {
    throw new HTTPException(401, { message: "X-User-Id header is required" });
  }
  return userId;
}
