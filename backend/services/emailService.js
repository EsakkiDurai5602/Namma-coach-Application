const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fallbackMode = process.env.NODE_ENV !== 'production' || process.env.OTP_EMAIL_FALLBACK === 'true';

const smtpService = process.env.SMTP_SERVICE?.trim();
const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
const fromName = process.env.SMTP_FROM_NAME?.trim() || process.env.RESEND_FROM_NAME || 'Namma Coach';

function isResendConfigured() {
  return Boolean(resendApiKey && resendApiKey.startsWith('re_'));
}

function isSmtpConfigured() {
  return Boolean((smtpService || smtpHost) && smtpUser && smtpPass);
}

function createSmtpTransport() {
  if (!isSmtpConfigured()) return null;

  if (smtpService) {
    return nodemailer.createTransport({
      service: smtpService,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

function buildHtml(name, otp, purpose) {
  const title = purpose === 'reset' ? 'Reset Your Password' : 'Verify Your Email';
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#eef6fc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(12,34,54,.12);">
        <tr>
          <td style="background:linear-gradient(135deg,#0c2236,#2f6da3);padding:28px 36px;text-align:center;">
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">NAMMA COACH</h1>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,.7);">Career Guidance &amp; Mentorship</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px;">
            <p style="margin:0 0 8px;font-size:16px;color:#142a3d;">Hello <strong>${name}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#5b7387;line-height:1.6;">
              Your ${title} code is below. It expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:#eef6fc;border:2px dashed #8fc3ec;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#2f6da3;letter-spacing:.1em;text-transform:uppercase;">Your OTP Code</p>
              <span style="font-size:44px;font-weight:800;letter-spacing:14px;color:#0c2236;font-family:'Courier New',monospace;">${otp}</span>
            </div>
            <p style="margin:0;font-size:13px;color:#8aa0b3;">
              If you did not request this, please ignore this email.<br>
              &copy; ${new Date().getFullYear()} Namma Coach
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOtpEmail(to, name, otp, purpose = 'verify') {
  const subject = purpose === 'reset'
    ? 'Reset Your Password — Namma Coach'
    : 'Verify Your Email — Namma Coach';

  console.log(`📧 Sending OTP email to: ${to}`);

  if (isSmtpConfigured()) {
    try {
      const transporter = createSmtpTransport();
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html: buildHtml(name, otp, purpose),
        text: `Hello ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\n— Namma Coach`,
      });

      console.log(`✅ OTP email sent via SMTP! Message ID: ${info.messageId}`);
      return { id: info.messageId, fallback: false, provider: 'smtp' };
    } catch (err) {
      console.error('❌ SMTP email delivery failed:', err.message);
      if (fallbackMode) {
        console.warn(`🧪 OTP for ${to}: ${otp}`);
        return { id: 'dev-mode', fallback: true, message: 'SMTP delivery failed; using fallback mode.' };
      }
      throw new Error('Failed to send OTP email. Please check your Gmail SMTP credentials.');
    }
  }

  if (isResendConfigured()) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Namma Coach <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: [to],
        subject,
        html: buildHtml(name, otp, purpose),
        text: `Hello ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\n— Namma Coach`,
      });

      if (error) {
        console.error('❌ Resend error:', JSON.stringify(error));
        if (fallbackMode) {
          console.warn(`🧪 OTP for ${to}: ${otp}`);
          return { id: 'dev-mode', fallback: true, message: 'Resend delivery failed; using fallback mode.' };
        }
        throw new Error('Failed to send OTP email. Please check your Resend API key or sender address.');
      }

      console.log(`✅ OTP email sent via Resend! ID: ${data?.id}`);
      return { ...data, fallback: false, provider: 'resend' };
    } catch (err) {
      console.error('❌ OTP email delivery failed:', err.message);
      if (fallbackMode) {
        console.warn(`🧪 OTP for ${to}: ${otp}`);
        return { id: 'dev-mode', fallback: true, message: 'Resend delivery failed; using fallback mode.' };
      }
      throw new Error('Failed to send OTP email. Please check your Resend API key or sender address.');
    }
  }

  const message = '⚠️ No email provider is configured. OTP was generated but email delivery was skipped.';
  console.warn(message);
  if (fallbackMode) {
    console.warn(`🧪 OTP for ${to}: ${otp}`);
    return { id: 'dev-mode', fallback: true, message };
  }
  throw new Error('Failed to send OTP email. Please configure Gmail SMTP or Resend.');
}

module.exports = { sendOtpEmail };
