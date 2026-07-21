import mongoose, { Schema, Document, Model } from "mongoose"

export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT"

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password: string
  role: UserRole
  profilePicture?: string   // base64 data URL
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name:           { type: String, required: true },
    email:          { type: String, required: true, unique: true, lowercase: true },
    password:       { type: String, required: true },
    role:           { type: String, enum: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "PARENT"], required: true },
    profilePicture: { type: String },
  },
  { timestamps: true }
)

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema)
export default User
