"use client";

import { useState } from "react";
import { Car, Search } from "lucide-react";
import { myTrips, useQuery } from "@/lib/data";
import { Empty, LinkButton, Segmented, TopBar } from "@/components/ui";
import { RideCard } from "@/components/ride";

export default function Trips() {
  const trips = useQuery(myTrips);
  const pending = trips?.driving.reduce((n, r) => n + r.pendingCount, 0) ?? 0;
  const [tab, setTab] = useState<"riding" | "driving" | null>(null);
  // Drivers with new requests land on the Driving tab.
  const active = tab ?? (pending > 0 ? "driving" : "riding");

  if (!trips) return null;
  const list = active === "riding" ? trips.riding : trips.driving;

  return (
    <main className="pb-32">
      <TopBar
        title="Trips"
        large
        right={
          <LinkButton href="/offer" size="sm" variant="secondary" className="mb-1.5">
            <Car size={16} /> Offer
          </LinkButton>
        }
      />
      <div className="px-5">
        <Segmented
          value={active}
          onChange={setTab}
          options={[
            { value: "riding", label: "Riding" },
            { value: "driving", label: "Driving", badge: pending },
          ]}
        />
      </div>
      <div className="mt-4 space-y-3 px-5">
        {list.map((r) => (
          <RideCard key={r.id} ride={r} mine={active === "driving"} showStatus={active === "riding"} />
        ))}
      </div>
      {list.length === 0 &&
        (active === "riding" ? (
          <Empty
            icon={<Search size={24} />}
            title="No rides booked"
            body="Requests and confirmed seats show up here."
            action={<LinkButton href="/rides">Find a ride</LinkButton>}
          />
        ) : (
          <Empty
            icon={<Car size={24} />}
            title="You're not driving anywhere yet"
            body="Post a trip and riders can request your empty seats."
            action={<LinkButton href="/offer">Offer a ride</LinkButton>}
          />
        ))}
    </main>
  );
}
