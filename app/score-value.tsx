function scoreNumber(score: number) {
  return score < 10 ? score.toFixed(2) : score.toFixed(1);
}

function scoreLengthClass(value: string) {
  if (value.length >= 8) return "big-score-xlong";
  if (value.length >= 6) return "big-score-long";
  if (value.length >= 5) return "big-score-medium";
  return "big-score-short";
}

export function ScoreValue({ score }: { score: number }) {
  const value = scoreNumber(score);
  return <div className={`big-score score-value ${scoreLengthClass(value)}`} aria-label={`${value} ori`}>
    <span className="score-digits" aria-hidden="true">{value}</span>
    <span className="score-times" aria-hidden="true">×</span>
  </div>;
}
