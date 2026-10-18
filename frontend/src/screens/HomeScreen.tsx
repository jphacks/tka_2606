import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AccountMenu } from "../components/AccountMenu";
import { CUSTOM_MENU_ID } from "../customMenu";
import { Pet } from "../components/Pet";
import { WorkoutLevelSelector } from "../components/WorkoutLevelSelector";
import type { CustomMenu, Intensity, TodayReport, User, WorkoutMenu } from "../types";
import { formatDuration } from "../formatDuration";
import { XP_PER_LEVEL } from "../progress";

// 時間の＋／－ (強度) はなくし、どのメニューも決まった秒数 (強度「普通」) でやる
const FIXED_INTENSITY: Intensity = "normal";

// 時間帯に合わせたあいさつ
function greeting(hour = new Date().getHours()) {
  if (hour < 5) return "夜ふかし中";
  if (hour < 11) return "おはよう";
  if (hour < 18) return "こんにちは";
  return "こんばんは";
}

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
  const [todayReport, setTodayReport] = useState<TodayReport | null>(null);

  // カスタムメニューの設定が変わったら、今日のメニューを取り直す
  const customMenuKey = JSON.stringify(user.custom_menu ?? null);

  useEffect(() => {
    let ignore = false; // レベルを素早く切り替えたとき、古い結果で上書きしない
    const fetchData = async () => {
      try {
        const [menu, { count }, report] = await Promise.all([
          api.getTodayMenu(),
          api.getTodayCount(),
          api.getTodayReport(),
        ]);
        if (ignore) return;
        setMenu(menu);
        setTodayCount(count);
        setTodayReport(report);
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
  const doneToday = (todayReport?.logs.length ?? 0) > 0;
  const xpInLevel = user.total_xp % XP_PER_LEVEL;
  const name = user.display_name || "ゲスト";

  return (
    <div className="screen home">
      <div className="home-bg" aria-hidden="true" />

      <header className="home-header">
        <p className="home-hello">
          <span className="home-greeting">{greeting()}、</span>
          {name}さん
        </p>
        <AccountMenu user={user} onLogout={onLogout} />
      </header>

      <div className="home-stats">
        <div className="home-stat home-stat-streak">
          <span className="home-stat-icon" aria-hidden="true">
            🔥
          </span>
          <span>
            <strong>{user.current_streak}</strong>日連続
          </span>
        </div>
        <div className="home-stat home-stat-level">
          <Pet userLevel={user.user_level} static />
          <span className="home-level">
            <span>
              Lv. <strong>{user.user_level}</strong>
            </span>
            <span
              className="home-xp-track"
              role="progressbar"
              aria-label="次のレベルまでの経験値"
              aria-valuemin={0}
              aria-valuemax={XP_PER_LEVEL}
              aria-valuenow={xpInLevel}
            >
              <span
                className="home-xp-bar"
                style={{ width: `${(xpInLevel / XP_PER_LEVEL) * 100}%` }}
              />
            </span>
          </span>
        </div>
      </div>

      <WorkoutLevelSelector
        workoutLevel={user.workout_level}
        customMenu={user.custom_menu}
        onChange={onChangeWorkoutLevel}
        onSelectCustom={onSelectCustomMenu}
        onError={onError}
      />

      {menu ? (
        <section className="home-hero">
          <div className="home-hero-top">
            <span className="home-hero-label">今日のメニュー</span>
            {doneToday ? <span className="home-hero-done">✓ 今日はクリア済み</span> : null}
          </div>
          {isCustom ? (
            <>
              <h2 className="home-hero-title">{menu.title}</h2>
              <p className="home-hero-sub">
                全{menu.exercises.length}種目 ／ 約{menu.base_calories}kcal
              </p>
            </>
          ) : (
            // どの種目かはスタートするまで隠す (クリアするまで種目は変わらない)
            <>
              <h2 className="home-hero-title home-mystery">？？？</h2>
              <p className="home-hero-sub">何が出るかはスタートしてからのお楽しみ</p>
            </>
          )}
          <span className="home-duration">
            ⏱ {formatDuration(menu.base_duration_sec)}
            {isCustom ? `（1種目${menu.exercises[0]?.duration_sec ?? 0}秒）` : ""}
          </span>
          <button className="home-start" onClick={() => onStart(menu, FIXED_INTENSITY)}>
            <span aria-hidden="true">▶</span>
            {doneToday ? "もう1回やる" : "スタート"}
          </button>
        </section>
      ) : (
        <section className="home-hero home-hero-loading">
          <p>読み込み中...</p>
        </section>
      )}

      <p className="home-count">
        <span aria-hidden="true">👥</span> 今日 <strong>{todayCount}人</strong> が運動を完了しました
      </p>

      <div className="home-pet">
        <Pet userLevel={user.user_level} user={user} todayReport={todayReport} />
      </div>
    </div>
  );
}
