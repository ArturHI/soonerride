"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CalendarCheck, House, Search, UsersRound } from "lucide-react";
import { getMe, pendingForMe, useQuery } from "@/lib/data";
import { onToast, type Toast } from "@/lib/toast";
import { LogoMark } from "./logo";
import { cx } from "./ui";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/rides", label: "Rides", icon: Search },
  { href: "/circles", label: "Circles", icon: UsersRound },
  { href: "/trips", label: "Trips", icon: CalendarCheck },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const me = useQuery(getMe, []);
  const [ready, setReady] = useState(false);

  const isWelcome = path.startsWith("/welcome");

  useEffect(() => {
    if (me === undefined) return;
    if (!me && !isWelcome) router.replace("/welcome");
    else setReady(true);
  }, [me, isWelcome, router]);

  const showTabs = ready && !!me && TABS.some((t) => t.href === path);

  return (
    <div className="relative mx-auto min-h-dvh max-w-[440px] bg-cream sm:shadow-[0_0_0_1px_var(--color-line)]">
      {ready || isWelcome ? children : null}
      {showTabs && <TabBar path={path} />}
      <Toaster />
    </div>
  );
}

function TabBar({ path }: { path: string }) {
  const pending = useQuery(pendingForMe, []) ?? 0;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[440px] px-5 pb-safe">
      <div className="glass flex h-[64px] items-center justify-around rounded-full px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                "relative flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-colors",
                active ? "bg-crimson-600/[0.08] text-crimson-600" : "text-ink-2",
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {label}
              {href === "/trips" && pending > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-20px)] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-crimson-600 px-1 text-[10px] font-bold text-white">
                  {pending}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Toaster() {
  const [t, setT] = useState<Toast | null>(null);
  useEffect(() => onToast(setT), []);
  if (!t) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-[440px] justify-center px-4 pt-[max(env(safe-area-inset-top),12px)]">
      {t.href ? (
        <Link
          key={t.id}
          href={t.href}
          className="glass animate-rise pointer-events-auto flex w-full items-center gap-3 rounded-[22px] p-3 active:scale-[0.99]"
        >
          <LogoMark size={36} />
          <span className="min-w-0 flex-1">
            <span className="flex justify-between text-[13px] font-semibold">
              SoonerRide <span className="font-normal text-ink-3">now</span>
            </span>
            <span className="block text-[15px] leading-snug font-medium text-ink">{t.text}</span>
          </span>
        </Link>
      ) : (
        <div key={t.id} className="glass animate-rise rounded-full px-5 py-3 text-[15px] font-semibold text-ink">
          {t.text}
        </div>
      )}
    </div>
  );
}
