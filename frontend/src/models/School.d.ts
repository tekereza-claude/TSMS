import mongoose, { Document, Model } from "mongoose";
export type SchoolStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export interface ISchool extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    address?: string;
    phone?: string;
    status: SchoolStatus;
    createdAt: Date;
    updatedAt: Date;
}
declare const School: Model<ISchool>;
export default School;
//# sourceMappingURL=School.d.ts.map