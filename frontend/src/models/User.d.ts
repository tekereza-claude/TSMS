import mongoose, { Document, Model } from "mongoose";
export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT";
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
declare const User: Model<IUser>;
export default User;
//# sourceMappingURL=User.d.ts.map