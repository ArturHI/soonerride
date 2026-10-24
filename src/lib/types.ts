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
  pricePerSeat: number | null; // null = free
  note?: string;
  circleId?: string | null;
  createdAt: string;
};

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
