import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "./api/client";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { ReportTabScreen } from "./screens/ReportTabScreen";
import { WorkoutScreen } from "./screens/WorkoutScreen";
import type { Intensity, User, WorkoutMenu, WorkoutResult } from "./types";
import "./App.css";

type Screen =
  | { name: "loading" }
  | { name: "login" }
  | { name: "home" }
  | { name: "workout"; menu: WorkoutMenu; intensity: Intensity }
  | { name: "report"; result: WorkoutResult };

type Tab = "home" | "report-tab";

// Google ログインに失敗して戻ってきたときは URL に login_error が付いている
// 読み取ったら URL からは消しておく
const loginParams = new URLSearchParams(window.location.search);
window.history.replaceState(null, "", window.location.pathname);

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "loading" });
  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  // 起動時にログイン中か確認する
  useEffect(() => {
    api
      .getMe()
      .then((user) => {
        setUser(user);
        setScreen({ name: "home" });
      })
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) {
          setError((e as Error).message);
        } else if (loginParams.has("login_error")) {
          setError("ログインに失敗しました。もう一度お試しください");
        }
        setScreen({ name: "login" });
      });
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

  const updateWorkoutLevel = (workoutLevel: number) => {
    setUser((u) => (u ? { ...u, workout_level: workoutLevel } : u));
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
        return <LoginScreen />;
      case "home":
        if (!user) return null;
        if (tab === "report-tab") {
          return <ReportTabScreen onError={setError} />;
        }
        return (
          <HomeScreen
            user={user}
            onStart={(menu, intensity) =>
              setScreen({ name: "workout", menu, intensity })
            }
            onChangeWorkoutLevel={updateWorkoutLevel}
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
    <div className="app">
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
            className={`tab-button ${tab === "report-tab" ? "active" : ""}`}
            onClick={() => setTab("report-tab")}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">レポート</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
