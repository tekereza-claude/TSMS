import mongoose, { Schema, Document, Model } from "mongoose"

// A persistent thread between a school's admin and one parent or teacher at that school.
export type ConversationRole = "PARENT" | "TEACHER"
export type SenderRole = ConversationRole | "SCHOOL_ADMIN"

export interface IConversation extends Document {
  _id:                    mongoose.Types.ObjectId
  schoolId:               mongoose.Types.ObjectId
  withRole:               ConversationRole
  withUserId:             mongoose.Types.ObjectId
  lastMessageAt:          Date
  lastMessagePreview:     string
  lastMessageSenderRole:  SenderRole
  adminLastReadAt?:       Date
  otherLastReadAt?:       Date
  createdAt:              Date
  updatedAt:              Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    schoolId:              { type: Schema.Types.ObjectId, ref: "School", required: true },
    withRole:              { type: String, enum: ["PARENT", "TEACHER"], required: true },
    withUserId:            { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt:         { type: Date, required: true, default: Date.now },
    lastMessagePreview:    { type: String, required: true, trim: true, maxlength: 2000 },
    lastMessageSenderRole: { type: String, enum: ["PARENT", "TEACHER", "SCHOOL_ADMIN"], required: true },
    adminLastReadAt:       { type: Date },
    otherLastReadAt:       { type: Date },
  },
  { timestamps: true }
)

ConversationSchema.index({ schoolId: 1, withRole: 1, withUserId: 1 }, { unique: true })
ConversationSchema.index({ schoolId: 1, lastMessageAt: -1 })

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ?? mongoose.model<IConversation>("Conversation", ConversationSchema)
export default Conversation
