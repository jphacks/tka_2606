// クリア時のファンファーレ。音源ファイルは使わず Web Audio で鳴らす
// (スタートボタンを押したあとなので、ブラウザの自動再生の制限にはかからない)
const FANFARE = [
  { note: 523.25, at: 0, len: 0.12 }, // ド
  { note: 659.25, at: 0.12, len: 0.12 }, // ミ
  { note: 783.99, at: 0.24, len: 0.12 }, // ソ
  { note: 1046.5, at: 0.36, len: 0.5 }, // 高いド
];

const LEVEL_UP = [
  { note: 783.99, at: 0, len: 0.1 },
  { note: 987.77, at: 0.1, len: 0.1 },
  { note: 1174.66, at: 0.2, len: 0.1 },
  { note: 1567.98, at: 0.3, len: 0.45 },
];

function play(notes: typeof FANFARE) {
  try {
    const ctx = new AudioContext();
    for (const { note, at, len } of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = note;
      const t = ctx.currentTime + at;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len + 0.05);
    }
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // 音が鳴らせない環境では何もしない
  }
}

export const playClearSound = () => play(FANFARE);
export const playLevelUpSound = () => play(LEVEL_UP);
