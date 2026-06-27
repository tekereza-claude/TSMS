import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId
  schoolId:  mongoose.Types.ObjectId
  plan:      "FREE" | "PAID"
  status:    "ACTIVE" | "EXPIRED" | "CANCELLED"
  startDate: Date
  endDate?:  Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    schoolId:  { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true },
    plan:      { type: String, enum: ["FREE", "PAID"], default: "FREE" },
    status:    { type: String, enum: ["ACTIVE", "EXPIRED", "CANCELLED"], default: "ACTIVE" },
    startDate: { type: Date, default: Date.now },
    endDate:   { type: Date },
  },
  { timestamps: true }
)

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ?? mongoose.model<ISubscription>("Subscription", SubscriptionSchema)
export default Subscription
