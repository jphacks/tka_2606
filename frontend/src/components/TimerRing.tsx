type Props = {
  remainingSec: number; // 表示する残り秒数 (整数)
  progress: number; // 残りの割合 (1 → 0)
  variant: "exercise" | "rest";
};

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// 残り時間の円形ゲージ。時間が経つにつれて円が減っていく
export function TimerRing({ remainingSec, progress, variant }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <div className={`timer-ring ${variant}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle className="timer-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
        <circle
          className="timer-ring-bar"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        />
      </svg>
      <p className="timer">{remainingSec}秒</p>
    </div>
  );
}
