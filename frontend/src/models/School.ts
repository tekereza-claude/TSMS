import mongoose, { Schema, Document, Model } from "mongoose"

export type SchoolStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"

export interface ISchool extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  address?: string
  phone?: string
  status: SchoolStatus
  createdAt: Date
  updatedAt: Date
}

const SchoolSchema = new Schema<ISchool>(
  {
    name:    { type: String, required: true },
    email:   { type: String, required: true, unique: true, lowercase: true },
    address: { type: String },
    phone:   { type: String },
    status:  { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"], default: "PENDING" },
  },
  { timestamps: true }
)

const School: Model<ISchool> = mongoose.models.School ?? mongoose.model<ISchool>("School", SchoolSchema)
export default School
