import { Hono } from "hono";
import { COLLECTIONS, db } from "../firebase.js";
import { getUserId } from "../middleware.js";
import { buildCustomMenu, isCustomMenuSelected } from "../services/customMenu.js";
import {
  assignedExerciseField,
  assignedExerciseIndex,
  buildOneExerciseMenu,
  pickExerciseIndex,
} from "../services/oneExerciseMenu.js";
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
  return c.json(
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as WorkoutMenu),
  );
});

// 今日のメニューを返す。運動レベルのメニューから1種目だけ (クリアするまで同じ種目)
menus.get("/today", async (c) => {
  const userId = getUserId(c);
  const userDoc = await db.collection(COLLECTIONS.users).doc(userId).get();
  if (!userDoc.exists) {
    return c.json({ error: "User not found" }, 404);
  }
  const user = userDoc.data() as User;
  // ホームの運動レベルで「カスタム」を選んでいれば、カスタムメニューを返す
  if (isCustomMenuSelected(user.custom_menu)) {
    return c.json(buildCustomMenu(user.custom_menu));
  }
  const snapshot = await db
    .collection(COLLECTIONS.menus)
    .where("target_workout_level", "==", user.workout_level)
    .limit(1)
    .get();
  if (snapshot.empty) return c.json({ error: "Workout menu not found" }, 404);
  const doc = snapshot.docs[0];
  const menu = { id: doc.id, ...doc.data() } as WorkoutMenu;
  // まだ種目が決まっていなければ抽選して保存する。決まっていればそのまま (レベル切り替えや再読み込みでは変わらない)
  let index = assignedExerciseIndex(user, menu);
  if (index === null) {
    index = pickExerciseIndex(menu);
    await userDoc.ref.update({ [assignedExerciseField(menu)]: index });
  }
  return c.json(buildOneExerciseMenu(menu, index));
});

menus.get("/:id", async (c) => {
  const doc = await db
    .collection(COLLECTIONS.menus)
    .doc(c.req.param("id"))
    .get();
  if (!doc.exists) {
    return c.json({ error: "Menu not found" }, 404);
  }
  return c.json({ id: doc.id, ...doc.data() } as WorkoutMenu);
});
