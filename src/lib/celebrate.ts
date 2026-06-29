import confetti from "canvas-confetti";

export function fireConfetti(intensity: "small" | "medium" | "big" = "medium") {
  const configs = {
    small: { particleCount: 60, spread: 50 },
    medium: { particleCount: 120, spread: 80 },
    big: { particleCount: 200, spread: 100 },
  };
  const { particleCount, spread } = configs[intensity];

  confetti({
    particleCount,
    spread,
    origin: { y: 0.65 },
    colors: ["#4f46e5", "#818cf8", "#34d399", "#fbbf24", "#f472b6"],
  });

  if (intensity !== "small") {
    setTimeout(() => {
      confetti({
        particleCount: Math.round(particleCount * 0.6),
        spread: spread - 20,
        origin: { x: 0.2, y: 0.7 },
        colors: ["#4f46e5", "#34d399", "#fbbf24"],
      });
      confetti({
        particleCount: Math.round(particleCount * 0.6),
        spread: spread - 20,
        origin: { x: 0.8, y: 0.7 },
        colors: ["#818cf8", "#f472b6", "#34d399"],
      });
    }, 180);
  }
}
