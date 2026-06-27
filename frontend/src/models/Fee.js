"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const FeeItemSchema = new mongoose_1.Schema({
    item: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    term: { type: String, required: true, trim: true },
}, { _id: false });
const FeeSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student", required: true, unique: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true },
    currency: { type: String, default: "RWF", trim: true },
    dueDate: { type: String },
    items: { type: [FeeItemSchema], default: [] },
    paid: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
FeeSchema.index({ schoolId: 1 });
const Fee = mongoose_1.default.models.Fee ?? mongoose_1.default.model("Fee", FeeSchema);
exports.default = Fee;
//# sourceMappingURL=Fee.js.map