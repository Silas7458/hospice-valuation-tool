import crypto from 'crypto';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Access code required' });
  }

  const code = password.trim();
  let userName = 'admin';

  // First, check KV for per-person access codes
  try {
    const record = await kv.get(`code:${code}`);
    if (record) {
      if (!record.active) {
        return res.status(401).json({ error: 'Access code has been revoked' });
      }
      if (record.expires && new Date(record.expires) < new Date()) {
        return res.status(401).json({ error: 'Access code has expired' });
      }
      userName = record.name || 'unknown';

      // Log access
      await kv.set(`lastlogin:${code}`, new Date().toISOString()).catch(() => {});
    } else {
      // Fallback: check master admin password
      const expected = process.env.AUTH_PASSWORD;
      if (!expected) {
        return res.status(500).json({ error: 'Auth not configured' });
      }
      const submittedHash = crypto.createHash('sha256').update(code).digest();
      const expectedHash = crypto.createHash('sha256').update(expected).digest();
      if (!crypto.timingSafeEqual(submittedHash, expectedHash)) {
        return res.status(401).json({ error: 'Invalid access code' });
      }
      userName = 'admin';
    }
  } catch (kvErr) {
    // KV unavailable — fall back to master password only
    console.error('KV lookup failed, falling back to master password:', kvErr.message);
    const expected = process.env.AUTH_PASSWORD;
    if (!expected) {
      return res.status(500).json({ error: 'Auth not configured' });
    }
    const submittedHash = crypto.createHash('sha256').update(code).digest();
    const expectedHash = crypto.createHash('sha256').update(expected).digest();
    if (!crypto.timingSafeEqual(submittedHash, expectedHash)) {
      return res.status(401).json({ error: 'Invalid access code' });
    }
    userName = 'admin';
  }

  // Build signed token with user identity
  const payload = Buffer.from(JSON.stringify({
    sub: userName,
    iat: Date.now(),
  })).toString('base64url');

  const secret = process.env.AUTH_SECRET || process.env.AUTH_PASSWORD;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const signedToken = `${payload}.${signature}`;

  res.setHeader('Set-Cookie',
    `auth_token=${signedToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
  );

  return res.status(200).json({ success: true, name: userName });
}
