import mongoose, { Document, Model } from "mongoose";
export interface IDisciplineRecord extends Document {
    _id: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    schoolId: mongoose.Types.ObjectId;
    teacherId: mongoose.Types.ObjectId;
    date: Date;
    type: "Merit" | "Demerit";
    category: string;
    points: number;
    note?: string;
    actionTaken?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const DisciplineRecord: Model<IDisciplineRecord>;
export default DisciplineRecord;
//# sourceMappingURL=DisciplineRecord.d.ts.map