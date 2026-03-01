import { verifyAuth } from './lib/verifyAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (verifyAuth(req)) {
    return res.status(200).json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
}
