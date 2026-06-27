import mongoose, { Schema, Document, Model } from "mongoose"

export interface IClass extends Document {
  _id: mongoose.Types.ObjectId
  name:      string
  grade:     string
  schoolId:  mongoose.Types.ObjectId
  teacherId?: mongoose.Types.ObjectId
}

const ClassSchema = new Schema<IClass>(
  {
    name:      { type: String, required: true },
    grade:     { type: String, required: true },
    schoolId:  { type: Schema.Types.ObjectId, ref: "School",  required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
  },
  { timestamps: true }
)

const Class: Model<IClass> =
  mongoose.models.Class ?? mongoose.model<IClass>("Class", ClassSchema)
export default Class
