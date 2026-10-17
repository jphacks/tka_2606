// docs/table.md のデータモデル

export type Intensity = "low" | "normal" | "high";

export type User = {
  id: string;
  google_id: string;
  workout_level: number; // 運動レベル (メニュー決定用。ホーム画面で手動変更可。例: 1, 2, 3)
  user_level: number; // ユーザーレベル (モチベ用。自動で上がる)
  current_streak: number;
  total_xp: number;
  last_workout_at: string | null; // ISO文字列
};

export type Exercise = {
  name: string;
  duration_sec: number;
};

export type WorkoutMenu = {
  id: string;
  title: string;
  description: string;
  target_workout_level: number; // このメニューが対象とする運動レベル
  base_duration_sec: number;
  base_calories: number;
  exercises: Exercise[]; // 運動中画面の「何個目か・次の種目」表示用 (table.md への追加)
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  menu_id: string;
  intensity: Intensity;
  actual_duration_sec: number;
  actual_calories: number;
  earned_xp: number;
  completed_at: string; // ISO文字列
};
