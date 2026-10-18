import { useEffect, useRef } from "react";

const COLORS = ["#ff7a00", "#ffb300", "#ff3d71", "#00c2ff", "#7cff4f", "#b04bff", "#ffffff"];
const GRAVITY = 0.25;
const DRAG = 0.985;
const DURATION_MS = 4500;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
  spin: number;
  shape: "rect" | "circle" | "star";
};

type Props = {
  // 何回に分けて打ち上げるか (ミリ秒後に発射)
  bursts?: number[];
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

// 画面の下の両端と真ん中から紙吹雪を打ち上げる
function burst(width: number, height: number): Particle[] {
  const sources = [
    { x: 0, y: height, dir: -60 },
    { x: width, y: height, dir: -120 },
    { x: width / 2, y: height * 0.45, dir: -90 },
  ];
  return sources.flatMap(({ x, y, dir }, i) =>
    Array.from({ length: i === 2 ? 60 : 80 }, (): Particle => {
      const spread = i === 2 ? 180 : 40;
      const angle = ((dir + random(-spread, spread)) * Math.PI) / 180;
      const speed = i === 2 ? random(4, 11) : random(12, 22);
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: random(6, 12),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle: random(0, Math.PI * 2),
        spin: random(-0.3, 0.3),
        shape: (["rect", "rect", "circle", "star"] as const)[Math.floor(Math.random() * 4)],
      };
    }),
  );
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r / 2.5;
    const a = (i * Math.PI) / 5;
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}

// クリア時の紙吹雪。画面全体に重ねて表示する (タップは下に通す)
export function Confetti({ bursts = [0] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstsKey = bursts.join(",");

  useEffect(() => {
    // 動きを減らす設定のときは出さない
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let particles: Particle[] = [];
    const timers = burstsKey
      .split(",")
      .map(Number)
      .map((delay) =>
        setTimeout(() => {
          particles = particles.concat(burst(window.innerWidth, window.innerHeight));
        }, delay),
      );

    const start = performance.now();
    const lastBurst = Math.max(...burstsKey.split(",").map(Number));
    let frame = 0;
    const tick = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      // 終わりに近づいたら、だんだん透明にする
      const fade = Math.min(1, Math.max(0, (start + lastBurst + DURATION_MS - now) / 800));
      ctx.globalAlpha = fade;
      for (const p of particles) {
        p.vx *= DRAG;
        p.vy = p.vy * DRAG + GRAVITY;
        p.x += p.vx + Math.sin(p.angle) * 0.6; // ひらひら揺らす
        p.y += p.vy;
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          drawStar(ctx, p.size * 0.7);
        } else {
          // 回転で裏返るように、縦の長さを変える
          ctx.fillRect(-p.size / 2, (-p.size / 4) * Math.cos(p.angle * 2), p.size, (p.size / 2) * Math.cos(p.angle * 2));
        }
        ctx.restore();
      }
      particles = particles.filter((p) => p.y < window.innerHeight + 40);
      if (fade > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
    };
  }, [burstsKey]);

  return <canvas className="confetti" ref={canvasRef} aria-hidden="true" />;
}
