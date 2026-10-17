import { Hono } from "hono";
import { COLLECTIONS, db } from "../firebase.js";
import { getUserId } from "../middleware.js";
import { startOfTodayJst } from "../services/progress.js";
import type { WorkoutLog } from "../types.js";

export const reports = new Hono();

// 今日の運動レポート
reports.get("/today", async (c) => {
  const userId = getUserId(c);
  const snapshot = await db
    .collection(COLLECTIONS.logs)
    .where("user_id", "==", userId)
    .where("completed_at", ">=", startOfTodayJst().toISOString())
    .get();
  const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as WorkoutLog);

  return c.json({
    logs,
    total_duration_sec: logs.reduce((sum, log) => sum + log.actual_duration_sec, 0),
    total_calories: logs.reduce((sum, log) => sum + log.actual_calories, 0),
    total_xp: logs.reduce((sum, log) => sum + log.earned_xp, 0),
  });
});

// TODO: 毎週・毎月レポート (GET /weekly, /monthly)
