/**
 * urlState.js — Encode/decode input state to/from URL parameters
 * for shareable links.
 */

/**
 * Encode inputs object to a base64 URL parameter string.
 */
export function encodeState(inputs) {
  try {
    const json = JSON.stringify(inputs)
    return btoa(json)
  } catch {
    return ''
  }
}

/**
 * Decode a base64 parameter string back to inputs, merged with defaults.
 */
export function decodeState(paramString, defaults = {}) {
  try {
    const json = atob(paramString)
    const parsed = JSON.parse(json)
    return { ...defaults, ...parsed }
  } catch {
    return defaults
  }
}

/**
 * Check current URL for a ?v= parameter and decode it.
 */
export function getStateFromUrl(defaults = {}) {
  try {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('v')
    if (encoded) {
      return decodeState(encoded, defaults)
    }
  } catch {
    // ignore parse errors
  }
  return null
}
