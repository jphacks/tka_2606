import { MENUS } from "../seed.js";
import type { CustomMenu, Exercise, WorkoutMenu } from "../types.js";

// カスタムメニューに入れられる種目数の上限
export const CUSTOM_MENU_MAX_EXERCISES = 5;
// 1種目あたりの時間の選択肢 (秒)
export const CUSTOM_MENU_DURATIONS = [20, 30, 45, 60];

export const CUSTOM_MENU_ID = "custom";

// 選べる種目の一覧 (全メニューの種目。名前で区別する)
const EXERCISES = new Map<string, { exercise: Exercise; level: number }>(
  MENUS.flatMap((menu) =>
    menu.exercises.map((exercise) => [exercise.name, { exercise, level: menu.target_workout_level }] as const),
  ),
);

// 設定タブから保存される内容をチェックする。問題があればエラーメッセージを返す
export function validateCustomMenu(input: unknown): string | null {
  if (typeof input !== "object" || input === null) return "Invalid custom menu";
  const { exercise_names, exercise_duration_sec } = input as Partial<CustomMenu>;
  if (!Array.isArray(exercise_names)) return "exercise_names must be an array";
  if (exercise_names.length > CUSTOM_MENU_MAX_EXERCISES) {
    return `exercise_names must have at most ${CUSTOM_MENU_MAX_EXERCISES} items`;
  }
  if (exercise_names.some((name) => typeof name !== "string" || !EXERCISES.has(name))) {
    return "Unknown exercise";
  }
  if (new Set(exercise_names).size !== exercise_names.length) return "Duplicate exercise";
  if (!CUSTOM_MENU_DURATIONS.includes(exercise_duration_sec as number)) {
    return `exercise_duration_sec must be one of ${CUSTOM_MENU_DURATIONS.join(", ")}`;
  }
  return null;
}

// カスタムメニューの設定から、運動中画面・記録で使う WorkoutMenu を作る
export function buildCustomMenu(custom: CustomMenu): WorkoutMenu {
  const items = custom.exercise_names
    .map((name) => EXERCISES.get(name))
    .filter((item) => item !== undefined);
  const duration = custom.exercise_duration_sec;

  const exercises: Exercise[] = items.map(({ exercise }) => ({
    ...exercise,
    duration_sec: duration,
    // 元の種目の「秒あたりのカロリー」で、選んだ時間分を計算する
    calories: Math.round((exercise.calories / exercise.duration_sec) * duration),
  }));

  return {
    id: CUSTOM_MENU_ID,
    title: "カスタムメニュー",
    description: "設定タブで選んだ種目のトレーニング",
    target_workout_level: Math.max(1, ...items.map((item) => item.level)),
    base_duration_sec: duration * exercises.length,
    base_calories: exercises.reduce((sum, e) => sum + e.calories, 0),
    body_parts: [...new Set(exercises.map((e) => e.body_part))],
    exercises,
  };
}

// カスタムメニューが作られているか (種目が1つ以上)
export function hasCustomMenu(custom: CustomMenu | null | undefined): custom is CustomMenu {
  return !!custom && custom.exercise_names.length > 0;
}

// ホームで「カスタム」が選ばれているか
export function isCustomMenuSelected(custom: CustomMenu | null | undefined): custom is CustomMenu {
  return hasCustomMenu(custom) && custom.selected;
}
