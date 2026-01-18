'use client'

import { MessageStatus } from './MessageStatus'
import type { Message } from '@/types/database'

interface MessageBubbleProps {
  message: Message & { status: string }
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
        }`}
      >
        <p className="break-words">{message.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${
          isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <span className="text-xs">
            {formatTime(message.created_at)}
          </span>
          {isOwn && (
            <MessageStatus status={message.status} />
          )}
        </div>
      </div>
    </div>
  )
}
