import mongoose, { Document, Model } from "mongoose";
export interface IParent extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    studentIds: mongoose.Types.ObjectId[];
}
declare const Parent: Model<IParent>;
export default Parent;
//# sourceMappingURL=Parent.d.ts.map