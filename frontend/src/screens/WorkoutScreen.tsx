import { useEffect, useMemo, useRef, useState } from "react";
import { TimerRing } from "../components/TimerRing";
import type { Intensity, WorkoutMenu } from "../types";
import standingForwardBend from "../assets/workouts/standing-forward-bend.gif";
import abs from "../assets/workouts/abs.gif";
import highKnees from "../assets/workouts/high-knees.gif";
import singleLegSquat from "../assets/workouts/single-leg-squat.gif";
import vUp from "../assets/workouts/v-up.gif";
import wallPushUp from "../assets/workouts/wall-push-up.gif";
import pushUp from "../assets/workouts/push-up.gif";
import squat from "../assets/workouts/squat.gif";
import burpees from "../assets/workouts/burpees.gif";
import standingCalfRaises from "../assets/workouts/standing-calf-raises.gif";
import gluteBridges from "../assets/workouts/glute-bridges.gif";
import forearmPlank from "../assets/workouts/forearm-plank.gif";
import backExtensions from "../assets/workouts/back-extensions.gif";
import fastPacedHighKnees from "../assets/workouts/fast-paced-high-knees.gif";
import plyometricPushUps from "../assets/workouts/plyometric-push-ups.gif";

const WORKOUT_IMAGES: Record<string, string> = {
  "standing-forward-bend.gif": standingForwardBend,
  "abs.gif": abs,
  "high-knees.gif": highKnees,
  "single-leg-squat.gif": singleLegSquat,
  "v-up.gif": vUp,
  "wall-push-up.gif": wallPushUp,
  "push-up.gif": pushUp,
  "squat.gif": squat,
  "burpees.gif": burpees,
  "standing-calf-raises.gif": standingCalfRaises,
  "glute-bridges.gif": gluteBridges,
  "forearm-plank.gif": forearmPlank,
  "back-extensions.gif": backExtensions,
  "fast-paced-high-knees.gif": fastPacedHighKnees,
  "plyometric-push-ups.gif": plyometricPushUps,
};

const INTENSITY_MULTIPLIER: Record<Intensity, number> = {
  low: 0.5,
  normal: 1,
  high: 1.5,
};

// 種目と種目の間の休憩 (クールタイム) の秒数
const REST_SEC = 5;

// ゲージを滑らかに動かすため、0.1秒ごとに経過時間を進める
const TICK_MS = 100;

// 運動が始まる前のカウントダウンの秒数
const COUNTDOWN_SEC = 3;

// タイマーの区切り。種目と休憩を交互に並べる (最後の種目のあとに休憩はない)
type Segment =
  | {
      type: "exercise";
      name: string;
      duration_sec: number;
      image: string;
      exerciseIndex: number;
    }
  | { type: "rest"; duration_sec: number; nextExerciseIndex: number };

type Props = {
  menu: WorkoutMenu;
  intensity: Intensity;
  onFinish: () => void;
};

export function WorkoutScreen({ menu, intensity, onFinish }: Props) {
  const exercises = useMemo(
    () =>
      menu.exercises.map((exercise) => ({
        ...exercise,
        duration_sec: Math.round(
          exercise.duration_sec * INTENSITY_MULTIPLIER[intensity],
        ),
      })),
    [menu, intensity],
  );

  const segments = useMemo(
    () =>
      exercises.flatMap((exercise, i): Segment[] => {
        const segment: Segment = {
          type: "exercise",
          ...exercise,
          exerciseIndex: i,
        };
        return i < exercises.length - 1
          ? [
              segment,
              {
                type: "rest",
                duration_sec: REST_SEC,
                nextExerciseIndex: i + 1,
              },
            ]
          : [segment];
      }),
    [exercises],
  );
  const totalSec = segments.reduce((sum, s) => sum + s.duration_sec, 0);

  // マイナスの間はカウントダウン (-3秒から始めて、0秒で1種目めが始まる)
  const [elapsedMs, setElapsedMs] = useState(-COUNTDOWN_SEC * 1000);
  const [paused, setPaused] = useState(false);
  const finished = useRef(false);
  const elapsed = elapsedMs / 1000;

  // 実際に経った時間を足していく (タブが裏に回って setInterval が遅れてもずれない)
  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      setElapsedMs((e) => e + delta);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (elapsed >= totalSec && !finished.current) {
      finished.current = true;
      onFinish();
    }
  }, [elapsed, totalSec, onFinish]);

  // カウントダウン中は、最初の種目を見せて構えてもらう
  if (elapsed < 0) {
    const first = exercises[0];
    const count = Math.ceil(-elapsed);
    return (
      <div className="screen countdown">
        <p>まもなくスタート</p>
        <p className="countdown-number" aria-live="assertive">
          {count}
        </p>
        <p className="sub">
          1種目め: <strong>{first.name}</strong>
        </p>
        <img className="workout-gif" src={WORKOUT_IMAGES[first.image]} alt={first.name} />
      </div>
    );
  }

  // 経過時間から現在の区切りと残り時間を求める
  let index = 0;
  let start = 0;
  while (
    index < segments.length - 1 &&
    elapsed >= start + segments[index].duration_sec
  ) {
    start += segments[index].duration_sec;
    index++;
  }
  const current = segments[index];
  const segmentEnd = start + current.duration_sec;
  const remaining = Math.max(segmentEnd - elapsed, 0);
  const remainingSec = Math.ceil(remaining);
  const progress = remaining / current.duration_sec;

  // 全体の進み具合のバー
  const overall = (
    <div className="overall-progress" aria-label="全体の進み具合">
      <div
        className="overall-progress-bar"
        style={{ width: `${Math.min(elapsed / totalSec, 1) * 100}%` }}
      />
    </div>
  );

  if (current.type === "rest") {
    const next = exercises[current.nextExerciseIndex];
    return (
      <div className="screen">
        {overall}
        <p>休憩</p>
        <h2>次: {next.name}</h2>
        <TimerRing
          key={index}
          remainingSec={remainingSec}
          progress={progress}
          variant="rest"
        />
        <p className="sub">
          {current.nextExerciseIndex + 1}/{exercises.length}個目の準備をしよう
        </p>
        <button onClick={() => setElapsedMs(segmentEnd * 1000)}>
          スキップ
        </button>
        <button onClick={() => setPaused(!paused)}>
          {paused ? "再開" : "一時停止"}
        </button>
      </div>
    );
  }

  const next = exercises[current.exerciseIndex + 1];
  return (
    <div className="screen">
      {overall}
      <p>
        {current.exerciseIndex + 1}/{exercises.length}個目
      </p>
      <TimerRing
        key={index}
        remainingSec={remainingSec}
        progress={progress}
        variant="exercise"
      />
      <h2>{current.name}</h2>
      <p className="sub">
        次: {next ? `休憩${REST_SEC}秒 → ${next.name}` : "ラスト！"}
      </p>
      <button onClick={() => setPaused(!paused)}>
        {paused ? "再開" : "一時停止"}
      </button>
      <img
        className="workout-gif"
        src={WORKOUT_IMAGES[current.image]}
        alt={current.name}
      />
    </div>
  );
}
