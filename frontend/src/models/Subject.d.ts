import mongoose, { Document, Model } from "mongoose";
export interface ISubject extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    code: string;
    schoolId: mongoose.Types.ObjectId;
    teacherId?: mongoose.Types.ObjectId;
}
declare const Subject: Model<ISubject>;
export default Subject;
//# sourceMappingURL=Subject.d.ts.map