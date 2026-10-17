import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

initializeApp({ projectId: "demo-todo-app" });

export const db = getFirestore();

export const COLLECTIONS = {
  users: "users",
  menus: "workout_menus",
  logs: "workout_logs",
} as const;
