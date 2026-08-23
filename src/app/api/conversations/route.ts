import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { notifyUser } from "@/lib/notify"
import Conversation from "@/models/Conversation"
import Message from "@/models/Message"
import Parent from "@/models/Parent"
import Teacher from "@/models/Teacher"
import Student from "@/models/Student"
import SchoolAdmin from "@/models/SchoolAdmin"

// Resolves the school a PARENT or TEACHER belongs to, for their one conversation with the admin.
async function resolveOwnSchoolId(role: UserRole, userId: string) {
  if (role === UserRole.TEACHER) {
    const teacher = await Teacher.findOne({ userId }).select("schoolId").lean()
    return teacher?.schoolId ?? null
  }
  // PARENT — derive from their first linked child, matching the old /api/comments behavior
  const parent = await Parent.findOne({ userId }).select("studentIds").lean()
  if (!parent?.studentIds?.length) return null
  const child = await Student.findById(parent.studentIds[0]).select("schoolId").lean()
  return child?.schoolId ?? null
}

// GET /api/conversations
//  - PARENT / TEACHER → their single conversation with the school admin, messages embedded
//  - SCHOOL_ADMIN      → list of conversation summaries for their school
export async function GET() {
  const { error, session } = await requireRole(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const role = session!.user.role

  if (role === UserRole.SCHOOL_ADMIN) {
    const schoolId = session!.user.schoolId
    if (!schoolId) return err("No school associated with this account", 400)
    const conversations = await Conversation.find({ schoolId })
      .populate("withUserId", "name email")
      .sort({ lastMessageAt: -1 })
      .lean()
    return ok(conversations)
  }

  const schoolId = await resolveOwnSchoolId(role, session!.user.id)
  if (!schoolId) return ok(null)

  const withRole = role === UserRole.TEACHER ? "TEACHER" : "PARENT"
  const conversation = await Conversation.findOne({ schoolId, withRole, withUserId: session!.user.id }).lean()
  if (!conversation) return ok(null)

  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean()
  return ok({ ...conversation, messages })
}

// POST /api/conversations — start a conversation (or add to it if it already exists)
export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const role = session!.user.role
  const body = (await req.json()) as { message?: string; regarding?: string; toRole?: "PARENT" | "TEACHER"; toId?: string }
  const message = body.message?.trim()
  if (!message) return err("Message is required")

  let schoolId: string | mongoose.Types.ObjectId | undefined | null
  let withRole: "PARENT" | "TEACHER"
  let withUserId: string

  if (role === UserRole.SCHOOL_ADMIN) {
    schoolId = session!.user.schoolId
    if (!schoolId) return err("No school associated with this account", 400)
    if (body.toRole !== "PARENT" && body.toRole !== "TEACHER") return err("toRole must be PARENT or TEACHER")
    if (!body.toId) return err("toId is required")

    if (body.toRole === "TEACHER") {
      const teacher = await Teacher.findById(body.toId).select("userId schoolId").lean()
      if (!teacher || String(teacher.schoolId) !== String(schoolId)) return err("Teacher not found", 404)
      withRole = "TEACHER"
      withUserId = String(teacher.userId)
    } else {
      const parent = await Parent.findById(body.toId).select("userId studentIds").lean()
      if (!parent) return err("Parent not found", 404)
      const belongsToSchool = parent.studentIds?.length
        ? await Student.exists({ _id: { $in: parent.studentIds }, schoolId })
        : false
      if (!belongsToSchool) return err("Parent not found", 404)
      withRole = "PARENT"
      withUserId = String(parent.userId)
    }
  } else {
    schoolId = await resolveOwnSchoolId(role, session!.user.id)
    if (!schoolId) return err("No school could be determined for your account", 400)
    withRole = role === UserRole.TEACHER ? "TEACHER" : "PARENT"
    withUserId = session!.user.id
  }

  const senderRole = role === UserRole.SCHOOL_ADMIN ? "SCHOOL_ADMIN" : withRole

  const conversation = await Conversation.findOneAndUpdate(
    { schoolId, withRole, withUserId },
    {
      $setOnInsert: { schoolId, withRole, withUserId },
      $set: { lastMessageAt: new Date(), lastMessagePreview: message.slice(0, 2000), lastMessageSenderRole: senderRole },
    },
    { upsert: true, returnDocument: "after" }
  )

  const created = await Message.create({
    conversationId: conversation._id,
    senderRole,
    senderUserId: session!.user.id,
    body: message,
    regarding: body.regarding?.trim() || undefined,
  })

  // Notify the other participant
  if (senderRole === "SCHOOL_ADMIN") {
    await notifyUser(withUserId, { title: "New message from your school", body: message })
  } else {
    const admin = await SchoolAdmin.findOne({ schoolId }).select("userId").lean()
    if (admin) {
      const label = senderRole === "TEACHER" ? "a teacher" : "a parent"
      await notifyUser(admin.userId, { title: `New message from ${label}`, body: message })
    }
  }

  return ok({ conversation, message: created }, 201)
}
