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
exports.EXAM_MAX = exports.TEST_MAX = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Each mark is split into a continuous-assessment (test) and a final-exam
// component, each out of 50. `score` is their sum (out of `maxScore`, 100).
exports.TEST_MAX = 50;
exports.EXAM_MAX = 50;
const MarkSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Teacher", required: true },
    test: { type: Number, required: true, min: 0, max: exports.TEST_MAX, default: 0 },
    exam: { type: Number, required: true, min: 0, max: exports.EXAM_MAX, default: 0 },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    term: { type: String, required: true },
    year: { type: String, required: true },
}, { timestamps: true });
// Prevent duplicate mark for same student+subject+term+year
MarkSchema.index({ studentId: 1, subjectId: 1, term: 1, year: 1 }, { unique: true });
const Mark = mongoose_1.default.models.Mark ?? mongoose_1.default.model("Mark", MarkSchema);
exports.default = Mark;
//# sourceMappingURL=Mark.js.map