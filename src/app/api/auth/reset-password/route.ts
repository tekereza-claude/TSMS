import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import { ok, err } from "@/lib/api-helpers"
import { hashToken } from "@/lib/resetToken"
import { hashPassword } from "@/lib/password"

export async function POST(req: NextRequest) {
  await connectDB()

  const { email, token, password } = await req.json()
  if (!email || !token || !password) return err("Email, token and new password are required")
  if (password.length < 8) return err("Password must be at least 8 characters")

  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+resetPasswordTokenHash +resetPasswordExpires")

  if (!user) return err("This reset link is invalid or has expired", 400)

  const valid =
    user.resetPasswordTokenHash === hashToken(token) &&
    user.resetPasswordExpires !== undefined &&
    user.resetPasswordExpires.getTime() > Date.now()

  if (!valid) return err("This reset link is invalid or has expired", 400)

  user.password = await hashPassword(password)
  user.resetPasswordTokenHash = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  return ok({ message: "Your password has been reset. You can now sign in." })
}
