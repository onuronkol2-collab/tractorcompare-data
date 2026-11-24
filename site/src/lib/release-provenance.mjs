/**
 * Public build provenance only. Not a signature, deployment attestation, or secret.
 * Reject anything but a full Git commit hash before embedding it in HTML.
 */
export function verifiedReleaseSha(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[a-f0-9]{40}$/i.test(trimmed) ? trimmed.toLowerCase() : null;
}

/** Check exactly one server-rendered release meta tag with the expected SHA. */
export function hasReleaseSha(html, expected) {
  const sha = verifiedReleaseSha(expected);
  if (!sha || typeof html !== "string") return false;
  const found = [...html.matchAll(/<meta\s+name="tractorvs-release-sha"\s+content="([a-f0-9]{40})"\s*\/?>/g)];
  return found.length === 1 && found[0][1] === sha;
}
