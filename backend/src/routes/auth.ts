import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env } from "../env.js";
import { COLLECTIONS, db } from "../firebase.js";
import { buildGoogleAuthUrl, fetchGoogleAccount, type GoogleAccount } from "../services/google.js";
import { endSession, startSession } from "../services/session.js";
import type { User } from "../types.js";

export const auth = new Hono();

const STATE_COOKIE = "oauth_state";

// 1. ログインボタンからここに来る。Google のログイン画面へリダイレクトする
auth.get("/google", (c) => {
  // CSRF 対策: ランダムな state を Cookie に保存し、コールバックで照合する
  const state = crypto.randomUUID();
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return c.redirect(buildGoogleAuthUrl(state));
});

// 2. Google でログインすると、ここに戻ってくる (index.ts で GOOGLE_REDIRECT_PATH に登録)
export async function handleGoogleCallback(c: Context) {
  const { code, state, error } = c.req.query();
  const savedState = getCookie(c, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, { path: "/" });

  if (error || !code || !state || state !== savedState) {
    return c.redirect(`${env.FRONTEND_URL}/?login_error=1`);
  }

  try {
    const account = await fetchGoogleAccount(code);
    const userId = await findOrCreateUser(account);
    await startSession(c, userId);
    return c.redirect(`${env.FRONTEND_URL}/`);
  } catch (e) {
    console.error(e);
    return c.redirect(`${env.FRONTEND_URL}/?login_error=1`);
  }
}

auth.post("/logout", (c) => {
  endSession(c);
  return c.json({ message: "Logged out" });
});

// ユーザーがまだいなければ作成する (サインアップ)
// すでにいれば、Google アカウントの名前・画像の変更を反映する
async function findOrCreateUser(account: GoogleAccount) {
  const profile = {
    display_name: account.displayName,
    email: account.email,
    photo_url: account.photoUrl,
  };

  const users = db.collection(COLLECTIONS.users);
  const snapshot = await users.where("google_id", "==", account.googleId).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.update(profile);
    return doc.id;
  }

  const newUser: Omit<User, "id"> = {
    google_id: account.googleId,
    ...profile,
    workout_level: 1, // 最初は一番やさしいレベル。ホーム画面で変更できる
    user_level: 1,
    current_streak: 0,
    total_xp: 0,
    last_workout_at: null,
  };
  const docRef = await users.add(newUser);
  return docRef.id;
}
