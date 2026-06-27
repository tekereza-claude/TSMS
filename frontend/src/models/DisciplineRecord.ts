import mongoose, { Schema, Document, Model } from "mongoose"

// A merit/demerit recorded against a student by a teacher.
// `points` is stored signed: positive for a Merit, negative for a Demerit.
export interface IDisciplineRecord extends Document {
  _id:       mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  schoolId:  mongoose.Types.ObjectId
  teacherId: mongoose.Types.ObjectId
  date:      Date
  type:      "Merit" | "Demerit"
  category:  string
  points:    number
  note?:     string
  actionTaken?: string
  createdAt: Date
  updatedAt: Date
}

const DisciplineRecordSchema = new Schema<IDisciplineRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    schoolId:  { type: Schema.Types.ObjectId, ref: "School",  required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    date:      { type: Date, required: true, default: Date.now },
    type:      { type: String, enum: ["Merit", "Demerit"], required: true },
    category:  { type: String, required: true, trim: true, maxlength: 120 },
    points:    { type: Number, required: true },
    note:      { type: String, trim: true, maxlength: 1000 },
    actionTaken: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
)

DisciplineRecordSchema.index({ studentId: 1, date: -1 })
DisciplineRecordSchema.index({ schoolId: 1, date: -1 })

const DisciplineRecord: Model<IDisciplineRecord> =
  mongoose.models.DisciplineRecord ??
  mongoose.model<IDisciplineRecord>("DisciplineRecord", DisciplineRecordSchema)
export default DisciplineRecord
