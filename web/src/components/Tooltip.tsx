import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const GAP = 8;

export function Tooltip({
  label,
  children,
  className = "flex flex-col items-center",
  panelClassName = "w-44 text-center",
  placement = "top",
  align = "center",
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  placement?: "top" | "bottom";
  align?: "center" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isTop = placement === "top";

  function show() {
    setRect(ref.current?.getBoundingClientRect() ?? null);
    setOpen(true);
  }

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      onFocus={show}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open &&
        rect &&
        createPortal(
          <div
            role="tooltip"
            className={`fixed z-50 px-3 py-2 rounded-lg bg-surface-container-lowest border border-white/15 text-xs text-on-surface shadow-xl pointer-events-none ${panelClassName}`}
            style={{
              top: isTop ? rect.top - GAP : rect.bottom + GAP,
              left: align === "right" ? rect.right : rect.left + rect.width / 2,
              transform: `translate(${align === "right" ? "-100%" : "-50%"}, ${isTop ? "-100%" : "0"})`,
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </div>
  );
}
