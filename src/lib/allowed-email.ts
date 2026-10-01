const DEFAULT_DOMAINS = "azumo.com,azumolabs.com";

export function allowedDomains(raw = process.env.ALLOWED_EMAIL_DOMAINS) {
  return (raw || DEFAULT_DOMAINS)
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/** Exact domain match only: subdomains and look-alike domains are rejected. */
export function isAllowedEmail(
  email: string | null | undefined,
  domains = allowedDomains(),
) {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  return domains.includes(email.slice(at + 1).toLowerCase());
}
