import mongoose, { Document, Model } from "mongoose";
export interface IPayment extends Document {
    _id: mongoose.Types.ObjectId;
    schoolId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    date: Date;
    method?: string;
    note?: string;
    recordedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const Payment: Model<IPayment>;
export default Payment;
//# sourceMappingURL=Payment.d.ts.map