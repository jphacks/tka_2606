import { api } from "../api/client";

const LEVEL_OPTIONS = [
  { level: 1, label: "全く運動していない" },
  { level: 2, label: "たまに歩く程度" },
  { level: 3, label: "少しは体力に自信あり" },
];

type Props = {
  onComplete: (workoutLevel: number) => void;
  onError: (message: string) => void;
};

export function OnboardingScreen({ onComplete, onError }: Props) {
  const handleSelect = async (level: number) => {
    try {
      await api.updateWorkoutLevel(level);
      onComplete(level);
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <div className="screen">
      <h2>今のあなたの運動レベルは？</h2>
      <div className="options">
        {LEVEL_OPTIONS.map((option) => (
          <button key={option.level} onClick={() => handleSelect(option.level)}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
