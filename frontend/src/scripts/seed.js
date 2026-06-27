"use strict";
/**
 * Mongoose seed script
 * Run: npm run db:seed  (from frontend/)
 *
 * Creates:
 *  - 1 Super Admin
 *  - 1 School  (Greenfield Academy, APPROVED)
 *  - 1 School Admin
 *  - 1 Teacher
 *  - 3 Subjects
 *  - 1 Class  (assigned to teacher)
 *  - 2 Students  (enrolled in class)
 *  - 1 Parent  (linked to both students)
 *  - Sample marks for Term 1 & Term 2, 2024
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const argon2 = __importStar(require("argon2"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from frontend root
dotenv.config({ path: path_1.default.resolve(__dirname, "../../.env") });
// ── Models ────────────────────────────────────────────────────────────────────
const User_1 = __importDefault(require("../models/User"));
const School_1 = __importDefault(require("../models/School"));
const SchoolAdmin_1 = __importDefault(require("../models/SchoolAdmin"));
const Teacher_1 = __importDefault(require("../models/Teacher"));
const Student_1 = __importDefault(require("../models/Student"));
const Class_1 = __importDefault(require("../models/Class"));
const Subject_1 = __importDefault(require("../models/Subject"));
const Mark_1 = __importDefault(require("../models/Mark"));
const Parent_1 = __importDefault(require("../models/Parent"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const DisciplineRecord_1 = __importDefault(require("../models/DisciplineRecord"));
const Fee_1 = __importDefault(require("../models/Fee"));
const CareerCluster_1 = __importDefault(require("../models/CareerCluster"));
async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri)
        throw new Error("MONGODB_URI not set in .env");
    await mongoose_1.default.connect(uri);
    console.log("Connected to MongoDB");
    // ── Wipe existing seed data ──────────────────────────────────────────────
    await Promise.all([
        User_1.default.deleteMany({}),
        School_1.default.deleteMany({}),
        SchoolAdmin_1.default.deleteMany({}),
        Teacher_1.default.deleteMany({}),
        Student_1.default.deleteMany({}),
        Class_1.default.deleteMany({}),
        Subject_1.default.deleteMany({}),
        Mark_1.default.deleteMany({}),
        Parent_1.default.deleteMany({}),
        Subscription_1.default.deleteMany({}),
        DisciplineRecord_1.default.deleteMany({}),
        Fee_1.default.deleteMany({}),
        CareerCluster_1.default.deleteMany({}),
    ]);
    console.log("Cleared existing data");
    // ── Passwords ────────────────────────────────────────────────────────────
    const pw = (plain) => argon2.hash(plain);
    // ── Super Admin ──────────────────────────────────────────────────────────
    const superAdminUser = await User_1.default.create({
        name: "Super Admin",
        email: "superadmin@tsms.dev",
        password: await pw("superadmin123"),
        role: "SUPER_ADMIN",
    });
    console.log("Created super admin:", superAdminUser.email);
    // ── School ───────────────────────────────────────────────────────────────
    const school = await School_1.default.create({
        name: "Greenfield Academy",
        email: "admin@greenfield.edu",
        address: "123 School Lane, Kigali",
        phone: "+250 788 000 001",
        status: "APPROVED",
    });
    await Subscription_1.default.create({
        schoolId: school._id,
        plan: "FREE",
        status: "ACTIVE",
        startDate: new Date(),
    });
    console.log("Created school:", school.name);
    // ── School Admin ─────────────────────────────────────────────────────────
    const schoolAdminUser = await User_1.default.create({
        name: "Alice Nkurunziza",
        email: "alice@greenfield.edu",
        password: await pw("schooladmin123"),
        role: "SCHOOL_ADMIN",
    });
    await SchoolAdmin_1.default.create({ userId: schoolAdminUser._id, schoolId: school._id });
    console.log("Created school admin:", schoolAdminUser.email);
    // ── Teacher ──────────────────────────────────────────────────────────────
    const teacherUser = await User_1.default.create({
        name: "Bob Mugisha",
        email: "bob@greenfield.edu",
        password: await pw("teacher123"),
        role: "TEACHER",
    });
    const teacher = await Teacher_1.default.create({ userId: teacherUser._id, schoolId: school._id });
    console.log("Created teacher:", teacherUser.email);
    // ── Subjects ─────────────────────────────────────────────────────────────
    const [math, english, science] = await Subject_1.default.insertMany([
        { name: "Mathematics", code: "MATH", schoolId: school._id },
        { name: "English", code: "ENG", schoolId: school._id },
        { name: "Science", code: "SCI", schoolId: school._id },
    ]);
    console.log("Created subjects: MATH, ENG, SCI");
    // ── Class ────────────────────────────────────────────────────────────────
    const cls = await Class_1.default.create({
        name: "Form 1A",
        grade: "Form 1",
        schoolId: school._id,
        teacherId: teacher._id,
    });
    console.log("Created class:", cls.name);
    // ── Students ─────────────────────────────────────────────────────────────
    const [student1, student2] = await Student_1.default.insertMany([
        { firstName: "Claire", lastName: "Uwimana", email: "claire@student.dev", schoolId: school._id, classId: cls._id },
        { firstName: "David", lastName: "Habimana", email: "david@student.dev", schoolId: school._id, classId: cls._id },
    ]);
    console.log("Created students:", student1.firstName, "&", student2.firstName);
    // ── Marks ────────────────────────────────────────────────────────────────
    const marksData = [
        // Claire — Term 1 2024
        { studentId: student1._id, subjectId: math._id, teacherId: teacher._id, score: 85, maxScore: 100, term: "Term 1", year: "2024" },
        { studentId: student1._id, subjectId: english._id, teacherId: teacher._id, score: 78, maxScore: 100, term: "Term 1", year: "2024" },
        { studentId: student1._id, subjectId: science._id, teacherId: teacher._id, score: 91, maxScore: 100, term: "Term 1", year: "2024" },
        // Claire — Term 2 2024
        { studentId: student1._id, subjectId: math._id, teacherId: teacher._id, score: 88, maxScore: 100, term: "Term 2", year: "2024" },
        { studentId: student1._id, subjectId: english._id, teacherId: teacher._id, score: 82, maxScore: 100, term: "Term 2", year: "2024" },
        { studentId: student1._id, subjectId: science._id, teacherId: teacher._id, score: 94, maxScore: 100, term: "Term 2", year: "2024" },
        // David — Term 1 2024
        { studentId: student2._id, subjectId: math._id, teacherId: teacher._id, score: 72, maxScore: 100, term: "Term 1", year: "2024" },
        { studentId: student2._id, subjectId: english._id, teacherId: teacher._id, score: 88, maxScore: 100, term: "Term 1", year: "2024" },
        { studentId: student2._id, subjectId: science._id, teacherId: teacher._id, score: 65, maxScore: 100, term: "Term 1", year: "2024" },
        // David — Term 2 2024
        { studentId: student2._id, subjectId: math._id, teacherId: teacher._id, score: 75, maxScore: 100, term: "Term 2", year: "2024" },
        { studentId: student2._id, subjectId: english._id, teacherId: teacher._id, score: 90, maxScore: 100, term: "Term 2", year: "2024" },
        { studentId: student2._id, subjectId: science._id, teacherId: teacher._id, score: 70, maxScore: 100, term: "Term 2", year: "2024" },
    ];
    // Split each total score into a test (CA) and exam component, each out of 50.
    await Mark_1.default.insertMany(marksData.map((m) => {
        const test = Math.min(50, Math.round(m.score / 2));
        return { ...m, test, exam: m.score - test };
    }));
    console.log("Created marks for both students (Term 1 & Term 2, 2024)");
    // ── Discipline records ─────────────────────────────────────────────────────
    // Points are stored signed: positive for a Merit, negative for a Demerit.
    await DisciplineRecord_1.default.insertMany([
        { studentId: student1._id, schoolId: school._id, teacherId: teacher._id, date: new Date("2024-02-12"), type: "Merit", category: "Academic Excellence", points: 5, note: "Top score in the Term 1 Mathematics test.", actionTaken: "Certificate awarded" },
        { studentId: student1._id, schoolId: school._id, teacherId: teacher._id, date: new Date("2024-03-20"), type: "Demerit", category: "Late Arrival", points: -2, note: "Arrived late to assembly.", actionTaken: "Verbal warning" },
        { studentId: student2._id, schoolId: school._id, teacherId: teacher._id, date: new Date("2024-02-08"), type: "Merit", category: "Sportsmanship", points: 4, note: "Fair play award at the inter-house gala.", actionTaken: "Recognition in newsletter" },
        { studentId: student2._id, schoolId: school._id, teacherId: teacher._id, date: new Date("2024-02-25"), type: "Demerit", category: "Incomplete Homework", points: -3, note: "Missing English assignment twice.", actionTaken: "Parent contacted" },
    ]);
    console.log("Created discipline records");
    // ── Fee accounts ───────────────────────────────────────────────────────────
    await Fee_1.default.insertMany([
        {
            studentId: student1._id, schoolId: school._id, currency: "RWF", dueDate: "2024-04-15",
            items: [
                { item: "Tuition", amount: 250000, term: "Term 1" },
                { item: "Meals", amount: 60000, term: "Term 1" },
                { item: "Transport", amount: 45000, term: "Term 1" },
                { item: "Tuition", amount: 250000, term: "Term 2" },
                { item: "Meals", amount: 60000, term: "Term 2" },
                { item: "Tuition", amount: 250000, term: "Term 3" },
            ],
            paid: 400000,
        },
        {
            studentId: student2._id, schoolId: school._id, currency: "RWF", dueDate: "2024-04-15",
            items: [
                { item: "Tuition", amount: 220000, term: "Term 1" },
                { item: "Meals", amount: 60000, term: "Term 1" },
            ],
            paid: 280000,
        },
    ]);
    console.log("Created fee accounts");
    // ── Career clusters (reference data for parent career insights) ────────────
    await CareerCluster_1.default.insertMany([
        { clusterId: "stem-engineering", order: 1, title: "Engineering & Technology", emoji: "⚙️", minScore: 65, color: "border-blue-500 bg-blue-50", description: "Design, build and solve real-world problems through mathematics and physical sciences.", subjects: ["Mathematics", "Physics", "Science"], careers: ["Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Software Engineer", "Aerospace Engineer", "Robotics Engineer"] },
        { clusterId: "computing", order: 2, title: "Computing & Data Science", emoji: "💻", minScore: 65, color: "border-indigo-500 bg-indigo-50", description: "Build software, analyse data and shape the digital world.", subjects: ["Mathematics", "Physics", "Computer Science"], careers: ["Software Developer", "Data Scientist", "Cybersecurity Analyst", "AI/ML Engineer", "Cloud Architect", "UX Designer"] },
        { clusterId: "medicine", order: 3, title: "Medicine & Health Sciences", emoji: "🩺", minScore: 70, color: "border-green-500 bg-green-50", description: "Understand the human body and help people live healthier lives.", subjects: ["Biology", "Chemistry", "Science", "Mathematics"], careers: ["Medical Doctor", "Pharmacist", "Nurse", "Biochemist", "Physiotherapist", "Dentist"] },
        { clusterId: "law-social", order: 4, title: "Law & Social Sciences", emoji: "⚖️", minScore: 65, color: "border-purple-500 bg-purple-50", description: "Understand society, argue cases and shape policy.", subjects: ["History", "English", "Literature", "Geography"], careers: ["Lawyer", "Judge", "Political Scientist", "Sociologist", "Human Rights Officer", "Diplomat"] },
        { clusterId: "business", order: 5, title: "Business & Finance", emoji: "📈", minScore: 60, color: "border-yellow-500 bg-yellow-50", description: "Drive economic growth through entrepreneurship, finance and management.", subjects: ["Mathematics", "Economics", "Business Studies", "History"], careers: ["Accountant", "Financial Analyst", "Entrepreneur", "Actuary", "Investment Banker", "Business Consultant"] },
        { clusterId: "arts-communication", order: 6, title: "Arts, Media & Communication", emoji: "🎨", minScore: 60, color: "border-rose-500 bg-rose-50", description: "Tell stories, create content and connect people through language and creativity.", subjects: ["English", "Literature", "History", "Art"], careers: ["Journalist", "Author", "Graphic Designer", "Film Director", "Marketing Manager", "Public Relations Specialist"] },
        { clusterId: "environment", order: 7, title: "Environment & Earth Sciences", emoji: "🌍", minScore: 60, color: "border-teal-500 bg-teal-50", description: "Protect the planet and understand natural systems.", subjects: ["Geography", "Biology", "Chemistry", "Science"], careers: ["Environmental Scientist", "Geologist", "Urban Planner", "Climate Researcher", "Marine Biologist", "Conservationist"] },
        { clusterId: "education", order: 8, title: "Education & Psychology", emoji: "📚", minScore: 55, color: "border-orange-500 bg-orange-50", description: "Shape minds, support development and understand human behaviour.", subjects: ["English", "Biology", "History", "Literature"], careers: ["Teacher", "School Counsellor", "Psychologist", "Educational Researcher", "Child Development Specialist", "Social Worker"] },
    ]);
    console.log("Created career clusters");
    // ── Parent ───────────────────────────────────────────────────────────────
    const parentUser = await User_1.default.create({
        name: "Eve Uwimana",
        email: "eve@parent.dev",
        password: await pw("parent123"),
        role: "PARENT",
    });
    await Parent_1.default.create({
        userId: parentUser._id,
        studentIds: [student1._id, student2._id],
    });
    console.log("Created parent:", parentUser.email);
    console.log("\n✅ Seed complete!\n");
    console.log("Demo credentials:");
    console.log("  Super Admin  → superadmin@tsms.dev   / superadmin123");
    console.log("  School Admin → alice@greenfield.edu  / schooladmin123");
    console.log("  Teacher      → bob@greenfield.edu    / teacher123");
    console.log("  Parent       → eve@parent.dev        / parent123");
    await mongoose_1.default.disconnect();
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map