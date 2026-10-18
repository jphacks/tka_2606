import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { CustomMenu } from "../types";
import { CUSTOM_LEVEL, WORKOUT_LEVELS } from "../workoutLevels";

type Props = {
  workoutLevel: number;
  customMenu: CustomMenu | null | undefined;
  onChange: (workoutLevel: number) => void;
  onSelectCustom: (customMenu: CustomMenu) => void;
  onError: (message: string) => void;
};

// ホーム画面の運動レベル切り替え (ゆるめ・ふつう・しっかり・カスタム)。変えると今日のメニューも変わる
// 右の「?」ボタンで各レベルの説明を表示する
export function WorkoutLevelSelector({
  workoutLevel,
  customMenu,
  onChange,
  onSelectCustom,
  onError,
}: Props) {
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

  // カスタムは設定タブでメニューを作ってから選べる
  const customAvailable = !!customMenu && customMenu.exercise_names.length > 0;
  const customSelected = customAvailable && customMenu.selected;

  const handleSelect = async (level: number) => {
    if ((level === workoutLevel && !customSelected) || saving) return;
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

  const handleSelectCustom = async () => {
    if (customSelected || saving) return;
    setSaving(true);
    try {
      const { custom_menu } = await api.selectCustomMenu();
      onSelectCustom(custom_menu);
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
          {WORKOUT_LEVELS.map(({ level, name }) => {
            const selected = level === workoutLevel && !customSelected;
            return (
              <button
                key={level}
                role="radio"
                aria-checked={selected}
                className={selected ? "selected" : ""}
                disabled={saving}
                onClick={() => handleSelect(level)}
              >
                {name}
              </button>
            );
          })}
          <button
            role="radio"
            aria-checked={customSelected}
            className={customSelected ? "selected" : ""}
            disabled={saving || !customAvailable}
            title={customAvailable ? undefined : "設定タブでカスタムメニューを作ると選べます"}
            onClick={handleSelectCustom}
          >
            {CUSTOM_LEVEL.name}
          </button>
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
            <div className="level-help-panel">
              <dl>
                {WORKOUT_LEVELS.map(({ level, name, target, description }) => (
                  <div key={level}>
                    <dt>{name}</dt>
                    <dd>
                      <span className="level-help-target">{target}</span>
                      {description}
                    </dd>
                  </div>
                ))}
                <div>
                  <dt>{CUSTOM_LEVEL.name}</dt>
                  <dd>
                    <span className="level-help-target">{CUSTOM_LEVEL.target}</span>
                    {CUSTOM_LEVEL.description}
                    {customAvailable ? "" : "（まだ作られていません）"}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
