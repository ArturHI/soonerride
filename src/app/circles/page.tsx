"use client";

import { useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { listCircles, useQuery } from "@/lib/data";
import type { CircleCategory } from "@/lib/types";
import { Chip, Empty, LinkButton, TopBar } from "@/components/ui";
import { CATEGORIES, CircleCard } from "@/components/circle";

export default function Circles() {
  const [cat, setCat] = useState<CircleCategory | undefined>();
  const circles = useQuery(() => listCircles(cat), [cat]);

  return (
    <main className="pb-32">
      <TopBar
        title="Trip Circles"
        large
        right={
          <LinkButton href="/circles/new" size="sm" className="mb-1.5">
            <Plus size={17} strokeWidth={2.6} /> New
          </LinkButton>
        }
      />
      <p className="-mt-1 px-5 text-[15px] leading-snug text-ink-2">
        Groups of students headed to the same place. Join one, and drivers can offer seats to everyone at once.
      </p>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        <Chip active={!cat} onClick={() => setCat(undefined)}>
          All
        </Chip>
        {CATEGORIES.map(({ value, label, icon: Icon }) => (
          <Chip key={value} active={cat === value} onClick={() => setCat(value)}>
            <Icon size={15} /> {label}
          </Chip>
        ))}
      </div>
      <div className="mt-4 space-y-3 px-5">
        {circles?.map((c) => (
          <CircleCard key={c.id} circle={c} wide />
        ))}
      </div>
      {circles?.length === 0 && (
        <Empty
          icon={<UsersRound size={24} />}
          title="No circles here yet"
          body="Start one for your next game, flight, or trip home."
          action={<LinkButton href={`/circles/new${cat ? `?category=${cat}` : ""}`}>Start a Trip Circle</LinkButton>}
        />
      )}
    </main>
  );
}
