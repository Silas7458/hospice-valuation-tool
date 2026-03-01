import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const expected = process.env.AUTH_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  // Hash both to equal length for constant-time comparison
  const submittedHash = crypto.createHash('sha256').update(password).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();

  if (!crypto.timingSafeEqual(submittedHash, expectedHash)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Generate signed session token
  const token = crypto.randomBytes(32).toString('hex');
  const secret = process.env.AUTH_SECRET || expected;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex');

  const signedToken = `${token}.${signature}`;

  res.setHeader('Set-Cookie',
    `auth_token=${signedToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
  );

  return res.status(200).json({ success: true });
}
