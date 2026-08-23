import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import Conversation from "@/models/Conversation"

// PATCH /api/conversations/[id]/read — mark the thread read by the caller
export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { id } = await params
  const conversation = await Conversation.findById(id).lean()
  if (!conversation) return err("Conversation not found", 404)

  const isAdmin = session!.user.role === UserRole.SCHOOL_ADMIN
  const isOwner = String(conversation.withUserId) === String(session!.user.id)

  if (isAdmin) {
    if (String(conversation.schoolId) !== String(session!.user.schoolId)) return err("Forbidden", 403)
    await Conversation.updateOne({ _id: id }, { $set: { adminLastReadAt: new Date() } })
  } else if (isOwner) {
    await Conversation.updateOne({ _id: id }, { $set: { otherLastReadAt: new Date() } })
  } else {
    return err("Forbidden", 403)
  }

  return ok({ success: true })
}
