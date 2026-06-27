import mongoose, { Document, Model } from "mongoose";
export interface ISubscription extends Document {
    _id: mongoose.Types.ObjectId;
    schoolId: mongoose.Types.ObjectId;
    plan: "FREE" | "PAID";
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    startDate: Date;
    endDate?: Date;
}
declare const Subscription: Model<ISubscription>;
export default Subscription;
//# sourceMappingURL=Subscription.d.ts.map