import { COLLECTIONS, db } from "./firebase.js";
import type { WorkoutMenu } from "./types.js";

const MENUS: WorkoutMenu[] = [
  {
    id: "gif-workout-easy",
    title: "ゆるめGIFトレーニング",
    description: "体を起こす軽めのトレーニング",
    target_workout_level: 1,
    base_duration_sec: 60,
    base_calories: 10,
    exercises: [
      { name: "前屈", duration_sec: 20, image: "standing-forward-bend.gif" },
      { name: "腿上げ", duration_sec: 20, image: "high-knees.gif" },
      { name: "壁腕立て伏せ", duration_sec: 20, image: "wall-push-up.gif" },
    ],
  },
  {
    id: "gif-workout-normal",
    title: "ふつうGIFトレーニング",
    description: "筋トレと有酸素運動を組み合わせたトレーニング",
    target_workout_level: 2,
    base_duration_sec: 60,
    base_calories: 20,
    exercises: [
      { name: "腕立て伏せ", duration_sec: 20, image: "push-up.gif" },
      { name: "スクワット", duration_sec: 20, image: "squat.gif" },
      { name: "腹筋", duration_sec: 20, image: "abs.gif" },
    ],
  },
  {
    id: "gif-workout-hard",
    title: "しっかりGIFトレーニング",
    description: "心拍数をしっかり上げるトレーニング",
    target_workout_level: 3,
    base_duration_sec: 60,
    base_calories: 30,
    exercises: [
      { name: "バーピー", duration_sec: 20, image: "burpees.gif" },
      { name: "V字腹筋", duration_sec: 20, image: "v-up.gif" },
      {
        name: "片足スクワット",
        duration_sec: 20,
        image: "single-leg-squat.gif",
      },
    ],
  },
];

export async function seedMenus() {
  const batch = db.batch();
  const snapshot = await db.collection(COLLECTIONS.menus).get();
  for (const doc of snapshot.docs) batch.delete(doc.ref);
  for (const { id, ...menu } of MENUS) {
    batch.set(db.collection(COLLECTIONS.menus).doc(id), menu);
  }
  await batch.commit();
  console.log(`Seeded ${MENUS.length} workout menus`);
}
