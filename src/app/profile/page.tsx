"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { getMe, listUsers, resetDemo, signOut, switchUser, updateMyPhone, useQuery } from "@/lib/data";
import { toast } from "@/lib/toast";
import type { User } from "@/lib/types";
import { Avatar, Button, Card, Field, Input, TopBar, cx } from "@/components/ui";
import { Rating } from "@/components/ride";
import { PaymentHandles } from "@/components/thanks";
import { phoneLabel } from "@/components/contact";

// Demo tools (switch accounts, reset shared data) are hidden from the public:
// tap the version line 5 times to show them on this device.
const DEMO_KEY = "soonerride:demo-tools";

export default function Profile() {
  const router = useRouter();
  const me = useQuery(getMe);
  const users = useQuery(listUsers);
  const [demo, setDemo] = useState(false);
  const taps = useRef({ n: 0, at: 0 });

  useEffect(() => {
    try {
      setDemo(localStorage.getItem(DEMO_KEY) === "1");
    } catch {}
  }, []);

  function tapVersion() {
    const now = Date.now();
    taps.current = { n: now - taps.current.at < 1500 ? taps.current.n + 1 : 1, at: now };
    if (taps.current.n < 5) return;
    taps.current.n = 0;
    const next = !demo;
    setDemo(next);
    try {
      if (next) localStorage.setItem(DEMO_KEY, "1");
      else localStorage.removeItem(DEMO_KEY);
    } catch {}
    toast(next ? "Demo tools on" : "Demo tools off");
  }

  if (!me || !users) return null;

  return (
    <main className="pb-16">
      <TopBar title="Profile" back />
      <div className="flex flex-col items-center px-5 pt-6 text-center">
        <Avatar user={me} size={84} />
        <p className="mt-3 text-[24px] font-bold tracking-tight">{me.name}</p>
        <p className="text-[15px] text-ink-2">{me.email}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-crimson-50 px-3 py-1 text-[13px] font-semibold text-crimson-600">
          <ShieldCheck size={15} /> Verified OU student
        </p>
        <p className="mt-3 flex items-center gap-2 text-[14px] text-ink-2">
          <Rating value={me.rating} /> · {me.tripCount} trips
        </p>
      </div>

      {me.car && (
        <Card className="mx-5 mt-6 flex items-center justify-between p-4">
          <div>
            <p className="text-[13px] text-ink-2">Your car</p>
            <p className="text-[16px] font-semibold">
              {me.car.color} {me.car.make}
            </p>
          </div>
          <span className="rounded-md bg-fill px-2 py-0.5 font-mono text-[13px] font-semibold">{me.car.plate}</span>
        </Card>
      )}

      <PhoneCard key={`phone-${me.id}`} user={me} />
      <PaymentHandles key={me.id} user={me} />

      {demo && (
        <section className="mt-8 px-5">
          <h2 className="text-[17px] font-bold">Demo accounts</h2>
          <p className="mt-0.5 mb-3 text-[14px] text-ink-2">
            Switch students to play out a rider and driver. Each browser tab can be a different student.
          </p>
          <div className="divide-y divide-line overflow-hidden rounded-[22px] bg-surface ring-1 ring-line/70">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={async () => {
                  await switchUser(u.id);
                  toast(`Signed in as ${u.name.split(" ")[0]}`);
                  router.push("/");
                }}
                className={cx("flex w-full items-center gap-3 px-4 py-3 text-left active:bg-fill", u.id === me.id && "bg-crimson-50/50")}
              >
                <Avatar user={u} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{u.name}</span>
                  <span className="block text-[13px] text-ink-2">{u.car ? `Driver · ${u.car.make}` : "Rider"}</span>
                </span>
                {u.id === me.id && <Check size={18} className="text-crimson-600" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 space-y-2 px-5">
        {demo && (
          <Button
            size="lg"
            variant="secondary"
            onClick={async () => {
              await resetDemo();
              toast("Demo data reset");
            }}
          >
            Reset demo data
          </Button>
        )}
        <Button
          size="lg"
          variant="ghost"
          onClick={async () => {
            await signOut();
            router.replace("/welcome");
          }}
        >
          Sign out
        </Button>
      </div>

      <button onClick={tapVersion} className="mx-auto mt-6 block px-4 py-2 text-[12px] text-ink-3 select-none">
        SoonerRide · v1.0
      </button>
    </main>
  );
}

function PhoneCard({ user }: { user: User }) {
  const [value, setValue] = useState(user.phone ? phoneLabel(user.phone) : "");
  const [busy, setBusy] = useState(false);
  const dirty = value !== (user.phone ? phoneLabel(user.phone) : "");

  async function save() {
    setBusy(true);
    try {
      await updateMyPhone(value);
      toast("Saved");
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <section className="mt-8 px-5">
      <h2 className="text-[17px] font-bold">Contact</h2>
      <p className="mt-0.5 mb-3 text-[14px] text-ink-2">Only shown to people you have a confirmed ride with.</p>
      <Card className="space-y-3 p-4">
        <Field label="Phone">
          <Input type="tel" inputMode="tel" value={value} onChange={(e) => setValue(e.target.value)} placeholder="(405) 555-0123" />
        </Field>
        {dirty && (
          <Button className="w-full" disabled={busy} onClick={save}>
            Save
          </Button>
        )}
      </Card>
    </section>
  );
}
