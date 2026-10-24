# SoonerRide

University-verified carpooling for OU students. Next.js 15 + Tailwind v4.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Setup

Create `.env.local` (never commit it) with the Supabase project values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Run `supabase/schema.sql` once in Supabase → SQL Editor. The app seeds an empty database
with sample rides and circles on first load. Without the env vars, the app falls back to
storing data in the browser only.

## How data works

All screens talk to `src/lib/data.ts`, which keeps the data in memory and loads/saves it
through `src/lib/backend.ts` (Supabase or localStorage). Supabase Realtime pushes every
change to all open devices, so screens update live. Drivers get a banner when someone
requests a seat; passengers get one when they're accepted or declined.

Database access is wide open to the publishable key (no real accounts yet). Fine for
the hackathon demo; add Supabase Auth and row-level policies before real students use it.

## Live demo (two devices)

Each device or browser tab can be a different student: Profile → Demo accounts.
Use a phone hotspot rather than venue Wi-Fi.

1. Profile → **Reset demo data** (resets it for everyone).
2. Phone A (you): Circles → **New** → "OU football game in Dallas", Game day, Dallas.
3. Phone B (teammate, as Chris): the circle appears → **I'm going**. Count updates on A.
4. Phone A (switch to Maya): circle → **Offer seats** → 3 seats → **Post ride**. It appears on B.
5. Phone B: open the ride → **Request a seat**. A gets a banner and a Trips badge.
6. Phone A: tap the banner → **Accept**. B flips to **Booking confirmed** with a banner.

To show both phones on the projector: connect them by cable to a Mac, then QuickTime →
File → New Movie Recording → pick each iPhone from the menu next to the record button.

Verification codes are shown in a fake "OU Mail" banner — tap it to fill the code.
Judges can tap **Try a demo account** on the welcome screen to skip sign-in.

## Deploy

Import the repo into Vercel and add the two `NEXT_PUBLIC_SUPABASE_*` variables under
Settings → Environment Variables, then redeploy.
