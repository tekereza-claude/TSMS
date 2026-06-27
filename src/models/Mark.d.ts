import mongoose, { Document, Model } from "mongoose";
export declare const TEST_MAX = 50;
export declare const EXAM_MAX = 50;
export interface IMark extends Document {
    _id: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    subjectId: mongoose.Types.ObjectId;
    teacherId: mongoose.Types.ObjectId;
    test: number;
    exam: number;
    score: number;
    maxScore: number;
    term: string;
    year: string;
}
declare const Mark: Model<IMark>;
export default Mark;
//# sourceMappingURL=Mark.d.ts.map