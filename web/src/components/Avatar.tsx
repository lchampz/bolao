import type { CSSProperties } from "react";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  className = "",
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-full bg-surface-bright flex items-center justify-center font-bold text-white ${className}`}
      style={style}
    >
      {initials(name)}
    </div>
  );
}
