import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { hashPassword, verifyPassword } from "@/lib/password"

// GET/PATCH /api/users/me — lets any signed-in user read or update their own
// profile (picture, email, password) — used by the "my profile" control in each portal.
export async function GET() {
  const { error, session } = await requireRole(
    UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT
  )
  if (error) return error
  await connectDB()

  const user = await User.findById(session!.user.id).select("name email role profilePicture").lean()
  if (!user) return err("User not found", 404)
  return ok(user)
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireRole(
    UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT
  )
  if (error) return error
  await connectDB()

  const body = (await req.json()) as {
    profilePicture?: string
    email?: string
    currentPassword?: string
    newPassword?: string
  }

  const update: Record<string, unknown> = {}
  if ("profilePicture" in body) update.profilePicture = body.profilePicture || null

  const wantsEmailChange = typeof body.email === "string" && body.email.trim().length > 0
  const wantsPasswordChange = typeof body.newPassword === "string" && body.newPassword.length > 0

  if (wantsEmailChange || wantsPasswordChange) {
    if (!body.currentPassword) return err("Enter your current password to confirm this change")

    const user = await User.findById(session!.user.id).select("email password")
    if (!user) return err("User not found", 404)

    const valid = await verifyPassword(user.password, body.currentPassword)
    if (!valid) return err("Current password is incorrect", 400)

    if (wantsEmailChange) {
      const newEmail = body.email!.trim().toLowerCase()
      if (newEmail !== user.email) {
        const taken = await User.exists({ email: newEmail, _id: { $ne: user._id } })
        if (taken) return err("That email is already in use", 400)
        update.email = newEmail
      }
    }

    if (wantsPasswordChange) {
      if (body.newPassword!.length < 8) return err("New password must be at least 8 characters")
      update.password = await hashPassword(body.newPassword!)
    }
  }

  const updated = await User.findByIdAndUpdate(session!.user.id, update, { new: true })
    .select("name email role profilePicture")
    .lean()
  if (!updated) return err("User not found", 404)
  return ok(updated)
}
