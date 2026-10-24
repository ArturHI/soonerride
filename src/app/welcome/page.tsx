"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Mail, ShieldCheck } from "lucide-react";
import { findUserByEmail, getMe, isOUEmail, signIn, switchUser } from "@/lib/data";
import { Button, Input, cx } from "@/components/ui";
import { Route } from "@/components/ride";
import { Wordmark } from "@/components/logo";

type Step = "intro" | "email" | "code" | "name";

export default function Welcome() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [banner, setBanner] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMe().then((u) => u && router.replace("/"));
  }, [router]);

  function sendCode() {
    if (!isOUEmail(email)) {
      setError("Use your @ou.edu email address.");
      return;
    }
    setError("");
    setSent(String(Math.floor(100000 + Math.random() * 900000)));
    setCode("");
    setStep("code");
    setTimeout(() => setBanner(true), 700);
    setTimeout(() => codeRef.current?.focus(), 50);
  }

  async function verify(value: string) {
    setCode(value);
    if (value.length < 6) return;
    if (value !== sent) {
      setError("That code doesn't match. Check your email and try again.");
      return;
    }
    setError("");
    setBanner(false);
    const existing = await findUserByEmail(email);
    if (existing) {
      await signIn(email);
      router.replace("/");
    } else {
      setStep("name");
    }
  }

  async function finish() {
    if (!name.trim()) return;
    await signIn(email, name, phone);
    router.replace("/");
  }

  async function demo() {
    await switchUser("u_chris");
    router.replace("/");
  }

  if (step === "intro") {
    return (
      <main className="flex min-h-dvh flex-col px-6 pt-[max(env(safe-area-inset-top),24px)] pb-safe">
        <div className="pt-4">
          <Wordmark />
        </div>
        <div className="flex flex-1 flex-col justify-center py-10">
          <h1 className="text-[44px] leading-[1.02] font-bold tracking-[-0.03em]">
            Find your
            <br />
            next ride.
          </h1>
          <p className="mt-4 max-w-[300px] text-[17px] leading-snug text-ink-2">
            Share the drive with OU students already headed your way.
          </p>

          <div className="mt-10 space-y-3">
            <div className="rounded-[22px] bg-surface p-4 ring-1 ring-line/70">
              <div className="mb-3 flex justify-between text-[13px] font-semibold text-ink-2">
                <span>Saturday · 8:00 AM</span>
                <span className="text-ink">$5 gas share</span>
              </div>
              <Route from="Norman" fromDetail="Lloyd Noble Center" to="Dallas" toDetail="AT&T Stadium" compact />
            </div>
            <p className="flex items-center gap-2 px-1 text-[14px] text-ink-2">
              <ShieldCheck size={17} className="text-crimson-600" />
              Every rider and driver is verified with an @ou.edu email.
            </p>
          </div>
        </div>
        <div className="space-y-2 pb-2">
          <Button size="lg" onClick={() => setStep("email")}>
            Continue with OU email
          </Button>
          <Button size="lg" variant="ghost" onClick={demo}>
            Try a demo account
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 pt-[max(env(safe-area-inset-top),16px)] pb-safe">
      {banner && (
        <button
          onClick={() => verify(sent)}
          className="glass animate-rise fixed inset-x-0 top-[max(env(safe-area-inset-top),10px)] z-50 mx-auto flex w-[calc(100%-24px)] max-w-[416px] items-center gap-3 rounded-[22px] p-3 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#2f6fe4] text-white">
            <Mail size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex justify-between text-[13px] font-semibold">
              OU Mail <span className="font-normal text-ink-3">now</span>
            </span>
            <span className="block truncate text-[14px] text-ink-2">Your SoonerRide code is {sent}</span>
          </span>
        </button>
      )}

      <button
        onClick={() => {
          setError("");
          setBanner(false);
          setStep(step === "name" ? "code" : step === "code" ? "email" : "intro");
        }}
        className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full active:bg-fill"
        aria-label="Back"
      >
        <ChevronLeft size={26} />
      </button>

      {step === "email" && (
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
        >
          <h1 className="mt-4 text-[30px] font-bold tracking-tight">What's your OU email?</h1>
          <p className="mt-2 text-[16px] text-ink-2">We'll send a 6-digit code to confirm you're a student.</p>
          <Input
            className="mt-8 h-14 text-[18px]"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="first.last@ou.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="mt-2 text-[14px] font-medium text-crimson-600">{error}</p>}
          <div className="mt-auto pb-2">
            <Button size="lg" type="submit" disabled={!email}>
              Send code
            </Button>
          </div>
        </form>
      )}

      {step === "code" && (
        <div className="flex flex-1 flex-col">
          <h1 className="mt-4 text-[30px] font-bold tracking-tight">Enter the code</h1>
          <p className="mt-2 text-[16px] text-ink-2">
            Sent to <span className="font-semibold text-ink">{email}</span>
          </p>
          <label className="relative mt-8 block">
            <input
              ref={codeRef}
              value={code}
              onChange={(e) => verify(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="absolute inset-0 opacity-0"
              aria-label="6-digit code"
            />
            <span className="flex justify-between gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  key={i}
                  className={cx(
                    "flex h-14 flex-1 items-center justify-center rounded-2xl bg-surface text-[24px] font-semibold ring-1 ring-line",
                    i === code.length && "ring-2 ring-crimson-600/60",
                  )}
                >
                  {code[i] ?? ""}
                </span>
              ))}
            </span>
          </label>
          {error && <p className="mt-3 text-[14px] font-medium text-crimson-600">{error}</p>}
          <button onClick={sendCode} className="mt-6 self-start text-[15px] font-semibold text-crimson-600">
            Resend code
          </button>
        </div>
      )}

      {step === "name" && (
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            finish();
          }}
        >
          <h1 className="mt-4 text-[30px] font-bold tracking-tight">You're verified.</h1>
          <p className="mt-2 text-[16px] text-ink-2">What should drivers and riders call you?</p>
          <Input
            className="mt-8 h-14 text-[18px]"
            autoFocus
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            className="mt-3 h-14 text-[18px]"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="mt-2 text-[13px] text-ink-3">Only shared with people you have a confirmed ride with, so you can text at pickup.</p>
          <div className="mt-auto pb-2">
            <Button size="lg" type="submit" disabled={!name.trim()}>
              Get started
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
