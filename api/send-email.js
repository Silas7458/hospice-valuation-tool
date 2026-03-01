import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, shareUrl } = req.body;

  if (!to || !shareUrl) {
    return res.status(400).json({ error: 'Missing required fields: to, shareUrl' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Amerix Medical Consulting" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Hospice Valuation Report — Amerix Medical Consulting',
      text: `Here is the interactive hospice valuation report:\n\n${shareUrl}\n\nPowered by Amerix Medical Consulting, LLC`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e293b; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">Hospice Valuation Report</h2>
            <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">Amerix Medical Consulting, LLC</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
              You have been shared an interactive hospice valuation report. Click the link below to view the full analysis with live calculations.
            </p>
            <a href="${shareUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              View Valuation Report
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              Powered by Amerix Medical Consulting, LLC
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send failed:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
