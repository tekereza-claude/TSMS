import { NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import { requireRole, ok, err } from "@/lib/api-helpers"
import { UserRole } from "@/types"
import { notifyUser } from "@/lib/notify"
import Conversation from "@/models/Conversation"
import Message from "@/models/Message"
import SchoolAdmin from "@/models/SchoolAdmin"

async function loadConversationForParticipant(id: string, role: UserRole, userId: string, schoolId?: string) {
  const conversation = await Conversation.findById(id).lean()
  if (!conversation) return null
  if (role === UserRole.SCHOOL_ADMIN) {
    return String(conversation.schoolId) === String(schoolId) ? conversation : null
  }
  return String(conversation.withUserId) === String(userId) ? conversation : null
}

// GET /api/conversations/[id]/messages — full history for one conversation
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { id } = await params
  const conversation = await loadConversationForParticipant(id, session!.user.role, session!.user.id, session!.user.schoolId)
  if (!conversation) return err("Conversation not found", 404)

  const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 }).lean()
  return ok(messages)
}

// POST /api/conversations/[id]/messages — reply within an existing thread
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireRole(UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  if (error) return error
  await connectDB()

  const { id } = await params
  const conversation = await loadConversationForParticipant(id, session!.user.role, session!.user.id, session!.user.schoolId)
  if (!conversation) return err("Conversation not found", 404)

  const { message, regarding } = (await req.json()) as { message?: string; regarding?: string }
  const trimmed = message?.trim()
  if (!trimmed) return err("Message is required")

  const senderRole = session!.user.role === UserRole.SCHOOL_ADMIN ? "SCHOOL_ADMIN" : conversation.withRole

  const created = await Message.create({
    conversationId: conversation._id,
    senderRole,
    senderUserId: session!.user.id,
    body: trimmed,
    regarding: regarding?.trim() || undefined,
  })

  await Conversation.updateOne(
    { _id: conversation._id },
    { $set: { lastMessageAt: created.createdAt, lastMessagePreview: trimmed.slice(0, 2000), lastMessageSenderRole: senderRole } }
  )

  if (senderRole === "SCHOOL_ADMIN") {
    await notifyUser(conversation.withUserId, { title: "New message from your school", body: trimmed })
  } else {
    const admin = await SchoolAdmin.findOne({ schoolId: conversation.schoolId }).select("userId").lean()
    if (admin) {
      const label = senderRole === "TEACHER" ? "a teacher" : "a parent"
      await notifyUser(admin.userId, { title: `New message from ${label}`, body: trimmed })
    }
  }

  return ok(created, 201)
}
