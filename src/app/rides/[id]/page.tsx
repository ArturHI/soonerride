"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, UsersRound } from "lucide-react";
import { cancelRequest, getMe, getRide, requestSeat, respondToRequest, useQuery } from "@/lib/data";
import { arrival, driveMinutes, duration, firstName, price, timeLabel, when } from "@/lib/format";
import { toast } from "@/lib/toast";
import { ActionBar, Avatar, Button, Card, Empty, LinkButton, cx } from "@/components/ui";
import { DriverCard, Route, SeatDots, Timeline } from "@/components/ride";
import { BottomSheet, RouteMap } from "@/components/map";
import type { RideDetail, User } from "@/lib/types";

export default function RidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ride = useQuery(() => getRide(id), [id]);
  const me = useQuery(getMe);

  if (ride === undefined || !me) return null;
  if (ride === null) {
    return (
      <main className="pt-20">
        <Empty
          icon={<Clock size={24} />}
          title="Ride not found"
          body="It may have been removed by the driver."
          action={<LinkButton href="/rides">Find a ride</LinkButton>}
        />
      </main>
    );
  }

  const isDriver = ride.driverId === me.id;

  return (
    <main>
      <div className="fixed inset-x-0 top-0 z-0 mx-auto h-[50dvh] max-w-[440px] overflow-hidden">
        <RouteMap seed={ride.id} from={ride.from} to={ride.to} />
      </div>
      <button
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/rides"))}
        className="glass fixed top-[max(env(safe-area-inset-top),14px)] z-40 ml-4 flex h-11 w-11 items-center justify-center rounded-full"
        aria-label="Back"
      >
        <ChevronLeft size={24} strokeWidth={2.4} />
      </button>

      {isDriver ? <DriverView ride={ride} /> : <PassengerView ride={ride} />}
    </main>
  );
}

function TripSummary({ ride }: { ride: RideDetail }) {
  return (
    <>
      <p className="text-[24px] font-bold tracking-tight">{when(ride.departAt)}</p>
      <p className="mt-0.5 text-[14px] text-ink-2">
        Arrive about {timeLabel(new Date(arrival(ride.departAt, ride.to)))} · {duration(driveMinutes(ride.to))} drive
      </p>
      <div className="mt-5">
        <Route from={ride.from} fromDetail={ride.fromDetail} to={ride.to} toDetail={ride.toDetail} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat
          label="Cost per seat"
          value={price(ride.pricePerSeat)}
          sub={ride.pricePerSeat ? "Gas contribution" : "Driver isn't charging"}
        />
        <Stat
          label="Seats"
          value={ride.seatsLeft > 0 ? `${ride.seatsLeft} of ${ride.seatsTotal} left` : "Full"}
          sub={<SeatDots total={ride.seatsTotal} left={ride.seatsLeft} />}
        />
      </div>
      {ride.circle && (
        <Link
          href={`/circles/${ride.circle.id}`}
          className="mt-3 flex items-center gap-3 rounded-2xl bg-crimson-50 px-4 py-3 active:opacity-80"
        >
          <UsersRound size={18} className="text-crimson-600" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold text-crimson-600">Part of a Trip Circle</span>
            <span className="block truncate text-[15px] font-semibold">{ride.circle.title}</span>
          </span>
          <ChevronRight size={18} className="text-crimson-600" />
        </Link>
      )}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-3.5 ring-1 ring-line/70">
      <p className="text-[12px] font-medium text-ink-2">{label}</p>
      <p className="mt-0.5 text-[18px] font-bold">{value}</p>
      <div className="mt-1 text-[12px] text-ink-3">{sub}</div>
    </div>
  );
}

