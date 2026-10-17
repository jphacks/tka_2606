# データモデル設計

## 全体像

```
User (1) ──< WorkoutLog >── (1) WorkoutMenu
```

- 1人の **User** は複数の **WorkoutLog** を持つ
- 1つの **WorkoutMenu** は複数の **WorkoutLog** から参照される
- **WorkoutLog** は「誰が・どのメニューを・どの強度で・いつやったか」の記録

---

## User（ユーザー）

```ts
type User = {
  id: string;
  google_id: string;
  workout_level: number;   // 運動レベル (メニュー決定用。ホーム画面で手動変更可。例: 1, 2, 3)
  user_level: number;      // ユーザーレベル (モチベ用。自動で上がる)
  current_streak: number;
  total_xp: number;
  last_workout_at: Date;
}
```

| カラム | 型 | 説明 |
| --- | --- | --- |
| `id` | string | 主キー |
| `google_id` | string | Googleログイン用ID |
| `workout_level` | number | **運動レベル**。メニュー決定用。ホーム画面で手動変更可（例：1, 2, 3） |
| `user_level` | number | **ユーザーレベル**。モチベーション用。自動で上がる |
| `current_streak` | number | 現在の連続日数（ストリーク） |
| `total_xp` | number | 累計経験値 |
| `last_workout_at` | Date | 最後に運動した日時 |

---

## WorkoutMenu（運動メニュー）

```ts
type WorkoutMenu = {
  id: string;
  title: string;
  description: string;
  target_workout_level: number; // ★このメニューが対象とする運動レベル
  base_duration_sec: number;
  base_calories: number;
}
```

| カラム | 型 | 説明 |
| --- | --- | --- |
| `id` | string | 主キー |
| `title` | string | メニュー名（例：3分間サーキット） |
| `description` | string | メニューの説明 |
| `target_workout_level` | number | ★このメニューが対象とする運動レベル |
| `base_duration_sec` | number | 基本の運動時間（秒） |
| `base_calories` | number | 基本の消費カロリー |

---

## WorkoutLog（運動記録）

```ts
type WorkoutLog = {
  id: string;                            // 主キー
  user_id: string;                       // 誰が (users.id)
  menu_id: string;                       // 何のメニューを (workout_menus.id)
  intensity: 'low' | 'normal' | 'high';  // 選んだ難易度（弱・普通・強）
  actual_duration_sec: number;           // 実際の運動時間 (強ならベースの1.5倍など)
  actual_calories: number;               // 実際の消費カロリー
  earned_xp: number;                     // 獲得した経験値
  completed_at: Date;                    // 完了日時
}
```

| カラム | 型 | 説明 |
| --- | --- | --- |
| `id` | string | 主キー |
| `user_id` | string | 誰が（`users.id` を参照） |
| `menu_id` | string | 何のメニューを（`workout_menus.id` を参照） |
| `intensity` | `'low'` \| `'normal'` \| `'high'` | 選んだ難易度（弱・普通・強） |
| `actual_duration_sec` | number | 実際の運動時間（強ならベースの1.5倍など） |
| `actual_calories` | number | 実際の消費カロリー |
| `earned_xp` | number | 獲得した経験値 |
| `completed_at` | Date | 完了日時 |

---

## 機能との対応

| 機能 | 使うデータ |
| --- | --- |
| とりあえずこれやれ機能 | `User.workout_level` と `WorkoutMenu.target_workout_level` を照合 |
| 運動ランク診断 | 結果を `User.workout_level` に保存 |
| 今日の運動レポート | `WorkoutLog` の `actual_duration_sec` / `actual_calories` / `earned_xp` |
| ストリーク機能 | `User.current_streak` / `User.last_workout_at` |
| レベル上げ機能 | `User.total_xp` / `User.user_level` |
| 毎週・毎月レポート | `WorkoutLog.completed_at` で期間集計 |
| 完了人数の表示 | 当日の `WorkoutLog` 件数を集計 |