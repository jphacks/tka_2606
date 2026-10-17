import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AccountMenu } from "../components/AccountMenu";
import { Calendar } from "../components/Calendar";
import { WorkoutLevelSelector } from "../components/WorkoutLevelSelector";
import type { Intensity, User, WorkoutMenu } from "../types";

const INTENSITIES: Intensity[] = ["low", "normal", "high"];
const INTENSITY_LABEL: Record<Intensity, string> = {
  low: "弱",
  normal: "普通",
  high: "強",
};
const INTENSITY_MULTIPLIER: Record<Intensity, number> = {
  low: 0.5,
  normal: 1,
  high: 1.5,
};

type Props = {
  user: User;
  onStart: (menu: WorkoutMenu, intensity: Intensity) => void;
  onChangeWorkoutLevel: (workoutLevel: number) => void;
  onLogout: () => void;
  onError: (message: string) => void;
};

export function HomeScreen({ user, onStart, onChangeWorkoutLevel, onLogout, onError }: Props) {
  const [menu, setMenu] = useState<WorkoutMenu | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [intensity, setIntensity] = useState<Intensity>("normal");

  // 運動レベルが変わったら、今日のメニューを取り直す
  useEffect(() => {
    let ignore = false; // レベルを素早く切り替えたとき、古い結果で上書きしない
    const fetchData = async () => {
      try {
        const [menu, { count }] = await Promise.all([
          api.getTodayMenu(),
          api.getTodayCount(),
        ]);
        if (ignore) return;
        setMenu(menu);
        setTodayCount(count);
      } catch (e) {
        onError((e as Error).message);
      }
    };
    fetchData();
    return () => {
      ignore = true;
    };
  }, [user.workout_level, onError]);

  // 時間の＋／－ボタン
  const changeIntensity = (diff: number) => {
    const index = INTENSITIES.indexOf(intensity) + diff;
    if (index >= 0 && index < INTENSITIES.length) {
      setIntensity(INTENSITIES[index]);
    }
  };

  const m = INTENSITY_MULTIPLIER[intensity];

  return (
    <div className="screen">
      <header className="home-header">
        <div className="status">
          <span>🔥 {user.current_streak}日連続</span>
          <span>Lv. {user.user_level}</span>
        </div>
        <AccountMenu user={user} onLogout={onLogout} />
      </header>

      <WorkoutLevelSelector
        workoutLevel={user.workout_level}
        onChange={onChangeWorkoutLevel}
        onError={onError}
      />

      {menu ? (
        <div className="card">
          <p>今日のメニュー</p>
          <h2>{menu.title}</h2>
          <p>
            難易度 {menu.target_workout_level} ／ 約
            {Math.round(menu.base_calories * m)}kcal
          </p>
          <div className="stepper">
            <button onClick={() => changeIntensity(-1)}>－</button>
            <span>
              {Math.round((menu.base_duration_sec * m) / 60)}分（
              {INTENSITY_LABEL[intensity]}）
            </span>
            <button onClick={() => changeIntensity(1)}>＋</button>
          </div>
          <button className="primary" onClick={() => onStart(menu, intensity)}>
            スタート
          </button>
        </div>
      ) : (
        <p>読み込み中...</p>
      )}

      <p className="sub">今日 {todayCount}人 が運動を完了しました</p>

      <Calendar onError={onError} />
    </div>
  );
}
