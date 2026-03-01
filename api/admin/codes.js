import crypto from 'crypto';
import { kv } from '@vercel/kv';

/**
 * Admin endpoint to manage per-person access codes.
 * Protected by the master AUTH_PASSWORD.
 *
 * GET    /api/admin/codes              — List all codes
 * POST   /api/admin/codes              — Create a new code
 *        body: { name, email?, expires?, code? }
 * DELETE /api/admin/codes              — Revoke a code
 *        body: { code }
 */
export default async function handler(req, res) {
  // Admin auth: require master password in Authorization header
  const authHeader = req.headers.authorization || '';
  const adminPassword = process.env.AUTH_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  const submitted = authHeader.replace('Bearer ', '');
  const submittedHash = crypto.createHash('sha256').update(submitted).digest();
  const expectedHash = crypto.createHash('sha256').update(adminPassword).digest();
  if (!crypto.timingSafeEqual(submittedHash, expectedHash)) {
    return res.status(401).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    return listCodes(res);
  } else if (req.method === 'POST') {
    return createCode(req, res);
  } else if (req.method === 'DELETE') {
    return revokeCode(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function listCodes(res) {
  const index = await kv.smembers('codes:index') || [];
  const codes = [];

  for (const code of index) {
    const record = await kv.get(`code:${code}`);
    const lastLogin = await kv.get(`lastlogin:${code}`);
    if (record) {
      codes.push({ code, ...record, lastLogin: lastLogin || null });
    }
  }

  return res.status(200).json({ codes });
}

async function createCode(req, res) {
  const { name, email, expires, code: customCode } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // Generate a readable code or use custom one
  const code = customCode || generateCode(name);

  const record = {
    name,
    email: email || null,
    active: true,
    created: new Date().toISOString(),
    expires: expires || null,
  };

  await kv.set(`code:${code}`, record);
  await kv.sadd('codes:index', code);

  return res.status(201).json({ code, ...record });
}

async function revokeCode(req, res) {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const record = await kv.get(`code:${code}`);
  if (!record) {
    return res.status(404).json({ error: 'Code not found' });
  }

  record.active = false;
  await kv.set(`code:${code}`, record);

  return res.status(200).json({ code, revoked: true });
}

function generateCode(name) {
  const prefix = name.split(/\s+/)[0].toUpperCase().slice(0, 6);
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${suffix}`;
}
