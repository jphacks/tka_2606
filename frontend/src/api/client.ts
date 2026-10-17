import type { Intensity, User, WorkoutMenu, WorkoutResult } from "../types";

const BASE_URL = "http://localhost:3000/api";
const USER_ID_KEY = "userId";

export const getStoredUserId = () => localStorage.getItem(USER_ID_KEY);
export const setStoredUserId = (id: string) => localStorage.setItem(USER_ID_KEY, id);
export const clearStoredUserId = () => localStorage.removeItem(USER_ID_KEY);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const userId = getStoredUserId();
  const rawRes = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "X-User-Id": userId } : {}),
      ...init.headers,
    },
  });
  const res = await rawRes.json();
  if (!rawRes.ok) {
    throw new Error(res.error ?? "Request failed");
  }
  return res;
}

export const api = {
  login: (google_id: string) =>
    request<{ user: User; isNew: boolean }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ google_id }),
    }),
  getMe: () => request<User>("/users/me"),
  updateWorkoutLevel: (workout_level: number) =>
    request<{ workout_level: number }>("/users/me/workout-level", {
      method: "PATCH",
      body: JSON.stringify({ workout_level }),
    }),
  getTodayMenu: () => request<WorkoutMenu>("/menus/today"),
  getTodayCount: () => request<{ count: number }>("/workouts/today/count"),
  completeWorkout: (menu_id: string, intensity: Intensity) =>
    request<WorkoutResult>("/workouts", {
      method: "POST",
      body: JSON.stringify({ menu_id, intensity }),
    }),
};
