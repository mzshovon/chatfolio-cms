export function isoToMonth(iso: string | null) {
  return iso ? iso.slice(0, 7) : "";
}

export function monthToIso(month: string) {
  return month ? `${month}-01` : null;
}

// `created_at` timestamps from the backend are UTC ISO 8601 and
// deliberately not localized server-side (Docs §8) — this renders one in
// the viewer's own local time zone (whatever region they're actually in,
// via the Date object's local getters) as DD/MM/YYYY, hh:mm AM/PM, e.g.
// "22/11/2026, 12:05 AM". Intl.DateTimeFormat/toLocaleString() were
// deliberately not used here: their day/month order and AM-PM-vs-24h
// choice both follow the browser's locale, which would make this
// inconsistent from one admin to another — this keeps the layout fixed
// while still converting to each viewer's own local clock time.
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours24 = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${day}/${month}/${year}, ${hours12}:${minutes} ${period}`;
}
