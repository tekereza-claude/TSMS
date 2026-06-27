import mongoose, { Document, Model } from "mongoose";
export interface IComment extends Document {
    _id: mongoose.Types.ObjectId;
    parentId: mongoose.Types.ObjectId;
    schoolId: mongoose.Types.ObjectId;
    regarding?: string;
    message: string;
    status: "SENT" | "READ";
    createdAt: Date;
    updatedAt: Date;
}
declare const Comment: Model<IComment>;
export default Comment;
//# sourceMappingURL=Comment.d.ts.map