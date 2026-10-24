import { occurrences, semesterEnd, ymd } from "./schedule";
import type { Circle, CircleMember, Ride, SeatRequest, User, WeekChange } from "./types";

export type DB = {
  users: User[];
  rides: Ride[];
  requests: SeatRequest[];
  circles: Circle[];
  members: CircleMember[];
  changes: WeekChange[];
};

const pad = (n: number) => String(n).padStart(2, "0");

function at(daysFromNow: number, h: number, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function day(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysOut(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return day(d);
}

// Tuesday before Thanksgiving (4th Thursday of November), this year or next.
function thanksgivingTuesday() {
  const now = new Date();
  for (const y of [now.getFullYear(), now.getFullYear() + 1]) {
    const nov1 = new Date(y, 10, 1);
    const firstThu = 1 + ((4 - nov1.getDay() + 7) % 7);
    const tue = new Date(y, 10, firstThu + 21 - 2);
    if (tue > now) return tue;
  }
  return now;
}

export function seed(): DB {
  const now = new Date().toISOString();
  const tg = thanksgivingTuesday();

  const users: User[] = [
    {
      id: "u_maya",
      name: "Maya Patel",
      email: "maya.patel@ou.edu",
      major: "Petroleum Eng.",
      year: "Senior",
      rating: 4.9,
      tripCount: 38,
      avatarColor: "#B9826B",
      car: { make: "Honda Civic", color: "Silver", plate: "KJR-482" },
      venmo: "maya-patel-ou",
      cashapp: "mayapatel",
    },
    {
      id: "u_sam",
      name: "Sam Rivera",
      email: "sam.rivera@ou.edu",
      major: "Finance",
      year: "Junior",
      rating: 4.8,
      tripCount: 21,
      avatarColor: "#6F8A7A",
      car: { make: "Toyota RAV4", color: "Blue", plate: "LTN-119" },
      venmo: "samrivera",
    },
    {
      id: "u_jordan",
      name: "Jordan Lee",
      email: "jordan.lee@ou.edu",
      major: "Journalism",
      year: "Sophomore",
      rating: 4.7,
      tripCount: 9,
      avatarColor: "#7C7FA6",
      car: { make: "Mazda 3", color: "Red", plate: "HWD-730" },
      zelle: "jordan.lee@ou.edu",
    },
    {
      id: "u_chris",
      name: "Chris Nguyen",
      email: "chris.nguyen@ou.edu",
      major: "Computer Science",
      year: "Freshman",
      rating: 5.0,
      tripCount: 3,
      avatarColor: "#C49A4A",
    },
    {
      id: "u_ava",
      name: "Ava Brooks",
      email: "ava.brooks@ou.edu",
      major: "Nursing",
      year: "Junior",
      rating: 4.9,
      tripCount: 14,
      avatarColor: "#A0687F",
      car: { make: "Subaru Outback", color: "Green", plate: "PRQ-551" },
      cashapp: "avabrooks",
      zelle: "ava.brooks@ou.edu",
    },
    {
      id: "u_noah",
      name: "Noah Kim",
      email: "noah.kim@ou.edu",
      major: "Architecture",
      year: "Senior",
      rating: 4.6,
      tripCount: 6,
      avatarColor: "#5E8CA3",
    },
  ];

  const circles: Circle[] = [
    {
      id: "c_thanks",
      title: "Thanksgiving flights out of OKC",
      category: "airport",
      destination: "OKC Airport",
      date: day(tg),
      description: "Most of us fly out Tuesday afternoon. Let's split rides to Will Rogers.",
      createdBy: "u_ava",
      createdAt: now,
    },
    {
      id: "c_tulsa",
      title: "Weekend home to Tulsa",
      category: "holiday",
      destination: "Tulsa",
      date: daysOut(6),
      description: "Leaving Friday after class, back Sunday night.",
      createdBy: "u_noah",
      createdAt: now,
    },
    {
      id: "c_dfw",
      title: "Winter break: DFW Airport",
      category: "airport",
      destination: "DFW Airport",
      date: daysOut(48),
      createdBy: "u_chris",
      createdAt: now,
    },
  ];

  // A weekly class ride: the next Wednesday, 8:40 AM, through the end of the semester.
  const weekly = { days: [3], time: "08:40", endDate: semesterEnd() };
  const firstWed = occurrences({ date: day(new Date()), ...weekly }, 3);
  circles.push({
    id: "c_weekly",
    title: "Wed 9am class: Dunham → Engineering",
    category: "weekly",
    destination: "Gallogly Hall",
    pickup: "Dunham College",
    date: day(new Date()),
    ...weekly,
    returnTime: "10:20",
    description: "Same 9am lab every Wednesday. Meet at the Dunham front circle.",
    createdBy: "u_noah",
    createdAt: now,
  });

  const members: CircleMember[] = [
    ["c_weekly", "u_noah"],
    ["c_weekly", "u_jordan"],
    ["c_weekly", "u_ava"],
    ["c_thanks", "u_ava"],
    ["c_thanks", "u_noah"],
    ["c_thanks", "u_chris"],
    ["c_thanks", "u_sam"],
    ["c_tulsa", "u_noah"],
    ["c_tulsa", "u_jordan"],
    ["c_dfw", "u_chris"],
  ].map(([circleId, userId]) => ({ circleId, userId, joinedAt: now }));

  const rides: Ride[] = [
    {
      id: "r_dallas",
      driverId: "u_maya",
      from: "Norman",
      fromDetail: "Lloyd Noble Center lot",
      to: "Dallas",
      toDetail: "Deep Ellum",
      departAt: at(2, 8, 0),
      seatsTotal: 3,
      distanceMiles: 190,
      pricePerSeat: 5,
      note: "One small bag each. Coffee stop in Ardmore.",
      createdAt: now,
    },
    {
      id: "r_okc",
      driverId: "u_sam",
      from: "Norman",
      fromDetail: "Couch Center",
      to: "OKC Airport",
      toDetail: "Will Rogers, Departures",
      departAt: at(3, 5, 30),
      seatsTotal: 2,
      distanceMiles: 25,
      pricePerSeat: null,
      createdAt: now,
    },
    {
      id: "r_tulsa",
      driverId: "u_jordan",
      from: "Norman",
      fromDetail: "Gaylord Hall",
      to: "Tulsa",
      toDetail: "Downtown, Brady Arts",
      departAt: at(6, 16, 0),
      seatsTotal: 3,
      distanceMiles: 130,
      pricePerSeat: null,
      note: "Leaving right after my 3pm class.",
      circleId: "c_tulsa",
      createdAt: now,
    },
    {
      id: "r_dfw",
      driverId: "u_ava",
      from: "Norman",
      fromDetail: "Headington Hall",
      to: "DFW Airport",
      toDetail: "Terminal D",
      departAt: at(5, 11, 0),
      seatsTotal: 3,
      distanceMiles: 185,
      pricePerSeat: 5,
      createdAt: now,
    },
    {
      id: "r_austin",
      driverId: "u_maya",
      from: "Norman",
      fromDetail: "Lloyd Noble Center lot",
      to: "Austin",
      toDetail: "UT Campus, Guadalupe St",
      departAt: at(9, 7, 0),
      seatsTotal: 2,
      distanceMiles: 385,
      extraMiles: 15,
      stopsNote: "Lunch in Waco",
      pricePerSeat: 20,
      priceReason: "Turnpike tolls both ways",
      createdAt: now,
    },
  ];

  rides.push({
    id: "r_weekly",
    driverId: "u_jordan",
    from: "Dunham College",
    fromDetail: "Front circle",
    to: "Gallogly Hall",
    toDetail: "Engineering quad",
    departAt: firstWed[0]?.toISOString() ?? at(3, 8, 40),
    seatsTotal: 3,
    distanceMiles: 2,
    pricePerSeat: null,
    circleId: "c_weekly",
    weekly: true,
    createdAt: now,
  });

  // Jordan can't drive the third Wednesday, so that week needs someone to cover.
  const changes: WeekChange[] = firstWed[2]
    ? [{ id: "w_1", rideId: "r_weekly", date: ymd(firstWed[2]), userId: "u_jordan", kind: "skip", createdAt: now }]
    : [];

  const requests: SeatRequest[] = [
    { id: "q_1", rideId: "r_dallas", passengerId: "u_noah", seats: 1, status: "accepted", createdAt: now, updatedAt: now },
    { id: "q_2", rideId: "r_tulsa", passengerId: "u_noah", seats: 1, status: "accepted", createdAt: now, updatedAt: now },
    { id: "q_3", rideId: "r_weekly", passengerId: "u_noah", seats: 1, status: "accepted", createdAt: now, updatedAt: now },
  ];

  return { users, rides, requests, circles, members, changes };
}

export const AVATAR_COLORS = ["#B9826B", "#6F8A7A", "#7C7FA6", "#C49A4A", "#A0687F", "#5E8CA3", "#8A7A62"];
