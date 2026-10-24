"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createCircle } from "@/lib/data";
import { todayYMD } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { CircleCategory } from "@/lib/types";
import { ActionBar, Button, Card, Chip, Field, Input, TopBar } from "@/components/ui";
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

  const valid = title.trim() && destination.trim() && date;

  async function submit() {
    if (!valid) return;
    setBusy(true);
    const c = await createCircle({
      title: title.trim(),
      category,
      destination: destination.trim(),
      date,
      description: description.trim() || undefined,
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="OU football game in Dallas" autoFocus />
          </Field>
          <Field label="Destination">
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Dallas" />
          </Field>
          <Field label="Date">
            <Input type="date" min={todayYMD()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
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
          You don't need a driver yet. Once students join, drivers heading the same way can offer seats to the group.
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
