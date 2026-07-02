/**
 * Hexágono via SVG (não clip-path + border) — evita o artefato de "costura"
 * visível nos vértices quando se combina clip-path com border em CSS puro.
 */
export function HexBadge({
  icon,
  color,
  active,
  size = 64,
}: {
  icon: string;
  color: string;
  active: boolean;
  size?: number;
}) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <polygon
          points="50,2 96,26 96,74 50,98 4,74 4,26"
          fill="rgb(34 42 61)"
          stroke={active ? color : "rgba(255,255,255,0.15)"}
          strokeWidth="3"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="material-symbols-outlined icon-filled text-2xl transition-transform group-hover:scale-110"
          style={{ color: active ? color : "#5a6482" }}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
