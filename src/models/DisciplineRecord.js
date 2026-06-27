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
const DisciplineRecordSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student", required: true },
    schoolId: { type: mongoose_1.Schema.Types.ObjectId, ref: "School", required: true },
    teacherId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Teacher", required: true },
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ["Merit", "Demerit"], required: true },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    points: { type: Number, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
    actionTaken: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });
DisciplineRecordSchema.index({ studentId: 1, date: -1 });
DisciplineRecordSchema.index({ schoolId: 1, date: -1 });
const DisciplineRecord = mongoose_1.default.models.DisciplineRecord ??
    mongoose_1.default.model("DisciplineRecord", DisciplineRecordSchema);
exports.default = DisciplineRecord;
//# sourceMappingURL=DisciplineRecord.js.map