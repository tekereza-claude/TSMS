import mongoose, { Schema, Document, Model } from "mongoose"

// A subscription payment received from a school, recorded manually by a super
// admin (there is no payment gateway). Drives the super-admin revenue analytics.
export interface IPayment extends Document {
  _id:        mongoose.Types.ObjectId
  schoolId:   mongoose.Types.ObjectId
  amount:     number
  currency:   string
  date:       Date
  method?:    string          // e.g. "Bank Transfer", "Cash", "Mobile Money"
  note?:      string
  recordedBy: mongoose.Types.ObjectId   // the super-admin User who entered it
  createdAt:  Date
  updatedAt:  Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    schoolId:   { type: Schema.Types.ObjectId, ref: "School", required: true },
    amount:     { type: Number, required: true, min: 0 },
    currency:   { type: String, default: "USD", trim: true },
    date:       { type: Date, required: true, default: Date.now },
    method:     { type: String, trim: true, maxlength: 60 },
    note:       { type: String, trim: true, maxlength: 500 },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
)

PaymentSchema.index({ date: -1 })
PaymentSchema.index({ schoolId: 1, date: -1 })

const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema)
export default Payment
