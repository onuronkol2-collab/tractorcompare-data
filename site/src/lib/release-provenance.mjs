/**
 * Public build provenance only. Not a signature, deployment attestation, or secret.
 * Reject anything but a full Git commit hash before embedding it in HTML.
 */
export function verifiedReleaseSha(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[a-f0-9]{40}$/i.test(trimmed) ? trimmed.toLowerCase() : null;
}
