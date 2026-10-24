# SoonerRide

University-verified carpooling for OU students. Next.js 15 + Tailwind v4.

```bash
npm install
npm run dev     # http://localhost:3000
```

## How data works

All screens talk to `src/lib/data.ts` only. Today it stores everything in the browser
(localStorage) with seed data from `src/lib/seed.ts`. Every function is async and returns
plain objects, so moving to Supabase means re-implementing those functions with
`supabase-js` — no screen changes. `supabase/schema.sql` matches `src/lib/types.ts`.

When switching, call `notify()` from a Supabase realtime subscription so open screens refresh.

## Demo script

Tip: open two browser tabs. Each tab can be signed in as a different student
(Profile → Demo accounts), and changes in one tab show up in the other right away.

1. Profile → **Reset demo data**.
2. Circles → **New** → "OU football game in Dallas", Game day, Dallas, pick a date.
3. Switch to Chris, Ava, Jordan → open the circle → **I'm going** (4 going).
4. Switch to Maya → circle → **Offer seats** → 3 seats → **Post ride**.
5. Switch to Chris → circle → the ride → **Request a seat**.
6. Switch to Maya → Trips shows a badge → open the ride → **Accept**.
7. Switch to Chris → ride shows **Booking confirmed** with the trip timeline.

Verification codes are shown in a fake "OU Mail" banner — tap it to fill the code.
Judges can tap **Try a demo account** on the welcome screen to skip sign-in.

## Deploy

Push to GitHub and import into Vercel. No environment variables needed yet.
