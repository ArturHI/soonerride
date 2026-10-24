"use client";

import Link from "next/link";
import { Car, House, Plane, Repeat, Ticket, Trophy } from "lucide-react";
import { ymdLabel } from "@/lib/format";
import { scheduleLabel } from "@/lib/schedule";
import type { CircleCategory, CircleView } from "@/lib/types";
import { AvatarStack, Card, cx } from "./ui";

export const CATEGORIES: { value: CircleCategory; label: string; icon: typeof Trophy }[] = [
  { value: "weekly", label: "Weekly", icon: Repeat },
  { value: "game", label: "Game day", icon: Trophy },
  { value: "airport", label: "Airport", icon: Plane },
  { value: "holiday", label: "Going home", icon: House },
  { value: "event", label: "Event", icon: Ticket },
];

export function categoryOf(c: CircleCategory) {
  return CATEGORIES.find((x) => x.value === c)!;
}

export function CircleCard({ circle, wide }: { circle: CircleView; wide?: boolean }) {
  const cat = categoryOf(circle.category);
  const Icon = cat.icon;
  return (
    <Link href={`/circles/${circle.id}`} className={cx("block transition-transform active:scale-[0.99]", !wide && "w-[260px] shrink-0")}>
      <Card className="flex h-full flex-col p-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-crimson-50 text-crimson-600">
            <Icon size={15} strokeWidth={2.2} />
          </span>
          {cat.label}
          <span className="text-ink-3">·</span>
          <span className="truncate">
            {circle.category === "weekly" ? scheduleLabel(circle).replace("Every ", "") : ymdLabel(circle.date)}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-[17px] font-semibold leading-snug">{circle.title}</p>
        <p className="mt-0.5 truncate text-[14px] text-ink-2">
          {circle.pickup ? `${circle.pickup} → ${circle.destination}` : `To ${circle.destination}`}
        </p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="flex items-center gap-2">
            <AvatarStack users={circle.members} max={4} size={26} />
            <span className="text-[13px] font-medium text-ink-2">{circle.members.length} going</span>
          </span>
          <span className={cx("flex items-center gap-1 text-[13px] font-semibold", circle.seatsOffered ? "text-ok" : "text-ink-3")}>
            <Car size={15} />
            {circle.rideCount ? (circle.category === "weekly" ? "Has a driver" : `${circle.seatsOffered} seats`) : "No driver yet"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
