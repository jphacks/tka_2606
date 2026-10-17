// backend/src/types.ts と揃える

export type Intensity = "low" | "normal" | "high";

export type User = {
  id: string;
  google_id: string;
  display_name: string;
  email: string;
  photo_url: string | null;
  workout_level: number;
  user_level: number;
  current_streak: number;
  total_xp: number;
  last_workout_at: string | null;
};

export type Exercise = {
  name: string;
  duration_sec: number;
};

export type WorkoutMenu = {
  id: string;
  title: string;
  description: string;
  target_workout_level: number;
  base_duration_sec: number;
  base_calories: number;
  exercises: Exercise[];
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  menu_id: string;
  intensity: Intensity;
  actual_duration_sec: number;
  actual_calories: number;
  earned_xp: number;
  completed_at: string;
};

export type WorkoutResult = {
  log: WorkoutLog;
  user: User;
  previous_streak: number;
  leveled_up: boolean;
  xp_to_next_level: number;
};
