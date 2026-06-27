import mongoose, { Document, Model } from "mongoose";
export interface IStudent extends Document {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email?: string;
    schoolId: mongoose.Types.ObjectId;
    classId?: mongoose.Types.ObjectId;
    profilePicture?: string;
}
declare const Student: Model<IStudent>;
export default Student;
//# sourceMappingURL=Student.d.ts.map