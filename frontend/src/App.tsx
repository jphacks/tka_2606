import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api/client";
import homeBgmSrc from "./assets/audio/listening-to-the-rain_c55a55c1.mp3";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { ReportTabScreen } from "./screens/ReportTabScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { TrainingListScreen } from "./screens/TrainingListScreen";
import { WorkoutScreen } from "./screens/WorkoutScreen";
import type {
  CustomMenu,
  Intensity,
  User,
  WorkoutMenu,
  WorkoutResult,
} from "./types";
import "./App.css";

type Screen =
  | { name: "loading" }
  | { name: "login" }
  | { name: "home" }
  | { name: "workout"; menu: WorkoutMenu; intensity: Intensity }
  | { name: "report"; result: WorkoutResult };

type Tab = "home" | "training-list" | "report-tab" | "settings";

// Google ログインに失敗して戻ってきたときは URL に login_error が付いている
// 読み取ったら URL からは消しておく
const loginParams = new URLSearchParams(window.location.search);
window.history.replaceState(null, "", window.location.pathname);

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "loading" });
  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const homeBgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(homeBgmSrc);
    audio.loop = true;
    audio.volume = 0.3;
    homeBgmRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const isHomeLike = screen.name === "home" || screen.name === "login";
  useEffect(() => {
    const audio = homeBgmRef.current;
    if (!audio) return;
    if (isHomeLike) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isHomeLike]);

  // macOS の自動再生制限を解除するため、最初のユーザー操作でも再生を試みる
  const handleAudioInteraction = () => {
    if (!isHomeLike) return;
    homeBgmRef.current?.play().catch(() => {});
  };

  // 起動時にログイン中か確認する
  useEffect(() => {
    api
      .getMe()
      .then((user) => {
        setUser(user);
        setScreen({ name: "home" });
      })
      // ログインしていないとき (サーバーにつながらないときも) はログイン画面を出す
      // トップページにはエラーの赤文字は出さない
      .catch(() => setScreen({ name: "login" }));
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      setScreen({ name: "login" });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // ゆるめ等を選ぶと、カスタムの選択は外れる
  const updateWorkoutLevel = (workoutLevel: number) => {
    setUser((u) =>
      u
        ? {
            ...u,
            workout_level: workoutLevel,
            custom_menu: u.custom_menu
              ? { ...u.custom_menu, selected: false }
              : u.custom_menu,
          }
        : u,
    );
  };

  const updateCustomMenu = (customMenu: CustomMenu) => {
    setUser((u) => (u ? { ...u, custom_menu: customMenu } : u));
  };

  const handleFinishWorkout = useCallback(async () => {
    if (screen.name !== "workout") return;
    try {
      const result = await api.completeWorkout(
        screen.menu.id,
        screen.intensity,
      );
      setUser(result.user);
      setScreen({ name: "report", result });
    } catch (e) {
      setError((e as Error).message);
    }
  }, [screen]);

  const showTabs = screen.name === "home" && user;

  const renderScreen = () => {
    switch (screen.name) {
      case "loading":
        return <p>読み込み中...</p>;
      case "login":
        return <LoginScreen loginFailed={loginParams.has("login_error")} />;
      case "home":
        if (!user) return null;
        if (tab === "training-list") {
          return <TrainingListScreen onError={setError} />;
        }
        if (tab === "report-tab") {
          return <ReportTabScreen onError={setError} />;
        }
        if (tab === "settings") {
          return (
            <SettingsScreen
              user={user}
              onSaved={updateCustomMenu}
              onError={setError}
            />
          );
        }
        return (
          <HomeScreen
            user={user}
            onStart={(menu, intensity) =>
              setScreen({ name: "workout", menu, intensity })
            }
            onChangeWorkoutLevel={updateWorkoutLevel}
            onSelectCustomMenu={updateCustomMenu}
            onLogout={handleLogout}
            onError={setError}
          />
        );
      case "workout":
        return (
          <WorkoutScreen
            menu={screen.menu}
            intensity={screen.intensity}
            onFinish={handleFinishWorkout}
          />
        );
      case "report":
        return (
          <ReportScreen
            result={screen.result}
            onBackHome={() => {
              setTab("home");
              setScreen({ name: "home" });
            }}
          />
        );
    }
  };

  return (
    <div className={`app ${showTabs ? "with-tabs" : ""}`} onClickCapture={handleAudioInteraction}>
      {error ? <p className="error">{error}</p> : null}
      {renderScreen()}

      {showTabs && (
        <nav className="bottom-tabs">
          <button
            className={`tab-button ${tab === "home" ? "active" : ""}`}
            onClick={() => setTab("home")}
          >
            <span className="tab-icon">🏠</span>
            <span className="tab-label">ホーム</span>
          </button>
          <button
            className={`tab-button ${tab === "training-list" ? "active" : ""}`}
            onClick={() => setTab("training-list")}
          >
            <span className="tab-icon">💪</span>
            <span className="tab-label">一覧</span>
          </button>
          <button
            className={`tab-button ${tab === "report-tab" ? "active" : ""}`}
            onClick={() => setTab("report-tab")}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">レポート</span>
          </button>
          <button
            className={`tab-button ${tab === "settings" ? "active" : ""}`}
            onClick={() => setTab("settings")}
          >
            <span className="tab-icon">⚙️</span>
            <span className="tab-label">設定</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
