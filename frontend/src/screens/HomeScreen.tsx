import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AccountMenu } from "../components/AccountMenu";
import { CUSTOM_MENU_ID } from "../customMenu";
import { WorkoutLevelSelector } from "../components/WorkoutLevelSelector";
import type { CustomMenu, Intensity, User, WorkoutMenu } from "../types";
import { formatDuration } from "../formatDuration";

// 時間の＋／－ (強度) はなくし、どのメニューも決まった秒数 (強度「普通」) でやる
const FIXED_INTENSITY: Intensity = "normal";

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

  const isCustom = menu?.id === CUSTOM_MENU_ID;

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
          {isCustom ? (
            <>
              <h2>{menu.title}</h2>
              <p>
                全{menu.exercises.length}種目 ／ 約{menu.base_calories}kcal
              </p>
            </>
          ) : (
            // どの種目かはスタートするまで隠す (クリアするまで種目は変わらない)
            <>
              <h2 className="mystery-title">？？？</h2>
              <p className="sub">何の種目かはスタートしてからのお楽しみ</p>
            </>
          )}
          <p className="stepper">
            {formatDuration(menu.base_duration_sec)}
            {isCustom ? `（1種目${menu.exercises[0]?.duration_sec ?? 0}秒）` : ""}
          </p>
          <button className="primary" onClick={() => onStart(menu, FIXED_INTENSITY)}>
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
