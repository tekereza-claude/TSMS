import mongoose, { Schema, Document, Model } from "mongoose"
import { SenderRole } from "./Conversation"

// One message within a Conversation thread.
export interface IMessage extends Document {
  _id:            mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId
  senderRole:     SenderRole
  senderUserId:   mongoose.Types.ObjectId
  body:           string
  regarding?:     string
  createdAt:      Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderRole:     { type: String, enum: ["PARENT", "TEACHER", "SCHOOL_ADMIN"], required: true },
    senderUserId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    body:           { type: String, required: true, trim: true, maxlength: 2000 },
    regarding:      { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

MessageSchema.index({ conversationId: 1, createdAt: 1 })

const Message: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>("Message", MessageSchema)
export default Message
