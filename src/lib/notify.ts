import mongoose from "mongoose"
import Notification from "@/models/Notification"

export async function notifyUser(userId: string | mongoose.Types.ObjectId, { title, body }: { title: string; body: string }) {
  try {
    await Notification.create({ userId, title, body })
  } catch (err) {
    console.error("[notify] Failed to create notification:", err)
  }
}
