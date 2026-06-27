import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISchoolAdmin extends Document {
  _id: mongoose.Types.ObjectId
  userId:   mongoose.Types.ObjectId
  schoolId: mongoose.Types.ObjectId
}

const SchoolAdminSchema = new Schema<ISchoolAdmin>({
  userId:   { type: Schema.Types.ObjectId, ref: "User",   required: true, unique: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true },
})

const SchoolAdmin: Model<ISchoolAdmin> =
  mongoose.models.SchoolAdmin ?? mongoose.model<ISchoolAdmin>("SchoolAdmin", SchoolAdminSchema)
export default SchoolAdmin
