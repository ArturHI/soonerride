"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createCircle } from "@/lib/data";
import { todayYMD } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { CircleCategory } from "@/lib/types";
import { PICKER_DAYS, semesterEnd, WEEKDAYS } from "@/lib/schedule";
import { ActionBar, Button, Card, Chip, Field, Input, TopBar, cx } from "@/components/ui";
import { CATEGORIES } from "@/components/circle";

export default function Page() {
  return (
    <Suspense>
      <NewCircle />
    </Suspense>
  );
}

function NewCircle() {
  const router = useRouter();
  const params = useSearchParams();
  const [category, setCategory] = useState<CircleCategory>((params.get("category") as CircleCategory) ?? "game");
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState(params.get("to") ?? "");
  const [date, setDate] = useState(params.get("date") ?? "");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  // Weekly circles
  const weekly = category === "weekly";
  const [pickup, setPickup] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [time, setTime] = useState("08:40");
  const [hasReturn, setHasReturn] = useState(false);
  const [returnTime, setReturnTime] = useState("10:20");
  const [startDate, setStartDate] = useState(todayYMD());
  const [endDate, setEndDate] = useState(semesterEnd());

  const valid = weekly
    ? title.trim() && pickup.trim() && destination.trim() && days.length && time && startDate && endDate >= startDate
    : title.trim() && destination.trim() && date;

  async function submit() {
    if (!valid) return;
    setBusy(true);
    const c = await createCircle({
      title: title.trim(),
      category,
      destination: destination.trim(),
      date: weekly ? startDate : date,
      description: description.trim() || undefined,
      ...(weekly && { pickup: pickup.trim(), days, time, returnTime: hasReturn ? returnTime : undefined, endDate }),
    });
    toast("Trip Circle created");
    router.replace(`/circles/${c.id}`);
  }

  return (
    <main>
      <TopBar title="New Trip Circle" back />
      <div className="space-y-5 px-5 pt-5">
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">What's the trip for?</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label, icon: Icon }) => (
              <Chip key={value} active={category === value} onClick={() => setCategory(value)}>
                <Icon size={15} /> {label}
              </Chip>
            ))}
          </div>
        </div>
        <Card className="space-y-4 p-4">
          <Field label="Name">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={weekly ? "Wed 9am class: Dunham → Engineering" : "OU football game in Dallas"}
              autoFocus
            />
          </Field>
          {weekly ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pickup">
                  <Input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Dunham College" />
                </Field>
                <Field label="Drop-off">
                  <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Gallogly Hall" />
                </Field>
              </div>
              <div>
                <p className="mb-1.5 text-[13px] font-medium text-ink-2">Repeats every</p>
                <div className="flex justify-between gap-1.5">
                  {PICKER_DAYS.map((d) => {
                    const on = days.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDays(on ? days.filter((x) => x !== d) : [...days, d])}
                        className={cx(
                          "flex h-11 flex-1 items-center justify-center rounded-full text-[14px] font-semibold",
                          on ? "bg-ink text-white" : "bg-surface ring-1 ring-line",
                        )}
                        aria-pressed={on}
                        aria-label={WEEKDAYS[d]}
                      >
                        {WEEKDAYS[d].slice(0, 2)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Leave at">
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </Field>
                <Field label="Ride back (optional)">
                  {hasReturn ? (
                    <Input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setHasReturn(true)}
                      className="h-12 w-full rounded-2xl text-[15px] font-semibold border-[1.5px] border-dashed border-line text-crimson-600"
                    >
                      + Add return
                    </button>
                  )}
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts">
                  <Input type="date" min={todayYMD()} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field label="Ends" hint="End of semester">
                  <Input type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field label="Destination">
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Dallas" />
              </Field>
              <Field label="Date">
                <Input type="date" min={todayYMD()} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </>
          )}
          <Field label="Details (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="When you want to leave, coming back the same day..."
              className="w-full resize-none rounded-2xl bg-surface px-4 py-3 text-[16px] ring-1 ring-line outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-crimson-600/60"
            />
          </Field>
        </Card>
        <p className="px-1 text-[14px] leading-snug text-ink-2">
          {weekly
            ? "Classmates join once. When someone offers to drive every week, everyone signs up once and has a ride each week."
            : "You don't need a driver yet. Once students join, drivers heading the same way can offer seats to the group."}
        </p>
      </div>
      <ActionBar>
        <Button size="lg" disabled={!valid || busy} onClick={submit}>
          Create circle
        </Button>
      </ActionBar>
    </main>
  );
}
