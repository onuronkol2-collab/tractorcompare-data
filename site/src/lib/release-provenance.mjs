/**
 * Public build provenance only. Not a signature, deployment attestation, or secret.
 * Reject anything but a full Git commit hash before embedding it in HTML.
 */
export function verifiedReleaseSha(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[a-f0-9]{40}$/i.test(trimmed) ? trimmed.toLowerCase() : null;
}

/**
 * Compare static Astro HTML with the public commit SHA. Reject duplicate
 * provenance tags; do not interpret the page as HTML or execute any content.
 */
export function hasReleaseSha(html, value) {
  const sha = verifiedReleaseSha(value);
  if (!sha || typeof html !== "string") return false;
  const attribute = 'name="tractorvs-release-sha"';
  const first = html.indexOf(attribute);
  if (first === -1 || html.indexOf(attribute, first + attribute.length) !== -1)
    return false;
  return html.includes('<meta ' + attribute + ' content="' + sha + '"');
}
