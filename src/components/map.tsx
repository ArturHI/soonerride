"use client";

import { useRef, useState, type ReactNode } from "react";
import { cx } from "./ui";

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** A quiet, stylized map. Not geographic — just enough to read as a route. */
export function RouteMap({ seed, from, to }: { seed: string; from: string; to: string }) {
  const r = rng(seed);
  const W = 400;
  const H = 560;
  const streets: string[] = [];
  for (let i = 0; i < 9; i++) {
    const y = 20 + i * 62 + r() * 20;
    streets.push(`M -20 ${y} L ${W + 20} ${y + (r() - 0.5) * 60}`);
  }
  for (let i = 0; i < 7; i++) {
    const x = 10 + i * 64 + r() * 20;
    streets.push(`M ${x} -20 L ${x + (r() - 0.5) * 80} ${H + 20}`);
  }
  const parks = Array.from({ length: 3 }, () => ({ x: r() * 320, y: r() * 420, w: 50 + r() * 60, h: 40 + r() * 50 }));
  const o = { x: 92, y: 255 };
  const d = { x: 300, y: 104 };
  const route = `M ${o.x} ${o.y} C ${o.x + 30} ${o.y - 120}, ${d.x - 120} ${d.y + 60 + r() * 40}, ${d.x} ${d.y}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMin slice"
      className="h-full w-full"
      aria-label={`Route from ${from} to ${to}`}
    >
      <rect width={W} height={H} fill="#ece6db" />
      {parks.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={10} fill="#dfe3d0" />
      ))}
      <path
        d={`M -20 ${180 + r() * 60} C 120 ${120 + r() * 80}, 260 ${300 + r() * 60}, ${W + 20} ${220 + r() * 60}`}
        stroke="#d6dde0"
        strokeWidth={22}
        fill="none"
      />
      {streets.map((s, i) => (
        <path key={i} d={s} stroke="#fbf8f3" strokeWidth={i % 4 === 0 ? 9 : 4} fill="none" />
      ))}
      <path d={route} stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" />
      <path d={route} stroke="#1b1816" strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={o.x} cy={o.y} r={9} fill="#1b1816" />
      <circle cx={o.x} cy={o.y} r={3.5} fill="#fff" />
      <rect x={d.x - 9} y={d.y - 9} width={18} height={18} fill="#841617" />
      <rect x={d.x - 3.5} y={d.y - 3.5} width={7} height={7} fill="#fff" />
      <MapLabel x={o.x} y={o.y + 32} text={from} />
      <MapLabel x={d.x} y={d.y - 24} text={to} />
    </svg>
  );
}

function MapLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const w = Math.max(60, text.length * 8.2 + 24);
  const cx0 = Math.min(Math.max(x, w / 2 + 8), 400 - w / 2 - 8);
  return (
    <g>
      <rect x={cx0 - w / 2} y={y - 15} width={w} height={28} rx={14} fill="#fff" opacity={0.95} />
      <text
        x={cx0}
        y={y + 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={600}
        fill="#1b1816"
        fontFamily="-apple-system, system-ui, sans-serif"
      >
        {text}
      </text>
    </g>
  );
}

/** Draggable sheet over the map. Drag or tap the handle to expand/collapse. */
export function BottomSheet({ children, peek = "44dvh" }: { children: ReactNode; peek?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const moved = useRef(false);

  return (
    <div
      className={cx(
        "fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[440px] flex-col rounded-t-[30px] bg-[rgb(250_248_244/0.94)] shadow-[0_-10px_40px_-12px_rgb(60_35_20/0.3)] backdrop-blur-xl",
        start.current === null && "transition-[top] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
      )}
      style={{ top: expanded ? "72px" : peek, transform: drag ? `translateY(${drag}px)` : undefined }}
    >
      <div
        className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center"
        onPointerDown={(e) => {
          start.current = e.clientY;
          moved.current = false;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (start.current === null) return;
          const dy = e.clientY - start.current;
          if (Math.abs(dy) > 4) moved.current = true;
          setDrag(expanded ? Math.max(0, dy) : Math.min(0, dy));
        }}
        onPointerUp={() => {
          if (!moved.current) setExpanded((x) => !x);
          else if (drag < -50) setExpanded(true);
          else if (drag > 50) setExpanded(false);
          start.current = null;
          setDrag(0);
        }}
        aria-label={expanded ? "Collapse details" : "Expand details"}
        role="button"
      >
        <span className="h-[5px] w-10 rounded-full bg-ink-3/40" />
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
    </div>
  );
}
