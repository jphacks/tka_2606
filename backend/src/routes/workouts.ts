import { Hono } from "hono";
import { COLLECTIONS, db } from "../firebase.js";
import { getUserId } from "../middleware.js";
import {
  calcNextStreak,
  calcUserLevel,
  calcWorkoutResult,
  startOfTodayJst,
  xpToNextLevel,
} from "../services/progress.js";
import type { Intensity, User, WorkoutLog, WorkoutMenu } from "../types.js";

export const workouts = new Hono();

// 運動完了を記録し、ストリーク・XP・レベルを更新する
workouts.post("/", async (c) => {
  const userId = getUserId(c);
  const { menu_id, intensity } = await c.req.json<{
    menu_id: string;
    intensity: Intensity;
  }>();
  if (!["low", "normal", "high"].includes(intensity)) {
    return c.json({ error: "Invalid intensity" }, 400);
  }

  const userRef = db.collection(COLLECTIONS.users).doc(userId);
  const menuRef = db.collection(COLLECTIONS.menus).doc(menu_id);
  const logRef = db.collection(COLLECTIONS.logs).doc();

  const result = await db.runTransaction(async (tx) => {
    const [userDoc, menuDoc] = await Promise.all([tx.get(userRef), tx.get(menuRef)]);
    if (!userDoc.exists || !menuDoc.exists) return null;

    const user = { id: userDoc.id, ...userDoc.data() } as User;
    const menu = { id: menuDoc.id, ...menuDoc.data() } as WorkoutMenu;
    const now = new Date();

    const log: Omit<WorkoutLog, "id"> = {
      user_id: userId,
      menu_id,
      intensity,
      ...calcWorkoutResult(menu, intensity),
      completed_at: now.toISOString(),
    };

    const total_xp = user.total_xp + log.earned_xp;
    const updatedUser: User = {
      ...user,
      total_xp,
      user_level: calcUserLevel(total_xp),
      current_streak: calcNextStreak(user, now),
      last_workout_at: log.completed_at,
    };

    tx.set(logRef, log);
    tx.update(userRef, {
      total_xp: updatedUser.total_xp,
      user_level: updatedUser.user_level,
      current_streak: updatedUser.current_streak,
      last_workout_at: updatedUser.last_workout_at,
    });

    return {
      log: { id: logRef.id, ...log },
      user: updatedUser,
      previous_streak: user.current_streak,
      leveled_up: updatedUser.user_level > user.user_level,
      xp_to_next_level: xpToNextLevel(total_xp),
    };
  });

  if (!result) {
    return c.json({ error: "User or menu not found" }, 404);
  }
  return c.json(result, 201);
});

// 今日の完了人数
workouts.get("/today/count", async (c) => {
  const snapshot = await db
    .collection(COLLECTIONS.logs)
    .where("completed_at", ">=", startOfTodayJst().toISOString())
    .get();
  const userIds = new Set(snapshot.docs.map((doc) => doc.get("user_id")));
  return c.json({ count: userIds.size });
});
