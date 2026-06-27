"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI)
    throw new Error("MONGODB_URI is not defined in environment variables");
// Cache connection across hot reloads in dev
const globalWithMongoose = globalThis;
if (!globalWithMongoose.mongoose) {
    globalWithMongoose.mongoose = { conn: null, promise: null };
}
const cached = globalWithMongoose.mongoose;
async function connectDB() {
    if (cached.conn)
        return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose_1.default.connect(MONGODB_URI, { bufferCommands: false });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
//# sourceMappingURL=mongoose.js.map