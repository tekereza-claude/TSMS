import mongoose, { Schema, Document, Model } from "mongoose"

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title: string
  body: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title:  { type: String, required: true },
    body:   { type: String, required: true },
    read:   { type: Boolean, default: false },
  },
  { timestamps: true }
)

NotificationSchema.index({ userId: 1, createdAt: -1 })

const Notification: Model<INotification> =
  mongoose.models.Notification ?? mongoose.model<INotification>("Notification", NotificationSchema)
export default Notification
