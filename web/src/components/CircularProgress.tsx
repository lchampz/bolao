const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularProgress({ value, total }: { value: number; total: number }) {
  const ratio = total > 0 ? value / total : 0;
  const offset = CIRCUMFERENCE * (1 - ratio);

  return (
    <div className="z-10 flex items-center bg-surface-container-low/50 rounded-full p-2 pr-6 border border-white/5">
      <div className="relative w-16 h-16 mr-4 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="none" r={RADIUS} stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            className="progress-circle"
            cx="50"
            cy="50"
            fill="none"
            r={RADIUS}
            stroke="#65df76"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="8"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-label-md text-label-md text-white font-bold text-xs">{Math.round(ratio * 100)}%</span>
        </div>
      </div>
      <div>
        <p className="font-headline-md text-headline-md text-white m-0">
          {value}/{total}
        </p>
        <p className="font-label-md text-label-md text-on-surface-variant text-xs uppercase tracking-wider m-0">
          Palpites Enviados
        </p>
      </div>
    </div>
  );
}
