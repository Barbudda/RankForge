/**
 * Publisher details for the legal notice (mentions légales, required in
 * France for a site that sells: LCEN art. 6 III). They come from the
 * environment so nothing here is invented.
 *
 * MISSING until the founder provides them (asked on 2026-10-25): the legal
 * name, business status, postal address and SIRET. Until LEGAL_NAME,
 * LEGAL_ADDRESS, LEGAL_SIRET and LEGAL_EMAIL are set, /legal returns 404 and
 * is linked from nowhere.
 */

export const LEGAL = {
  /** Individual or company name, e.g. "Jane Doe" or "Acme SAS". */
  name: process.env.LEGAL_NAME ?? "",
  /** e.g. "Entrepreneur individuel (micro-entreprise)". */
  status: process.env.LEGAL_STATUS ?? "",
  address: process.env.LEGAL_ADDRESS ?? "",
  siret: process.env.LEGAL_SIRET ?? "",
  /** VAT number, or the VAT-exemption mention that applies. */
  vat: process.env.LEGAL_VAT ?? "",
  email: process.env.LEGAL_EMAIL ?? "",
  phone: process.env.LEGAL_PHONE ?? "",
  /** Directeur de la publication; defaults to the publisher. */
  director: process.env.LEGAL_DIRECTOR ?? "",
};

/** The host, as stated in Vercel's terms (vercel.com/legal/terms, checked 2026-10-25). */
export const HOST = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, United States",
  url: "https://vercel.com",
};

export const legalNoticeReady = Boolean(LEGAL.name && LEGAL.address && LEGAL.siret && LEGAL.email);
