import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Exercise, WorkoutMenu } from "../types";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "ゆるめ",
  2: "ふつう",
  3: "しっかり",
};

type SortKey = "calories" | "difficulty";
type SortOrder = "asc" | "desc";

type ExerciseWithLevel = Exercise & { difficulty: number; calPerMin: number };

function getFavorites(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem("fav-exercises") ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem("fav-exercises", JSON.stringify([...favs]));
}

export function TrainingListScreen({
  onError,
}: {
  onError: (msg: string) => void;
}) {
  const [menus, setMenus] = useState<WorkoutMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("difficulty");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [bodyPartFilter, setBodyPartFilter] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(getFavorites);

  useEffect(() => {
    api
      .getMenus()
      .then(setMenus)
      .catch((e) => onError((e as Error).message))
      .finally(() => setLoading(false));
  }, [onError]);

  const allExercises = useMemo<ExerciseWithLevel[]>(() => {
    const list: ExerciseWithLevel[] = [];
    for (const menu of menus) {
      for (const ex of menu.exercises) {
        const calPerMin = ex.duration_sec > 0
          ? Math.round((ex.calories / ex.duration_sec) * 60 * 10) / 10
          : 0;
        list.push({ ...ex, difficulty: menu.target_workout_level, calPerMin });
      }
    }
    return list;
  }, [menus]);

  const allBodyParts = useMemo(() => {
    const parts = new Set<string>();
    for (const ex of allExercises) {
      if (ex.body_part) parts.add(ex.body_part);
    }
    return [...parts];
  }, [allExercises]);

  const filtered = useMemo(() => {
    let result = allExercises;
    if (bodyPartFilter) {
      result = result.filter((ex) => ex.body_part === bodyPartFilter);
    }
    if (favOnly) {
      result = result.filter((ex) => favorites.has(ex.name));
    }
    const dir = order === "asc" ? 1 : -1;
    if (sort === "calories") {
      result = [...result].sort((a, b) => (a.calPerMin - b.calPerMin) * dir);
    } else {
      result = [...result].sort((a, b) => (a.difficulty - b.difficulty) * dir);
    }
    return result;
  }, [allExercises, bodyPartFilter, favOnly, favorites, sort, order]);

  const toggleFavorite = (name: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      saveFavorites(next);
      return next;
    });
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div className="screen training-list">
      <h2>トレーニング一覧</h2>

      <div className="tl-toolbar">
        <div className="tl-sort">
          <span className="tl-toolbar-label">並べ替え</span>
          <div className="segmented">
            <button
              className={sort === "difficulty" ? "selected" : ""}
              onClick={() => setSort("difficulty")}
            >
              難易度
            </button>
            <button
              className={sort === "calories" ? "selected" : ""}
              onClick={() => setSort("calories")}
            >
              カロリー
            </button>
          </div>
          <button
            className="tl-order-button"
            onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
            aria-label={order === "asc" ? "昇順" : "降順"}
          >
            {order === "asc" ? "↑ 昇順" : "↓ 降順"}
          </button>
        </div>

        <div className="tl-filters">
          <span className="tl-toolbar-label">絞り込み</span>
          <div className="tl-chip-row">
            <button
              className={`tl-chip ${favOnly ? "tl-chip-active" : ""}`}
              onClick={() => setFavOnly((v) => !v)}
            >
              ★ お気に入り
            </button>
            {allBodyParts.map((part) => (
              <button
                key={part}
                className={`tl-chip ${bodyPartFilter === part ? "tl-chip-active" : ""}`}
                onClick={() =>
                  setBodyPartFilter((prev) => (prev === part ? null : part))
                }
              >
                {part}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="sub">該当する種目がありません</p>
      ) : (
        <div className="tl-cards">
          {filtered.map((ex, i) => (
            <div key={`${ex.name}-${i}`} className="card tl-card">
              <div className="tl-card-top">
                <img
                  className="tl-thumb"
                  src={
                    new URL(
                      `../assets/workouts/${ex.image}`,
                      import.meta.url,
                    ).href
                  }
                  alt={ex.name}
                />
                <div className="tl-card-info">
                  <div className="tl-card-header">
                    <strong className="tl-card-title">{ex.name}</strong>
                    <button
                      className="tl-fav-button"
                      onClick={() => toggleFavorite(ex.name)}
                      aria-label={
                        favorites.has(ex.name)
                          ? "お気に入り解除"
                          : "お気に入り追加"
                      }
                    >
                      {favorites.has(ex.name) ? "★" : "☆"}
                    </button>
                  </div>
                  <div className="tl-tags">
                    <span className="tl-tag">🔥 {ex.calPerMin} kcal/min</span>
                    <span className="tl-tag">
                      💪{" "}
                      {DIFFICULTY_LABELS[ex.difficulty] ??
                        `Lv.${ex.difficulty}`}
                    </span>
                  </div>
                  <div className="tl-parts">
                    <span className="tl-part-badge">{ex.body_part}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
