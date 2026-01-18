'use client'

import { createContext, useContext } from 'react'
import type { Message } from '@/types/database'

export type UnreadCount = {
  conversationId: string
  count: number
}

export type GlobalMessageContextType = {
  // Unread message counts per conversation
  unreadCounts: Map<string, number>
  // Recent messages (for notifications, etc.)
  recentMessages: Message[]
  // Check if global listener is active
  isConnected: boolean
  // Clear unread count when user opens a conversation
  clearUnreadCount: (conversationId: string) => void
  // Get unread count for a specific conversation
  getUnreadCount: (conversationId: string) => number
}

export const GlobalMessageContext = createContext<GlobalMessageContextType>({
  unreadCounts: new Map(),
  recentMessages: [],
  isConnected: false,
  clearUnreadCount: () => {},
  getUnreadCount: () => 0,
})

export function useGlobalMessageContext() {
  const context = useContext(GlobalMessageContext)
  if (!context) {
    throw new Error('useGlobalMessageContext must be used within GlobalMessageProvider')
  }
  return context
}
