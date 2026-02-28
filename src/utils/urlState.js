/**
 * urlState.js — Encode/decode input state to/from URL parameters
 * for shareable links. Supports embedding access level for locked sharing.
 */

/**
 * Encode inputs object to a base64 URL parameter string.
 * Optionally embeds accessLevel as _accessLevel key.
 */
export function encodeState(inputs, accessLevel) {
  try {
    const payload = accessLevel ? { ...inputs, _accessLevel: accessLevel } : inputs;
    return btoa(JSON.stringify(payload));
  } catch {
    return '';
  }
}

/**
 * Decode a base64 parameter string back to inputs, merged with defaults.
 * Strips _accessLevel so it doesn't pollute the input state.
 */
export function decodeState(paramString, defaults = {}) {
  try {
    const json = atob(paramString);
    const parsed = JSON.parse(json);
    const { _accessLevel, ...rest } = parsed;
    return { ...defaults, ...rest };
  } catch {
    return defaults;
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
