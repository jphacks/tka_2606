import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AccountMenu } from "../components/AccountMenu";
import { CUSTOM_MENU_ID } from "../customMenu";
import { WorkoutLevelSelector } from "../components/WorkoutLevelSelector";
import type { CustomMenu, Intensity, User, WorkoutMenu } from "../types";

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
  onSelectCustomMenu: (customMenu: CustomMenu) => void;
  onLogout: () => void;
  onError: (message: string) => void;
};

export function HomeScreen({
  user,
  onStart,
  onChangeWorkoutLevel,
  onSelectCustomMenu,
  onLogout,
  onError,
}: Props) {
  const [menu, setMenu] = useState<WorkoutMenu | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [intensity, setIntensity] = useState<Intensity>("normal");

  // カスタムメニューの設定が変わったら、今日のメニューを取り直す
  const customMenuKey = JSON.stringify(user.custom_menu ?? null);

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
  }, [user.workout_level, customMenuKey, onError]);

  // 時間の＋／－ボタン
  const changeIntensity = (diff: number) => {
    const index = INTENSITIES.indexOf(intensity) + diff;
    if (index >= 0 && index < INTENSITIES.length) {
      setIntensity(INTENSITIES[index]);
    }
  };

  // カスタムメニューは設定で決めた秒数でやるので、＋／－は出さず強度を「普通」に固定する
  const isCustom = menu?.id === CUSTOM_MENU_ID;
  const effectiveIntensity: Intensity = isCustom ? "normal" : intensity;
  const m = INTENSITY_MULTIPLIER[effectiveIntensity];

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
        customMenu={user.custom_menu}
        onChange={onChangeWorkoutLevel}
        onSelectCustom={onSelectCustomMenu}
        onError={onError}
      />

      {menu ? (
        <div className="card">
          <p>今日のメニュー</p>
          <h2>{menu.title}</h2>
          <p>
            全{menu.exercises.length}種目 ／ 約
            {Math.round(menu.base_calories * m)}kcal
          </p>
          {isCustom ? (
            <p className="stepper">
              約{Math.max(1, Math.round(menu.base_duration_sec / 60))}分（1種目
              {menu.exercises[0]?.duration_sec ?? 0}秒）
            </p>
          ) : (
            <div className="stepper">
              <button onClick={() => changeIntensity(-1)}>－</button>
              <span>
                {Math.round((menu.base_duration_sec * m) / 60)}分（
                {INTENSITY_LABEL[intensity]}）
              </span>
              <button onClick={() => changeIntensity(1)}>＋</button>
            </div>
          )}
          <button className="primary" onClick={() => onStart(menu, effectiveIntensity)}>
            スタート
          </button>
        </div>
      ) : (
        <p>読み込み中...</p>
      )}

      <p className="sub">今日 {todayCount}人 が運動を完了しました</p>
    </div>
  );
}
