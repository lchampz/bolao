import { useState, type ReactNode } from "react";

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full mb-2 z-30 w-44 text-center px-3 py-2 rounded-lg bg-surface-container-lowest border border-white/15 text-xs text-on-surface shadow-xl pointer-events-none"
        >
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-container-lowest" />
        </div>
      )}
    </div>
  );
}
