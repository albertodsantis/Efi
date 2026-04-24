// Utilities for capturing and reading the referral code from the landing URL.
// Flow: user lands via efidesk.com/?ref=XYZ → we persist XYZ in sessionStorage →
// the register / Google auth flows pull it and send it to the backend.

const STORAGE_KEY = 'efi:ref';

/** Pull ?ref= from the URL into sessionStorage (if any) and scrub it from history. */
export function captureReferralFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref) return;
    const cleaned = ref.trim().slice(0, 32);
    if (!cleaned) return;
    sessionStorage.setItem(STORAGE_KEY, cleaned);

    // Remove ?ref= from the URL so reloads don't re-apply it — keep other params.
    params.delete('ref');
    const query = params.toString();
    const next = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
    window.history.replaceState({}, '', next);
  } catch {
    // sessionStorage may be disabled; fail silently — referral is opportunistic.
  }
}

/** Read the stored referral code, if any. */
export function readReferralCode(): string | undefined {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

/** Clear the stored referral code after a successful signup attempt. */
export function clearReferralCode(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
