/**
 * urlState.js — Encode/decode input state to/from URL parameters
 * for shareable links. Supports embedding access level for locked sharing.
 */

/**
 * Encode inputs object to a base64 URL parameter string.
 * Optionally embeds accessLevel and expiry timestamp.
 * @param {string} expiresIn — duration key: '24h','48h','7d','30d','3mo','12mo','unlimited'
 */
export function encodeState(inputs, accessLevel, expiresIn = 'unlimited') {
  try {
    const payload = accessLevel ? { ...inputs, _accessLevel: accessLevel } : { ...inputs };
    if (expiresIn && expiresIn !== 'unlimited') {
      payload._expiresAt = Date.now() + EXPIRY_MS[expiresIn];
    }
    return btoa(JSON.stringify(payload));
  } catch {
    return '';
  }
}

const EXPIRY_MS = {
  '24h':  24 * 60 * 60 * 1000,
  '48h':  48 * 60 * 60 * 1000,
  '7d':   7 * 24 * 60 * 60 * 1000,
  '30d':  30 * 24 * 60 * 60 * 1000,
  '3mo':  90 * 24 * 60 * 60 * 1000,
  '12mo': 365 * 24 * 60 * 60 * 1000,
};

/**
 * Decode a base64 parameter string back to inputs, merged with defaults.
 * Strips _accessLevel so it doesn't pollute the input state.
 */
export function decodeState(paramString, defaults = {}) {
  try {
    const json = atob(paramString);
    const parsed = JSON.parse(json);
    const { _accessLevel, _expiresAt, ...rest } = parsed;
    return { ...defaults, ...rest };
  } catch {
    return defaults;
  }
}

/**
 * Check if the URL state has expired.
 * Returns true if expired, false if still valid or no expiry set.
 */
export function isLinkExpired() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('v');
    if (!encoded) return false;
    const parsed = JSON.parse(atob(encoded));
    if (!parsed._expiresAt) return false;
    return Date.now() > parsed._expiresAt;
  } catch {
    return false;
  }
}

/**
 * Check current URL for a ?v= parameter and decode it.
 */
export function getStateFromUrl(defaults = {}) {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('v');
    if (encoded) {
      return decodeState(encoded, defaults);
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

/**
 * Extract the access level from the URL parameter, if present.
 * Returns 'client' | 'enterprise' | 'master' | null.
 */
export function getAccessLevelFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('v');
    if (encoded) {
      const json = atob(encoded);
      const parsed = JSON.parse(json);
      return parsed._accessLevel || null;
    }
  } catch {
    // ignore
  }
  return null;
}
