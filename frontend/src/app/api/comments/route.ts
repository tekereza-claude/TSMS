import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import Comment from "@/models/Comment"
import Parent from "@/models/Parent"
import Student from "@/models/Student"

// GET /api/comments
//  - PARENT       → their own submitted comments
//  - SCHOOL_ADMIN → all comments addressed to their school (with parent name)
export async function GET() {
  const { error, session } = await requireRole(UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  if (session!.user.role === UserRole.PARENT) {
    const parent = await Parent.findOne({ userId: session!.user.id }).select("_id").lean()
    if (!parent) return err("Parent record not found", 404)
    const comments = await Comment.find({ parentId: parent._id }).sort({ createdAt: -1 }).lean()
    return ok(comments)
  }

  // SCHOOL_ADMIN
  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this account", 400)

  const comments = await Comment.find({ schoolId })
    .populate({ path: "parentId", populate: { path: "userId", select: "name email" } })
    .sort({ createdAt: -1 })
    .lean()
  return ok(comments)
}

// POST /api/comments — a parent leaves a message for their child's school
export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.PARENT)
  if (error) return error
  await connectDB()

  const { message, regarding } = (await req.json()) as { message?: string; regarding?: string }
  if (!message || !message.trim()) return err("Message is required")

  const parent = await Parent.findOne({ userId: session!.user.id }).lean()
  if (!parent) return err("Parent record not found", 404)

  // Derive the school from the parent's first child.
  const child = parent.studentIds?.length
    ? await Student.findById(parent.studentIds[0]).select("schoolId").lean()
    : null
  if (!child?.schoolId) return err("No school could be determined for your account", 400)

  const comment = await Comment.create({
    parentId:  parent._id,
    schoolId:  child.schoolId,
    regarding: regarding?.trim() || undefined,
    message:   message.trim(),
  })

  return ok(comment, 201)
}
