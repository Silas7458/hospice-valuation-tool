import crypto from 'crypto';

/**
 * Verify the auth_token cookie from an incoming request.
 * Returns true if the cookie contains a valid HMAC-signed token.
 */
export function verifyAuth(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const signedToken = cookies.auth_token;

  if (!signedToken) return false;

  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const token = signedToken.slice(0, dotIndex);
  const signature = signedToken.slice(dotIndex + 1);
  if (!token || !signature) return false;

  const secret = process.env.AUTH_SECRET || process.env.AUTH_PASSWORD;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex');

  // Constant-time comparison — pad to same length via hashing
  const sigHash = crypto.createHash('sha256').update(signature).digest();
  const expHash = crypto.createHash('sha256').update(expected).digest();

  return crypto.timingSafeEqual(sigHash, expHash);
}

function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) cookies[name] = rest.join('=');
  });
  return cookies;
}