function Riders({ users }: { users: User[] }) {
  if (!users.length) return null;
  return (
    <div className="mt-6">
      <p className="mb-2 text-[13px] font-semibold text-ink-2">Riding along</p>
      <div className="flex flex-wrap gap-3">
        {users.map((u) => (
          <span key={u.id} className="flex items-center gap-2 rounded-full bg-surface py-1 pr-3 pl-1 ring-1 ring-line/70">
            <Avatar user={u} size={28} />
            <span className="text-[14px] font-medium">{firstName(u.name)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------- Passenger ----------

function PassengerView({ ride }: { ride: RideDetail }) {
  const [busy, setBusy] = useState(false);
  const req = ride.myRequest;
  const driver = firstName(ride.driver.name);

  async function run(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try {
      await fn();
      toast(msg);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BottomSheet peek="40dvh">
        <div className="pt-1 pb-32">
          {req?.status === "pending" && (
            <div className="animate-rise mb-5 flex items-center gap-3 rounded-2xl bg-warn-50 p-4">
              <Clock size={26} className="text-warn" />
              <div>
                <p className="text-[17px] font-bold text-warn">Request sent</p>
                <p className="text-[14px] text-ink-2">We'll let you know when {driver} responds.</p>
              </div>
            </div>
          )}
          {req?.status === "accepted" && (
            <div className="animate-rise mb-5 flex items-center gap-3 rounded-2xl bg-ok-50 p-4">
              <CheckCircle2 size={28} className="text-ok" />
              <div>
                <p className="text-[17px] font-bold text-ok">Booking confirmed</p>
                <p className="text-[14px] text-ink-2">
                  Meet {driver} at {ride.fromDetail}.
                </p>
              </div>
            </div>
          )}

          <TripSummary ride={ride} />

          <div className="mt-6 border-t border-line pt-5">
            <DriverCard driver={ride.driver} />
            {ride.note && <p className="mt-4 rounded-2xl bg-fill px-4 py-3 text-[15px] leading-snug text-ink-2">“{ride.note}”</p>}
          </div>

          {req && (
            <Card className="mt-6 p-4 pb-1">
              <p className="mb-3 text-[13px] font-semibold text-ink-2">Your trip</p>
              <Timeline ride={ride} request={req} />
            </Card>
          )}

          <Riders users={ride.passengers} />
        </div>
      </BottomSheet>

      <ActionBar spacer={false}>
        {!req &&
          (ride.seatsLeft > 0 ? (
            <Button size="lg" disabled={busy} onClick={() => run(() => requestSeat(ride.id), `Request sent to ${driver}`)}>
              Request a seat · {price(ride.pricePerSeat)}
            </Button>
          ) : (
            <Button size="lg" disabled>
              This ride is full
            </Button>
          ))}
        {req?.status === "pending" && (
          <Button size="lg" variant="secondary" disabled={busy} onClick={() => run(() => cancelRequest(req.id), "Request cancelled")}>
            Cancel request
          </Button>
        )}
        {req?.status === "accepted" && (
          <Button size="lg" variant="secondary" disabled={busy} onClick={() => run(() => cancelRequest(req.id), "Booking cancelled")}>
            Cancel booking
          </Button>
        )}
        {req?.status === "declined" && (
          <LinkButton href={`/rides?q=${encodeURIComponent(ride.to)}`} size="lg">
            Find another ride to {ride.to}
          </LinkButton>
        )}
      </ActionBar>
    </>
  );
}

// ---------- Driver ----------

function DriverView({ ride }: { ride: RideDetail }) {
  const [busy, setBusy] = useState<string | null>(null);
  const pending = ride.requests.filter((r) => r.status === "pending");
  const declined = ride.requests.filter((r) => r.status === "declined");

  async function respond(id: string, d: "accepted" | "declined", name: string) {
    setBusy(id);
    try {
      await respondToRequest(id, d);
      toast(d === "accepted" ? `${firstName(name)} is confirmed` : "Request declined");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <BottomSheet peek="40dvh">
      <div className="pt-1 pb-10">
        <p className="mb-2 text-[13px] font-semibold tracking-wide text-crimson-600 uppercase">You're driving</p>
        <TripSummary ride={ride} />

        <div className="mt-7">
          <h2 className="text-[20px] font-bold tracking-tight">
            Requests
            {pending.length > 0 && <span className="ml-2 text-ink-3">{pending.length}</span>}
          </h2>
          {pending.length === 0 && <p className="mt-1 text-[15px] text-ink-2">No new requests. Riders who request a seat show up here.</p>}
          <div className="mt-3 space-y-3">
            {pending.map((r) => (
              <Card key={r.id} className="animate-rise p-4">
                <div className="flex items-center gap-3">
                  <Avatar user={r.passenger} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold">{r.passenger.name}</p>
                    <p className="text-[13px] text-ink-2">
                      ★ {r.passenger.rating.toFixed(1)} · {r.passenger.major ?? "OU student"} · {r.seats} seat
                    </p>
                  </div>
                </div>
                {r.message && <p className="mt-3 text-[14px] text-ink-2">“{r.message}”</p>}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="secondary" disabled={!!busy} onClick={() => respond(r.id, "declined", r.passenger.name)}>
                    Decline
                  </Button>
                  <Button disabled={!!busy || ride.seatsLeft < r.seats} onClick={() => respond(r.id, "accepted", r.passenger.name)}>
                    {ride.seatsLeft < r.seats ? "Ride full" : "Accept"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <h2 className="text-[20px] font-bold tracking-tight">Passengers</h2>
          {ride.passengers.length === 0 ? (
            <p className="mt-1 text-[15px] text-ink-2">Nobody confirmed yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-[22px] bg-surface ring-1 ring-line/70">
              {ride.passengers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar user={u} size={36} />
                  <span className="flex-1 text-[15px] font-medium">{u.name}</span>
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-ok">
                    <CheckCircle2 size={15} /> Confirmed
                  </span>
                </div>
              ))}
            </div>
          )}
          {declined.length > 0 && <p className={cx("mt-3 text-[13px] text-ink-3")}>{declined.length} declined</p>}
        </div>
      </div>
    </BottomSheet>
  );
}
