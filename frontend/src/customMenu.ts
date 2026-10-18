// カスタムメニューの設定値 (backend/src/services/customMenu.ts と揃える)

// カスタムメニューの WorkoutMenu.id
export const CUSTOM_MENU_ID = "custom";

// カスタムメニューに入れられる種目数の上限
export const CUSTOM_MENU_MAX_EXERCISES = 5;
// 1種目あたりの時間の選択肢 (秒)
export const CUSTOM_MENU_DURATIONS = [20, 30, 45, 60];

// 種目を sec 秒やったときの消費カロリー
// 元の種目の「1秒あたりのカロリー」で計算する (backend の buildCustomMenu と同じ計算)
export function caloriesFor(exercise: { calories: number; duration_sec: number }, sec: number) {
  return Math.round((exercise.calories / exercise.duration_sec) * sec);
}
