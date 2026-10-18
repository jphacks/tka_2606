import { useEffect, useState } from "react";

// 0 から target まで数字を数え上げる (delayMs 後に始めて durationMs で到達する)
export function useCountUp(target: number, durationMs: number, delayMs = 0) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / durationMs, 0), 1);
      const eased = 1 - Math.pow(1 - t, 3); // 最後にゆっくり止まる
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, delayMs, reduced]);

  return value;
}
