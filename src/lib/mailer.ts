import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"TSMS Platform" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  })
}

export function credentialsEmail({
  schoolName,
  adminName,
  email,
  password,
  loginUrl,
}: {
  schoolName: string
  adminName: string
  email: string
  password: string
  loginUrl: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
      <h2 style="color:#16a34a;margin-bottom:4px;">Welcome to TSMS 🎉</h2>
      <p style="color:#6b7280;margin-top:0;">Your school has been approved on the Teleparenting School Management System.</p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="margin:0 0 4px;"><strong>School:</strong> ${schoolName}</p>
      <p style="margin:0 0 20px;"><strong>Admin Name:</strong> ${adminName}</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#15803d;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Your Login Credentials</p>
        <p style="margin:0 0 4px;font-size:15px;"><strong>Email:</strong> <code style="background:#dcfce7;padding:2px 6px;border-radius:4px;">${email}</code></p>
        <p style="margin:0;font-size:15px;"><strong>Password:</strong> <code style="background:#dcfce7;padding:2px 6px;border-radius:4px;">${password}</code></p>
      </div>

      <a href="${loginUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">
        Sign In to Your Portal
      </a>

      <p style="margin-top:24px;font-size:13px;color:#9ca3af;">
        For security, please change your password after your first login.<br/>
        If you did not expect this email, please contact support.
      </p>
    </div>
  `
}
