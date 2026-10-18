import type { WorkoutMenu } from "../types.js";

// メニューの中の1種目だけを取り出したメニュー
// ID は「元のメニューID@種目の番号」(例: "gif-workout-normal@2")。記録のときもこの ID から同じ1種目を組み立てる

const SEPARATOR = "@";

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
