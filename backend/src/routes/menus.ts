import { Hono } from "hono";
import { COLLECTIONS, db } from "../firebase.js";
import { getUserId } from "../middleware.js";
import type { User, WorkoutMenu } from "../types.js";

export const menus = new Hono();

const SORT_KEYS = {
  duration: "base_duration_sec",
  difficulty: "target_workout_level",
  calories: "base_calories",
} as const;

// メニュー表 (?sort=duration|difficulty|calories で並べ替え)
menus.get("/", async (c) => {
  const sort = c.req.query("sort") as keyof typeof SORT_KEYS | undefined;
  const field = (sort && SORT_KEYS[sort]) ?? "target_workout_level";
  const snapshot = await db.collection(COLLECTIONS.menus).orderBy(field).get();
  return c.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as WorkoutMenu));
});

// とりあえずこれやれ機能: 運動レベルに合ったメニューを1つだけ返す
menus.get("/today", async (c) => {
  const userId = getUserId(c);
  const userDoc = await db.collection(COLLECTIONS.users).doc(userId).get();
  if (!userDoc.exists) {
    return c.json({ error: "User not found" }, 404);
  }
  const user = userDoc.data() as User;

  const snapshot = await db
    .collection(COLLECTIONS.menus)
    .where("target_workout_level", "==", user.workout_level)
    .get();
  if (snapshot.empty) {
    return c.json({ error: "No menu for this level" }, 404);
  }
  // TODO: 選び方を工夫する (前回と被らない等)。今は日替わりで決める
  const index = new Date().getDate() % snapshot.size;
  const doc = snapshot.docs[index];
  return c.json({ id: doc.id, ...doc.data() } as WorkoutMenu);
});

menus.get("/:id", async (c) => {
  const doc = await db.collection(COLLECTIONS.menus).doc(c.req.param("id")).get();
  if (!doc.exists) {
    return c.json({ error: "Menu not found" }, 404);
  }
  return c.json({ id: doc.id, ...doc.data() } as WorkoutMenu);
});
