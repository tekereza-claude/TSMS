import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId
  name:      string
  code:      string
  schoolId:  mongoose.Types.ObjectId
  teacherId?: mongoose.Types.ObjectId
}

const SubjectSchema = new Schema<ISubject>(
  {
    name:      { type: String, required: true },
    code:      { type: String, required: true, unique: true, uppercase: true },
    schoolId:  { type: Schema.Types.ObjectId, ref: "School", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
  },
  { timestamps: true }
)

const Subject: Model<ISubject> =
  mongoose.models.Subject ?? mongoose.model<ISubject>("Subject", SubjectSchema)
export default Subject
