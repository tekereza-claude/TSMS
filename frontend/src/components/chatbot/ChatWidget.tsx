"use client"

import { useState, useRef, useEffect } from "react"
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  "How do I register my school?",
  "How can parents track progress?",
  "How does mark uploading work?",
  "What subscription plans are available?",
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm the TSMS Assistant. Ask me anything about the platform — onboarding, features, how it works for schools, teachers, or parents.",
    },
  ])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    const userMsg: Message = { role: "user", content: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput("")
    setStreaming(true)

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error("Chat request failed")

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))

        for (const line of lines) {
          const data = line.replace("data: ", "")
          if (data === "[DONE]") break
          try {
            const { text } = JSON.parse(data)
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + text,
              }
              return updated
            })
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I ran into an issue. Please try again.",
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 shadow-lg hover:bg-blue-700 transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Open chat"
      >
        {open
          ? <XMarkIcon className="h-6 w-6 text-white" />
          : <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
        }
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[560px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">TSMS Assistant</p>
              <p className="text-xs text-blue-200">Ask me anything about the platform</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 max-h-[380px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content || (
                    <span className="flex space-x-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — only show before first user message */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Type a message..."
              disabled={streaming}
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <PaperAirplaneIcon className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
