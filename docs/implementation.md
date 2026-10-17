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

### 初回だけ必要な設定

1. `backend/.env.example` を `backend/.env` にコピーし、`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `SESSION_SECRET` を設定する
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` はチーム内で共有する（Google Cloud Console の OAuth クライアント）
   - `SESSION_SECRET` は `openssl rand -hex 32` で作った値でよい（各自で別の値でもよい）
   - `.env` は Git に入らない。**シークレットはコミットやチャットに貼らない**
2. Google Cloud Console > APIとサービス > 認証情報 > OAuth クライアント の「承認済みのリダイレクト URI」に次を登録する（チームで1回だけ）
   ```
   http://localhost:3000/callback
   ```
3. OAuth 同意画面が「テスト」状態のときは、ログインに使う Google アカウントを「テストユーザー」に追加する

注意

- ブラウザは `http://localhost:5173` で開く（`127.0.0.1` だとセッションの Cookie が送られない）
- Firestore のデータはエミュレータを止めると消える。もう一度ログインすると新しいユーザーとして作り直される

---

## 実装した機能

| 機能 | 状態 | 実装箇所 |
| --- | --- | --- |
| サインイン／サインアップ | ○ Google の OAuth でログイン（初回はユーザーを作成） | `routes/auth.ts` / `services/google.ts` / `LoginScreen.tsx` |
| アカウント表示 | ○ ホーム画面右上にGoogleのアイコン。押すと名前・メールアドレスを表示 | `components/AccountMenu.tsx` |
| ログアウト | ○ 右上のアカウントメニューの中 | `routes/auth.ts` / `App.tsx` / `components/AccountMenu.tsx` |
| とりあえずこれやれ機能 | ○ 運動レベルに合うメニューを1つ表示 | `routes/menus.ts` / `HomeScreen.tsx` |
| 時間の＋／－ボタン | ○ 弱・普通・強の3段階 | `HomeScreen.tsx` |
| 運動中のタイマー | ○ 何個目か・残り時間・次の種目・一時停止・種目間の休憩 | `WorkoutScreen.tsx` |
| 今日の運動レポート | ○ 運動時間・消費カロリー・獲得XP | `routes/reports.ts` / `ReportScreen.tsx` |
| ストリーク機能 | ○ 連続日数を自動更新 | `services/progress.ts` |
| レベル上げ機能 | ○ XPに応じて自動でレベルアップ | `services/progress.ts` |
| 今日の完了人数 | ○ ホーム画面に表示 | `routes/workouts.ts` |
| カレンダー | ○ ホーム画面に月のカレンダー。運動した日に印をつける | `routes/reports.ts` / `components/Calendar.tsx` |
| 運動レベルの切り替え | ○ ホーム画面で ゆるめ／ふつう／しっかり を選ぶと、今日のメニューが変わる。右の「?」ボタンで各レベルの説明を表示。初回ログイン時は「ゆるめ」 | `routes/users.ts` / `components/WorkoutLevelSelector.tsx` |
| 並べ替え機能 | △ APIのみ（画面は未作成） | `routes/menus.ts` |

---

## 画面の流れ

```
ログイン ──> ホーム ──> 運動中 ──> レポート
               ↑                     │
               └─────────────────────┘
```

- 運動ランク診断（アンケート）のオンボーディング画面は、ホーム画面で運動レベルを自分で選べるようにしたので廃止した

| 画面 | ファイル | 主な要素 |
| --- | --- | --- |
| ログイン | `frontend/src/screens/LoginScreen.tsx` | 「Googleではじめる」ボタン |
| ホーム | `frontend/src/screens/HomeScreen.tsx` | ストリーク、レベル、運動レベルの切り替え、今日のメニュー、＋／－ボタン、スタートボタン、今日の完了人数、カレンダー（運動した日に印）、右上のアカウントメニュー（名前・メールアドレス・ログアウト） |
| 運動中 | `frontend/src/screens/WorkoutScreen.tsx` | 何個目か、種目名、残り時間、次の種目、一時停止ボタン。種目の間に休憩（次の種目名、残り時間、スキップボタン） |
| レポート | `frontend/src/screens/ReportScreen.tsx` | 「クリア！お疲れ様」、ストリーク更新、運動時間、消費カロリー、獲得XP、次のレベルまでのXP |

- 画面の切り替えはルーターを使わず、`App.tsx` の state で管理している
- ログイン状態はセッションの Cookie に保存されるので、30日間は次回からホームから始まる

---

## ログイン・ログアウトの仕組み

Google の OAuth 2.0（OpenID Connect）の認可コードフローをバックエンドで行い、ログイン状態は HttpOnly の Cookie で管理する。Firebase Authentication は使っていない。

```
[ブラウザ]                 [バックエンド]                       [Google]
「Googleではじめる」
  └─> GET /api/auth/google ─> state を Cookie に保存
                              Google のログイン画面へリダイレクト ─> アカウントを選ぶ
                                                                    │
      GET /callback?code=...&state=... <────────────────────┘
                              state を照合 (CSRF 対策)
                              code を IDトークンに交換 (client_secret を使う)
                              IDトークンを Google の公開鍵で検証
                              users に google_id がなければ作成
                              session Cookie (JWT) を発行
  <── フロントへリダイレクト
GET /api/users/me (Cookie 付き) で状態を確認 ─> ホーム

ログアウト: POST /api/auth/logout ─> Cookie を削除 ─> ログイン画面
```

