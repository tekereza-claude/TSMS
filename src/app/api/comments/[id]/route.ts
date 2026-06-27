import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import Comment from "@/models/Comment"

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

  if (body.reply && typeof body.reply === "string" && body.reply.trim()) {
    update.reply = body.reply.trim()
    update.repliedAt = new Date()
  }

  const updated = await Comment.findByIdAndUpdate(id, update, { new: true }).lean()
  return ok(updated)
}
