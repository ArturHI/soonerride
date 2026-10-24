"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CalendarDays, Search, UsersRound, X } from "lucide-react";
import { getMe, searchRides, useQuery } from "@/lib/data";
import { ymdLabel, todayYMD } from "@/lib/format";
import { Empty, LinkButton, TopBar, cx } from "@/components/ui";
import { RideCard } from "@/components/ride";

export default function Page() {
  return (
    <Suspense>
      <FindRide />
    </Suspense>
  );
}

function FindRide() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [date, setDate] = useState(params.get("date") ?? "");
  const me = useQuery(getMe);
  const rides = useQuery(() => searchRides({ q, date }), [q, date]);

  function sync(nextQ: string, nextDate: string) {
    const sp = new URLSearchParams();
    if (nextQ) sp.set("q", nextQ);
    if (nextDate) sp.set("date", nextDate);
    router.replace(`/rides${sp.size ? `?${sp}` : ""}`, { scroll: false });
  }

  const newCircle = `/circles/new${q ? `?to=${encodeURIComponent(q)}` : ""}${date ? `${q ? "&" : "?"}date=${date}` : ""}`;

  return (
    <main className="pb-32">
      <TopBar title="Find a ride" large />
      <div className="sticky top-0 z-20 space-y-2 glass-bar px-5 pt-1 pb-3">
        <label className="flex h-12 items-center gap-3 rounded-full bg-surface px-4 ring-1 ring-line/80 focus-within:ring-2 focus-within:ring-crimson-600/50">
          <Search size={19} className="text-ink-2" strokeWidth={2.4} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              sync(e.target.value, date);
            }}
            placeholder="Destination"
            className="h-full flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-ink-3"
            enterKeyHint="search"
          />
          {q && (
            <button onClick={() => (setQ(""), sync("", date))} aria-label="Clear" className="text-ink-3">
              <X size={18} />
            </button>
          )}
        </label>
        <div className="flex items-center gap-2">
          <label
            className={cx(
              "relative inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium",
              date ? "bg-ink text-white" : "bg-surface text-ink ring-1 ring-line",
            )}
          >
            <CalendarDays size={16} />
            {date ? ymdLabel(date) : "Any date"}
            <input
              type="date"
              min={todayYMD()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                sync(q, e.target.value);
              }}
              className="absolute inset-0 opacity-0"
              aria-label="Departure date"
            />
          </label>
          {date && (
            <button onClick={() => (setDate(""), sync(q, ""))} className="h-9 px-2 text-[14px] font-semibold text-crimson-600">
              Clear
            </button>
          )}
          <span className="ml-auto text-[13px] text-ink-3">{rides ? `${rides.length} ride${rides.length === 1 ? "" : "s"}` : ""}</span>
        </div>
      </div>

      <div className="space-y-3 px-5 pt-2">
        {rides?.map((r) => (
          <RideCard key={r.id} ride={r} mine={r.driverId === me?.id} />
        ))}
      </div>

      {rides && rides.length === 0 && (
        <Empty
          icon={<UsersRound size={24} />}
          title={q ? `No rides to ${q} yet` : "No rides on this day"}
          body="Start a Trip Circle so drivers know students are going. They can offer seats to the whole group."
          action={
            <LinkButton href={newCircle} variant="primary">
              Start a Trip Circle
            </LinkButton>
          }
        />
      )}
    </main>
  );
}
