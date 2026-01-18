'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import type { Message } from '@/types/database'

interface MessageListProps {
  messages: (Message & { status: string })[]
  currentUserId: string
  onMessageVisible?: (messageId: string) => void
}

export function MessageList({ messages, currentUserId, onMessageVisible }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Intersection Observer for read receipts
  useEffect(() => {
    if (!onMessageVisible || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id')
            if (messageId) {
              onMessageVisible(messageId)
            }
          }
        })
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      }
    )

    // Observe all messages from other users that aren't read yet
    const messageElements = containerRef.current.querySelectorAll('[data-message-id]')
    messageElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [messages, onMessageVisible])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-1"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          data-message-id={
            // Only track messages from others that need to be marked as read
            message.sender_id !== currentUserId && message.status !== 'read'
              ? message.id
              : undefined
          }
        >
          <MessageBubble
            message={message}
            isOwn={message.sender_id === currentUserId}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
