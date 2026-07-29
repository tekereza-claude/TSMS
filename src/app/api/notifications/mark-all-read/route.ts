import { connectDB } from "@/lib/mongoose"
import Notification from "@/models/Notification"
import { requireRole, ok } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function PATCH() {
  const { error, session } = await requireRole(
    UserRole.TEACHER, UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN
  )
  if (error) return error
  await connectDB()

  await Notification.updateMany({ userId: session!.user.id, read: false }, { $set: { read: true } })
  return ok({ message: "All notifications marked as read" })
}
