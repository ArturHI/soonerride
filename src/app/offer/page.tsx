"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { UsersRound } from "lucide-react";
import { createRide, getCircle, getMe, updateMyCar, useQuery } from "@/lib/data";
import { todayYMD, ymdLabel } from "@/lib/format";
import { toast } from "@/lib/toast";
import { ActionBar, Button, Card, Field, Input, Segmented, Stepper, TopBar } from "@/components/ui";

export default function Page() {
  return (
    <Suspense>
      <OfferRide />
    </Suspense>
  );
}

function OfferRide() {
  const router = useRouter();
  const params = useSearchParams();
  const circleId = params.get("circle");
  const me = useQuery(getMe);
  const circle = useQuery(() => (circleId ? getCircle(circleId) : Promise.resolve(null)), [circleId]);

  return me && circle !== undefined ? (
    <Form
      key={circle?.id ?? "none"}
      hasCar={!!me.car}
      circle={circle ? { id: circle.id, title: circle.title, destination: circle.destination, date: circle.date } : null}
      onDone={(id) => router.replace(`/rides/${id}`)}
    />
  ) : null;
}

function Form({
  hasCar,
  circle,
  onDone,
}: {
  hasCar: boolean;
  circle: { id: string; title: string; destination: string; date: string } | null;
  onDone: (rideId: string) => void;
}) {
  const [to, setTo] = useState(circle?.destination ?? "");
  const [toDetail, setToDetail] = useState("");
  const [fromDetail, setFromDetail] = useState("Lloyd Noble Center lot");
  const [date, setDate] = useState(circle?.date ?? "");
  const [time, setTime] = useState("09:00");
  const [seats, setSeats] = useState(3);
  const [paid, setPaid] = useState<"free" | "paid">("paid");
  const [amount, setAmount] = useState("10");
  const [note, setNote] = useState("");
  const [car, setCar] = useState({ make: "", color: "", plate: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const carOk = hasCar || (car.make.trim() && car.plate.trim());
  const valid = to.trim() && date && time && carOk && (paid === "free" || Number(amount) > 0);

  async function submit() {
    if (!valid) return;
    const departAt = new Date(`${date}T${time}`);
    if (departAt.getTime() < Date.now()) {
      setError("Pick a departure time in the future.");
      return;
    }
    setBusy(true);
    try {
      if (!hasCar) await updateMyCar({ make: car.make.trim(), color: car.color.trim(), plate: car.plate.trim().toUpperCase() });
      const ride = await createRide({
        from: "Norman",
        fromDetail: fromDetail.trim() || "OU campus",
        to: to.trim(),
        toDetail: toDetail.trim(),
        departAt: departAt.toISOString(),
        seatsTotal: seats,
        pricePerSeat: paid === "free" ? null : Math.round(Number(amount)),
        note: note.trim() || undefined,
        circleId: circle?.id ?? null,
      });
      toast(circle ? "Ride posted to your Trip Circle" : "Ride posted");
      onDone(ride.id);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main>
      <TopBar title="Offer a ride" back />
      <div className="space-y-5 px-5 pt-5">
        {circle && (
          <div className="flex items-center gap-3 rounded-2xl bg-crimson-50 px-4 py-3">
            <UsersRound size={18} className="text-crimson-600" />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-crimson-600">Offering seats to</p>
              <p className="truncate text-[15px] font-semibold">{circle.title}</p>
            </div>
          </div>
        )}

        <Card className="space-y-4 p-4">
          <Field label="Leaving from (Norman)">
            <Input value={fromDetail} onChange={(e) => setFromDetail(e.target.value)} placeholder="Pickup spot on campus" />
          </Field>
          <Field label="Going to">
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="City, e.g. Dallas" />
          </Field>
          <Field label="Drop-off area (optional)">
            <Input value={toDetail} onChange={(e) => setToDetail(e.target.value)} placeholder="e.g. AT&T Stadium" />
          </Field>
        </Card>

        <Card className="grid grid-cols-2 gap-3 p-4">
          <Field label="Date" hint={date ? ymdLabel(date) : undefined}>
            <Input type="date" min={todayYMD()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Departure">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-[16px] font-semibold">Seats available</p>
            <p className="text-[13px] text-ink-2">Not counting you</p>
          </div>
          <Stepper value={seats} min={1} max={6} onChange={setSeats} />
        </Card>

        <Card className="space-y-3 p-4">
          <p className="text-[16px] font-semibold">Cost contribution</p>
          <Segmented
            value={paid}
            onChange={setPaid}
            options={[
              { value: "paid", label: "Split gas" },
              { value: "free", label: "Free" },
            ]}
          />
          {paid === "paid" && (
            <label className="flex h-12 items-center rounded-2xl bg-surface px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-crimson-600/60">
              <span className="text-[17px] font-semibold text-ink-2">$</span>
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 3))}
                className="h-full flex-1 bg-transparent pl-1 text-[17px] font-semibold outline-none"
                aria-label="Cost per seat in dollars"
              />
              <span className="text-[14px] text-ink-3">per seat</span>
            </label>
          )}
        </Card>

        {!hasCar && (
          <Card className="space-y-4 p-4">
            <div>
              <p className="text-[16px] font-semibold">Your car</p>
              <p className="text-[13px] text-ink-2">Riders use this to find you at pickup. Saved for next time.</p>
            </div>
            <Field label="Make and model">
              <Input value={car.make} onChange={(e) => setCar({ ...car, make: e.target.value })} placeholder="Honda Civic" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Color">
                <Input value={car.color} onChange={(e) => setCar({ ...car, color: e.target.value })} placeholder="Silver" />
              </Field>
              <Field label="Plate">
                <Input value={car.plate} onChange={(e) => setCar({ ...car, plate: e.target.value })} placeholder="ABC-123" />
              </Field>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <Field label="Note for riders (optional)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Luggage space, stops, music..."
              className="w-full resize-none rounded-2xl bg-surface px-4 py-3 text-[16px] ring-1 ring-line outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-crimson-600/60"
            />
          </Field>
        </Card>
        {error && <p className="text-[14px] font-medium text-crimson-600">{error}</p>}
      </div>

      <ActionBar>
        <Button size="lg" disabled={!valid || busy} onClick={submit}>
          Post ride · {seats} seat{seats === 1 ? "" : "s"}
        </Button>
      </ActionBar>
    </main>
  );
}
