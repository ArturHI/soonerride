"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Car, Check, MapPin, UsersRound } from "lucide-react";
import { getCircle, getMe, joinCircle, leaveCircle, useQuery } from "@/lib/data";
import { firstName, fullDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { ActionBar, Avatar, Button, Card, Empty, LinkButton, TopBar } from "@/components/ui";
import { RideCard } from "@/components/ride";
import { categoryOf } from "@/components/circle";

export default function CirclePage() {
  const { id } = useParams<{ id: string }>();
  const circle = useQuery(() => getCircle(id), [id]);
  const me = useQuery(getMe);
  const [busy, setBusy] = useState(false);

  if (circle === undefined || !me) return null;
  if (circle === null) {
    return (
      <main className="pt-20">
        <Empty
          icon={<UsersRound size={24} />}
          title="Circle not found"
          body="It may have ended."
          action={<LinkButton href="/circles">All circles</LinkButton>}
        />
      </main>
    );
  }

  const cat = categoryOf(circle.category);
  const Icon = cat.icon;
  const offerHref = `/offer?circle=${circle.id}`;

  async function toggle() {
    setBusy(true);
    if (circle!.isMember) {
      await leaveCircle(circle!.id);
      toast("You left the circle");
    } else {
      await joinCircle(circle!.id);
      toast("You're in");
    }
    setBusy(false);
  }

  return (
    <main>
      <TopBar back="/circles" />
      <div className="px-5 pt-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-crimson-600">
          <Icon size={16} /> {cat.label}
        </p>
        <h1 className="mt-2 text-[28px] leading-tight font-bold tracking-tight">{circle.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-[15px] text-ink-2">
          <MapPin size={16} /> {circle.destination} · {fullDate(circle.date + "T12:00")}
        </p>
        {circle.description && <p className="mt-3 text-[15px] leading-snug text-ink">{circle.description}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Card className="p-3.5">
            <p className="text-[24px] font-bold">{circle.members.length}</p>
            <p className="text-[13px] text-ink-2">students going</p>
          </Card>
          <Card className="p-3.5">
            <p className="text-[24px] font-bold">{circle.seatsOffered}</p>
            <p className="text-[13px] text-ink-2">
              {circle.rideCount
                ? `open seat${circle.seatsOffered === 1 ? "" : "s"} from ${circle.rideCount} driver${circle.rideCount === 1 ? "" : "s"}`
                : "open seats, no drivers yet"}
            </p>
          </Card>
        </div>
      </div>

      <section className="mt-7 px-5">
        <h2 className="mb-3 text-[20px] font-bold tracking-tight">Rides for this circle</h2>
        {circle.rides.length ? (
          <div className="space-y-3">
            {circle.rides.map((r) => (
              <RideCard key={r.id} ride={r} mine={r.driverId === me.id} />
            ))}
          </div>
        ) : (
          <Card className="flex items-center gap-4 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2">
              <Car size={21} />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-semibold">No driver yet</p>
              <p className="text-[14px] leading-snug text-ink-2">
                {circle.members.length} student{circle.members.length === 1 ? " is" : "s are"} looking for a ride. Driving? Offer seats to
                the group.
              </p>
            </div>
          </Card>
        )}
      </section>

      <section className="mt-7 px-5">
        <h2 className="mb-3 text-[20px] font-bold tracking-tight">Who's going</h2>
        <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-surface ring-1 ring-line/70">
          {circle.members.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar user={u} size={38} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">{u.id === me.id ? "You" : u.name}</p>
                <p className="text-[13px] text-ink-2">{[u.year, u.major].filter(Boolean).join(" · ") || "OU student"}</p>
              </div>
              {u.id === circle.createdBy && <span className="text-[12px] font-semibold text-ink-3">Organizer</span>}
              {circle.rides.some((r) => r.driverId === u.id) && (
                <span className="flex items-center gap-1 text-[12px] font-semibold text-ok">
                  <Car size={14} /> Driving
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-ink-3">Started by {circle.creator.id === me.id ? "you" : firstName(circle.creator.name)}</p>
      </section>

      <ActionBar>
        <div className="grid grid-cols-2 gap-2">
          <LinkButton href={offerHref} variant="secondary" className="h-[54px] text-[16px]">
            <Car size={18} /> Offer seats
          </LinkButton>
          {circle.isMember ? (
            <Button variant="secondary" className="h-[54px] text-[16px]" disabled={busy} onClick={toggle}>
              <Check size={18} className="text-ok" strokeWidth={3} /> Going
            </Button>
          ) : (
            <Button className="h-[54px] text-[16px]" disabled={busy} onClick={toggle}>
              I'm going
            </Button>
          )}
        </div>
      </ActionBar>
    </main>
  );
}
