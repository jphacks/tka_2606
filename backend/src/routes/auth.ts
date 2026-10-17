import { Hono } from "hono";
import { COLLECTIONS, db } from "../firebase.js";
import type { User } from "../types.js";

export const auth = new Hono();

// TODO: Googleログインに置き換える。今は google_id をそのまま受け取る仮実装
auth.post("/login", async (c) => {
  const { google_id } = await c.req.json<{ google_id: string }>();
  if (!google_id) {
    return c.json({ error: "google_id is required" }, 400);
  }

  const users = db.collection(COLLECTIONS.users);
  const snapshot = await users.where("google_id", "==", google_id).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return c.json({ user: { id: doc.id, ...doc.data() } as User, isNew: false });
  }

  const newUser: Omit<User, "id"> = {
    google_id,
    workout_level: 1,
    user_level: 1,
    current_streak: 0,
    total_xp: 0,
    last_workout_at: null,
  };
  const docRef = await users.add(newUser);
  return c.json({ user: { id: docRef.id, ...newUser }, isNew: true }, 201);
});
