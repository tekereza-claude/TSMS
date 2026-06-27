import mongoose, { Document, Model } from "mongoose";
export interface ICareerCluster extends Document {
    _id: mongoose.Types.ObjectId;
    clusterId: string;
    title: string;
    emoji: string;
    description: string;
    careers: string[];
    subjects: string[];
    color: string;
    minScore: number;
    order: number;
}
declare const CareerCluster: Model<ICareerCluster>;
export default CareerCluster;
//# sourceMappingURL=CareerCluster.d.ts.map