import { connectDB } from "@/lib/mongoose"
import Notification from "@/models/Notification"
import { requireRole, ok } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function GET() {
  const { error, session } = await requireRole(
    UserRole.TEACHER, UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN
  )
  if (error) return error
  await connectDB()

  const notifications = await Notification.find({ userId: session!.user.id })
    .sort({ createdAt: -1 })
    .lean()
  const unreadCount = notifications.filter((n) => !n.read).length

  return ok({ notifications, unreadCount })
}
