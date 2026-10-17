import { COLLECTIONS, db } from "./firebase.js";
import type { WorkoutMenu } from "./types.js";

const MENUS: WorkoutMenu[] = [
  {
    id: "gif-workout-easy",
    title: "ゆるめトレーニング",
    description: "体を起こす軽めのトレーニング",
    target_workout_level: 1,
    base_duration_sec: 100,
    base_calories: 16,
    body_parts: ["柔軟", "脚", "腕・胸", "お尻"],
    exercises: [
      {
        name: "前屈",
        duration_sec: 20,
        image: "standing-forward-bend.gif",
        body_part: "柔軟",
        calories: 2,
      },
      {
        name: "腿上げ",
        duration_sec: 20,
        image: "high-knees.gif",
        body_part: "脚",
        calories: 4,
      },
      {
        name: "壁腕立て伏せ",
        duration_sec: 20,
        image: "wall-push-up.gif",
        body_part: "腕・胸",
        calories: 4,
      },
      {
        name: "かかと上げ",
        duration_sec: 20,
        image: "standing-calf-raises.gif",
        body_part: "脚",
        calories: 3,
      },
      {
        name: "お尻あげ",
        duration_sec: 20,
        image: "glute-bridges.gif",
        body_part: "お尻",
        calories: 3,
      },
    ],
  },
  {
    id: "gif-workout-normal",
    title: "ふつうトレーニング",
    description: "筋トレと有酸素運動を組み合わせたトレーニング",
    target_workout_level: 2,
    base_duration_sec: 100,
    base_calories: 32,
    body_parts: ["腕・胸", "脚", "腹筋", "背中"],
    exercises: [
      {
        name: "腕立て伏せ",
        duration_sec: 20,
        image: "push-up.gif",
        body_part: "腕・胸",
        calories: 7,
      },
      {
        name: "スクワット",
        duration_sec: 20,
        image: "squat.gif",
        body_part: "脚",
        calories: 7,
      },
      {
        name: "腹筋",
        duration_sec: 20,
        image: "abs.gif",
        body_part: "腹筋",
        calories: 6,
      },
      {
        name: "プランク",
        duration_sec: 20,
        image: "forearm-plank.gif",
        body_part: "腹筋",
        calories: 6,
      },
      {
        name: "バックエクステンション",
        duration_sec: 20,
        image: "back-extensions.gif",
        body_part: "背中",
        calories: 6,
      },
    ],
  },
  {
    id: "gif-workout-hard",
    title: "しっかりトレーニング",
    description: "心拍数をしっかり上げるトレーニング",
    target_workout_level: 3,
    base_duration_sec: 100,
    base_calories: 58,
    body_parts: ["全身", "腹筋", "脚", "腕・胸"],
    exercises: [
      {
        name: "バーピー",
        duration_sec: 20,
        image: "burpees.gif",
        body_part: "全身",
        calories: 12,
      },
      {
        name: "V字腹筋",
        duration_sec: 20,
        image: "v-up.gif",
        body_part: "腹筋",
        calories: 10,
      },
      {
        name: "片足スクワット",
        duration_sec: 20,
        image: "single-leg-squat.gif",
        body_part: "脚",
        calories: 8,
      },
      {
        name: "高速ももあげ",
        duration_sec: 20,
        image: "fast-paced-high-knees.gif",
        body_part: "脚",
        calories: 14,
      },
      {
        name: "プッシュアップジャンプ",
        duration_sec: 20,
        image: "plyometric-push-ups.gif",
        body_part: "腕・胸",
        calories: 14,
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
