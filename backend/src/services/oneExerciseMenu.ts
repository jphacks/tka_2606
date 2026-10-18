import type { User, WorkoutMenu } from "../types.js";

// 今日のメニューは、運動レベルのメニューの種目からランダムで1種目だけ選ぶ
// 選んだ種目は User.assigned_exercises に保存し、クリアするまで変えない (嫌な種目でも引き直せない)
// ID は「元のメニューID@種目の番号」(例: "gif-workout-normal@2")。記録のときもこの ID から同じ1種目を組み立てる

const SEPARATOR = "@";

// ランダムに種目を選ぶ。種目が2つ以上あれば、直前の種目 (exclude) は避ける
export function pickExerciseIndex(menu: WorkoutMenu, exclude?: number) {
  const candidates = menu.exercises.map((_, i) => i).filter((i) => i !== exclude);
  const pool = candidates.length > 0 ? candidates : [0];
  return pool[Math.floor(Math.random() * pool.length)];
}

// 今のレベルで割り当て済みの種目の番号 (なければ、または範囲外なら null)
export function assignedExerciseIndex(user: User, menu: WorkoutMenu) {
  const index = user.assigned_exercises?.[String(menu.target_workout_level)];
  return index !== undefined && index >= 0 && index < menu.exercises.length ? index : null;
}

// User.assigned_exercises を更新するときのフィールド名
export function assignedExerciseField(menu: WorkoutMenu) {
  return `assigned_exercises.${menu.target_workout_level}`;
}

// メニューから1種目だけのメニューを作る
export function buildOneExerciseMenu(menu: WorkoutMenu, index: number): WorkoutMenu {
  const exercise = menu.exercises[index];
  return {
    ...menu,
    id: `${menu.id}${SEPARATOR}${index}`,
    title: exercise.name,
    base_duration_sec: exercise.duration_sec,
    base_calories: exercise.calories,
    body_parts: [exercise.body_part],
    exercises: [exercise],
  };
}

// 1種目メニューの ID なら、元のメニューIDと種目の番号に分ける
export function parseOneExerciseMenuId(id: string) {
  const [menuId, index, ...rest] = id.split(SEPARATOR);
  if (rest.length > 0 || index === undefined || !/^\d+$/.test(index)) return null;
  return { menuId, index: Number(index) };
}
