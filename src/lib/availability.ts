export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Day = (typeof DAYS)[number];

export type DaySlot = { enabled: boolean; start: string; end: string };
export type Availability = Record<Day, DaySlot>;

const STORAGE_KEY = "chatfolio.meeting-availability";

export const DEFAULT_AVAILABILITY: Availability = Object.fromEntries(
  DAYS.map((day, i) => [day, { enabled: i < 5, start: "09:00", end: "17:00" }])
) as Availability;

// "HH:MM" strings compare correctly lexicographically.
export function isValidSlot(slot: DaySlot) {
  return !slot.enabled || (slot.start !== "" && slot.end !== "" && slot.start < slot.end);
}

// Backend has no availability endpoint yet (see Docs/Required_API_Doc.md §8), so
// this is persisted per-browser only.
export function loadAvailability(): Availability {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AVAILABILITY;
    return { ...DEFAULT_AVAILABILITY, ...(JSON.parse(raw) as Availability) };
  } catch {
    return DEFAULT_AVAILABILITY;
  }
}

export function saveAvailability(value: Availability) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // storage unavailable — the UI still works for the session
  }
}
