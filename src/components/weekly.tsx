"use client";

import { useState } from "react";
import { Car, Repeat } from "lucide-react";
import { getWeeks, setCover, setSkip, useQuery } from "@/lib/data";
import { firstName, timeLabel } from "@/lib/format";
import { returnLabel, scheduleLabel, shortDate } from "@/lib/schedule";
import { toast } from "@/lib/toast";
import type { Circle, RideView, User } from "@/lib/types";
import { AvatarStack, cx } from "./ui";

/** "Every Wed · 8:40 AM · back at 10:20 AM" with a repeat icon. */
export function ScheduleLine({ circle, className }: { circle: Circle; className?: string }) {
  return (
    <p className={cx("flex items-center gap-1.5 text-[15px] text-ink-2", className)}>
      <Repeat size={16} className="shrink-0" />
      {[scheduleLabel(circle), returnLabel(circle)].filter(Boolean).join(" · ")}
    </p>
  );
}

/**
 * The next few weeks of a weekly ride: who's driving and riding each week,
 * with skip / undo for the driver and riders, and "I'll drive" for weeks
 * the regular driver can't make.
 */
export function WeekList({ ride, me, canCover }: { ride: RideView; me: User; canCover: boolean }) {
  const weeks = useQuery(() => getWeeks(ride.id, 4), [ride.id]);
  const [busy, setBusy] = useState<string | null>(null);
  const isDriver = ride.driverId === me.id;
  const isRider = ride.myRequest?.status === "accepted";

  async function run(date: string, fn: () => Promise<void>, msg: string) {
    setBusy(date);
    try {
      await fn();
      toast(msg);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!weeks?.length) return null;
  return (
    <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-surface ring-1 ring-line/70">
      {weeks.map((w) => {
        const day = shortDate(w.date);
        const off = (isDriver || isRider) && w.iSkip;
        let action: { label: string; onClick: () => void; primary?: boolean } | null = null;
        if (isDriver || isRider) {
          action = w.iSkip
            ? { label: "Undo", onClick: () => run(w.date, () => setSkip(ride.id, w.date, false), `You're back on for ${day}`) }
            : { label: "Skip", onClick: () => run(w.date, () => setSkip(ride.id, w.date, true), `Skipping ${day}`) };
        } else if (w.iCover) {
          action = { label: "Undo", onClick: () => run(w.date, () => setCover(ride.id, w.date, false), "Okay, you're not driving") };
        } else if (!w.driver && canCover) {
          action = {
            label: "I'll drive",
            primary: true,
            onClick: () => run(w.date, () => setCover(ride.id, w.date, true), `Thanks! You're driving ${day}`),
          };
        }
        return (
          <div key={w.date} className={cx("flex items-center gap-3 px-4 py-3", off && "opacity-60")}>
            <div className="w-[54px] shrink-0 text-center">
              <p className="text-[12px] font-semibold text-ink-3 uppercase">{day.split(",")[0]}</p>
              <p className="text-[20px] leading-tight font-bold">{new Date(w.at).getDate()}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">
                {timeLabel(new Date(w.at))}
                {off && <span className="ml-1.5 font-medium text-ink-3">· You're skipping</span>}
              </p>
              {w.driver ? (
                <p className="flex items-center gap-1 truncate text-[13px] text-ink-2">
                  <Car size={13} className="shrink-0" />
                  {w.driver.id === me.id ? "You're" : firstName(w.driver.name)} {w.covering ? "covering" : "driving"}
                </p>
              ) : (
                <p className="text-[13px] font-semibold text-warn">Needs a driver</p>
              )}
            </div>
            {w.riders.length > 0 && <AvatarStack users={w.riders} max={3} size={24} />}
            {action && (
              <button
                onClick={action.onClick}
                disabled={!!busy}
                className={cx(
                  "h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold",
                  action.primary ? "bg-crimson-600 text-white" : "bg-fill text-ink",
                )}
              >
                {action.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
