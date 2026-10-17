import { api, setStoredUserId } from "../api/client";
import type { User } from "../types";

type Props = {
  onLogin: (user: User, isNew: boolean) => void;
  onError: (message: string) => void;
};

export function LoginScreen({ onLogin, onError }: Props) {
  const handleLogin = async () => {
    try {
      // TODO: Googleログインに置き換える。今はランダムIDで仮ログイン
      const { user, isNew } = await api.login(`dummy-${crypto.randomUUID()}`);
      setStoredUserId(user.id);
      onLogin(user, isNew);
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <div className="screen">
      <h1>アプリ名</h1>
      <p>3分だけ、体を動かそう</p>
      <button className="primary" onClick={handleLogin}>
        Googleではじめる
      </button>
    </div>
  );
}
