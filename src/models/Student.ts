import mongoose, { Schema, Document, Model } from "mongoose"

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId
  firstName: string
  lastName:  string
  email?:    string
  schoolId:  mongoose.Types.ObjectId
  classId?:  mongoose.Types.ObjectId
  profilePicture?: string   // base64 data URL
}

const StudentSchema = new Schema<IStudent>(
  {
    firstName:      { type: String, required: true },
    lastName:       { type: String, required: true },
    email:          { type: String, sparse: true, unique: true, lowercase: true },
    schoolId:       { type: Schema.Types.ObjectId, ref: "School",  required: true },
    classId:        { type: Schema.Types.ObjectId, ref: "Class" },
    profilePicture: { type: String },
  },
  { timestamps: true }
)

const Student: Model<IStudent> =
  mongoose.models.Student ?? mongoose.model<IStudent>("Student", StudentSchema)
export default Student
