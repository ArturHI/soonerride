"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, HeartHandshake, MapPin, UsersRound } from "lucide-react";
import { cancelRequest, completeRide, getMe, getRide, requestSeat, respondToRequest, useQuery } from "@/lib/data";
import { arrival, driveMinutes, duration, firstName, LONG_TRIP_MILES, price, timeLabel, when } from "@/lib/format";
import { toast } from "@/lib/toast";
import { ActionBar, Avatar, Button, Card, Empty, LinkButton, cx } from "@/components/ui";
import { DriverCard, Route, SeatDots, Timeline } from "@/components/ride";
import { BottomSheet, RouteMap } from "@/components/map";
import { ThanksSheet } from "@/components/thanks";
import { WeekList } from "@/components/weekly";
import { ContactButtons } from "@/components/contact";
import { returnLabel } from "@/lib/schedule";
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

      {isDriver ? <DriverView ride={ride} me={me} /> : <PassengerView ride={ride} me={me} />}
    </main>
  );
}

function TripSummary({ ride }: { ride: RideDetail }) {
  return (
    <>
      {ride.circle && ride.weekly ? (
        <>
          <p className="text-[24px] font-bold tracking-tight">{ride.schedule}</p>
          <p className="mt-0.5 text-[14px] text-ink-2">
            {[ride.nextAt && `Next: ${when(ride.nextAt)}`, returnLabel(ride.circle)].filter(Boolean).join(" · ")}
          </p>
        </>
      ) : (
        <>
          <p className="text-[24px] font-bold tracking-tight">{when(ride.departAt)}</p>
          <p className="mt-0.5 text-[14px] text-ink-2">
            {ride.completed
              ? "Trip complete"
              : `Arrive about ${timeLabel(new Date(arrival(ride.departAt, ride.miles)))} · ${duration(driveMinutes(ride.miles))} · ${ride.miles} mi`}
          </p>
        </>
      )}
      <div className="mt-5">
        <Route from={ride.from} fromDetail={ride.fromDetail} to={ride.to} toDetail={ride.toDetail} />
      </div>
      {!!ride.extraMiles && (
        <p className="mt-3 flex items-center gap-2 text-[14px] text-ink-2">
          <MapPin size={15} className="shrink-0" />
          Planned stop{ride.stopsNote ? `: ${ride.stopsNote}` : ""} (+{ride.extraMiles} mi)
        </p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat
          label="Gas share"
          value={ride.pricePerSeat ? `${price(ride.pricePerSeat)} /seat` : "Free"}
          sub={
            ride.pricePerSeat ? (
              ride.aboveEstimate ? (
                <span className="font-semibold text-warn">Above ${ride.gasEstimate} estimate</span>
              ) : (
                `Gas estimate $${ride.gasEstimate}`
              )
            ) : ride.gasEstimate === null ? (
              `Under ${LONG_TRIP_MILES} mi, always free`
            ) : (
              "Driver made it free"
            )
          }
        />
        <Stat
          label="Seats"
          value={ride.seatsLeft > 0 ? `${ride.seatsLeft} of ${ride.seatsTotal} left` : "Full"}
          sub={<SeatDots total={ride.seatsTotal} left={ride.seatsLeft} />}
        />
      </div>
      {ride.aboveEstimate && ride.priceReason && (
        <p className="mt-3 rounded-2xl bg-warn-50 px-4 py-3 text-[14px] leading-snug text-ink-2">
          <span className="font-semibold text-warn">Why it's above the gas estimate: </span>“{ride.priceReason}”
        </p>
      )}
      {ride.circle && (
        <Link
          href={`/circles/${ride.circle.id}`}
          className="mt-3 flex items-center gap-3 rounded-2xl bg-crimson-50 px-4 py-3 active:opacity-80"
        >
          <UsersRound size={18} className="text-crimson-600" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold text-crimson-600">
              {ride.weekly ? "Weekly circle" : "Part of a Trip Circle"}
            </span>
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

function PassengerView({ ride, me }: { ride: RideDetail; me: User }) {
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState<"after" | "tip" | null>(null);
  const req = ride.myRequest;
  const driver = firstName(ride.driver.name);
  const rode = req?.status === "accepted";
  const needsThanks = rode && ride.completed && !req.feedbackAt;

  // When the driver completes the ride, invite the rider to say thanks (once per tab).
  useEffect(() => {
    if (!needsThanks) return;
    const key = `soonerride:thanks-shown:${req.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    setThanks("after");
  }, [needsThanks, req?.id]);

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
          {rode && ride.completed && (
            <div className="animate-rise mb-5 flex items-center gap-3 rounded-2xl bg-ok-50 p-4">
              <Flag size={26} className="text-ok" />
              <div>
                <p className="text-[17px] font-bold text-ok">You made it to {ride.to}</p>
                <p className="text-[14px] text-ink-2">{req.feedbackAt ? `You thanked ${driver}.` : `Ride with ${driver} complete.`}</p>
              </div>
            </div>
          )}
          {rode && !ride.completed && (
            <div className="animate-rise mb-5 flex items-center gap-3 rounded-2xl bg-ok-50 p-4">
              <CheckCircle2 size={28} className="text-ok" />
              <div>
                <p className="text-[17px] font-bold text-ok">{ride.weekly ? "You're signed up" : "Booking confirmed"}</p>
                <p className="text-[14px] text-ink-2">
                  {ride.weekly ? `Your seat with ${driver} every week. Skip any week below.` : `Meet ${driver} at ${ride.fromDetail}.`}
                </p>
              </div>
            </div>
          )}

          <TripSummary ride={ride} />

          <div className="mt-6 border-t border-line pt-5">
            <DriverCard driver={ride.driver} />
            {rode && !ride.completed && (
              <div className="mt-4">
                <ContactButtons user={ride.driver} />
              </div>
            )}
            {ride.note && <p className="mt-4 rounded-2xl bg-fill px-4 py-3 text-[15px] leading-snug text-ink-2">“{ride.note}”</p>}
          </div>
          {ride.weekly ? (
            <div className="mt-6">
              <p className="mb-2 text-[13px] font-semibold text-ink-2">Next few weeks</p>
              <WeekList ride={ride} me={me} canCover={false} />
            </div>
          ) : (
            req && (
              <Card className="mt-6 p-4 pb-1">
                <p className="mb-3 text-[13px] font-semibold text-ink-2">Your trip</p>
                <Timeline ride={ride} request={req} />
              </Card>
            )
          )}

          {rode && !ride.completed && !req.feedbackAt && (
            <button
              onClick={() => setThanks("tip")}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left ring-1 ring-line/70"
            >
              <HeartHandshake size={20} className="shrink-0 text-crimson-600" />
              <span className="flex-1 text-[14px] leading-snug text-ink-2">
                <span className="block font-semibold text-ink">Thank {driver}</span>
                Tip anytime through Venmo, Cash App or Zelle. Always optional.
              </span>
              <ChevronRight size={18} className="text-ink-3" />
            </button>
          )}

          <Riders users={ride.passengers} />
        </div>
      </BottomSheet>

      <ActionBar spacer={false}>
        {!req && ride.completed && (
          <Button size="lg" disabled>
            This ride has ended
          </Button>
        )}
        {!req &&
          !ride.completed &&
          (ride.seatsLeft > 0 ? (
            <Button size="lg" disabled={busy} onClick={() => run(() => requestSeat(ride.id), `Request sent to ${driver}`)}>
              {ride.weekly ? "Sign up for every week" : `Request a seat · ${price(ride.pricePerSeat)}`}
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
        {rode && !ride.completed && (
          <Button size="lg" variant="secondary" disabled={busy} onClick={() => run(() => cancelRequest(req.id), "Booking cancelled")}>
            {ride.weekly ? "Leave weekly ride" : "Cancel booking"}
          </Button>
        )}
        {needsThanks && (
          <Button size="lg" onClick={() => setThanks("after")}>
            Say thanks to {driver}
          </Button>
        )}
        {rode && ride.completed && req.feedbackAt && (
          <LinkButton href="/rides" size="lg" variant="secondary">
            Find your next ride
          </LinkButton>
        )}
        {req?.status === "declined" && (
          <LinkButton href={`/rides?q=${encodeURIComponent(ride.to)}`} size="lg">
            Find another ride to {ride.to}
          </LinkButton>
        )}
      </ActionBar>

      {thanks && req && <ThanksSheet driver={ride.driver} request={req} afterRide={thanks === "after"} onClose={() => setThanks(null)} />}
    </>
  );
}

// ---------- Driver ----------

function DriverView({ ride, me }: { ride: RideDetail; me: User }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pending = ride.requests.filter((r) => r.status === "pending");
  const declined = ride.requests.filter((r) => r.status === "declined");
  const riders = ride.requests.filter((r) => r.status === "accepted");

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  async function complete() {
    if (!confirming) return setConfirming(true);
    setBusy("complete");
    try {
      await completeRide(ride.id);
      toast("Ride complete. Nice driving!");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
      setConfirming(false);
    }
  }

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
    <>
      <BottomSheet peek="40dvh">
        <div className="pt-1 pb-32">
          <p className="mb-2 text-[13px] font-semibold tracking-wide text-crimson-600 uppercase">
            {ride.completed ? "You drove" : "You're driving"}
          </p>
          <TripSummary ride={ride} />

          {ride.weekly && (
            <div className="mt-7">
              <h2 className="mb-1 text-[20px] font-bold tracking-tight">Next few weeks</h2>
              <p className="mb-3 text-[14px] text-ink-2">Can't make a week? Skip it, and other members can cover.</p>
              <WeekList ride={ride} me={me} canCover={false} />
            </div>
          )}

          {!ride.completed && (
            <div className="mt-7">
              <h2 className="text-[20px] font-bold tracking-tight">
                Requests
                {pending.length > 0 && <span className="ml-2 text-ink-3">{pending.length}</span>}
              </h2>
              {pending.length === 0 && (
                <p className="mt-1 text-[15px] text-ink-2">No new requests. Riders who request a seat show up here.</p>
              )}
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
          )}

          <div className="mt-7">
            <h2 className="text-[20px] font-bold tracking-tight">Passengers</h2>
            {riders.length === 0 ? (
              <p className="mt-1 text-[15px] text-ink-2">{ride.completed ? "No passengers on this trip." : "Nobody confirmed yet."}</p>
            ) : (
              <div className="mt-3 divide-y divide-line overflow-hidden rounded-[22px] bg-surface ring-1 ring-line/70">
                {riders.map((r) => (
                  <div key={r.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={r.passenger} size={36} />
                      <span className="flex-1 text-[15px] font-medium">{r.passenger.name}</span>
                      {r.feedbackAt ? (
                        <span className="flex items-center gap-1 text-[13px] font-semibold text-crimson-600">
                          <HeartHandshake size={15} /> Said thanks{r.rating ? ` · ★ ${r.rating}` : ""}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[13px] font-semibold text-ok">
                          <CheckCircle2 size={15} /> {ride.completed ? "Rode with you" : "Confirmed"}
                        </span>
                      )}
                      {!ride.completed && <ContactButtons user={r.passenger} compact />}
                    </div>
                    {r.thanksNote && <p className="mt-2 ml-12 text-[14px] text-ink-2">“{r.thanksNote}”</p>}
                  </div>
                ))}
              </div>
            )}
            {declined.length > 0 && <p className={cx("mt-3 text-[13px] text-ink-3")}>{declined.length} declined</p>}
          </div>
        </div>
      </BottomSheet>

      {!ride.completed && !ride.weekly && riders.length > 0 && (
        <ActionBar spacer={false}>
          <Button size="lg" variant={confirming ? "primary" : "secondary"} disabled={!!busy} onClick={complete}>
            <Flag size={18} /> {confirming ? "Tap again to complete" : "Complete ride"}
          </Button>
        </ActionBar>
      )}
    </>
  );
}
