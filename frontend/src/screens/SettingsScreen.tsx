import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { CUSTOM_MENU_DURATIONS, CUSTOM_MENU_MAX_EXERCISES } from "../customMenu";
import type { CustomMenu, Exercise, User } from "../types";

// 設定タブで編集する部分 (ホームで選んでいるかどうかは含めない)
type Draft = Pick<CustomMenu, "exercise_names" | "exercise_duration_sec">;

const DEFAULT_DRAFT: Draft = {
  exercise_names: [],
  exercise_duration_sec: 30,
};

const imageUrl = (image: string) =>
  new URL(`../assets/workouts/${image}`, import.meta.url).href;

type Props = {
  user: User;
  onSaved: (customMenu: CustomMenu) => void;
  onError: (message: string) => void;
};

// 設定タブ。今はカスタムメニューの設定だけ
export function SettingsScreen({ user, onSaved, onError }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [draft, setDraft] = useState<Draft>(() =>
    user.custom_menu
      ? {
          exercise_names: user.custom_menu.exercise_names,
          exercise_duration_sec: user.custom_menu.exercise_duration_sec,
        }
      : DEFAULT_DRAFT,
  );
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  // 選べる種目 = 全メニューの種目
  useEffect(() => {
    api
      .getMenus()
      .then((menus) => setExercises(menus.flatMap((menu) => menu.exercises)))
      .catch((e) => onError((e as Error).message));
  }, [onError]);

  const byName = useMemo(() => new Map(exercises.map((e) => [e.name, e])), [exercises]);
  const selected = draft.exercise_names
    .map((name) => byName.get(name))
    .filter((e) => e !== undefined);
  const isFull = draft.exercise_names.length >= CUSTOM_MENU_MAX_EXERCISES;

  // 目安の合計時間・カロリー
  const sec = draft.exercise_duration_sec;
  const totalSec = sec * selected.length;
  const totalCalories = selected.reduce(
    (sum, e) => sum + Math.round((e.calories / e.duration_sec) * sec),
    0,
  );

  const update = (changes: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setSavedMessage("");
  };

  const add = (name: string) => {
    if (isFull || draft.exercise_names.includes(name)) return;
    update({ exercise_names: [...draft.exercise_names, name] });
  };

  const remove = (name: string) => {
    update({ exercise_names: draft.exercise_names.filter((n) => n !== name) });
  };

  const move = (index: number, diff: number) => {
    const names = [...draft.exercise_names];
    const to = index + diff;
    if (to < 0 || to >= names.length) return;
    [names[index], names[to]] = [names[to], names[index]];
    update({ exercise_names: names });
  };

  const save = async () => {
    setSaving(true);
    try {
      const { custom_menu } = await api.updateCustomMenu(draft);
      onSaved(custom_menu);
      setSavedMessage("保存しました");
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen settings">
      <h2>設定</h2>

      <section className="card settings-section">
        <div className="settings-section-header">
          <h3>カスタムメニュー</h3>
        </div>
        <p className="sub settings-note">
          保存すると、ホームの運動レベルで「カスタム」を選べるようになります
        </p>

        <div className="settings-field">
          <div className="settings-field-label">
            <span>選んだ種目</span>
            <span className={`custom-count ${isFull ? "full" : ""}`}>
              {draft.exercise_names.length}/{CUSTOM_MENU_MAX_EXERCISES}
            </span>
          </div>
          {selected.length === 0 ? (
            <p className="sub">下の一覧から種目を追加してください</p>
          ) : (
            <ol className="custom-selected">
              {selected.map((exercise, i) => (
                <li key={exercise.name}>
                  <span className="custom-order">{i + 1}</span>
                  <span className="custom-name">{exercise.name}</span>
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="上へ">
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === selected.length - 1}
                    aria-label="下へ"
                  >
                    ↓
                  </button>
                  <button onClick={() => remove(exercise.name)} aria-label="外す">
                    ×
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="settings-field">
          <div className="settings-field-label">
            <span>1種目の時間</span>
          </div>
          <div className="segmented">
            {CUSTOM_MENU_DURATIONS.map((option) => (
              <button
                key={option}
                className={sec === option ? "selected" : ""}
                onClick={() => update({ exercise_duration_sec: option })}
              >
                {option}秒
              </button>
            ))}
          </div>
        </div>

        {selected.length > 0 ? (
          <p className="sub">
            合計 約{Math.max(1, Math.round(totalSec / 60))}分 ／ 約{totalCalories}kcal
          </p>
        ) : null}

        <button className="primary" onClick={save} disabled={saving}>
          {saving ? "保存中..." : "保存する"}
        </button>
        {savedMessage ? <p className="sub settings-saved">{savedMessage}</p> : null}
      </section>

      <section className="settings-field">
        <div className="settings-field-label">
          <span>種目を追加</span>
          {isFull ? <span className="sub">上限の{CUSTOM_MENU_MAX_EXERCISES}種目まで選んでいます</span> : null}
        </div>
        <div className="custom-catalog">
          {exercises.map((exercise) => {
            const added = draft.exercise_names.includes(exercise.name);
            return (
              <button
                key={exercise.name}
                className={`custom-catalog-item ${added ? "added" : ""}`}
                onClick={() => (added ? remove(exercise.name) : add(exercise.name))}
                disabled={!added && isFull}
              >
                <img src={imageUrl(exercise.image)} alt="" />
                <span className="custom-name">{exercise.name}</span>
                <span className="sub">{exercise.body_part}</span>
                <span className="custom-catalog-action">{added ? "✓ 追加済み" : "＋ 追加"}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
