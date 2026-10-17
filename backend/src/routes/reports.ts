import { Hono } from "hono";
import { COLLECTIONS, db } from "../firebase.js";
import { getUserId } from "../middleware.js";
import { startOfTodayJst, toJstDateString } from "../services/progress.js";
import type { CalendarDay, WorkoutLog } from "../types.js";

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

// カレンダー用: 指定した月 (?month=2026-10) に運動した日の一覧
reports.get("/calendar", async (c) => {
  const userId = getUserId(c);
  const month = c.req.query("month") ?? toJstDateString(new Date()).slice(0, 7);
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) {
    return c.json({ error: "month must be YYYY-MM" }, 400);
  }

  // 日本時間でその月の1日 0:00 から、翌月の1日 0:00 まで
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextMonth = String(((monthIndex + 1) % 12) + 1).padStart(2, "0");
  const start = new Date(`${month}-01T00:00:00+09:00`);
  const end = new Date(`${nextYear}-${nextMonth}-01T00:00:00+09:00`);

  const snapshot = await db
    .collection(COLLECTIONS.logs)
    .where("user_id", "==", userId)
    .where("completed_at", ">=", start.toISOString())
    .where("completed_at", "<", end.toISOString())
    .get();

  // 日付ごとに集計する
  const days = new Map<string, CalendarDay>();
  for (const doc of snapshot.docs) {
    const log = doc.data() as WorkoutLog;
    const date = toJstDateString(new Date(log.completed_at));
    const day = days.get(date) ?? { date, count: 0, total_duration_sec: 0, total_calories: 0 };
    day.count += 1;
    day.total_duration_sec += log.actual_duration_sec;
    day.total_calories += log.actual_calories;
    days.set(date, day);
  }

  return c.json({
    month,
    days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
  });
});

// TODO: 毎週・毎月レポート (GET /weekly, /monthly)
