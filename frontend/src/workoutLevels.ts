// 運動レベル (User.workout_level) の一覧。ホーム画面の切り替えで使う
export const WORKOUT_LEVELS = [
  {
    level: 1,
    name: "ゆるめ",
    description: "壁腕立て・腿上げ・前屈の軽い運動",
  },
  {
    level: 2,
    name: "ふつう",
    description: "腕立て・スクワット・腹筋の標準的な運動",
  },
  {
    level: 3,
    name: "しっかり",
    description: "バーピー・V字腹筋・片足スクワットの強い運動",
  },
];

// 運動レベルの4つ目の選択肢。設定タブで作ったカスタムメニューをやる
export const CUSTOM_LEVEL = {
  name: "カスタム",
  description: "設定タブで自分で選んだ種目のメニュー",
};
