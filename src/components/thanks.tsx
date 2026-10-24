"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { sendThanks, updateMyPayments, type Thanks } from "@/lib/data";
import { firstName } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { SeatRequest, TipMethod, User } from "@/lib/types";
import { Avatar, Button, Card, Field, Input, cx } from "./ui";

export const PAY_METHODS: { id: TipMethod; label: string; color: string; prefix: string; placeholder: string }[] = [
  { id: "venmo", label: "Venmo", color: "#008CFF", prefix: "@", placeholder: "username" },
  { id: "cashapp", label: "Cash App", color: "#00C244", prefix: "$", placeholder: "cashtag" },
  { id: "zelle", label: "Zelle", color: "#6D1ED4", prefix: "", placeholder: "email or phone" },
];

/** Opens the payment app with the amount filled in. Zelle has no link, so it returns null. */
function payLink(method: TipMethod, handle: string, amount: number, note: string) {
  if (method === "venmo")
    return `https://venmo.com/${encodeURIComponent(handle)}?txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`;
  if (method === "cashapp") return `https://cash.app/$${encodeURIComponent(handle)}/${amount}`;
  return null;
}

const AMOUNTS = [2, 5, 10];

/**
 * Rider's thank-you: optional stars, a note, and an optional tip through the
 * driver's own Venmo / Cash App / Zelle. SoonerRide never handles the money.
 */
export function ThanksSheet({
  driver,
  request,
  afterRide,
  onClose,
}: {
  driver: User;
  request: SeatRequest;
  afterRide: boolean;
  onClose: () => void;
}) {
  const methods = PAY_METHODS.filter((m) => driver[m.id]);
  const [rating, setRating] = useState(request.rating ?? 0);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<TipMethod | null>(methods[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const name = firstName(driver.name);
  const tip = amount ?? (Number(custom) || null);
  const tipping = !!(tip && method);
  const canSend = rating > 0 || note.trim() || tipping;
  const methodLabel = PAY_METHODS.find((m) => m.id === method)?.label;

  async function send() {
    setBusy(true);
    const t: Thanks = { rating: rating || undefined, thanksNote: note };
    if (tipping) {
      const handle = driver[method!]!;
      const link = payLink(method!, handle, tip!, note.trim() || "Thanks for the ride! (SoonerRide)");
      // Open the payment app first, while this still counts as a tap.
      if (link) window.open(link, "_blank");
      else await navigator.clipboard?.writeText(handle).catch(() => {});
      Object.assign(t, { tipAmount: tip!, tipMethod: method! });
    }
    try {
      await sendThanks(request.id, t);
      toast(tipping && method === "zelle" ? `Zelle info copied. Send $${tip} to ${name} in your bank app.` : `Thanks sent to ${name}`);
      onClose();
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[440px] items-end bg-ink/30" onClick={onClose}>
      <div
        className="animate-rise max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] bg-cream px-5 pt-3 pb-safe"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Thank ${name}`}
      >
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-ink-3/40" />
        <div className="flex flex-col items-center text-center">
          <Avatar user={driver} size={64} />
          <h2 className="mt-3 text-[22px] font-bold tracking-tight">{afterRide ? `How was your ride with ${name}?` : `Thank ${name}`}</h2>
          <p className="mt-1 text-[15px] text-ink-2">
            {afterRide ? "A quick thank-you goes a long way." : "Tips are always optional. A note means a lot too."}
          </p>
        </div>

        {afterRide && (
          <div className="mt-5 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`} className="p-1">
                <Star size={34} strokeWidth={1.6} className={n <= rating ? "fill-ink text-ink" : "text-ink-3"} />
              </button>
            ))}
          </div>
        )}

        <div className="mt-5">
          <Field label="Say thanks (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Thanks for the ride, ${name}!`} />
          </Field>
        </div>

        <Card className="mt-4 p-4">
          <p className="text-[15px] font-semibold">Add a tip?</p>
          <p className="text-[13px] text-ink-2">Optional. It goes straight to {name}; SoonerRide never takes a cut.</p>
          {methods.length === 0 ? (
            <p className="mt-3 text-[14px] text-ink-3">{name} hasn't added a way to receive tips yet.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => (setAmount(amount === a ? null : a), setCustom(""))}
                    className={cx(
                      "h-11 rounded-2xl text-[16px] font-semibold",
                      amount === a ? "bg-ink text-white" : "bg-surface ring-1 ring-line",
                    )}
                  >
                    ${a}
                  </button>
                ))}
                <label
                  className={cx("flex h-11 items-center rounded-2xl px-2", custom ? "bg-ink text-white" : "bg-surface ring-1 ring-line")}
                >
                  <span className="text-[15px] font-semibold">$</span>
                  <input
                    inputMode="numeric"
                    value={custom}
                    onChange={(e) => (setCustom(e.target.value.replace(/\D/g, "").slice(0, 3)), setAmount(null))}
                    placeholder="Other"
                    className="w-full bg-transparent text-[15px] font-semibold outline-none placeholder:font-medium placeholder:text-ink-3"
                    aria-label="Other tip amount"
                  />
                </label>
              </div>
              {tip && (
                <div className="mt-3 flex gap-2">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cx(
                        "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold",
                        method === m.id ? "bg-surface ring-2 ring-ink" : "bg-surface ring-1 ring-line text-ink-2",
                      )}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        <div className="mt-5 space-y-1 pb-3">
          <Button size="lg" disabled={!canSend || busy} onClick={send}>
            {tipping ? `Send thanks + $${tip} via ${methodLabel}` : "Send thanks"}
          </Button>
          <Button size="lg" variant="ghost" onClick={onClose} className="text-ink-2">
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Profile section where drivers add where they can receive tips. */
export function PaymentHandles({ user }: { user: User }) {
  const [v, setV] = useState({ venmo: user.venmo ?? "", cashapp: user.cashapp ?? "", zelle: user.zelle ?? "" });
  const [busy, setBusy] = useState(false);
  const dirty = v.venmo !== (user.venmo ?? "") || v.cashapp !== (user.cashapp ?? "") || v.zelle !== (user.zelle ?? "");

  async function save() {
    setBusy(true);
    const clean = (s: string) => s.trim().replace(/^[@$]/, "") || undefined;
    await updateMyPayments({ venmo: clean(v.venmo), cashapp: clean(v.cashapp), zelle: clean(v.zelle) });
    toast("Saved");
    setBusy(false);
  }

  return (
    <section className="mt-8 px-5">
      <h2 className="text-[17px] font-bold">Get thanked</h2>
      <p className="mt-0.5 mb-3 text-[14px] text-ink-2">Riders can tip you through these after a ride. Leave any blank.</p>
      <Card className="space-y-3 p-4">
        {PAY_METHODS.map((m) => (
          <Field key={m.id} label={m.label}>
            <label className="flex h-12 items-center rounded-2xl bg-surface px-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-crimson-600/60">
              {m.prefix && <span className="text-[16px] text-ink-3">{m.prefix}</span>}
              <input
                value={v[m.id]}
                onChange={(e) => setV({ ...v, [m.id]: e.target.value })}
                placeholder={m.placeholder}
                autoCapitalize="none"
                autoCorrect="off"
                className="h-full flex-1 bg-transparent pl-0.5 text-[16px] outline-none placeholder:text-ink-3"
              />
            </label>
          </Field>
        ))}
        {dirty && (
          <Button className="w-full" disabled={busy} onClick={save}>
            Save
          </Button>
        )}
      </Card>
    </section>
  );
}
