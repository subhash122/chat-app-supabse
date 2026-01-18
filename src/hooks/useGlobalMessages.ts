'use client'

import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/database'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useGlobalMessages(userId: string | undefined) {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map())
  const [recentMessages, setRecentMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Fetch initial unread counts
  useEffect(() => {
    if (!userId) return

    const fetchUnreadCounts = async () => {
      // Get all conversations for this user
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

      if (!conversations) return

      // For each conversation, count unread messages
      const counts = new Map<string, number>()

      for (const conv of conversations) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .in('status', ['sent', 'delivered']) // Not read yet

        counts.set(conv.id, count || 0)
      }

      setUnreadCounts(counts)
    }

    fetchUnreadCounts()
  }, [userId, supabase])

  // Set up global real-time subscription
  useEffect(() => {
    if (!userId) return

    // Subscribe to ALL messages (RLS will filter to user's conversations)
    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // NO FILTER - RLS ensures we only get messages from our conversations
        },
        async (payload) => {
          const newMessage = payload.new as Message

          // If I'm NOT the sender, mark as delivered immediately
          if (newMessage.sender_id !== userId && newMessage.status === 'sent') {
            // Mark as delivered
            await supabase
              .from('messages')
              .update({
                status: 'delivered',
                delivered_at: new Date().toISOString()
              })
              .eq('id', newMessage.id)
              .eq('status', 'sent') // Only if still 'sent'

            // Update unread count
            setUnreadCounts(prev => {
              const newCounts = new Map(prev)
              const currentCount = newCounts.get(newMessage.conversation_id) || 0
              newCounts.set(newMessage.conversation_id, currentCount + 1)
              return newCounts
            })

            // Add to recent messages (keep last 10)
            setRecentMessages(prev => [newMessage, ...prev].slice(0, 10))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMessage = payload.new as Message

          // If a message was marked as read, update unread count
          if (updatedMessage.status === 'read' && updatedMessage.sender_id !== userId) {
            setUnreadCounts(prev => {
              const newCounts = new Map(prev)
              const currentCount = newCounts.get(updatedMessage.conversation_id) || 0
              if (currentCount > 0) {
                newCounts.set(updatedMessage.conversation_id, currentCount - 1)
              }
              return newCounts
            })
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      setIsConnected(false)
    }
  }, [userId, supabase])

  // Function to clear unread count for a conversation (when user opens it)
  const clearUnreadCount = useCallback((conversationId: string) => {
    setUnreadCounts(prev => {
      const newCounts = new Map(prev)
      newCounts.set(conversationId, 0)
      return newCounts
    })
  }, [])

  // Function to get unread count for a specific conversation
  const getUnreadCount = useCallback((conversationId: string) => {
    return unreadCounts.get(conversationId) || 0
  }, [unreadCounts])

  return {
    unreadCounts,
    recentMessages,
    isConnected,
    clearUnreadCount,
    getUnreadCount,
  }
}
