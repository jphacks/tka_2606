import { Hono } from "hono";
import { COLLECTIONS, db } from "../firebase.js";
import { getUserId } from "../middleware.js";
import { hasCustomMenu, validateCustomMenu } from "../services/customMenu.js";
import type { CustomMenu, User } from "../types.js";

export const users = new Hono();

users.get("/me", async (c) => {
  const userId = getUserId(c);
  const doc = await db.collection(COLLECTIONS.users).doc(userId).get();
  if (!doc.exists) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json({ id: doc.id, ...doc.data() } as User);
});

// ホーム画面での運動レベル変更 (ゆるめ・ふつう・しっかり)
// 「カスタム」を選んでいた場合は、その選択を外す
users.patch("/me/workout-level", async (c) => {
  const userId = getUserId(c);
  const { workout_level } = await c.req.json<{ workout_level: number }>();
  if (![1, 2, 3].includes(workout_level)) {
    return c.json({ error: "workout_level must be 1, 2 or 3" }, 400);
  }
  const userRef = db.collection(COLLECTIONS.users).doc(userId);
  const user = (await userRef.get()).data() as User | undefined;
  await userRef.update({
    workout_level,
    ...(user?.custom_menu ? { "custom_menu.selected": false } : {}),
  });
  return c.json({ workout_level });
});

// ホーム画面の運動レベルで「カスタム」を選ぶ
users.patch("/me/custom-menu/select", async (c) => {
  const userId = getUserId(c);
  const userRef = db.collection(COLLECTIONS.users).doc(userId);
  const user = (await userRef.get()).data() as User | undefined;
  if (!hasCustomMenu(user?.custom_menu)) {
    return c.json({ error: "Create a custom menu in settings first" }, 400);
  }
  await userRef.update({ "custom_menu.selected": true });
  return c.json({ custom_menu: { ...user.custom_menu, selected: true } });
});

// 設定タブのカスタムメニュー (種目と時間) を保存する
// ホームで「カスタム」を選んでいるかどうかはそのまま (種目を0個にした場合だけ外す)
users.put("/me/custom-menu", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json<Pick<CustomMenu, "exercise_names" | "exercise_duration_sec">>();
  const error = validateCustomMenu(body);
  if (error) {
    return c.json({ error }, 400);
  }
  const userRef = db.collection(COLLECTIONS.users).doc(userId);
  const user = (await userRef.get()).data() as User | undefined;
  const custom_menu: CustomMenu = {
    selected: !!user?.custom_menu?.selected && body.exercise_names.length > 0,
    exercise_names: body.exercise_names,
    exercise_duration_sec: body.exercise_duration_sec,
  };
  await userRef.update({ custom_menu });
  return c.json({ custom_menu });
});
