import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

initializeApp({ projectId: "demo-todo-app" });

const db = getFirestore();
const TODOS_COLLECTION = "todos";

const app = new Hono();

const port = 3000;
console.log(`Hono Server is running on http://localhost:${port}`);

app.get("/api/todos", async (c) => {
  try {
    const snapshot = await db.collection(TODOS_COLLECTION).get();
    const todos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return c.json(todos, 200);
  } catch {
    return c.json({ error: "Failed to fetch todos" }, 500);
  }
});

app.post("/api/todos", async (c) => {
  try {
    const { title } = await c.req.json<{ title: string }>();
    if (!title || !title.trim()) {
      return c.json({ error: "Title is required" }, 500);
    }

    const newTodo = {
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection(TODOS_COLLECTION).add(newTodo);
    return c.json({ id: docRef.id, ...newTodo }, 201);
  } catch {
    return c.json({ error: "Failed to create todo" }, 500);
  }
});

app.patch("/api/todos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { completed } = await c.req.json<{ completed: boolean }>();
    const todo = await db
      .collection(TODOS_COLLECTION)
      .doc(id)
      .update({ completed: completed });
    return c.json({ id, message: "Updated successfully" }, 200);
  } catch {
    return c.json({ error: "Failed to update todo" }, 500);
  }
});

app.delete("/api/todos/:id", async (c) => {
  try {
    const id = await c.req.param("id");
    await db.collection(TODOS_COLLECTION).doc(id).delete();
    return c.json({ id, message: "Deleted successfully" });
  } catch {
    return c.json({ error: "Failed to delete todo" }, 500);
  }
});

serve({
  fetch: app.fetch,
  port,
});
