const nodemailer = require("nodemailer");

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = buildTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

function resetPasswordEmailTemplate(name, link) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0B1120;">Reset your password</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#F5A623;color:#0B1120;font-weight:600;border-radius:8px;text-decoration:none;">Reset password</a>
      <p style="color:#666;font-size:13px;margin-top:24px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}

module.exports = { sendEmail, resetPasswordEmailTemplate };
