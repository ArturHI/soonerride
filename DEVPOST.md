# SoonerRide — Devpost submission

**Name:** SoonerRide

**Tagline:** Carpooling for verified OU students — free around town, gas-split for long trips, never for profit.

**Links**
- Try it: https://soonerride.vercel.app (tap "Try a demo account")
- Code: https://github.com/ArturHI/soonerride
- Presentation: https://github.com/ArturHI/soonerride/blob/main/docs/SoonerRide-presentation.pdf

**Built with:** Next.js, React, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Supabase Realtime, Vercel, Lucide icons

---

## Inspiration

Plenty of OU students don't have a car. Getting to an 8am lab in the rain, the OKC airport before break, an internship, or home for Thanksgiving means an expensive rideshare, begging in group chats, or not going. At the same time, thousands of students drive to the same places every weekend with empty seats. Rideshare apps fix this by turning it into a business. We wanted the opposite: a way for students to share the rides they're already taking, where money is never the point.

## What it does

SoonerRide connects verified OU students going the same way.

- **Find or offer a ride.** Search by destination and date; drivers post trips with seats, pickup spot and car details. Riders request a seat, drivers accept or decline, and both sides see the booking update live.
- **Trip Circles.** Students going to the same game, airport run or holiday form a group *before* a driver exists. Drivers see real demand and offer seats to the whole circle at once.
- **Weekly circles.** For a class every Wednesday at 9am, students set up a repeating ride (e.g. Dunham → Gallogly). Riders sign up once; anyone can skip a week, and if the regular driver can't make it, another member can cover that week.
- **Not built for profit.** Rides under 100 miles are always free. Longer trips can ask for a *gas share* that the app suggests from distance and planned stops. Drivers can set their own price, but anything well above the gas estimate is labeled for riders with the driver's reason.
- **Thank-yous instead of fares.** After the driver completes a ride, riders get a gentle prompt to rate and say thanks, with an *optional* tip that goes straight to the driver through Venmo, Cash App or Zelle. A note alone is always enough, and tip amounts are never shown to anyone.
- **Trust and safety.** Only @ou.edu emails can join. Drivers' car and plate are shown at pickup, and riders and drivers can text or call each other only once a booking is confirmed.

## Social good

- **Affordability:** a free or gas-split ride instead of a $40+ rideshare to the airport or $80+ to Dallas.
- **Access:** students without cars can reach class, jobs, internships, healthcare and home on the same terms as students with cars.
- **Community:** circles turn strangers in the same class or dorm into a carpool, and thank-yous replace transactions.
- **Environment:** every shared seat is one fewer car on I-35.

## How we built it

- **Next.js 15 + React + TypeScript**, styled with **Tailwind CSS** as a mobile-first web app that installs to the iPhone home screen and runs full-screen like a native app.
- **Supabase (PostgreSQL)** stores users, rides, seat requests, circles, members and weekly exceptions. **Supabase Realtime** pushes every change to all open devices, so a request on one phone shows up as a banner on the driver's phone about a second later.
- One data layer (`src/lib/data.ts`) that every screen talks to, backed by Supabase or by the browser when offline — the screens never know the difference.
- Pricing and booking rules (free under 100 mi, gas estimate, above-estimate reason, seat limits) are enforced in the data layer, not just in forms.
- Weekly schedules compute each upcoming date from weekdays, time and end date, then apply per-week skips and covers.
- Deployed on **Vercel**; every push to GitHub redeploys.

## Challenges we ran into

- **Keeping money optional without making drivers lose out.** A hard price cap punishes drivers who take detours; no rules invites overcharging. We landed on a transparent gas estimate that includes planned stops, with a visible label and reason when a price is well above it.
- **Live updates across phones.** Phones drop connections in the background, so the app refreshes when it comes back to the foreground in addition to Realtime events.
- **Repeating rides.** Modeling "every Mon/Wed/Fri until finals, except the weeks people skip" without generating hundreds of rows.

## Accomplishments that we're proud of

- A complete, working flow end to end: circle → join → driver offers seats → request → accept → complete → thank-you, live across two phones.
- A product that's deliberately *not* another Uber: free short rides, cost-sharing instead of fares, and gratitude instead of mandatory tipping.
- A clean, native-feeling interface built in one day.

## What we learned

How to design pricing and incentives around fairness instead of revenue, how to sync state live between devices with Supabase Realtime, and how much a simple, focused UI matters when the person using it is standing in a parking lot.

## What's next for SoonerRide

- Real email verification with Supabase Auth (codes to @ou.edu only) and row-level security.
- Live maps and pickup ETAs.
- Safety tools: share my trip with a friend, report a user.
- Impact stats: miles shared, CO₂ saved, money saved by students.
- Partnering with OU Parking & Transportation and student orgs, then expanding to other universities.
