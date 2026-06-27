import mongoose, { Schema, Document, Model } from "mongoose"

// A single billable line on a student's fee account.
interface IFeeItem {
  item:   string
  amount: number
  term:   string
}

// One fee account per student, managed by the school admin.
export interface IFee extends Document {
  _id:       mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  schoolId:  mongoose.Types.ObjectId
  currency:  string
  dueDate?:  string
  items:     IFeeItem[]
  paid:      number
  createdAt: Date
  updatedAt: Date
}

const FeeItemSchema = new Schema<IFeeItem>(
  {
    item:   { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    term:   { type: String, required: true, trim: true },
  },
  { _id: false }
)

const FeeSchema = new Schema<IFee>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true },
    schoolId:  { type: Schema.Types.ObjectId, ref: "School",  required: true },
    currency:  { type: String, default: "RWF", trim: true },
    dueDate:   { type: String },
    items:     { type: [FeeItemSchema], default: [] },
    paid:      { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

FeeSchema.index({ schoolId: 1 })

const Fee: Model<IFee> =
  mongoose.models.Fee ?? mongoose.model<IFee>("Fee", FeeSchema)
export default Fee
