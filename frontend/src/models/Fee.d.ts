import mongoose, { Document, Model } from "mongoose";
interface IFeeItem {
    item: string;
    amount: number;
    term: string;
}
export interface IFee extends Document {
    _id: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    schoolId: mongoose.Types.ObjectId;
    currency: string;
    dueDate?: string;
    items: IFeeItem[];
    paid: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const Fee: Model<IFee>;
export default Fee;
//# sourceMappingURL=Fee.d.ts.map