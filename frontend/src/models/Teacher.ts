import mongoose, { Schema, Document, Model } from "mongoose"

export interface ITeacher extends Document {
  _id: mongoose.Types.ObjectId
  userId:   mongoose.Types.ObjectId
  schoolId: mongoose.Types.ObjectId
}

const TeacherSchema = new Schema<ITeacher>({
  userId:   { type: Schema.Types.ObjectId, ref: "User",   required: true, unique: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
})

const Teacher: Model<ITeacher> =
  mongoose.models.Teacher ?? mongoose.model<ITeacher>("Teacher", TeacherSchema)
export default Teacher
