import mongoose, { Document, Model } from "mongoose";
export interface ITeacher extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    schoolId: mongoose.Types.ObjectId;
}
declare const Teacher: Model<ITeacher>;
export default Teacher;
//# sourceMappingURL=Teacher.d.ts.map