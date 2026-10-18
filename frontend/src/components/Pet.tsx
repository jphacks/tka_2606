import { useEffect, useState } from "react";

type PetStage = "egg" | "baby" | "child" | "teen" | "royal";

function getPetStage(level: number): PetStage {
  if (level <= 1) return "egg";
  if (level <= 3) return "baby";
  if (level <= 5) return "child";
  if (level <= 7) return "teen";
  return "royal";
}

function EggSvg() {
  return (
    <svg viewBox="0 0 60 80" className="pet-svg">
      <ellipse cx="30" cy="48" rx="22" ry="30" fill="#f5e6c8" stroke="#d4a574" strokeWidth="2" />
      <ellipse cx="30" cy="48" rx="18" ry="26" fill="#faf0e0" opacity="0.5" />
      <path d="M18 40 Q22 35 26 40 Q30 35 34 40 Q38 35 42 40" fill="none" stroke="#d4a574" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BabySlimeSvg() {
  return (
    <svg viewBox="0 0 60 60" className="pet-svg">
      <ellipse cx="30" cy="38" rx="22" ry="18" fill="#c084fc" />
      <ellipse cx="30" cy="38" rx="18" ry="14" fill="#d8b4fe" opacity="0.5" />
      <circle cx="23" cy="34" r="3" fill="#fff" />
      <circle cx="37" cy="34" r="3" fill="#fff" />
      <circle cx="24" cy="35" r="1.5" fill="#1a1a2e" />
      <circle cx="38" cy="35" r="1.5" fill="#1a1a2e" />
      <path d="M26 42 Q30 46 34 42" fill="none" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="19" cy="40" rx="3" ry="2" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="41" cy="40" rx="3" ry="2" fill="#f9a8d4" opacity="0.5" />
    </svg>
  );
}

function ChildSlimeSvg() {
  return (
    <svg viewBox="0 0 70 65" className="pet-svg">
      <ellipse cx="35" cy="40" rx="26" ry="22" fill="#a855f7" />
      <ellipse cx="35" cy="40" rx="22" ry="18" fill="#c084fc" opacity="0.5" />
      <circle cx="26" cy="35" r="4" fill="#fff" />
      <circle cx="44" cy="35" r="4" fill="#fff" />
      <circle cx="27.5" cy="36" r="2" fill="#1a1a2e" />
      <circle cx="45.5" cy="36" r="2" fill="#1a1a2e" />
      <circle cx="28" cy="34" r="1" fill="#fff" />
      <circle cx="46" cy="34" r="1" fill="#fff" />
      <path d="M30 46 Q35 51 40 46" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="20" cy="42" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="50" cy="42" rx="4" ry="2.5" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="26" cy="60" rx="5" ry="3" fill="#9333ea" />
      <ellipse cx="44" cy="60" rx="5" ry="3" fill="#9333ea" />
    </svg>
  );
}

function TeenSlimeSvg() {
  return (
    <svg viewBox="0 0 80 75" className="pet-svg">
      <path d="M8 35 Q2 20 15 25 Q10 30 14 35" fill="#e9d5ff" stroke="#c084fc" strokeWidth="1" />
      <path d="M72 35 Q78 20 65 25 Q70 30 66 35" fill="#e9d5ff" stroke="#c084fc" strokeWidth="1" />
      <ellipse cx="40" cy="45" rx="28" ry="24" fill="#9333ea" />
      <ellipse cx="40" cy="45" rx="24" ry="20" fill="#a855f7" opacity="0.5" />
      <circle cx="30" cy="40" r="5" fill="#fff" />
      <circle cx="50" cy="40" r="5" fill="#fff" />
      <circle cx="31.5" cy="41" r="2.5" fill="#1a1a2e" />
      <circle cx="51.5" cy="41" r="2.5" fill="#1a1a2e" />
      <circle cx="32" cy="39" r="1.2" fill="#fff" />
      <circle cx="52" cy="39" r="1.2" fill="#fff" />
      <path d="M34 52 Q40 58 46 52" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="22" cy="48" rx="4" ry="3" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="58" cy="48" rx="4" ry="3" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="30" cy="67" rx="6" ry="3.5" fill="#7e22ce" />
      <ellipse cx="50" cy="67" rx="6" ry="3.5" fill="#7e22ce" />
      <text x="60" y="25" fontSize="10" className="pet-sparkle">✦</text>
    </svg>
  );
}

function RoyalSlimeSvg() {
  return (
    <svg viewBox="0 0 80 85" className="pet-svg">
      <path d="M24 22 L28 10 L33 18 L40 6 L47 18 L52 10 L56 22 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="28" cy="12" r="2" fill="#ef4444" />
      <circle cx="40" cy="8" r="2" fill="#3b82f6" />
      <circle cx="52" cy="12" r="2" fill="#22c55e" />
      <path d="M6 42 Q-2 22 14 28 Q6 34 12 42" fill="#e9d5ff" stroke="#c084fc" strokeWidth="1" />
      <path d="M74 42 Q82 22 66 28 Q74 34 68 42" fill="#e9d5ff" stroke="#c084fc" strokeWidth="1" />
      <ellipse cx="40" cy="50" rx="30" ry="26" fill="#7e22ce" />
      <ellipse cx="40" cy="50" rx="26" ry="22" fill="#9333ea" opacity="0.5" />
      <circle cx="29" cy="44" r="6" fill="#fff" />
      <circle cx="51" cy="44" r="6" fill="#fff" />
      <circle cx="30.5" cy="45" r="3" fill="#1a1a2e" />
      <circle cx="52.5" cy="45" r="3" fill="#1a1a2e" />
      <circle cx="31.5" cy="43.5" r="1.5" fill="#fff" />
      <circle cx="53.5" cy="43.5" r="1.5" fill="#fff" />
      <text x="28" y="47" fontSize="4" fill="#fbbf24" textAnchor="middle">★</text>
      <text x="50" y="47" fontSize="4" fill="#fbbf24" textAnchor="middle">★</text>
      <path d="M33 57 Q40 64 47 57" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="20" cy="53" rx="5" ry="3" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="60" cy="53" rx="5" ry="3" fill="#f9a8d4" opacity="0.5" />
      <ellipse cx="30" cy="74" rx="7" ry="4" fill="#6b21a8" />
      <ellipse cx="50" cy="74" rx="7" ry="4" fill="#6b21a8" />
      <text x="12" y="30" fontSize="8" className="pet-sparkle">✦</text>
      <text x="66" y="28" fontSize="10" className="pet-sparkle pet-sparkle-delay">✦</text>
      <text x="58" y="80" fontSize="7" className="pet-sparkle pet-sparkle-delay2">✦</text>
    </svg>
  );
}

function PetSvg({ stage }: { stage: PetStage }) {
  switch (stage) {
    case "egg": return <EggSvg />;
    case "baby": return <BabySlimeSvg />;
    case "child": return <ChildSlimeSvg />;
    case "teen": return <TeenSlimeSvg />;
    case "royal": return <RoyalSlimeSvg />;
  }
}

type Props = {
  userLevel: number;
  leveledUp?: boolean;
  static?: boolean;
};

export function Pet(props: Props) {
  const { userLevel, leveledUp, static: isStatic } = props;
  const stage = getPetStage(userLevel);
  const previousStage = getPetStage(Math.max(1, userLevel - 1));
  const evolved = leveledUp && stage !== previousStage;
  const [showEvolution, setShowEvolution] = useState(evolved);

  useEffect(() => {
    if (!evolved) return;
    setShowEvolution(true);
    const timer = setTimeout(() => setShowEvolution(false), 2500);
    return () => clearTimeout(timer);
  }, [evolved]);

  if (isStatic) {
    return (
      <div className={`pet-inline pet-stage-${stage}`}>
        <PetSvg stage={stage} />
      </div>
    );
  }

  const walkClass = stage === "egg" ? "pet-rock" : "pet-walk";
  const bounceClass = stage === "baby" ? "pet-bounce" : "";

  return (
    <div className="pet-area">
      {showEvolution && (
        <div className="pet-evolution-flash" key="evolve">
          <span className="pet-evolution-text">✨ 進化！ ✨</span>
        </div>
      )}
      <div className={`pet-container ${walkClass} ${bounceClass}`}>
        <div className={`pet-character pet-stage-${stage}`}>
          <PetSvg stage={stage} />
        </div>
      </div>
    </div>
  );
}
