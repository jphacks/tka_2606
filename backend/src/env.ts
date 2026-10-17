// backend/.env を読み込む
try {
  process.loadEnvFile();
} catch {
  // .env がない場合は、環境変数がすでに設定されている前提で進める
}

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} が設定されていません。backend/.env.example を参考に backend/.env を作ってください`);
  }
  return value;
}

export const env = {
  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
  SESSION_SECRET: required("SESSION_SECRET"),
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:3000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
};
