export function BreakEvenBar({ progress, brokeEven }: { progress: number; brokeEven: boolean }) {
  const width = Math.max(progress * 100, progress > 0 ? 4 : 0);
  return (
    <div
      className="be-track"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`be-fill ${brokeEven ? "be-fill-done" : ""}`} style={{ width: `${width}%` }} />
    </div>
  );
}
