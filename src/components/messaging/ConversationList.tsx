"use client"

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"

export interface ConversationSummary {
  _id: string
  withRole: "PARENT" | "TEACHER"
  withUserId: { _id: string; name: string; email: string } | string
  lastMessageAt: string
  lastMessagePreview: string
  lastMessageSenderRole: "PARENT" | "TEACHER" | "SCHOOL_ADMIN"
  adminLastReadAt?: string
}

export function isUnread(c: ConversationSummary) {
  if (c.lastMessageSenderRole === "SCHOOL_ADMIN") return false
  if (!c.adminLastReadAt) return true
  return new Date(c.adminLastReadAt) < new Date(c.lastMessageAt)
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ConversationSummary[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <ChatBubbleLeftRightIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No conversations yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
      {conversations.map((c) => {
        const person = typeof c.withUserId === "string" ? null : c.withUserId
        const unread = isUnread(c)
        return (
          <button
            key={c._id}
            onClick={() => onSelect(c._id)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedId === c._id ? "bg-green-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900 truncate">{person?.name ?? "Unknown"}</p>
              {unread && <span className="ml-2 h-2 w-2 rounded-full bg-green-600 flex-shrink-0" />}
            </div>
            <p className="text-xs text-gray-400">{c.withRole === "TEACHER" ? "Teacher" : "Parent"}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessagePreview}</p>
            <p className="text-[10px] text-gray-400 mt-1">{new Date(c.lastMessageAt).toLocaleString()}</p>
          </button>
        )
      })}
    </div>
  )
}
