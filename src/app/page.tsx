"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Car, Plus, Search } from "lucide-react";
import { getMe, listCircles, myTrips, searchRides, useQuery } from "@/lib/data";
import { firstName, when } from "@/lib/format";
import { Avatar, Card, Section } from "@/components/ui";
import { RideCard, STATUS } from "@/components/ride";
import { CircleCard } from "@/components/circle";

const QUICK = ["Dallas", "OKC Airport", "Tulsa", "DFW Airport", "Austin"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const router = useRouter();
  const me = useQuery(getMe);
  const rides = useQuery(() => searchRides());
  const circles = useQuery(() => listCircles());
  const trips = useQuery(myTrips);
  const [q, setQ] = useState("");

  const next = trips?.riding.find((r) => r.myRequest?.status === "accepted" || r.myRequest?.status === "pending");
  const others = rides?.filter((r) => r.driverId !== me?.id).slice(0, 3);

  return (
    <main className="pb-32">
      <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),20px)]">
        <div>
          <p className="text-[15px] text-ink-2">{greeting()}</p>
          <p className="text-[28px] font-bold tracking-tight">{me ? firstName(me.name) : ""}</p>
        </div>
        {me && (
          <Link href="/profile" aria-label="Profile">
            <Avatar user={me} size={42} />
          </Link>
        )}
      </header>

      <form
        className="mt-5 px-5"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/rides${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
        }}
      >
        <label className="flex h-14 items-center gap-3 rounded-full bg-surface px-5 ring-1 ring-line/80 focus-within:ring-2 focus-within:ring-crimson-600/50">
          <Search size={20} className="text-ink-2" strokeWidth={2.4} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Where are you going?"
            className="h-full flex-1 bg-transparent text-[17px] font-medium outline-none placeholder:text-ink-2"
            enterKeyHint="search"
          />
        </label>
      </form>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
        {QUICK.map((d) => (
          <Link
            key={d}
            href={`/rides?q=${encodeURIComponent(d)}`}
            className="h-9 shrink-0 rounded-full bg-fill px-4 text-[14px] leading-9 font-medium text-ink active:bg-line"
          >
            {d}
          </Link>
        ))}
      </div>

      {next?.myRequest && (
        <div className="mt-6 px-5">
          <Link href={`/rides/${next.id}`}>
            <Card className="flex items-center gap-3 p-4">
              <span className={`h-2.5 w-2.5 rounded-full ${next.myRequest.status === "accepted" ? "bg-ok" : "bg-warn"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink-2">
                  {STATUS[next.myRequest.status].label} · {when(next.departAt)}
                </p>
                <p className="truncate text-[16px] font-semibold">
                  {next.to} with {firstName(next.driver.name)}
                </p>
              </div>
              <ArrowRight size={20} className="text-ink-3" />
            </Card>
          </Link>
        </div>
      )}

      <div className="mt-6 px-5">
        <Link href="/offer" className="flex items-center gap-4 rounded-[22px] bg-ink p-4 text-white active:opacity-90">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12">
            <Car size={22} />
          </span>
          <span className="flex-1">
            <span className="block text-[16px] font-semibold">Offer a ride</span>
            <span className="block text-[14px] text-white/65">Driving somewhere? Fill your empty seats.</span>
          </span>
          <ArrowRight size={20} className="text-white/60" />
        </Link>
      </div>

      <Section
        title="Upcoming rides"
        action={
          <Link href="/rides" className="text-[15px] font-semibold text-crimson-600">
            See all
          </Link>
        }
      >
        <div className="space-y-3 px-5">
          {others?.map((r) => (
            <RideCard key={r.id} ride={r} />
          ))}
        </div>
      </Section>

      <Section
        title="Trip Circles"
        action={
          <Link href="/circles" className="text-[15px] font-semibold text-crimson-600">
            See all
          </Link>
        }
      >
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
          {circles?.map((c) => (
            <CircleCard key={c.id} circle={c} />
          ))}
          <Link
            href="/circles/new"
            className="flex w-[150px] shrink-0 flex-col items-center justify-center gap-2 rounded-[22px] border-[1.5px] border-dashed border-ink-3/40 text-[14px] font-semibold text-ink-2 active:bg-fill"
          >
            <Plus size={22} />
            New circle
          </Link>
        </div>
      </Section>
    </main>
  );
}
