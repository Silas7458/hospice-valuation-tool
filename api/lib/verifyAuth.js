import crypto from 'crypto';

/**
 * Verify the auth_token cookie from an incoming request.
 * Returns false if invalid, or { valid: true, user: string } if valid.
 * For backward compat, also returns true (boolean) for legacy tokens.
 */
export function verifyAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const signedToken = cookies.auth_token;

  if (!signedToken) return false;

  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const payload = signedToken.slice(0, dotIndex);
  const signature = signedToken.slice(dotIndex + 1);
  if (!payload || !signature) return false;

  const secret = process.env.AUTH_SECRET || process.env.AUTH_PASSWORD;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison
  const sigHash = crypto.createHash('sha256').update(signature).digest();
  const expHash = crypto.createHash('sha256').update(expected).digest();

  if (!crypto.timingSafeEqual(sigHash, expHash)) return false;

  // Try to extract user identity from payload
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return { valid: true, user: data.sub || 'unknown' };
  } catch {
    // Legacy token (random hex, not base64url JSON) — still valid
    return true;
  }
}

/**
 * Helper: extract just the user name from a verified token.
 */
export function getUser(req) {
  const result = verifyAuth(req);
  if (!result) return null;
  if (result === true) return 'admin'; // legacy token
  return result.user;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) cookies[name] = rest.join('=');
  });
  return cookies;
}
