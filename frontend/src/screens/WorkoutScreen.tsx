import { useEffect, useMemo, useRef, useState } from "react";
import type { Intensity, WorkoutMenu } from "../types";

const INTENSITY_MULTIPLIER: Record<Intensity, number> = {
  low: 0.5,
  normal: 1,
  high: 1.5,
};

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
  const totalSec = exercises.reduce((sum, e) => sum + e.duration_sec, 0);

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

  // 経過時間から現在の種目と残り時間を求める
  let index = 0;
  let start = 0;
  while (index < exercises.length - 1 && elapsed >= start + exercises[index].duration_sec) {
    start += exercises[index].duration_sec;
    index++;
  }
  const current = exercises[index];
  const next = exercises[index + 1];
  const remaining = Math.max(start + current.duration_sec - elapsed, 0);

  return (
    <div className="screen">
      <p>
        {index + 1}/{exercises.length}個目
      </p>
      <h2>{current.name}</h2>
      <p className="timer">{remaining}秒</p>
      <p className="sub">次: {next ? next.name : "ラスト！"}</p>
      <button onClick={() => setPaused(!paused)}>{paused ? "再開" : "一時停止"}</button>
    </div>
  );
}
