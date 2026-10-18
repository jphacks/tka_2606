import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TimerRing } from "../components/TimerRing";
import type { Intensity, WorkoutMenu } from "../types";
import bgmSrc from "../assets/audio/bodyweight-training-ii_1cfde3fa.mp3";
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
      body_part: string;
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

  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(bgmSrc);
    audio.loop = true;
    audio.volume = 0.4;
    bgmRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const inCountdown = elapsed < 0;
  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    if (paused || finished.current || inCountdown) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [paused, inCountdown]);

  const handleFinishWithBgm = useCallback(() => {
    bgmRef.current?.pause();
    onFinish();
  }, [onFinish]);

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
      handleFinishWithBgm();
    }
  }, [elapsed, totalSec, handleFinishWithBgm]);

  // カウントダウン中は、最初の種目を見せて構えてもらう
  if (elapsed < 0) {
    const first = exercises[0];
    const count = Math.ceil(-elapsed);
    return (
      <div className="screen countdown">
        <p>まもなくスタート</p>
        <p className="countdown-number" key={count} aria-live="assertive">
          {count}
        </p>
        <p className="sub">
          1種目め: <strong>{first.name}</strong>
        </p>
        <img className="workout-gif" src={WORKOUT_IMAGES[first.image]} alt={first.name} />
        <button onClick={() => setElapsedMs(0)}>すぐ始める</button>
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

  const pauseButton = (
    <button className="workout-pause" onClick={() => setPaused(!paused)}>
      {paused ? "▶ 再開" : "❚❚ 一時停止"}
    </button>
  );

  // 休憩中は、次の種目のお手本を見せて準備してもらう
  if (current.type === "rest") {
    const next = exercises[current.nextExerciseIndex];
    return (
      <div className="screen workout workout-rest">
        {overall}
        <div className="workout-tags">
          <span className="workout-step">休憩</span>
          <span className="workout-part">
            次は {current.nextExerciseIndex + 1}/{exercises.length}種目め
          </span>
        </div>
        <h2 className="workout-name">
          <span className="workout-name-label">次の種目</span>
          {next.name}
        </h2>
        <img className="workout-gif" src={WORKOUT_IMAGES[next.image]} alt={next.name} />
        <div className="workout-bottom">
          <TimerRing
            key={index}
            remainingSec={remainingSec}
            progress={progress}
            variant="rest"
          />
          <div className="workout-actions">
            <button onClick={() => setElapsedMs(segmentEnd * 1000)}>スキップ</button>
            {pauseButton}
          </div>
        </div>
      </div>
    );
  }

  const next = exercises[current.exerciseIndex + 1];
  return (
    <div className="screen workout">
      {overall}
      <div className="workout-tags">
        <span className="workout-step">
          {current.exerciseIndex + 1}/{exercises.length}種目め
        </span>
        <span className="workout-part">{current.body_part}</span>
      </div>
      <h2 className="workout-name">
        <span className="workout-name-label">いまの種目</span>
        {current.name}
      </h2>
      <img
        className="workout-gif"
        src={WORKOUT_IMAGES[current.image]}
        alt={current.name}
      />
      <p className="workout-hint">お手本の動きをまねしよう</p>
      <div className="workout-bottom">
        <TimerRing
          key={index}
          remainingSec={remainingSec}
          progress={progress}
          variant="exercise"
        />
        <div className="workout-actions">{pauseButton}</div>
      </div>
      <p className="workout-next">
        {next ? (
          <>
            次: 休憩{REST_SEC}秒 → <strong>{next.name}</strong>
          </>
        ) : (
          <strong>ラスト！ がんばろう</strong>
        )}
      </p>
    </div>
  );
}
