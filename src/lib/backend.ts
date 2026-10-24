"use client";

// Where the data lives. data.ts keeps an in-memory DB and asks a backend to
// load it, save changes, and report changes made by other devices.
// - Supabase when NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY are set (shared, live)
// - otherwise this browser's localStorage (offline fallback)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DB } from "./seed";

export type Table = keyof DB;

export type Op = { kind: "upsert"; table: Table; row: object } | { kind: "delete"; table: Table; match: Record<string, string> };

export type Backend = {
  shared: boolean;
  load(): Promise<DB | null>; // null = empty, needs seeding
  apply(ops: Op[], next: DB): Promise<void>;
  replaceAll(next: DB): Promise<void>;
  watch(onRemoteChange: () => void): void;
};

// ---------- localStorage ----------

const DB_KEY = "soonerride:db:v1";

const local: Backend = {
  shared: false,
  async load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? (JSON.parse(raw) as DB) : null;
    } catch {
      return null;
    }
  },
  async apply(_ops, next) {
    await local.replaceAll(next);
  },
  async replaceAll(next) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(next));
    } catch {}
  },
  watch(onRemoteChange) {
    // Another tab in this browser changed the data.
    window.addEventListener("storage", (e) => e.key === DB_KEY && onRemoteChange());
  },
};

// ---------- Supabase ----------

const TABLES: Record<Table, string> = {
  users: "users",
  circles: "circles",
  members: "circle_members",
  rides: "rides",
  requests: "seat_requests",
};
// Insert parents before children; delete in reverse.
const ORDER: Table[] = ["users", "circles", "members", "rides", "requests"];
const TIMESTAMPS = new Set(["departAt", "createdAt", "updatedAt", "joinedAt"]);

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function rowOut(obj: object) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), v ?? null]));
}

function rowIn(obj: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      const key = toCamel(k);
      // Postgres returns "+00:00"; keep every timestamp in one ISO format so string sorting works.
      return [key, TIMESTAMPS.has(key) && typeof v === "string" ? new Date(v).toISOString() : v === null ? undefined : v];
    }),
  );
}

function supabaseBackend(sb: SupabaseClient): Backend {
  const fail = (e: { message: string } | null) => {
    if (e) throw new Error(e.message);
  };
  return {
    shared: true,
    async load() {
      const results = await Promise.all(ORDER.map((t) => sb.from(TABLES[t]).select("*")));
      results.forEach((r) => fail(r.error));
      const db = Object.fromEntries(ORDER.map((t, i) => [t, (results[i].data ?? []).map(rowIn)])) as unknown as DB;
      // Keep the car field null rather than undefined so profile checks stay simple.
      db.users.forEach((u) => (u.car ??= null));
      return db.users.length ? db : null;
    },
    async apply(ops) {
      for (const op of ops) {
        const q = sb.from(TABLES[op.table]);
        const { error } = op.kind === "upsert" ? await q.upsert(rowOut(op.row)) : await q.delete().match(op.match);
        fail(error);
      }
    },
    async replaceAll(next) {
      for (const t of [...ORDER].reverse()) {
        const key = t === "members" ? "circle_id" : "id";
        fail((await sb.from(TABLES[t]).delete().neq(key, "")).error);
      }
      for (const t of ORDER) {
        if (next[t].length) fail((await sb.from(TABLES[t]).insert(next[t].map(rowOut))).error);
      }
    },
    watch(onRemoteChange) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const soon = () => {
        clearTimeout(timer);
        timer = setTimeout(onRemoteChange, 120);
      };
      const ch = sb.channel("soonerride");
      for (const t of ORDER) ch.on("postgres_changes", { event: "*", schema: "public", table: TABLES[t] }, soon);
      ch.subscribe();
      // Phones drop the live connection in the background; catch up when the app comes back.
      document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && soon());
      window.addEventListener("online", soon);
    },
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const backend: Backend = url && key ? supabaseBackend(createClient(url, key, { auth: { persistSession: false } })) : local;
