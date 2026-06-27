import mongoose, { Document, Model } from "mongoose";
export interface ISchoolAdmin extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    schoolId: mongoose.Types.ObjectId;
}
declare const SchoolAdmin: Model<ISchoolAdmin>;
export default SchoolAdmin;
//# sourceMappingURL=SchoolAdmin.d.ts.map