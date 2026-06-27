"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SYSTEM_PROMPT = `You are TSMS Assistant, a helpful AI for the Teleparenting School Management System (TSMS).

TSMS is a multi-tenant SaaS platform that connects schools, teachers, and parents.

You help:
- Prospective schools understand how to onboard and what the platform offers
- Parents understand how to track their child's academic progress
- Teachers understand how to manage classes and upload marks via Excel
- Anyone with general questions about the platform

Key features you can explain:
- School registration and approval workflow managed by a Super Admin
- Role-based portals: Super Admin, School Admin, Teacher, Parent
- Mark/grade management via Excel (CSV) upload with full validation
- Real-time academic progress tracking and report cards for parents
- Career insights based on student subject performance
- Subscription plans: Free and Paid

Keep responses concise, friendly, and helpful. If asked about something outside TSMS, politely redirect to platform-related topics. Do not make up specific pricing or features not mentioned above.`;
async function POST(req) {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: "messages array required" }), { status: 400 });
    }
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPT,
    });
    // Gemini uses "user" / "model" roles and a history array
    const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1].content;
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage);
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start(controller) {
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
        },
    });
    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
//# sourceMappingURL=route.js.map