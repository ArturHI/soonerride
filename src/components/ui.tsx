"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { initials } from "@/lib/format";
import type { User } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ---------- Buttons ----------

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-crimson-600 text-white active:bg-crimson-700 disabled:bg-crimson-600/40",
  secondary: "bg-fill text-ink active:bg-line disabled:text-ink-3",
  ghost: "text-crimson-600 active:bg-crimson-50",
  danger: "bg-surface text-crimson-600 ring-1 ring-line active:bg-crimson-50",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors select-none disabled:cursor-not-allowed",
        size === "sm" && "h-9 px-4 text-[14px]",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-[54px] w-full px-6 text-[17px]",
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors select-none",
        size === "sm" && "h-9 px-4 text-[14px]",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-[54px] w-full px-6 text-[17px]",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

// ---------- Avatar ----------

export function Avatar({ user, size = 40, ring }: { user: Pick<User, "name" | "avatarColor">; size?: number; ring?: boolean }) {
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", ring && "ring-2 ring-white")}
      style={{ width: size, height: size, background: user.avatarColor, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(user.name)}
    </span>
  );
}

export function AvatarStack({ users, max = 4, size = 28 }: { users: User[]; max?: number; size?: number }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((u, i) => (
        <span key={u.id} style={{ marginLeft: i ? -size * 0.3 : 0 }}>
          <Avatar user={u} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-fill text-[11px] font-semibold text-ink-2 ring-2 ring-white"
          style={{ width: size, height: size, marginLeft: -size * 0.3 }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

// ---------- Layout ----------

export function TopBar({ title, back, right, large }: { title?: string; back?: boolean | string; right?: ReactNode; large?: boolean }) {
  const router = useRouter();
  if (large) {
    return (
      <header className="flex items-end justify-between gap-3 px-5 pt-[max(env(safe-area-inset-top),24px)] pb-3">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight">{title}</h1>
        {right}
      </header>
    );
  }
  return (
    <header className="glass-bar sticky top-0 z-30 border-b border-line/60">
      <div className="flex h-14 items-center gap-2 px-4 pt-[env(safe-area-inset-top)]">
        {back && (
          <button
            onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-fill"
            aria-label="Back"
          >
            <ChevronLeft size={26} strokeWidth={2.2} />
          </button>
        )}
        <h1 className="flex-1 truncate text-[17px] font-semibold">{title}</h1>
        {right}
      </div>
    </header>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("mt-7", className)}>
      <div className="mb-3 flex items-baseline justify-between px-5">
        <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div {...props} className={cx("rounded-[22px] bg-surface shadow-[0_1px_2px_rgb(60_35_20/0.06)] ring-1 ring-line/70", className)}>
      {children}
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-fill text-ink-2">{icon}</span>
      <p className="text-[17px] font-semibold">{title}</p>
      <p className="mt-1 text-[15px] leading-snug text-ink-2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Inputs ----------

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[13px] text-ink-3">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-2xl bg-surface px-4 text-[16px] text-ink ring-1 ring-line outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-crimson-600/60";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cx(inputClass, props.className)} />;
}

export function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-fill text-ink active:bg-line disabled:text-ink-3/50"
        aria-label="Fewer"
      >
        <Minus size={20} />
      </button>
      <span className="w-6 text-center text-[24px] font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-fill text-ink active:bg-line disabled:text-ink-3/50"
        aria-label="More"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; badge?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full bg-fill p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-all",
            value === o.value ? "bg-surface text-ink shadow-sm" : "text-ink-2",
          )}
        >
          {o.label}
          {!!o.badge && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-crimson-600 px-1 text-[11px] text-white">
              {o.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium transition-colors",
        active ? "bg-ink text-white" : "bg-surface text-ink ring-1 ring-line active:bg-fill",
      )}
    >
      {children}
    </button>
  );
}

// ---------- Status ----------

export type Tone = "neutral" | "ok" | "warn" | "crimson";
const TONES: Record<Tone, string> = {
  neutral: "bg-fill text-ink-2",
  ok: "bg-ok-50 text-ok",
  warn: "bg-warn-50 text-warn",
  crimson: "bg-crimson-50 text-crimson-600",
};

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold", TONES[tone])}>{children}</span>
  );
}

/** Fixed action area at the bottom of a screen, in glass. */
export function ActionBar({ children, spacer = true }: { children: ReactNode; spacer?: boolean }) {
  return (
    <>
      {spacer && <div className="h-28" />}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[440px] px-4 pb-safe">
        <div className="glass rounded-[28px] p-2.5">{children}</div>
      </div>
    </>
  );
}
