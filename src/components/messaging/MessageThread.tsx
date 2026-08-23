"use client"

import { useState, type FormEvent } from "react"
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"

export interface ThreadMessage {
  _id: string
  senderRole: "PARENT" | "TEACHER" | "SCHOOL_ADMIN"
  senderUserId: string
  body: string
  regarding?: string
  createdAt: string
}

type Accent = "rose" | "indigo" | "green"

const ACCENTS: Record<Accent, { solid: string; ring: string; bubbleMine: string; bubbleTheirs: string }> = {
  rose: {
    solid: "bg-rose-600 hover:bg-rose-700",
    ring: "focus:ring-rose-500 focus:border-rose-500",
    bubbleMine: "bg-rose-600 text-white",
    bubbleTheirs: "bg-gray-100 text-gray-800",
  },
  indigo: {
    solid: "bg-indigo-600 hover:bg-indigo-700",
    ring: "focus:ring-indigo-500 focus:border-indigo-500",
    bubbleMine: "bg-indigo-600 text-white",
    bubbleTheirs: "bg-gray-100 text-gray-800",
  },
  green: {
    solid: "bg-green-600 hover:bg-green-700",
    ring: "focus:ring-green-500 focus:border-green-500",
    bubbleMine: "bg-green-600 text-white",
    bubbleTheirs: "bg-gray-100 text-gray-800",
  },
}

const ROLE_LABEL: Record<ThreadMessage["senderRole"], string> = {
  PARENT: "Parent",
  TEACHER: "Teacher",
  SCHOOL_ADMIN: "School",
}

export default function MessageThread({
  messages,
  currentUserId,
  onSend,
  sending = false,
  accent,
  placeholder = "Write a message…",
  emptyLabel = "No messages yet. Say hello!",
}: {
  messages: ThreadMessage[]
  currentUserId: string
  onSend: (text: string) => Promise<void> | void
  sending?: boolean
  accent: Accent
  placeholder?: string
  emptyLabel?: string
}) {
  const [text, setText] = useState("")
  const colors = ACCENTS[accent]

  async function doSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    await onSend(trimmed)
    setText("")
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    void doSend()
  }

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 320, maxHeight: 480 }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">{emptyLabel}</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderUserId === currentUserId
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${mine ? colors.bubbleMine : colors.bubbleTheirs}`}>
                  {!mine && <p className="text-[11px] font-semibold opacity-70 mb-0.5">{ROLE_LABEL[m.senderRole]}</p>}
                  {m.regarding && <p className={`text-[11px] mb-0.5 ${mine ? "text-white/70" : "text-gray-500"}`}>Re: {m.regarding}</p>}
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  <p className={`text-[10px] mt-1 text-right ${mine ? "text-white/60" : "text-gray-400"}`}>
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={submit} className="border-t border-gray-200 p-3 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void doSend()
            }
          }}
          rows={2}
          placeholder={placeholder}
          className={`flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${colors.ring}`}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colors.solid}`}
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
