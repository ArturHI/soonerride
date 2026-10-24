"use client";

// The only module the UI talks to for data. Every function is async and
// returns plain objects. Data is held in memory, loaded from and saved to the
// backend in backend.ts (Supabase when configured, else this browser).

import { useEffect, useState } from "react";
import { backend, type Op } from "./backend";
import { ABOVE_ESTIMATE, arrival, firstName, gasEstimate, LONG_TRIP_MILES, milesTo } from "./format";
import { AVATAR_COLORS, seed, type DB } from "./seed";
import { toast } from "./toast";
import type {
  Car,
  Circle,
  CircleCategory,
  CircleDetail,
  CircleView,
  Ride,
  RideDetail,
  RideView,
  SeatRequest,
  TipMethod,
  User,
} from "./types";

const SESSION_KEY = "soonerride:session";

let cache: DB | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

export const isShared = backend.shared;

/** Loads data once; every exported function awaits this first. */
function ready() {
  loading ??= (async () => {
    let data: DB | null = null;
    try {
      data = await backend.load();
    } catch (e) {
      console.error("Could not load data", e);
      toast("Can't reach the server. Check your connection.");
    }
    if (!data) {
      data = seed();
      await backend.replaceAll(data).catch((e) => console.error("Could not seed", e));
    }
    cache = data;
    backend.watch(refresh);
  })();
  return loading;
}

function db(): DB {
  return cache!;
}

/** Save local changes. On failure, reload the real data and surface the error. */
async function commit(ops: Op[]) {
  notify();
  try {
    await backend.apply(ops, db());
  } catch (e) {
    await refresh();
    throw new Error(`Couldn't save: ${(e as Error).message}`);
  }
}

/** Another device or tab changed something: reload and tell this user what's new for them. */
async function refresh() {
  try {
    const next = await backend.load();
    if (!next || !cache) return;
    const prev = cache;
    cache = next;
    announce(prev, next);
    notify();
  } catch (e) {
    console.error("Refresh failed", e);
  }
}

function announce(prev: DB, next: DB) {
  const myId = sessionId();
  if (!myId) return;
  const before = new Map(prev.requests.map((r) => [r.id, r]));
  const ridesBefore = new Map(prev.rides.map((r) => [r.id, r]));
  const name = (id: string) => firstName(next.users.find((u) => u.id === id)?.name ?? "Someone");
  for (const r of next.requests) {
    const ride = next.rides.find((x) => x.id === r.rideId);
    const old = before.get(r.id);
    if (!ride) continue;
    const href = `/rides/${ride.id}`;
    if (ride.driverId === myId && r.feedbackAt && !old?.feedbackAt) toast(`${name(r.passengerId)} said thanks for the ride`, href);
    if (old?.status === r.status) continue;
    if (ride.driverId === myId && r.status === "pending") toast(`${name(r.passengerId)} requested a seat to ${ride.to}`, href);
    if (r.passengerId === myId && r.status === "accepted") toast(`${name(ride.driverId)} accepted your seat request`, href);
    if (r.passengerId === myId && r.status === "declined") toast(`${name(ride.driverId)} declined your request`, href);
  }
  for (const ride of next.rides) {
    if (ride.status !== "completed" || ridesBefore.get(ride.id)?.status === "completed") continue;
    const mine = next.requests.some((q) => q.rideId === ride.id && q.passengerId === myId && q.status === "accepted");
    if (mine) toast(`You've arrived. Say thanks to ${name(ride.driverId)}?`, `/rides/${ride.id}`);
  }
}

export function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowISO = () => new Date().toISOString();

// ---------- Session ----------
// Kept per tab (sessionStorage) so two tabs can be two different students
// during the demo; localStorage remembers the last account for new tabs.

function sessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function setSessionId(id: string | null) {
  try {
    if (id) {
      sessionStorage.setItem(SESSION_KEY, id);
      localStorage.setItem(SESSION_KEY, id);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
  notify();
}

function me(): User | null {
  const id = sessionId();
  return db().users.find((u) => u.id === id) ?? null;
}

function requireMe(): User {
  const u = me();
  if (!u) throw new Error("Not signed in");
  return u;
}

export async function getMe() {
  await ready();
  return me();
}

export function isOUEmail(email: string) {
  return /^[^\s@]+@ou\.edu$/i.test(email.trim());
}

export async function findUserByEmail(email: string) {
  await ready();
  return db().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

export async function signIn(email: string, name?: string) {
  if (!isOUEmail(email)) throw new Error("Use your @ou.edu email");
  let user = await findUserByEmail(email);
  if (!user) {
    const d = db();
    user = {
      id: uid("u"),
      name: (name ?? "").trim() || email.split("@")[0],
      email: email.trim().toLowerCase(),
      rating: 5,
      tripCount: 0,
      avatarColor: AVATAR_COLORS[d.users.length % AVATAR_COLORS.length],
      car: null,
    };
    d.users.push(user);
    await commit([{ kind: "upsert", table: "users", row: user }]);
  }
  setSessionId(user.id);
  return user;
}

export async function switchUser(id: string) {
  setSessionId(id);
}

export async function signOut() {
  setSessionId(null);
}

export async function listUsers() {
  await ready();
  return [...db().users];
}

export async function updateMyPayments(handles: Pick<User, "venmo" | "cashapp" | "zelle">) {
  await ready();
  const u = requireMe();
  Object.assign(u, handles);
  await commit([{ kind: "upsert", table: "users", row: u }]);
}

export async function updateMyCar(car: Car) {
  await ready();
  const u = requireMe();
  u.car = car;
  await commit([{ kind: "upsert", table: "users", row: u }]);
}

export async function resetDemo() {
  await ready();
  const keep = me();
  const next = seed();
  if (keep && !next.users.some((u) => u.id === keep.id)) {
    next.users.push({ ...keep, car: keep.car ?? null, tripCount: 0 });
  }
  cache = next;
  notify();
  await backend.replaceAll(next);
}

// ---------- Rides ----------

function seatsTaken(rideId: string) {
  return db()
    .requests.filter((r) => r.rideId === rideId && r.status === "accepted")
    .reduce((n, r) => n + r.seats, 0);
}

function toView(ride: Ride): RideView {
  const d = db();
  const myId = sessionId();
  const myRequest =
    d.requests
      .filter((r) => r.rideId === ride.id && r.passengerId === myId && r.status !== "cancelled")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  const miles = rideMiles(ride);
  const gas = (ride.distanceMiles ?? milesTo(ride.to) ?? 0) >= LONG_TRIP_MILES ? gasEstimate(miles, ride.seatsTotal) : null;
  return {
    ...ride,
    driver: d.users.find((u) => u.id === ride.driverId)!,
    seatsLeft: ride.seatsTotal - seatsTaken(ride.id),
    myRequest,
    pendingCount: d.requests.filter((r) => r.rideId === ride.id && r.status === "pending").length,
    completed: isCompleted(ride),
    miles,
    gasEstimate: gas,
    aboveEstimate: !!(gas && ride.pricePerSeat && ride.pricePerSeat >= gas * ABOVE_ESTIMATE),
  };
}

export function rideMiles(ride: Pick<Ride, "distanceMiles" | "extraMiles" | "to">) {
  return (ride.distanceMiles ?? milesTo(ride.to) ?? 120) + (ride.extraMiles ?? 0);
}

// Rides finish when the driver taps Complete, or automatically 3 hours after the estimated arrival.
const AUTO_COMPLETE_MS = 3 * 60 * 60 * 1000;
function isCompleted(r: Ride) {
  return r.status === "completed" || Date.now() > new Date(arrival(r.departAt, rideMiles(r))).getTime() + AUTO_COMPLETE_MS;
}

const upcoming = (r: Ride) => !isCompleted(r) && new Date(r.departAt).getTime() > Date.now() - 60 * 60 * 1000;
const byDepart = (a: Ride, b: Ride) => a.departAt.localeCompare(b.departAt);

function sameDay(iso: string, ymd: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` === ymd;
}

export async function searchRides(opts: { q?: string; date?: string } = {}) {
  await ready();
  const q = (opts.q ?? "").trim().toLowerCase();
  return db()
    .rides.filter(upcoming)
    .filter((r) => !q || `${r.to} ${r.toDetail}`.toLowerCase().includes(q))
    .filter((r) => !opts.date || sameDay(r.departAt, opts.date))
    .sort(byDepart)
    .map(toView);
}

export async function getRide(id: string): Promise<RideDetail | null> {
  await ready();
  const d = db();
  const ride = d.rides.find((r) => r.id === id);
  if (!ride) return null;
  const view = toView(ride);
  const myId = sessionId();
  const isDriver = ride.driverId === myId;
  const all = d.requests.filter((r) => r.rideId === id && r.status !== "cancelled").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    ...view,
    requests: all
      .filter((r) => isDriver || r.passengerId === myId)
      .map((r) => ({ ...r, passenger: d.users.find((u) => u.id === r.passengerId)! })),
    passengers: all.filter((r) => r.status === "accepted").map((r) => d.users.find((u) => u.id === r.passengerId)!),
    circle: d.circles.find((c) => c.id === ride.circleId) ?? null,
  };
}

export type NewRide = Omit<Ride, "id" | "driverId" | "createdAt" | "status" | "completedAt">;

export async function createRide(input: NewRide) {
  await ready();
  const user = requireMe();
  if (input.seatsTotal < 1) throw new Error("Add at least one seat");
  const short = (input.distanceMiles ?? milesTo(input.to) ?? 0) < LONG_TRIP_MILES;
  if (short && input.pricePerSeat) throw new Error(`Rides under ${LONG_TRIP_MILES} miles are free`);
  const est = gasEstimate(rideMiles(input), input.seatsTotal);
  if (input.pricePerSeat && input.pricePerSeat >= est * ABOVE_ESTIMATE && !input.priceReason?.trim()) {
    throw new Error("Add a reason for the higher price");
  }
  const ride: Ride = { ...input, status: "open", id: uid("r"), driverId: user.id, createdAt: nowISO() };
  db().rides.push(ride);
  await commit([{ kind: "upsert", table: "rides", row: ride }]);
  return ride;
}

export async function requestSeat(rideId: string, message?: string) {
  await ready();
  const user = requireMe();
  const d = db();
  const ride = d.rides.find((r) => r.id === rideId);
  if (!ride) throw new Error("Ride not found");
  if (ride.driverId === user.id) throw new Error("This is your ride");
  if (ride.seatsTotal - seatsTaken(rideId) < 1) throw new Error("No seats left");
  const existing = d.requests.find(
    (r) => r.rideId === rideId && r.passengerId === user.id && (r.status === "pending" || r.status === "accepted"),
  );
  if (existing) return existing;
  const req: SeatRequest = {
    id: uid("q"),
    rideId,
    passengerId: user.id,
    seats: 1,
    status: "pending",
    message: message?.trim() || undefined,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  d.requests.push(req);
  await commit([{ kind: "upsert", table: "requests", row: req }]);
  return req;
}

export async function cancelRequest(requestId: string) {
  await ready();
  const user = requireMe();
  const req = db().requests.find((r) => r.id === requestId && r.passengerId === user.id);
  if (!req) return;
  req.status = "cancelled";
  req.updatedAt = nowISO();
  await commit([{ kind: "upsert", table: "requests", row: req }]);
}

export async function respondToRequest(requestId: string, decision: "accepted" | "declined") {
  await ready();
  const user = requireMe();
  const d = db();
  const req = d.requests.find((r) => r.id === requestId);
  const ride = req && d.rides.find((r) => r.id === req.rideId);
  if (!req || !ride || ride.driverId !== user.id) throw new Error("Not allowed");
  if (decision === "accepted" && ride.seatsTotal - seatsTaken(ride.id) < req.seats) {
    throw new Error("Ride is full");
  }
  req.status = decision;
  req.updatedAt = nowISO();
  await commit([{ kind: "upsert", table: "requests", row: req }]);
}

export async function completeRide(rideId: string) {
  await ready();
  const user = requireMe();
  const ride = db().rides.find((r) => r.id === rideId);
  if (!ride || ride.driverId !== user.id) throw new Error("Not allowed");
  ride.status = "completed";
  ride.completedAt = nowISO();
  // Requests nobody answered can't happen anymore.
  const stale = db().requests.filter((q) => q.rideId === rideId && q.status === "pending");
  stale.forEach((q) => ((q.status = "declined"), (q.updatedAt = nowISO())));
  await commit([
    { kind: "upsert", table: "rides", row: ride },
    ...stale.map((q) => ({ kind: "upsert" as const, table: "requests" as const, row: q })),
  ]);
}

export type Thanks = { rating?: number; thanksNote?: string; tipAmount?: number; tipMethod?: TipMethod };

/** Rider's optional rating, note and tip record. Updates the driver's average rating. */
export async function sendThanks(requestId: string, t: Thanks) {
  await ready();
  const user = requireMe();
  const d = db();
  const req = d.requests.find((q) => q.id === requestId && q.passengerId === user.id);
  const ride = req && d.rides.find((r) => r.id === req.rideId);
  const driver = ride && d.users.find((u) => u.id === ride.driverId);
  if (!req || !ride || !driver) throw new Error("Ride not found");
  const ops: Op[] = [];
  if (t.rating && !req.rating) {
    driver.rating = Math.round(((driver.rating * driver.tripCount + t.rating) / (driver.tripCount + 1)) * 10) / 10;
    driver.tripCount += 1;
    ops.push({ kind: "upsert", table: "users", row: driver });
  }
  Object.assign(req, {
    rating: t.rating ?? req.rating,
    thanksNote: t.thanksNote?.trim() || req.thanksNote,
    tipAmount: t.tipAmount ?? req.tipAmount,
    tipMethod: t.tipMethod ?? req.tipMethod,
    feedbackAt: req.feedbackAt ?? nowISO(),
    updatedAt: nowISO(),
  });
  ops.push({ kind: "upsert", table: "requests", row: req });
  await commit(ops);
}

export async function myTrips() {
  await ready();
  const myId = sessionId();
  const d = db();
  const driving = d.rides
    .filter((r) => r.driverId === myId && upcoming(r))
    .sort(byDepart)
    .map(toView)
    // rides waiting on the driver's reply come first
    .sort((a, b) => Number(b.pendingCount > 0) - Number(a.pendingCount > 0));
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const awaitingThanks = (r: Ride) =>
    isCompleted(r) &&
    Date.now() - new Date(r.departAt).getTime() < WEEK &&
    d.requests.some((q) => q.rideId === r.id && q.passengerId === myId && q.status === "accepted" && !q.feedbackAt);
  const riding = d.rides
    .filter(
      (r) =>
        awaitingThanks(r) ||
        (upcoming(r) && d.requests.some((q) => q.rideId === r.id && q.passengerId === myId && q.status !== "cancelled")),
    )
    .sort(byDepart)
    .map(toView);
  return { driving, riding };
}

export async function pendingForMe() {
  await ready();
  const myId = sessionId();
  const d = db();
  const mine = new Set(d.rides.filter((r) => r.driverId === myId && upcoming(r)).map((r) => r.id));
  return d.requests.filter((q) => mine.has(q.rideId) && q.status === "pending").length;
}

// ---------- Trip Circles ----------

function circleView(c: Circle): CircleView {
  const d = db();
  const memberIds = d.members.filter((m) => m.circleId === c.id).map((m) => m.userId);
  const rides = d.rides.filter((r) => r.circleId === c.id && upcoming(r));
  return {
    ...c,
    members: memberIds.map((id) => d.users.find((u) => u.id === id)!).filter(Boolean),
    rideCount: rides.length,
    seatsOffered: rides.reduce((n, r) => n + r.seatsTotal - seatsTaken(r.id), 0),
    isMember: memberIds.includes(sessionId() ?? ""),
  };
}

export async function listCircles(category?: CircleCategory) {
  await ready();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return db()
    .circles.filter((c) => new Date(c.date + "T23:59") >= today)
    .filter((c) => !category || c.category === category)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(circleView);
}

export async function getCircle(id: string): Promise<CircleDetail | null> {
  await ready();
  const d = db();
  const c = d.circles.find((x) => x.id === id);
  if (!c) return null;
  return {
    ...circleView(c),
    rides: d.rides
      .filter((r) => r.circleId === id && upcoming(r))
      .sort(byDepart)
      .map(toView),
    creator: d.users.find((u) => u.id === c.createdBy)!,
  };
}

export type NewCircle = Pick<Circle, "title" | "category" | "destination" | "date" | "description">;

export async function createCircle(input: NewCircle) {
  await ready();
  const user = requireMe();
  const c: Circle = { ...input, id: uid("c"), createdBy: user.id, createdAt: nowISO() };
  const member = { circleId: c.id, userId: user.id, joinedAt: nowISO() };
  const d = db();
  d.circles.push(c);
  d.members.push(member);
  await commit([
    { kind: "upsert", table: "circles", row: c },
    { kind: "upsert", table: "members", row: member },
  ]);
  return c;
}

export async function joinCircle(id: string) {
  await ready();
  const user = requireMe();
  const d = db();
  if (!d.members.some((m) => m.circleId === id && m.userId === user.id)) {
    const member = { circleId: id, userId: user.id, joinedAt: nowISO() };
    d.members.push(member);
    await commit([{ kind: "upsert", table: "members", row: member }]);
  }
}

export async function leaveCircle(id: string) {
  await ready();
  const user = requireMe();
  const d = db();
  d.members = d.members.filter((m) => !(m.circleId === id && m.userId === user.id));
  await commit([{ kind: "delete", table: "members", match: { circle_id: id, user_id: user.id } }]);
}

// ---------- React hook ----------

/** Runs an async query and re-runs it whenever data changes. */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []): T | undefined {
  const [data, setData] = useState<T>();
  useEffect(() => {
    let alive = true;
    const run = () => {
      fn().then((v) => alive && setData(v));
    };
    run();
    const unsub = subscribe(run);
    return () => {
      alive = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return data;
}
