import mongoose, { Document, Model } from "mongoose";
export interface IClass extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    grade: string;
    schoolId: mongoose.Types.ObjectId;
    teacherId?: mongoose.Types.ObjectId;
}
declare const Class: Model<IClass>;
export default Class;
//# sourceMappingURL=Class.d.ts.map