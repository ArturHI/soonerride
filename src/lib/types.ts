// Shared data contract. Mirrors supabase/schema.sql one-to-one so the
// local store in data.ts can be swapped for Supabase without touching the UI.

export type Car = {
  make: string; // "Honda Civic"
  color: string; // "Silver"
  plate: string; // "OK · KJR-482"
};

export type User = {
  id: string;
  name: string;
  email: string; // must end with @ou.edu
  major?: string;
  year?: string;
  rating: number; // 0–5
  tripCount: number;
  car?: Car | null;
  avatarColor: string; // hex, used behind initials
  // Where riders can send a thank-you tip. Usernames / email / phone, no symbols.
  venmo?: string;
  cashapp?: string;
  zelle?: string;
};

export type Ride = {
  id: string;
  driverId: string;
  from: string; // "Norman"
  fromDetail: string; // "Lloyd Noble Center lot"
  to: string; // "Dallas"
  toDetail: string; // "AT&T Stadium, Arlington"
  departAt: string; // ISO datetime
  seatsTotal: number;
  distanceMiles?: number; // one way from Norman; trips >= LONG_TRIP_MILES may ask for a gas share
  extraMiles?: number; // planned stops / detours, counted in the gas estimate
  stopsNote?: string; // "Turner Falls viewpoint"
  pricePerSeat: number | null; // gas share per seat; null = free
  priceReason?: string; // required when the price is well above the gas estimate
  note?: string;
  circleId?: string | null;
  status?: RideStatus; // missing = "open"
  completedAt?: string;
  createdAt: string;
};

export type RideStatus = "open" | "completed";

export type TipMethod = "venmo" | "cashapp" | "zelle";

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export type SeatRequest = {
  id: string;
  rideId: string;
  passengerId: string;
  seats: number;
  status: RequestStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
  // Filled in by the rider after the ride. All optional; tip amounts are never shown to others.
  rating?: number; // 1–5
  thanksNote?: string;
  tipAmount?: number;
  tipMethod?: TipMethod;
  feedbackAt?: string;
};

export type CircleCategory = "game" | "airport" | "holiday" | "event";

export type Circle = {
  id: string;
  title: string;
  category: CircleCategory;
  destination: string;
  date: string; // YYYY-MM-DD
  description?: string;
  createdBy: string;
  createdAt: string;
};

export type CircleMember = {
  circleId: string;
  userId: string;
  joinedAt: string;
};

// ---- View models returned by the data layer ----

export type RideView = Ride & {
  driver: User;
  seatsLeft: number;
  myRequest: SeatRequest | null;
  pendingCount: number; // only meaningful to the driver
  completed: boolean; // driver tapped Complete, or it's well past arrival
  miles: number; // distance + planned stops
  gasEstimate: number | null; // suggested gas share per seat; null = short trip, always free
  aboveEstimate: boolean;
};

export type RideDetail = RideView & {
  requests: (SeatRequest & { passenger: User })[]; // driver sees all; passenger sees only their own
  passengers: User[]; // accepted
  circle: Circle | null;
};

export type CircleView = Circle & {
  members: User[];
  rideCount: number;
  seatsOffered: number;
  isMember: boolean;
};

export type CircleDetail = CircleView & {
  rides: RideView[];
  creator: User;
};
