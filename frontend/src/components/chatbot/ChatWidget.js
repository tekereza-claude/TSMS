"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatWidget;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
const SUGGESTIONS = [
    "How do I register my school?",
    "How can parents track progress?",
    "How does mark uploading work?",
    "What subscription plans are available?",
];
function ChatWidget() {
    const [open, setOpen] = (0, react_1.useState)(false);
    const [messages, setMessages] = (0, react_1.useState)([
        {
            role: "assistant",
            content: "Hi! I'm the TSMS Assistant. Ask me anything about the platform — onboarding, features, how it works for schools, teachers, or parents.",
        },
    ]);
    const [input, setInput] = (0, react_1.useState)("");
    const [streaming, setStreaming] = (0, react_1.useState)(false);
    const bottomRef = (0, react_1.useRef)(null);
    const inputRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    (0, react_1.useEffect)(() => {
        if (open)
            setTimeout(() => inputRef.current?.focus(), 100);
    }, [open]);
    const send = async (text) => {
        const trimmed = text.trim();
        if (!trimmed || streaming)
            return;
        const userMsg = { role: "user", content: trimmed };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setStreaming(true);
        // Add empty assistant message to stream into
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
                }),
            });
            if (!res.ok)
                throw new Error("Chat request failed");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
                for (const line of lines) {
                    const data = line.replace("data: ", "");
                    if (data === "[DONE]")
                        break;
                    try {
                        const { text } = JSON.parse(data);
                        setMessages((prev) => {
                            const updated = [...prev];
                            updated[updated.length - 1] = {
                                role: "assistant",
                                content: updated[updated.length - 1].content + text,
                            };
                            return updated;
                        });
                    }
                    catch { }
                }
            }
        }
        catch {
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: "assistant",
                    content: "Sorry, I ran into an issue. Please try again.",
                };
                return updated;
            });
        }
        finally {
            setStreaming(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setOpen(!open), className: "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 shadow-lg hover:bg-blue-700 transition-all hover:scale-105 flex items-center justify-center", "aria-label": "Open chat", children: open
                    ? (0, jsx_runtime_1.jsx)(outline_1.XMarkIcon, { className: "h-6 w-6 text-white" })
                    : (0, jsx_runtime_1.jsx)(outline_1.ChatBubbleLeftRightIcon, { className: "h-6 w-6 text-white" }) }), open && ((0, jsx_runtime_1.jsxs)("div", { className: "fixed bottom-24 right-6 z-50 w-[360px] max-h-[560px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-blue-600 px-4 py-3 flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-full bg-white/20 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.SparklesIcon, { className: "h-4 w-4 text-white" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-white", children: "TSMS Assistant" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-blue-200", children: "Ask me anything about the platform" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 max-h-[380px]", children: [messages.map((msg, i) => ((0, jsx_runtime_1.jsx)("div", { className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`, children: (0, jsx_runtime_1.jsx)("div", { className: `max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-sm"
                                        : "bg-gray-100 text-gray-800 rounded-bl-sm"}`, children: msg.content || ((0, jsx_runtime_1.jsxs)("span", { className: "flex space-x-1 items-center h-4", children: [(0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: "0ms" } }), (0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: "150ms" } }), (0, jsx_runtime_1.jsx)("span", { className: "w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: "300ms" } })] })) }) }, i))), (0, jsx_runtime_1.jsx)("div", { ref: bottomRef })] }), messages.length === 1 && ((0, jsx_runtime_1.jsx)("div", { className: "px-4 pb-2 flex flex-wrap gap-1.5", children: SUGGESTIONS.map((s) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => send(s), className: "text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors", children: s }, s))) })), (0, jsx_runtime_1.jsxs)("div", { className: "px-3 py-3 border-t border-gray-100 flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("input", { ref: inputRef, type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && send(input), placeholder: "Type a message...", disabled: streaming, className: "flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => send(input), disabled: !input.trim() || streaming, className: "h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0", children: (0, jsx_runtime_1.jsx)(outline_1.PaperAirplaneIcon, { className: "h-4 w-4 text-white" }) })] })] }))] }));
}
//# sourceMappingURL=ChatWidget.js.map