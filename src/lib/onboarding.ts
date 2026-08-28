// Client-only onboarding state for the candidate dashboard's first-run
// tutorial and "get chatfolio-ready" tracker (Templates/CMS Candidate
// Dashboard user journey tutorial.dc.html). All of it is local-device UX
// state, not backend data — there's no "has this candidate seen the
// tutorial" field on the account, so localStorage is the right store, same
// as the reference template's own `localStorage.getItem(...)` calls.

const CV_UPLOADED_KEY = "chatfolio-cv-uploaded";
const ONBOARDING_SEEN_KEY = "chatfolio-onboarding-seen";
const TRACKER_OPEN_KEY = "chatfolio-tracker-open";

function readBoolFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeBoolFlag(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Private browsing / blocked storage — the tutorial and tracker are
    // non-critical nudges, so just let it re-show next time rather than error.
  }
}

// There's no backend endpoint to ask "has this candidate ever uploaded a
// CV" (§4 of the API doc has upload/status/retry, no list) — the CV Upload
// page sets this the moment a job reaches "parsed" so the tracker elsewhere
// in the shell can reflect it without re-fetching CV state on every page.
export const getCvUploadedFlag = () => readBoolFlag(CV_UPLOADED_KEY);
export const setCvUploadedFlag = () => writeBoolFlag(CV_UPLOADED_KEY);

export const hasSeenOnboarding = () => readBoolFlag(ONBOARDING_SEEN_KEY);
export const markOnboardingSeen = () => writeBoolFlag(ONBOARDING_SEEN_KEY);

export function getTrackerOpenPreference(defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = window.localStorage.getItem(TRACKER_OPEN_KEY);
    if (stored === "0") return false;
    if (stored === "1") return true;
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setTrackerOpenPreference(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRACKER_OPEN_KEY, value ? "1" : "0");
  } catch {
    // ignore — see writeBoolFlag
  }
}
