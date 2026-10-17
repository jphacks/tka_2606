import { Hono } from "hono";
import { COLLECTIONS, db } from "../firebase.js";
import { getUserId } from "../middleware.js";
import type { User } from "../types.js";

export const users = new Hono();

users.get("/me", async (c) => {
  const userId = getUserId(c);
  const doc = await db.collection(COLLECTIONS.users).doc(userId).get();
  if (!doc.exists) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json({ id: doc.id, ...doc.data() } as User);
});

// 運動ランク診断の結果保存 / ホーム画面での運動レベル手動変更
users.patch("/me/workout-level", async (c) => {
  const userId = getUserId(c);
  const { workout_level } = await c.req.json<{ workout_level: number }>();
  if (![1, 2, 3].includes(workout_level)) {
    return c.json({ error: "workout_level must be 1, 2 or 3" }, 400);
  }
  await db.collection(COLLECTIONS.users).doc(userId).update({ workout_level });
  return c.json({ workout_level });
});
