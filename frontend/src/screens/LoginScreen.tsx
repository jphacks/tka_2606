import { api } from "../api/client";

export function LoginScreen() {
  return (
    <div className="screen">
      <h1>アプリ名</h1>
      <p>3分だけ、体を動かそう</p>
      <button className="primary" onClick={api.loginWithGoogle}>
        Googleではじめる
      </button>
    </div>
  );
}
