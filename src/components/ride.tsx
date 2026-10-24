"use client";

import Link from "next/link";
import { Check, ShieldCheck, Star, X } from "lucide-react";
import { arrival, driveMinutes, duration, price, timeLabel, when } from "@/lib/format";
import type { RequestStatus, RideView, SeatRequest, User } from "@/lib/types";
import { Avatar, Card, Pill, cx, type Tone } from "./ui";

export const STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  pending: { label: "Requested", tone: "warn" },
  accepted: { label: "Confirmed", tone: "ok" },
  declined: { label: "Declined", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

/** Uber-style origin → destination column. */
export function Route({
  from,
  fromDetail,
  to,
  toDetail,
  compact,
}: {
  from: string;
  fromDetail?: string;
  to: string;
  toDetail?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-[7px]">
        <span className="h-2 w-2 rounded-full bg-ink" />
        <span className={cx("my-1 w-px flex-1 bg-ink-3/50", compact ? "min-h-4" : "min-h-6")} />
        <span className="h-2 w-2 bg-crimson-600" />
      </div>
      <div className={cx("flex min-w-0 flex-col", compact ? "gap-2" : "gap-3.5")}>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{from}</p>
          {fromDetail && <p className="truncate text-[13px] text-ink-2">{fromDetail}</p>}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{to}</p>
          {toDetail && <p className="truncate text-[13px] text-ink-2">{toDetail}</p>}
        </div>
      </div>
    </div>
  );
}

export function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-ink">
      <Star size={13} className="fill-ink" strokeWidth={0} />
      {value.toFixed(1)}
    </span>
  );
}

export function RideCard({ ride, showStatus = true, mine }: { ride: RideView; showStatus?: boolean; mine?: boolean }) {
  const status = ride.myRequest && STATUS[ride.myRequest.status];
  const full = ride.seatsLeft <= 0;
  return (
    <Link href={`/rides/${ride.id}`} className="block active:scale-[0.99] transition-transform">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[14px] font-semibold text-ink-2">{when(ride.departAt)}</p>
          <p className="text-[17px] font-bold tabular-nums">
            {price(ride.pricePerSeat)}
            {ride.pricePerSeat ? <span className="text-[13px] font-medium text-ink-3"> /seat</span> : null}
          </p>
        </div>
        <Route from={ride.from} fromDetail={ride.fromDetail} to={ride.to} toDetail={ride.toDetail} compact />
        <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-3">
          <Avatar user={ride.driver} size={30} />
          <p className="min-w-0 flex-1 truncate text-[14px] font-medium">
            {ride.driver.name.split(" ")[0]}{" "}
            <span className="ml-1">
              <Rating value={ride.driver.rating} />
            </span>
          </p>
          {showStatus && status ? (
            <Pill tone={status.tone}>{status.label}</Pill>
          ) : mine && ride.pendingCount > 0 ? (
            <Pill tone="crimson">
              {ride.pendingCount} new request{ride.pendingCount === 1 ? "" : "s"}
            </Pill>
          ) : (
            <span className={cx("text-[13px] font-semibold", full ? "text-ink-3" : "text-ink")}>
              {full ? "Full" : `${ride.seatsLeft} seat${ride.seatsLeft === 1 ? "" : "s"} left`}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function DriverCard({ driver }: { driver: User }) {
  return (
    <div className="flex items-center gap-3.5">
      <Avatar user={driver} size={56} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[17px] font-semibold">
          {driver.name}
          <ShieldCheck size={16} className="text-crimson-600" aria-label="Verified OU student" />
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[14px] whitespace-nowrap text-ink-2">
          <Rating value={driver.rating} />
          <span>·</span>
          <span>{driver.tripCount} trips</span>
        </p>
      </div>
      {driver.car && (
        <div className="text-right">
          <p className="inline-block rounded-md bg-fill px-2 py-0.5 font-mono text-[13px] font-semibold tracking-wide">
            {driver.car.plate}
          </p>
          <p className="mt-1 text-[13px] text-ink-2">
            {driver.car.color} {driver.car.make}
          </p>
        </div>
      )}
    </div>
  );
}

/** Trip progress, like Uber's live trip status. */
export function Timeline({ ride, request }: { ride: RideView; request: SeatRequest }) {
  const declined = request.status === "declined";
  const accepted = request.status === "accepted";
  const t = (iso: string) => timeLabel(new Date(iso));
  const steps: { label: string; detail: string; state: "done" | "current" | "todo" | "fail" }[] = [
    { label: "Seat requested", detail: t(request.createdAt), state: "done" },
    declined
      ? { label: "Driver declined", detail: "Try another ride or your Trip Circle", state: "fail" }
      : accepted
        ? { label: "Driver accepted", detail: t(request.updatedAt), state: "done" }
        : { label: "Waiting for driver", detail: `${ride.driver.name.split(" ")[0]} usually replies within an hour`, state: "current" },
  ];
  if (!declined) {
    steps.push(
      { label: "Pickup", detail: `${when(ride.departAt)} · ${ride.fromDetail}`, state: accepted ? "current" : "todo" },
      {
        label: `Arrive in ${ride.to}`,
        detail: `About ${t(arrival(ride.departAt, ride.to))} · ${duration(driveMinutes(ride.to))}`,
        state: "todo",
      },
    );
  }
  return (
    <ol>
      {steps.map((s, i) => (
        <li key={s.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cx(
                "flex h-6 w-6 items-center justify-center rounded-full",
                s.state === "done" && "bg-ok text-white",
                s.state === "current" && "bg-surface ring-2 ring-crimson-600",
                s.state === "todo" && "bg-fill",
                s.state === "fail" && "bg-ink-3 text-white",
              )}
            >
              {s.state === "done" && <Check size={14} strokeWidth={3} />}
              {s.state === "fail" && <X size={14} strokeWidth={3} />}
              {s.state === "current" && <span className="h-2 w-2 rounded-full bg-crimson-600" />}
            </span>
            {i < steps.length - 1 && <span className={cx("w-0.5 flex-1 min-h-5", s.state === "done" ? "bg-ok" : "bg-fill")} />}
          </div>
          <div className="pb-4">
            <p className={cx("text-[15px] font-semibold leading-6", s.state === "todo" && "text-ink-3")}>{s.label}</p>
            <p className="text-[13px] text-ink-2">{s.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Seat dots: filled = taken, outlined = open. */
export function SeatDots({ total, left }: { total: number; left: number }) {
  return (
    <span className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx("h-2.5 w-2.5 rounded-full", i < total - left ? "bg-ink" : "ring-[1.5px] ring-ink-3 ring-inset")} />
      ))}
    </span>
  );
}
