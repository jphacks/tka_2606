import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { auth } from "./routes/auth.js";
import { menus } from "./routes/menus.js";
import { reports } from "./routes/reports.js";
import { users } from "./routes/users.js";
import { workouts } from "./routes/workouts.js";
import { seedMenus } from "./seed.js";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "http://localhost:5173",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "X-User-Id"],
  }),
);

app.route("/api/auth", auth);
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