- `client_secret` はバックエンドだけが持つ。フロントには出さない
- セッションの Cookie の中身は、ユーザーID（`users` のドキュメントID）を入れて `SESSION_SECRET` で署名した JWT。有効期限は30日
- `users` のドキュメントIDは自動採番。`google_id` には Google アカウントのID（IDトークンの `sub`）を入れる
- ログインに失敗したとき（キャンセルした、state が合わない等）は `?login_error=1` を付けてフロントに戻し、ログイン画面にメッセージを出す
- バックエンドの `requireAuth`（`backend/src/middleware.ts`）が Cookie を検証し、ルートでは `getUserId(c)` でユーザーIDを取り出す

---

## API 一覧

ベースURL：`http://localhost:3000/api`

🔒 のAPIは、ログイン中（セッションの Cookie が有効）でなければ 401 を返す。フロントからは `credentials: "include"` を付けて呼ぶ。

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/auth/google` | Google のログイン画面へリダイレクトする（ブラウザで開く） |
| GET | `/callback`（`/api` なし） | Google からの戻り先。ログインに成功したらセッションを作ってフロントへリダイレクトする |
| POST | `/auth/logout` | セッションの Cookie を消す |
| GET | `/users/me` 🔒 | 自分のユーザー情報 |
| PATCH | `/users/me/workout-level` 🔒 | 運動レベル（1〜3）を変更する |
| GET | `/menus?sort=duration\|difficulty\|calories` | メニュー一覧（時間・難易度・カロリー順） |
| GET | `/menus/today` 🔒 | 今日のメニューを1つ返す（とりあえずこれやれ） |
| GET | `/menus/:id` | メニュー詳細 |
| POST | `/workouts` 🔒 | 運動完了を記録し、ストリーク・XP・レベルを更新する |
| GET | `/workouts/today/count` | 今日運動を完了した人数 |
| GET | `/reports/today` 🔒 | 自分の今日の運動レポート |
| GET | `/reports/calendar?month=2026-10` 🔒 | 指定した月に運動した日の一覧（日ごとの回数・運動時間・消費カロリー）。`month` を省略すると今月 |

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
| 種目間の休憩 | 種目と種目の間に5秒（`WorkoutScreen.tsx` の `REST_SEC`）。最後の種目のあとにはない。運動時間・消費カロリー・XPには含めない |
| 今日の完了人数 | 今日の WorkoutLog のユーザー数（同じ人が何回やっても1人） |
| カレンダーの印 | その日（日本時間）に WorkoutLog が1件以上ある日 |

---

## データモデル

[table.md](table.md) のモデルを Firestore の3つのコレクションに保存している。

| コレクション | 型 |
| --- | --- |
| `users` | User |
| `workout_menus` | WorkoutMenu |
| `workout_logs` | WorkoutLog |

### table.md から変えたところ

- **`User` に Google アカウントの表示用情報を追加**：ホーム画面右上のアカウント表示に使う。ログインのたびに Google の情報で上書きする
  ```ts
  display_name: string;      // Google アカウントの名前
  email: string;             // メールアドレス
  photo_url: string | null;  // プロフィール画像のURL（ない場合は名前の頭文字を表示）
  ```
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
├── env.ts              # backend/.env の読み込み
├── firebase.ts         # Firestore の初期化、コレクション名
├── middleware.ts       # ログイン中か確認する（requireAuth）
├── seed.ts             # 仮メニューの登録
├── types.ts            # データモデルの型
├── services/
│   ├── google.ts       # Google の OAuth（ログイン画面のURL作成、IDトークンの検証）
│   ├── session.ts      # セッションの Cookie（JWT）の発行・検証・削除
│   └── progress.ts     # XP・レベル・ストリークの計算
└── routes/
    ├── auth.ts
    ├── users.ts
    ├── menus.ts
    ├── workouts.ts
    └── reports.ts

frontend/src/
├── App.tsx             # 画面の切り替え、起動時のログイン確認、ログアウト
├── App.css
├── types.ts            # backend/src/types.ts と同じ型
├── workoutLevels.ts    # 運動レベルの名前と説明（ゆるめ／ふつう／しっかり）
├── api/
│   └── client.ts       # API クライアント
├── components/
│   ├── AccountMenu.tsx # 右上のアカウントアイコンとメニュー
│   ├── Calendar.tsx    # ホーム画面のカレンダー
│   └── WorkoutLevelSelector.tsx # ホーム画面の運動レベル切り替え
└── screens/
    ├── LoginScreen.tsx
    ├── HomeScreen.tsx
    ├── WorkoutScreen.tsx
    └── ReportScreen.tsx
```

---

## まだやっていないこと（TODO）

### 仮実装を置き換えるもの
- **今日のメニューの選び方**：今は日替わりで選んでいるだけ。前回と被らないようにする等

### 未実装の機能
- レポート画面の「他ユーザーの完了通知」
- メニュー一覧・並べ替えの画面（APIはある）
- 毎週・毎月の運動レポート
- A tier：運動の効果表示

### 本番で必要になること
- **本番の Firestore への接続**：今は Firestore を常にエミュレータにつないでいる（`backend/src/firebase.ts`）。本番ではエミュレータの設定を外し、サービスアカウントの鍵か Cloud Run などの自動認証で接続する
- 公開先の `https://.../callback` を Google Cloud Console の「承認済みのリダイレクト URI」に追加し、`backend/.env` の `BACKEND_URL` / `FRONTEND_URL` を設定する
- フロントとバックエンドを別ドメインで公開すると、セッションの Cookie が送られない（SameSite=Lax のため）。同じドメインにまとめるか、Cookie の設定を見直す
- OAuth 同意画面を「本番環境」に公開する（テスト状態だとテストユーザーしかログインできない）
- `GET /reports/today` と `GET /reports/calendar` は `user_id` と `completed_at` の2条件で検索しているため、本番の Firestore では複合インデックスの作成が必要（エミュレータでは不要）
- フロントの型 `frontend/src/types.ts` はバックエンドの型を手でコピーしているので、変更するときは両方を直す
