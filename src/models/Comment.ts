import mongoose, { Schema, Document, Model } from "mongoose"

// A message left by a parent for the school (e.g. feedback, a concern, a query).
export interface IComment extends Document {
  _id:        mongoose.Types.ObjectId
  parentId:   mongoose.Types.ObjectId
  schoolId:   mongoose.Types.ObjectId
  regarding?: string
  message:    string
  status:     "SENT" | "READ"
  reply?:     string        // school admin's reply
  repliedAt?: Date
  createdAt:  Date
  updatedAt:  Date
}

const CommentSchema = new Schema<IComment>(
  {
    parentId:  { type: Schema.Types.ObjectId, ref: "Parent", required: true },
    schoolId:  { type: Schema.Types.ObjectId, ref: "School", required: true },
    regarding: { type: String },
    message:   { type: String, required: true, trim: true, maxlength: 2000 },
    status:    { type: String, enum: ["SENT", "READ"], default: "SENT" },
    reply:     { type: String, trim: true, maxlength: 2000 },
    repliedAt: { type: Date },
  },
  { timestamps: true }
)

CommentSchema.index({ schoolId: 1, createdAt: -1 })
CommentSchema.index({ parentId: 1, createdAt: -1 })

const Comment: Model<IComment> =
  mongoose.models.Comment ?? mongoose.model<IComment>("Comment", CommentSchema)
export default Comment
