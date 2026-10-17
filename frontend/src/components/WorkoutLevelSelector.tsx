import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { WORKOUT_LEVELS } from "../workoutLevels";

type Props = {
  workoutLevel: number;
  onChange: (workoutLevel: number) => void;
  onError: (message: string) => void;
};

// ホーム画面の運動レベル切り替え。変えると今日のメニューも変わる
// 右の「?」ボタンで各レベルの説明を表示する
export function WorkoutLevelSelector({ workoutLevel, onChange, onError }: Props) {
  const [saving, setSaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // 説明の外を押したら閉じる
  useEffect(() => {
    if (!helpOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!helpRef.current?.contains(e.target as Node)) setHelpOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [helpOpen]);

  const handleSelect = async (level: number) => {
    if (level === workoutLevel || saving) return;
    setSaving(true);
    try {
      await api.updateWorkoutLevel(level);
      onChange(level);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="level-selector">
      <span className="sub">運動レベル</span>
      <div className="level-controls">
        <div className="segmented" role="radiogroup" aria-label="運動レベル">
          {WORKOUT_LEVELS.map(({ level, name }) => (
            <button
              key={level}
              role="radio"
              aria-checked={level === workoutLevel}
              className={level === workoutLevel ? "selected" : ""}
              disabled={saving}
              onClick={() => handleSelect(level)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="level-help" ref={helpRef}>
          <button
            className="help-button"
            onClick={() => setHelpOpen(!helpOpen)}
            aria-label="運動レベルの説明"
            aria-expanded={helpOpen}
          >
            ?
          </button>
          {helpOpen ? (
            <dl className="level-help-panel">
              {WORKOUT_LEVELS.map(({ level, name, description }) => (
                <div key={level}>
                  <dt>{name}</dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}
