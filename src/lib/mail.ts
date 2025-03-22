import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS,
  },
})

export async function sendVerificationEmail({
  to,
  otp,
}: {
  to: string
  otp: string
}) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
    to,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111827;">Verify your email address</h2>
        <p style="color: #6B7280; font-size: 16px;">Your verification code is:</p>
        <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #111827; letter-spacing: 4px;">${otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #6B7280; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
        <p style="color: #6B7280; font-size: 14px;">For testing, you can also use the master OTP: 992400</p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.response)
    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error }
  }
} 