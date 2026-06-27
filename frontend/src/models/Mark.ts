import mongoose, { Schema, Document, Model } from "mongoose"

// Each mark is split into a continuous-assessment (test) and a final-exam
// component, each out of 50. `score` is their sum (out of `maxScore`, 100).
export const TEST_MAX = 50
export const EXAM_MAX = 50

export interface IMark extends Document {
  _id: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  subjectId: mongoose.Types.ObjectId
  teacherId: mongoose.Types.ObjectId
  test:      number
  exam:      number
  score:     number
  maxScore:  number
  term:      string
  year:      string
}

const MarkSchema = new Schema<IMark>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    test:      { type: Number, required: true, min: 0, max: TEST_MAX, default: 0 },
    exam:      { type: Number, required: true, min: 0, max: EXAM_MAX, default: 0 },
    score:     { type: Number, required: true, min: 0 },
    maxScore:  { type: Number, required: true, min: 1 },
    term:      { type: String, required: true },
    year:      { type: String, required: true },
  },
  { timestamps: true }
)

// Prevent duplicate mark for same student+subject+term+year
MarkSchema.index({ studentId: 1, subjectId: 1, term: 1, year: 1 }, { unique: true })

const Mark: Model<IMark> =
  mongoose.models.Mark ?? mongoose.model<IMark>("Mark", MarkSchema)
export default Mark
