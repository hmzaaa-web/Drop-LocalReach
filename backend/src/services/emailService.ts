import { config } from '../config/index.js';

interface SendResetEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send password reset email via Resend API
 */
export async function sendPasswordResetEmail(
  rawToken: string,
  expiresAt: Date
): Promise<SendResetEmailResult> {
  const recipient = config.admin.recoveryEmail || 'mdhamza0612@gmail.com';
  const resetUrl = `${config.publicBaseUrl}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;
  const expiresMinutes = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / (60 * 1000)));

  if (!config.resend.apiKey) {
    console.warn('[EmailService] RESEND_API_KEY is not configured in environment variables.');
    console.log(`[EmailService] (Development Mode) Password reset link: ${resetUrl}`);
    return { success: true };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reset DROP Admin Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050505; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #0d0d0f; border: 1px solid #1f2937; border-radius: 12px; padding: 36px 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px; border-bottom: 1px solid #1f2937;">
              <div style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">
                DROP <span style="font-size: 13px; font-weight: 500; color: #10b981; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 2px 8px; border-radius: 9999px; margin-left: 6px;">ADMIN</span>
              </div>
              <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">LocalReach Security Services</div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding-top: 24px; padding-bottom: 28px;">
              <h1 style="font-size: 18px; font-weight: 600; color: #f9fafb; margin: 0 0 12px 0;">Admin Password Reset Request</h1>
              <p style="font-size: 14px; line-height: 22px; color: #9ca3af; margin: 0 0 20px 0;">
                A request was received to reset the administrator password for the DROP storage & analytics control panel.
              </p>
              
              <!-- Action Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #10b981;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #000000; text-decoration: none; border-radius: 8px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 20px; color: #6b7280; margin: 0 0 12px 0;">
                This link is single-use and will expire in <strong style="color: #d1d5db;">${expiresMinutes} minutes</strong>.
              </p>
              
              <div style="padding: 12px; background-color: rgba(255,255,255,0.02); border: 1px solid #1f2937; border-radius: 6px; font-size: 12px; color: #6b7280; word-break: break-all;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="${resetUrl}" style="color: #10b981; text-decoration: none;">${resetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Security Footer -->
          <tr>
            <td style="padding-top: 20px; border-top: 1px solid #1f2937; font-size: 12px; line-height: 18px; color: #4b5563;">
              If you did not request this password reset, please ignore this email. Your current admin credentials will remain unchanged.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `
DROP Admin Password Reset Request

A request was received to reset the administrator password for the DROP control panel.

To set a new password, visit the following URL:
${resetUrl}

This link is single-use and will expire in ${expiresMinutes} minutes.

If you did not request this reset, please ignore this message.
  `.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.resend.fromEmail || 'DROP Admin <noreply@localreach.in>',
        to: [recipient],
        subject: 'DROP Admin - Password Reset Request',
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[EmailService] Resend API error response:', response.status, errText);
      return {
        success: false,
        error: `Resend error (${response.status}): ${errText}`,
      };
    }

    const data: any = await response.json();
    console.log('[EmailService] Password reset email successfully sent via Resend:', data?.id);
    return { success: true };
  } catch (err: any) {
    console.error('[EmailService] Exception sending reset email via Resend:', err);
    return {
      success: false,
      error: err?.message || 'Network error communicating with Resend',
    };
  }
}
