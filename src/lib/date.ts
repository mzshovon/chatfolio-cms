export function isoToMonth(iso: string | null) {
  return iso ? iso.slice(0, 7) : "";
}

export function monthToIso(month: string) {
  return month ? `${month}-01` : null;
}
