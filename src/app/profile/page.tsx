"use client";

import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { getMe, listUsers, resetDemo, signOut, switchUser, useQuery } from "@/lib/data";
import { toast } from "@/lib/toast";
import { Avatar, Button, Card, TopBar, cx } from "@/components/ui";
import { Rating } from "@/components/ride";

export default function Profile() {
  const router = useRouter();
  const me = useQuery(getMe);
  const users = useQuery(listUsers);
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

      <div className="mt-8 space-y-2 px-5">
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
    </main>
  );
}
