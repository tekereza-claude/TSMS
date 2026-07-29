import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import { ok, err } from "@/lib/api-helpers"
import { generateResetToken } from "@/lib/resetToken"
import { sendMail, passwordResetEmail } from "@/lib/mailer"

const GENERIC_MESSAGE = "If an account exists for that email, a password reset link has been sent."

export async function POST(req: NextRequest) {
  await connectDB()

  const { email } = await req.json()
  if (!email) return err("Email is required")

  const user = await User.findOne({ email: email.toLowerCase() }).select("_id name email").lean()

  if (user) {
    const { token, tokenHash, expires } = generateResetToken()
    await User.findByIdAndUpdate(user._id, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: expires,
    })

    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`

    try {
      await sendMail(
        user.email,
        "Reset your TSMS password",
        passwordResetEmail({ name: user.name, resetUrl })
      )
    } catch (mailErr) {
      console.error("[mailer] Failed to send password reset email:", mailErr)
    }
  }

  // Always the same response — don't reveal whether the email exists.
  return ok({ message: GENERIC_MESSAGE })
}
