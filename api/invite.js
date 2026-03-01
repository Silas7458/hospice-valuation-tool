import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { kv } from '@vercel/kv';
import { verifyAuth, getUser } from './lib/verifyAuth.js';

/**
 * POST /api/invite — Create an access code and optionally send an invite email.
 * Requires auth cookie from an admin user.
 *
 * Body: { name, email?, code?, expires?, shareUrl?, sendEmail? }
 * Returns: { code, name, email, expires, sent? }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only admin can create invite codes
  const user = getUser(req);
  if (user !== 'admin') {
    return res.status(403).json({ error: 'Only admin can create invite codes' });
  }

  const { name, email, code: customCode, expires, shareUrl, sendEmail } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Recipient name is required' });
  }

  // Generate or use custom code
  const prefix = name.split(/\s+/)[0].toUpperCase().slice(0, 6);
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = customCode?.trim().toUpperCase() || `${prefix}-${suffix}`;

  // Calculate expiration
  let expiresAt = null;
  if (expires && expires !== 'unlimited') {
    const now = new Date();
    const match = expires.match(/^(\d+)(h|d|mo)$/);
    if (match) {
      const [, num, unit] = match;
      if (unit === 'h') now.setHours(now.getHours() + parseInt(num));
      else if (unit === 'd') now.setDate(now.getDate() + parseInt(num));
      else if (unit === 'mo') now.setMonth(now.getMonth() + parseInt(num));
      expiresAt = now.toISOString();
    }
  }

  // Store in KV
  const record = {
    name,
    email: email || null,
    active: true,
    created: new Date().toISOString(),
    expires: expiresAt,
  };

  await kv.set(`code:${code}`, record);
  await kv.sadd('codes:index', code);

  const result = { code, name, email: email || null, expires: expiresAt };

  // Send invite email if requested
  if (sendEmail && email) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Amerix Medical Consulting" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Hospice Valuation Report — Amerix Medical Consulting',
        text: `Hi ${name},\n\nYou've been invited to view an interactive hospice valuation report.\n\nLink: ${shareUrl}\nAccess Code: ${code}\n${expiresAt ? `Expires: ${new Date(expiresAt).toLocaleDateString()}\n` : ''}\nPowered by Amerix Medical Consulting, LLC`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e293b; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">Hospice Valuation Report</h2>
              <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Amerix Medical Consulting, LLC</p>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                Hi ${name},
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                You've been invited to view an interactive hospice valuation report. Use the access code below to sign in.
              </p>
              <div style="background: #ffffff; border: 2px solid #10b981; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your Access Code</div>
                <div style="font-size: 24px; font-weight: 700; color: #0f766e; letter-spacing: 2px; font-family: monospace;">${code}</div>
              </div>
              ${expiresAt ? `<p style="color: #94a3b8; font-size: 12px; margin: 0 0 16px; text-align: center;">This access expires ${new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''}
              <a href="${shareUrl}" style="display: block; text-align: center; background: #2563eb; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Valuation Report
              </a>
            </div>
            <div style="padding: 16px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Powered by Amerix Medical Consulting, LLC
              </p>
            </div>
          </div>
        `,
      });

      result.sent = true;
    } catch (err) {
      console.error('Invite email failed:', err);
      result.sent = false;
      result.emailError = 'Failed to send email';
    }
  }

  return res.status(201).json(result);
}
