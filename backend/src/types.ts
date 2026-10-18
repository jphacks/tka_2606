// docs/table.md のデータモデル

export type Intensity = "low" | "normal" | "high";

export type User = {
  id: string;
  google_id: string;
  // Google アカウントの表示用情報 (ログインのたびに更新する。table.md への追加)
  display_name: string;
  email: string;
  photo_url: string | null;
  workout_level: number; // 運動レベル (メニュー決定用。ホーム画面で手動変更可。例: 1, 2, 3)
  user_level: number; // ユーザーレベル (モチベ用。自動で上がる)
  current_streak: number;
  total_xp: number;
  last_workout_at: string | null; // ISO文字列
  custom_menu?: CustomMenu | null;
  // 運動レベルごとの「次にやる種目」の番号 (キーは運動レベル "1"〜"3")
  // クリアするまで同じ種目にして、クリアしたら抽選し直す。ホームでは種目名を隠す
  assigned_exercises?: Record<string, number>; // 設定タブで作るカスタムメニュー (未設定なら undefined)
};

// 設定タブで作るカスタムメニュー。ホームの運動レベルで「カスタム」を選ぶと、今日のメニューがこれになる
export type CustomMenu = {
  selected: boolean; // ホームで「カスタム」を選んでいるか (ゆるめ等を選ぶと false になる)
  exercise_names: string[]; // やりたい種目 (Exercise.name) を順番どおりに。最大 CUSTOM_MENU_MAX_EXERCISES 個
  exercise_duration_sec: number; // 1種目あたりの時間 (CUSTOM_MENU_DURATIONS のどれか)
};

export type Exercise = {
  name: string;
  duration_sec: number;
  image: string;
  body_part: string;
  calories: number;
};

export type WorkoutMenu = {
  id: string;
  title: string;
  description: string;
  target_workout_level: number; // このメニューが対象とする運動レベル
  base_duration_sec: number;
  base_calories: number;
  body_parts: string[];
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

// カレンダーの1日分 (運動した日だけ返す)
export type CalendarDay = {
  date: string; // 日本時間の日付 "2026-10-17"
  count: number; // その日に運動した回数
  total_duration_sec: number;
  total_calories: number;
};
