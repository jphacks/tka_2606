import type { Intensity, User, WorkoutMenu } from "../types.js";

// レベルの上がり方は一定にする (docs/function.md)
export const XP_PER_LEVEL = 100;

const INTENSITY_MULTIPLIER: Record<Intensity, number> = {
  low: 0.5,
  normal: 1,
  high: 1.5,
};

// 一時的に獲得 XP を10倍にしている (レベルアップ演出の確認用)。戻すときは 1 にする
const XP_BOOST = 10;

export function calcWorkoutResult(menu: WorkoutMenu, intensity: Intensity) {
  const m = INTENSITY_MULTIPLIER[intensity];
  const actual_duration_sec = Math.round(menu.base_duration_sec * m);
  const actual_calories = Math.round(menu.base_calories * m);
  // 1分 = 10XP (XP_BOOST 倍)
  const earned_xp = Math.round((actual_duration_sec / 60) * 10 * XP_BOOST);
  return { actual_duration_sec, actual_calories, earned_xp };
}

export function calcUserLevel(totalXp: number) {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

export function xpToNextLevel(totalXp: number) {
  return XP_PER_LEVEL - (totalXp % XP_PER_LEVEL);
}

// 日付の比較は日本時間で行う (例: "2026-10-17")
export function toJstDateString(date: Date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function startOfTodayJst(now = new Date()) {
  return new Date(`${toJstDateString(now)}T00:00:00+09:00`);
}

export function calcNextStreak(user: User, now = new Date()) {
  if (!user.last_workout_at) return 1;

  const last = toJstDateString(new Date(user.last_workout_at));
  const today = toJstDateString(now);
  const yesterday = toJstDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000));

  if (last === today) return user.current_streak; // 今日2回目以降は据え置き
  if (last === yesterday) return user.current_streak + 1;
  return 1;
}
