# 実装概要（v1.0 ひな形）

[function.md](function.md) の S tier 機能と v1.0 の画面構成、[table.md](table.md) のデータモデルを基に作ったひな形の説明。

---

## 起動方法

```sh
# 1. Firestore エミュレータ + バックエンド (http://localhost:3000)
make dev

# 2. フロントエンド (http://localhost:5173) ※別ターミナルで
make frontend
```

- バックエンドの起動時に、運動メニューが空なら仮メニュー3件が自動で登録される
- エミュレータの中身は http://localhost:4000 （Emulator UI）で確認できる

---

## 実装した機能

| 機能 | 状態 | 実装箇所 |
| --- | --- | --- |
| サインイン／サインアップ | △ 仮実装（ランダムIDでログイン） | `routes/auth.ts` / `LoginScreen.tsx` |
| 運動ランク診断（アンケート） | ○ 3択で `workout_level` を保存 | `routes/users.ts` / `OnboardingScreen.tsx` |
| とりあえずこれやれ機能 | ○ 運動レベルに合うメニューを1つ表示 | `routes/menus.ts` / `HomeScreen.tsx` |
| 時間の＋／－ボタン | ○ 弱・普通・強の3段階 | `HomeScreen.tsx` |
| 運動中のタイマー | ○ 何個目か・残り時間・次の種目・一時停止 | `WorkoutScreen.tsx` |
| 今日の運動レポート | ○ 運動時間・消費カロリー・獲得XP | `routes/reports.ts` / `ReportScreen.tsx` |
| ストリーク機能 | ○ 連続日数を自動更新 | `services/progress.ts` |
| レベル上げ機能 | ○ XPに応じて自動でレベルアップ | `services/progress.ts` |
| 今日の完了人数 | ○ ホーム画面に表示 | `routes/workouts.ts` |
| 並べ替え機能 | △ APIのみ（画面は未作成） | `routes/menus.ts` |

---

## 画面の流れ

```
ログイン ──(初回)──> オンボーディング ──> ホーム ──> 運動中 ──> レポート
   │                                     ↑                       │
   └──(2回目以降)────────────────────────┴───────────────────────┘
```

| 画面 | ファイル | 主な要素 |
| --- | --- | --- |
| ログイン | `frontend/src/screens/LoginScreen.tsx` | 「Googleではじめる」ボタン（今は仮ログイン） |
| オンボーディング | `frontend/src/screens/OnboardingScreen.tsx` | 「今のあなたの運動レベルは？」3択 |
| ホーム | `frontend/src/screens/HomeScreen.tsx` | ストリーク、レベル、今日のメニュー、＋／－ボタン、スタートボタン、今日の完了人数 |
| 運動中 | `frontend/src/screens/WorkoutScreen.tsx` | 何個目か、種目名、残り時間、次の種目、一時停止ボタン |
| レポート | `frontend/src/screens/ReportScreen.tsx` | 「クリア！お疲れ様」、ストリーク更新、運動時間、消費カロリー、獲得XP、次のレベルまでのXP |

- 画面の切り替えはルーターを使わず、`App.tsx` の state で管理している
- ログインしたユーザーのIDは localStorage に保存し、次回からはホームから始まる

---

## API 一覧

ベースURL：`http://localhost:3000/api`

ログイン以外のAPIは、リクエストヘッダー `X-User-Id` にユーザーIDが必要（仮の認証）。

| メソッド | パス | 内容 |
| --- | --- | --- |
| POST | `/auth/login` | `google_id` でログイン。ユーザーがいなければ作成する（`isNew: true`） |
| GET | `/users/me` | 自分のユーザー情報 |
| PATCH | `/users/me/workout-level` | 運動レベル（1〜3）を変更する |
| GET | `/menus?sort=duration\|difficulty\|calories` | メニュー一覧（時間・難易度・カロリー順） |
| GET | `/menus/today` | 今日のメニューを1つ返す（とりあえずこれやれ） |
| GET | `/menus/:id` | メニュー詳細 |
| POST | `/workouts` | 運動完了を記録し、ストリーク・XP・レベルを更新する |
| GET | `/workouts/today/count` | 今日運動を完了した人数 |
| GET | `/reports/today` | 自分の今日の運動レポート |

### `POST /workouts` のレスポンス例

