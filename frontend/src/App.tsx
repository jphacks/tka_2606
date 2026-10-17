import { useCallback, useEffect, useState } from "react";
import { api, clearStoredUserId, getStoredUserId } from "./api/client";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { WorkoutScreen } from "./screens/WorkoutScreen";
import type { Intensity, User, WorkoutMenu, WorkoutResult } from "./types";
import "./App.css";

type Screen =
  | { name: "loading" }
  | { name: "login" }
  | { name: "onboarding" }
  | { name: "home" }
  | { name: "workout"; menu: WorkoutMenu; intensity: Intensity }
  | { name: "report"; result: WorkoutResult };

function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    getStoredUserId() ? { name: "loading" } : { name: "login" },
  );
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  // 保存済みのユーザーがいればホームへ
  useEffect(() => {
    if (!getStoredUserId()) return;
    api
      .getMe()
      .then((user) => {
        setUser(user);
        setScreen({ name: "home" });
      })
      .catch(() => {
        clearStoredUserId();
        setScreen({ name: "login" });
      });
  }, []);

  const handleFinishWorkout = useCallback(async () => {
    if (screen.name !== "workout") return;
    try {
      const result = await api.completeWorkout(screen.menu.id, screen.intensity);
      setUser(result.user);
      setScreen({ name: "report", result });
    } catch (e) {
      setError((e as Error).message);
    }
  }, [screen]);

  const renderScreen = () => {
    switch (screen.name) {
      case "loading":
        return <p>読み込み中...</p>;
      case "login":
        return (
          <LoginScreen
            onLogin={(user, isNew) => {
              setUser(user);
              setScreen(isNew ? { name: "onboarding" } : { name: "home" });
            }}
            onError={setError}
          />
        );
      case "onboarding":
        return (
          <OnboardingScreen
            onComplete={(workout_level) => {
              setUser((u) => (u ? { ...u, workout_level } : u));
              setScreen({ name: "home" });
            }}
            onError={setError}
          />
        );
      case "home":
        return user ? (
          <HomeScreen
            user={user}
            onStart={(menu, intensity) => setScreen({ name: "workout", menu, intensity })}
            onError={setError}
          />
        ) : null;
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
          <ReportScreen result={screen.result} onBackHome={() => setScreen({ name: "home" })} />
        );
    }
  };

  return (
    <div className="app">
      {error ? <p className="error">{error}</p> : null}
      {renderScreen()}
    </div>
  );
}

export default App;
