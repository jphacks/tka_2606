import { COLLECTIONS, db } from "./firebase.js";
import type { WorkoutMenu } from "./types.js";

// 初期メニュー (仮データ)
const MENUS: WorkoutMenu[] = [
  {
    id: "lv1-stretch",
    title: "3分間ストレッチ",
    description: "ベッドの横でできる、体を起こすためのストレッチ",
    target_workout_level: 1,
    base_duration_sec: 180,
    base_calories: 10,
    exercises: [
      { name: "首・肩まわし", duration_sec: 60 },
      { name: "前屈", duration_sec: 60 },
      { name: "その場足踏み", duration_sec: 60 },
    ],
  },
  {
    id: "lv2-circuit",
    title: "3分間サーキット",
    description: "軽めの筋トレと有酸素を組み合わせたサーキット",
    target_workout_level: 2,
    base_duration_sec: 180,
    base_calories: 20,
    exercises: [
      { name: "スクワット", duration_sec: 60 },
      { name: "膝つき腕立て", duration_sec: 60 },
      { name: "もも上げ", duration_sec: 60 },
    ],
  },
  {
    id: "lv3-hiit",
    title: "4分間HIIT",
    description: "短時間でしっかり心拍数を上げるインターバルトレーニング",
    target_workout_level: 3,
    base_duration_sec: 240,
    base_calories: 40,
    exercises: [
      { name: "ジャンピングジャック", duration_sec: 60 },
      { name: "バーピー", duration_sec: 60 },
      { name: "マウンテンクライマー", duration_sec: 60 },
      { name: "スクワットジャンプ", duration_sec: 60 },
    ],
  },
];

export async function seedMenus() {
  const snapshot = await db.collection(COLLECTIONS.menus).limit(1).get();
  if (!snapshot.empty) return;

  const batch = db.batch();
  for (const { id, ...menu } of MENUS) {
    batch.set(db.collection(COLLECTIONS.menus).doc(id), menu);
  }
  await batch.commit();
  console.log(`Seeded ${MENUS.length} workout menus`);
}
