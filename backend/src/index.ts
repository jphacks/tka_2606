import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { env } from "./env.js";
import { requireAuth } from "./middleware.js";
import { auth, handleGoogleCallback } from "./routes/auth.js";
import { menus } from "./routes/menus.js";
import { reports } from "./routes/reports.js";
import { users } from "./routes/users.js";
import { workouts } from "./routes/workouts.js";
import { seedMenus } from "./seed.js";
import { GOOGLE_REDIRECT_PATH } from "./services/google.js";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: env.FRONTEND_URL,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type"],
    credentials: true, // セッション Cookie を受け取る
  }),
);

// ログインが必要なAPI
app.use("/api/users/*", requireAuth);
app.use("/api/menus/today", requireAuth);
app.on("POST", "/api/workouts", requireAuth);
app.use("/api/reports/*", requireAuth);

app.route("/api/auth", auth);
app.get(GOOGLE_REDIRECT_PATH, handleGoogleCallback);
app.route("/api/users", users);
app.route("/api/menus", menus);
app.route("/api/workouts", workouts);
app.route("/api/reports", reports);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

await seedMenus();

const port = 3000;
console.log(`Hono Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
