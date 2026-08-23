/**
 * One-time migration: parent→school Comment docs into the new
 * Conversation + Message shape (see src/models/Conversation.ts, src/models/Message.ts).
 * Run once: npm run db:migrate-comments
 *
 * Safe to re-run: skips comments whose messages already exist (matched by
 * conversation + createdAt + senderRole, since Comment docs have no other stable id).
 */

import mongoose from "mongoose"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import Comment from "../models/Comment"
import Conversation from "../models/Conversation"
import Message from "../models/Message"
import Parent from "../models/Parent"
import SchoolAdmin from "../models/SchoolAdmin"

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI not set in .env")

  await mongoose.connect(uri)
  console.log("Connected to MongoDB")

  const comments = await Comment.find({}).sort({ createdAt: 1 }).lean()
  console.log(`Found ${comments.length} comment(s) to migrate`)

  const adminUserIdBySchool = new Map<string, mongoose.Types.ObjectId | null>()
  let migrated = 0
  let skipped = 0

  for (const comment of comments) {
    const parent = await Parent.findById(comment.parentId).select("userId").lean()
    if (!parent) {
      console.warn(`  ! skipping comment ${comment._id}: parent ${comment.parentId} not found`)
      skipped++
      continue
    }

    const conversation = await Conversation.findOneAndUpdate(
      { schoolId: comment.schoolId, withRole: "PARENT", withUserId: parent.userId },
      {
        $setOnInsert: {
          schoolId: comment.schoolId,
          withRole: "PARENT",
          withUserId: parent.userId,
          lastMessageAt: comment.createdAt,
          lastMessagePreview: comment.message.slice(0, 2000),
          lastMessageSenderRole: "PARENT",
        },
      },
      { upsert: true, returnDocument: "after" }
    )

    const alreadyMigrated = await Message.exists({
      conversationId: conversation._id,
      senderRole: "PARENT",
      createdAt: comment.createdAt,
      body: comment.message,
    })
    if (alreadyMigrated) {
      skipped++
      continue
    }

    await Message.create({
      conversationId: conversation._id,
      senderRole: "PARENT",
      senderUserId: parent.userId,
      body: comment.message,
      regarding: comment.regarding,
      createdAt: comment.createdAt,
    })

    let lastAt = comment.createdAt
    let lastPreview = comment.message
    let lastSenderRole: "PARENT" | "SCHOOL_ADMIN" = "PARENT"

    if (comment.reply) {
      const schoolKey = String(comment.schoolId)
      if (!adminUserIdBySchool.has(schoolKey)) {
        const admin = await SchoolAdmin.findOne({ schoolId: comment.schoolId }).select("userId").lean()
        adminUserIdBySchool.set(schoolKey, admin?.userId ?? null)
      }
      const adminUserId = adminUserIdBySchool.get(schoolKey)

      if (adminUserId) {
        const repliedAt = comment.repliedAt ?? comment.updatedAt ?? comment.createdAt
        await Message.create({
          conversationId: conversation._id,
          senderRole: "SCHOOL_ADMIN",
          senderUserId: adminUserId,
          body: comment.reply,
          createdAt: repliedAt,
        })
        lastAt = repliedAt
        lastPreview = comment.reply
        lastSenderRole = "SCHOOL_ADMIN"
      } else {
        console.warn(`  ! comment ${comment._id} has a reply but school ${comment.schoolId} has no admin — reply skipped`)
      }
    }

    const setFields: Record<string, unknown> = {}
    if (lastAt >= conversation.lastMessageAt) {
      setFields.lastMessagePreview = lastPreview.slice(0, 2000)
      setFields.lastMessageSenderRole = lastSenderRole
    }
    if (comment.status === "READ") setFields.adminLastReadAt = lastAt

    await Conversation.updateOne(
      { _id: conversation._id },
      {
        $max: { lastMessageAt: lastAt },
        ...(Object.keys(setFields).length ? { $set: setFields } : {}),
      }
    )

    migrated++
  }

  console.log(`\n✅ Migration complete: ${migrated} migrated, ${skipped} skipped (already migrated or unresolvable)`)
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
