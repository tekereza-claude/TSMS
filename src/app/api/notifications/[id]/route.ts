import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import Notification from "@/models/Notification"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(
    UserRole.TEACHER, UserRole.PARENT, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN
  )
  if (error) return error
  await connectDB()

  const { id } = await params
  const notification = await Notification.findOne({ _id: id, userId: session!.user.id })
  if (!notification) return err("Notification not found", 404)

  notification.read = true
  await notification.save()

  return ok(notification)
}
