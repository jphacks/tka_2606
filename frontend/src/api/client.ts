import type { CalendarDay, Intensity, TodayReport, User, WorkoutMenu, WorkoutResult } from "../types";

export const BASE_URL = "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const rawRes = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include", // セッション Cookie を送る
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const res = await rawRes.json();
  if (!rawRes.ok) {
    throw new ApiError(rawRes.status, res.error ?? "Request failed");
  }
  return res;
}

export const api = {
  // Google のログイン画面へ移動する (ログイン後はこのアプリに戻ってくる)
  loginWithGoogle: () => {
    window.location.href = `${BASE_URL}/auth/google`;
  },
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  getMe: () => request<User>("/users/me"),
  updateWorkoutLevel: (workout_level: number) =>
    request<{ workout_level: number }>("/users/me/workout-level", {
      method: "PATCH",
      body: JSON.stringify({ workout_level }),
    }),
  getTodayMenu: () => request<WorkoutMenu>("/menus/today"),
  getTodayReport: () => request<TodayReport>("/reports/today"),
  getTodayCount: () => request<{ count: number }>("/workouts/today/count"),
  // month は "2026-10" の形式
  getCalendar: (month: string) =>
    request<{ month: string; days: CalendarDay[] }>(`/reports/calendar?month=${month}`),
  completeWorkout: (menu_id: string, intensity: Intensity) =>
    request<WorkoutResult>("/workouts", {
      method: "POST",
      body: JSON.stringify({ menu_id, intensity }),
    }),
};
