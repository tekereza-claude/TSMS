import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import Comment from "@/models/Comment"
import Parent from "@/models/Parent"
import { notifyUser } from "@/lib/notify"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { id } = await params
  const comment = await Comment.findById(id).lean()
  if (!comment) return err("Comment not found", 404)

  if (String(comment.schoolId) !== String(session!.user.schoolId))
    return err("Forbidden", 403)

  const body = await req.json().catch(() => ({}))
  const update: Record<string, unknown> = { status: "READ" }

  const isReply = Boolean(body.reply && typeof body.reply === "string" && body.reply.trim())
  if (isReply) {
    update.reply = body.reply.trim()
    update.repliedAt = new Date()
  }

  const updated = await Comment.findByIdAndUpdate(id, update, { new: true }).lean()

  if (isReply) {
    const parent = await Parent.findById(comment.parentId).select("userId").lean()
    if (parent) {
      await notifyUser(parent.userId, {
        title: "The school replied to your message",
        body: body.reply.trim(),
      })
    }
  }

  return ok(updated)
}
