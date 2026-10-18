import { useEffect, useState } from "react";
import { Confetti } from "../components/Confetti";
import { Pet } from "../components/Pet";
import { playClearSound, playLevelUpSound } from "../clearSound";
import { useCountUp } from "../useCountUp";
import type { WorkoutResult } from "../types";
import { formatDuration } from "../formatDuration";

// backend の services/progress.ts の XP_PER_LEVEL と同じ値
const XP_PER_LEVEL = 100;

// 演出のタイミング (ミリ秒)
const STATS_AT = 600; // 数字が出始める
const XP_BAR_AT = 1800; // XP ゲージが伸び始める
const LEVEL_UP_AT = 2700; // ゲージが満タンになってレベルアップ

type Props = {
  result: WorkoutResult;
  onBackHome: () => void;
};

type XpPhase = "before" | "filling" | "leveled";

export function ReportScreen({ result, onBackHome }: Props) {
  const { log, user, previous_streak, leveled_up } = result;

  const calories = useCountUp(log.actual_calories, 1000, STATS_AT);
  const xp = useCountUp(log.earned_xp, 1000, STATS_AT + 150);
  const [xpPhase, setXpPhase] = useState<XpPhase>("before");

  // 今のレベルの中で何 XP たまっているか (レベルアップしたときは前のレベルから伸ばす)
  // 1回で何レベルも上がることがあるので、運動前の XP から前のレベルを求める
  const xpNow = user.total_xp % XP_PER_LEVEL;
  const totalXpBefore = user.total_xp - log.earned_xp;
  const xpBefore = totalXpBefore % XP_PER_LEVEL;
  const levelBefore = Math.floor(totalXpBefore / XP_PER_LEVEL) + 1;
  const xpWidth = {
    before: xpBefore,
    filling: leveled_up ? XP_PER_LEVEL : xpNow,
    leveled: xpNow,
  }[xpPhase];

  useEffect(() => {
    playClearSound();
    navigator.vibrate?.([80, 40, 80, 40, 200]);
    const timers = [setTimeout(() => setXpPhase("filling"), XP_BAR_AT)];
    if (leveled_up) {
      timers.push(
        setTimeout(() => {
          setXpPhase("leveled");
          playLevelUpSound();
          navigator.vibrate?.([200, 60, 200]);
        }, LEVEL_UP_AT),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [leveled_up]);

  return (
    <div className="screen clear-screen">
      <div className="clear-flash" aria-hidden="true" />
      <Confetti bursts={leveled_up ? [0, 500, LEVEL_UP_AT] : [0, 500]} />

      <div className="clear-burst" aria-hidden="true" />
      <h1 className="clear-title">
        {"CLEAR!!".split("").map((char, i) => (
          <span key={i} style={{ animationDelay: `${i * 60}ms` }}>
            {char}
          </span>
        ))}
      </h1>
      <p className="clear-subtitle">お疲れ様！今日もやりきった</p>

      <div className="clear-stats">
        <div className="clear-stat" style={{ animationDelay: `${STATS_AT}ms` }}>
          <span className="clear-stat-value">{formatDuration(log.actual_duration_sec)}</span>
          <span className="clear-stat-label">運動時間</span>
        </div>
        <div className="clear-stat" style={{ animationDelay: `${STATS_AT + 100}ms` }}>
          <span className="clear-stat-value">{calories}kcal</span>
          <span className="clear-stat-label">消費カロリー</span>
        </div>
        <div className="clear-stat" style={{ animationDelay: `${STATS_AT + 200}ms` }}>
          <span className="clear-stat-value">+{xp}XP</span>
          <span className="clear-stat-label">獲得XP</span>
        </div>
      </div>

      <div className="clear-streak" style={{ animationDelay: `${STATS_AT + 600}ms` }}>
        <span className="clear-streak-flame" aria-hidden="true">
          🔥
        </span>
        {/* 今日2回目以降は連続日数が変わらないので、今の日数だけ出す */}
        {previous_streak === user.current_streak ? (
          <strong className="clear-streak-after">{user.current_streak}日連続</strong>
        ) : (
          <span>
            <span className="clear-streak-before">{previous_streak}日</span>
            {" → "}
            <strong className="clear-streak-after">{user.current_streak}日連続</strong>
          </span>
        )}
      </div>

      <div className="clear-xp" style={{ animationDelay: `${XP_BAR_AT - 300}ms` }}>
        <div className="clear-xp-label">
          <span>Lv. {xpPhase === "leveled" ? user.user_level : levelBefore}</span>
          <span>
            次のレベルまで {XP_PER_LEVEL - (xpPhase === "before" ? xpBefore : xpNow)}XP
          </span>
        </div>
        <div className="clear-xp-track">
          <div
            className={`clear-xp-bar ${xpPhase === "leveled" ? "no-transition" : ""}`}
            style={{ width: `${(xpWidth / XP_PER_LEVEL) * 100}%` }}
          />
        </div>
      </div>

      {xpPhase === "leveled" ? (
        <div className="level-up" role="status">
          <span className="level-up-text">LEVEL UP!</span>
          <span className="level-up-level">Lv. {user.user_level}</span>
        </div>
      ) : null}

      <Pet userLevel={user.user_level} leveledUp={leveled_up} />

      <button
        className="primary clear-home-button"
        style={{ animationDelay: `${leveled_up ? LEVEL_UP_AT + 600 : XP_BAR_AT + 400}ms` }}
        onClick={onBackHome}
      >
        ホームに戻る
      </button>
    </div>
  );
}
