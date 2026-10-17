import { COLLECTIONS, db } from "./firebase.js";
import type { WorkoutMenu } from "./types.js";

export const MENUS: WorkoutMenu[] = [
  {
    id: "gif-workout-easy",
    title: "ゆるめトレーニング",
    description: "体を起こす軽めのトレーニング",
    target_workout_level: 1,
    base_duration_sec: 60,
    base_calories: 10,
    body_parts: ["柔軟", "脚", "腕・胸"],
    exercises: [
      { name: "前屈", duration_sec: 20, image: "standing-forward-bend.gif", body_part: "柔軟", calories: 2 },
      { name: "腿上げ", duration_sec: 20, image: "high-knees.gif", body_part: "脚", calories: 4 },
      { name: "壁腕立て伏せ", duration_sec: 20, image: "wall-push-up.gif", body_part: "腕・胸", calories: 4 },
    ],
  },
  {
    id: "gif-workout-normal",
    title: "ふつうトレーニング",
    description: "筋トレと有酸素運動を組み合わせたトレーニング",
    target_workout_level: 2,
    base_duration_sec: 60,
    base_calories: 20,
    body_parts: ["腕・胸", "脚", "腹筋"],
    exercises: [
      { name: "腕立て伏せ", duration_sec: 20, image: "push-up.gif", body_part: "腕・胸", calories: 7 },
      { name: "スクワット", duration_sec: 20, image: "squat.gif", body_part: "脚", calories: 7 },
      { name: "腹筋", duration_sec: 20, image: "abs.gif", body_part: "腹筋", calories: 6 },
    ],
  },
  {
    id: "gif-workout-hard",
    title: "しっかりトレーニング",
    description: "心拍数をしっかり上げるトレーニング",
    target_workout_level: 3,
    base_duration_sec: 60,
    base_calories: 30,
    body_parts: ["全身", "腹筋", "脚"],
    exercises: [
      { name: "バーピー", duration_sec: 20, image: "burpees.gif", body_part: "全身", calories: 12 },
      { name: "V字腹筋", duration_sec: 20, image: "v-up.gif", body_part: "腹筋", calories: 10 },
      { name: "片足スクワット", duration_sec: 20, image: "single-leg-squat.gif", body_part: "脚", calories: 8 },
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
