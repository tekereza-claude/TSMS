import mongoose, { Schema, Document, Model } from "mongoose"

export interface IParent extends Document {
  _id: mongoose.Types.ObjectId
  userId:     mongoose.Types.ObjectId
  studentIds: mongoose.Types.ObjectId[]
}

const ParentSchema = new Schema<IParent>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: "Student" }],
  },
  { timestamps: true }
)

const Parent: Model<IParent> =
  mongoose.models.Parent ?? mongoose.model<IParent>("Parent", ParentSchema)
export default Parent
