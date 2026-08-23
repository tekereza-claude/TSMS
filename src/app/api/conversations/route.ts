import { NextRequest } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { notifyUser } from "@/lib/notify"
import { resolveOwnSchoolId } from "@/lib/school"
import Conversation, { SenderRole } from "@/models/Conversation"
import Message from "@/models/Message"
import Parent from "@/models/Parent"
import Teacher from "@/models/Teacher"
import Student from "@/models/Student"
import SchoolAdmin from "@/models/SchoolAdmin"

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

// Creates/reuses the one conversation for (schoolId, withRole, withUserId), appends the
// message, and notifies whichever side didn't send it.
async function sendIntoConversation(params: {
  schoolId: string | mongoose.Types.ObjectId
  withRole: "PARENT" | "TEACHER"
  withUserId: string
  senderRole: SenderRole
  senderUserId: string
  message: string
  regarding?: string
}) {
  const { schoolId, withRole, withUserId, senderRole, senderUserId, message, regarding } = params

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
    senderUserId,
    body: message,
    regarding: regarding?.trim() || undefined,
  })

  if (senderRole === "SCHOOL_ADMIN") {
    await notifyUser(withUserId, { title: "New message from your school", body: message })
  } else {
    const admin = await SchoolAdmin.findOne({ schoolId }).select("userId").lean()
    if (admin) {
      const label = senderRole === "TEACHER" ? "a teacher" : "a parent"
      await notifyUser(admin.userId, { title: `New message from ${label}`, body: message })
    }
  }

  return { conversation, message: created }
}

// POST /api/conversations — start/continue a conversation.
//  - PARENT / TEACHER senders always message their one school admin.
//  - SCHOOL_ADMIN senders pick a toRole and one or more toIds (Teacher/Parent doc ids) —
//    the same message is fanned out into each recipient's own 1:1 thread.
export async function POST(req: NextRequest) {
  const { error, session } = await requireRole(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const role = session!.user.role
  const body = (await req.json()) as {
    message?: string
    regarding?: string
    toRole?: "PARENT" | "TEACHER"
    toIds?: string[]
  }
  const message = body.message?.trim()
  if (!message) return err("Message is required")

  if (role !== UserRole.SCHOOL_ADMIN) {
    const schoolId = await resolveOwnSchoolId(role, session!.user.id)
    if (!schoolId) return err("No school could be determined for your account", 400)
    const withRole = role === UserRole.TEACHER ? "TEACHER" : "PARENT"

    const result = await sendIntoConversation({
      schoolId,
      withRole,
      withUserId: session!.user.id,
      senderRole: withRole,
      senderUserId: session!.user.id,
      message,
      regarding: body.regarding,
    })
    return ok(result, 201)
  }

  // SCHOOL_ADMIN
  const schoolId = session!.user.schoolId
  if (!schoolId) return err("No school associated with this account", 400)
  if (body.toRole !== "PARENT" && body.toRole !== "TEACHER") return err("toRole must be PARENT or TEACHER")

  const toIds = [...new Set((body.toIds ?? []).filter(Boolean))]
  if (toIds.length === 0) return err("At least one recipient is required")

  const results: { toId: string; conversation?: unknown; error?: string }[] = []

  for (const toId of toIds) {
    let withUserId: string
    if (body.toRole === "TEACHER") {
      const teacher = await Teacher.findById(toId).select("userId schoolId").lean()
      if (!teacher || String(teacher.schoolId) !== String(schoolId)) {
        results.push({ toId, error: "Teacher not found" })
        continue
      }
      withUserId = String(teacher.userId)
    } else {
      const parent = await Parent.findById(toId).select("userId studentIds").lean()
      const belongsToSchool = parent?.studentIds?.length
        ? await Student.exists({ _id: { $in: parent.studentIds }, schoolId })
        : false
      if (!parent || !belongsToSchool) {
        results.push({ toId, error: "Parent not found" })
        continue
      }
      withUserId = String(parent.userId)
    }

    const { conversation } = await sendIntoConversation({
      schoolId,
      withRole: body.toRole,
      withUserId,
      senderRole: "SCHOOL_ADMIN",
      senderUserId: session!.user.id,
      message,
      regarding: body.regarding,
    })
    results.push({ toId, conversation })
  }

  const sent = results.filter((r) => r.conversation)
  const failed = results.filter((r) => r.error)
  return ok({ sentCount: sent.length, conversations: sent.map((r) => r.conversation), failed }, 201)
}
