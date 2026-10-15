import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

initializeApp({ projectId: "demo-todo-app" });

const db = getFirestore();
const TODOS_COLLECTION = "todos";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/api/todos", async (c) => {
  try {
    const snapshot = await db
      .collection(TODOS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    const todos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return c.json(todos);
  } catch (error) {
    return c.json({ error: "Failed to fetch todos" }, 500);
  }
});

app.post("/api/todos", async (c) => {
  try {
    const { title } = await c.req.json<{ title: string }>();
    if (!title || !title.trim()) {
      return c.json({ error: "Title is required" }, 400);
    }

    const newTodo = {
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(TODOS_COLLECTION).add(newTodo);
    return c.json({ id: docRef.id, ...newTodo }, 201);
  } catch (error) {
    return c.json({ error: "Failed to add todo" }, 500);
  }
});

app.delete("/api/todos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await db.collection(TODOS_COLLECTION).doc(id).delete();
    return c.json({ id, message: "Deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete todo" }, 500);
  }
});

app.patch("/api/todos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const completed = body.completed;
    await db
      .collection(TODOS_COLLECTION)
      .doc(id)
      .update({ completed: completed });
    return c.json({ id, message: "Updated successfully" });
  } catch {
    return c.json({ error: "Failed to update todo" }, 500);
  }
});

const port = 3000;
console.log(`Hono Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