```json
{
  "log": { "id": "...", "menu_id": "lv2-circuit", "intensity": "high",
           "actual_duration_sec": 270, "actual_calories": 30, "earned_xp": 45, "completed_at": "..." },
  "user": { "current_streak": 1, "total_xp": 45, "user_level": 1, "...": "..." },
  "previous_streak": 0,
  "leveled_up": false,
  "xp_to_next_level": 55
}
```

レポート画面はこのレスポンスをそのまま表示している。

---

## 計算ルール

`backend/src/services/progress.ts` にまとめている。数値は仮なので調整してよい。

| 項目 | ルール |
| --- | --- |
| 強度の倍率 | 弱 0.5倍 ／ 普通 1倍 ／ 強 1.5倍（運動時間・消費カロリー・各種目の秒数にかける） |
| 獲得XP | 運動1分につき 10XP |
| ユーザーレベル | 100XP ごとに1つ上がる（上がり方は一定） |
| ストリーク | 最後の運動が昨日なら +1、今日なら据え置き、それより前なら 1 に戻る（日本時間で判定） |
| 今日のメニュー | 運動レベルが同じメニューの中から日替わりで1つ選ぶ |
| 今日の完了人数 | 今日の WorkoutLog のユーザー数（同じ人が何回やっても1人） |

---

## データモデル

[table.md](table.md) のモデルを Firestore の3つのコレクションに保存している。

| コレクション | 型 |
| --- | --- |
| `users` | User |
| `workout_menus` | WorkoutMenu |
| `workout_logs` | WorkoutLog |

### table.md から変えたところ

- **`WorkoutMenu.exercises` を追加**：運動中画面で「何個目か」「次の種目」を出すために、種目名と秒数の配列を持たせた
  ```ts
  exercises: { name: string; duration_sec: number }[];
  ```
- **日時は ISO 形式の文字列で保存**（`last_workout_at`, `completed_at`）
- `last_workout_at` は、まだ一度も運動していないユーザーでは `null`

### 仮メニュー（`backend/src/seed.ts`）

| ID | メニュー名 | 対象レベル | 時間 | カロリー |
| --- | --- | --- | --- | --- |
| `lv1-stretch` | 3分間ストレッチ | 1 | 3分 | 10kcal |
| `lv2-circuit` | 3分間サーキット | 2 | 3分 | 20kcal |
| `lv3-hiit` | 4分間HIIT | 3 | 4分 | 40kcal |

---

## ディレクトリ構成

```
backend/src/
├── index.ts            # アプリ本体（CORS、ルーティング、エラー処理）
├── firebase.ts         # Firestore の初期化、コレクション名
├── middleware.ts       # X-User-Id からユーザーIDを取得（仮の認証）
├── seed.ts             # 仮メニューの登録
├── types.ts            # データモデルの型
├── services/
│   └── progress.ts     # XP・レベル・ストリークの計算
└── routes/
    ├── auth.ts
    ├── users.ts
    ├── menus.ts
    ├── workouts.ts
    └── reports.ts

frontend/src/
├── App.tsx             # 画面の切り替え
├── App.css
├── types.ts            # backend/src/types.ts と同じ型
├── api/
│   └── client.ts       # API クライアント
└── screens/
    ├── LoginScreen.tsx
    ├── OnboardingScreen.tsx
    ├── HomeScreen.tsx
    ├── WorkoutScreen.tsx
    └── ReportScreen.tsx
```

---

## まだやっていないこと（TODO）

### 仮実装を置き換えるもの
- **Googleログイン**：今はランダムIDでログインし、`X-User-Id` ヘッダーをそのまま信用しているので安全ではない。Firebase Authentication などに置き換える
- **今日のメニューの選び方**：今は日替わりで選んでいるだけ。前回と被らないようにする等

### 未実装の機能
- レポート画面の「他ユーザーの完了通知」
- ホーム画面での運動レベルの変更（APIはある）
- メニュー一覧・並べ替えの画面（APIはある）
- 毎週・毎月の運動レポート
- A tier：運動の効果表示

### 本番で必要になること
- `GET /reports/today` は `user_id` と `completed_at` の2条件で検索しているため、本番の Firestore では複合インデックスの作成が必要（エミュレータでは不要）
- フロントの型 `frontend/src/types.ts` はバックエンドの型を手でコピーしているので、変更するときは両方を直す
