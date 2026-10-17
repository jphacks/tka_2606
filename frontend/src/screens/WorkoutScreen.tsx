import { useEffect, useMemo, useRef, useState } from "react";
import type { Intensity, WorkoutMenu } from "../types";

const INTENSITY_MULTIPLIER: Record<Intensity, number> = {
  low: 0.5,
  normal: 1,
  high: 1.5,
};

// 種目と種目の間の休憩 (クールタイム) の秒数
const REST_SEC = 5;

// タイマーの区切り。種目と休憩を交互に並べる (最後の種目のあとに休憩はない)
type Segment =
  | { type: "exercise"; name: string; duration_sec: number; exerciseIndex: number }
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
        duration_sec: Math.round(exercise.duration_sec * INTENSITY_MULTIPLIER[intensity]),
      })),
    [menu, intensity],
  );

  const segments = useMemo(
    () =>
      exercises.flatMap((exercise, i): Segment[] => {
        const segment: Segment = { type: "exercise", ...exercise, exerciseIndex: i };
        return i < exercises.length - 1
          ? [segment, { type: "rest", duration_sec: REST_SEC, nextExerciseIndex: i + 1 }]
          : [segment];
      }),
    [exercises],
  );
  const totalSec = segments.reduce((sum, s) => sum + s.duration_sec, 0);

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (elapsed >= totalSec && !finished.current) {
      finished.current = true;
      onFinish();
    }
  }, [elapsed, totalSec, onFinish]);

  // 経過時間から現在の区切りと残り時間を求める
  let index = 0;
  let start = 0;
  while (index < segments.length - 1 && elapsed >= start + segments[index].duration_sec) {
    start += segments[index].duration_sec;
    index++;
  }
  const current = segments[index];
  const segmentEnd = start + current.duration_sec;
  const remaining = Math.max(segmentEnd - elapsed, 0);

  if (current.type === "rest") {
    const next = exercises[current.nextExerciseIndex];
    return (
      <div className="screen">
        <p>休憩</p>
        <h2>次: {next.name}</h2>
        <p className="timer">{remaining}秒</p>
        <p className="sub">
          {current.nextExerciseIndex + 1}/{exercises.length}個目の準備をしよう
        </p>
        <button onClick={() => setElapsed(segmentEnd)}>スキップ</button>
        <button onClick={() => setPaused(!paused)}>{paused ? "再開" : "一時停止"}</button>
      </div>
    );
  }

  const next = exercises[current.exerciseIndex + 1];
  return (
    <div className="screen">
      <p>
        {current.exerciseIndex + 1}/{exercises.length}個目
      </p>
      <h2>{current.name}</h2>
      <p className="timer">{remaining}秒</p>
      <p className="sub">次: {next ? `休憩${REST_SEC}秒 → ${next.name}` : "ラスト！"}</p>
      <button onClick={() => setPaused(!paused)}>{paused ? "再開" : "一時停止"}</button>
    </div>
  );
}
