/**
 * Premium pricing, in one place.
 *
 * The charged amount is set server-side by PREMIUM_AMOUNT_PAISE and is never
 * taken from the client (spec §6.10). These values exist only for display, so
 * they must be kept in step with that env var:
 *
 *   PREMIUM_AMOUNT_PAISE=299900   ->   ₹2,999
 */
export const PREMIUM_PRICE_PAISE = 299900;

export const PREMIUM_PRICE_LABEL = `₹${(PREMIUM_PRICE_PAISE / 100).toLocaleString('en-IN')}`;

/** Shown on the landing stat strip, where space is tight. */
export const PREMIUM_PRICE_SHORT = PREMIUM_PRICE_LABEL;
