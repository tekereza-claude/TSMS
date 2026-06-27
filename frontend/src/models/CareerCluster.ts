import mongoose, { Schema, Document, Model } from "mongoose"

// Reference data driving the parent portal's career recommendations.
// `subjects` lists the subject names that feed this cluster; `minScore` is the
// minimum average % across matched subjects needed for the cluster to surface.
export interface ICareerCluster extends Document {
  _id:         mongoose.Types.ObjectId
  clusterId:   string          // stable slug, e.g. "stem-engineering"
  title:       string
  emoji:       string
  description: string
  careers:     string[]
  subjects:    string[]
  color:       string          // tailwind classes for the card accent
  minScore:    number
  order:       number          // display/sort order
}

const CareerClusterSchema = new Schema<ICareerCluster>(
  {
    clusterId:   { type: String, required: true, unique: true },
    title:       { type: String, required: true },
    emoji:       { type: String, default: "" },
    description: { type: String, default: "" },
    careers:     { type: [String], default: [] },
    subjects:    { type: [String], default: [] },
    color:       { type: String, default: "border-gray-400 bg-gray-50" },
    minScore:    { type: Number, default: 60 },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
)

const CareerCluster: Model<ICareerCluster> =
  mongoose.models.CareerCluster ??
  mongoose.model<ICareerCluster>("CareerCluster", CareerClusterSchema)
export default CareerCluster
