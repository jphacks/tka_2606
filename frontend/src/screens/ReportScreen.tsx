import type { WorkoutResult } from "../types";

type Props = {
  result: WorkoutResult;
  onBackHome: () => void;
};

export function ReportScreen({ result, onBackHome }: Props) {
  const { log, user, previous_streak, leveled_up, xp_to_next_level } = result;

  return (
    <div className="screen">
      <h1>クリア！お疲れ様</h1>
      <p>
        🔥 {previous_streak}日 → {user.current_streak}日連続達成
      </p>
      <div className="card">
        <p>運動時間: {Math.round(log.actual_duration_sec / 60)}分</p>
        <p>消費カロリー: {log.actual_calories}kcal</p>
        <p>獲得XP: +{log.earned_xp}</p>
        {leveled_up ? <p>レベルアップ！ Lv. {user.user_level}</p> : null}
        <p>レベルアップまであと {xp_to_next_level}XP</p>
      </div>
      {/* TODO: 他ユーザーの完了通知 */}
      <button className="primary" onClick={onBackHome}>
        ホームに戻る
      </button>
    </div>
  );
}
