import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import User from "@/models/User"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

// GET/PATCH /api/users/me — lets any signed-in user read or update their own
// profile picture (used by the small "my profile" avatar control in each portal).
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

  const { profilePicture } = await req.json()
  const user = await User.findByIdAndUpdate(
    session!.user.id,
    { profilePicture: profilePicture || null },
    { new: true }
  ).select("name email role profilePicture").lean()
  if (!user) return err("User not found", 404)
  return ok(user)
}
