'use client'

import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/database'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useGlobalMessageContext } from '@/contexts/GlobalMessageContext'

type MessageWithStatus = Message & { status: string }

export function useMessages(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<MessageWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const pendingReadsRef = useRef<Set<string>>(new Set())
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { clearUnreadCount } = useGlobalMessageContext()

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data.map(m => ({ ...m, status: m.status || 'sent' })))
      }
      setLoading(false)

      // Clear unread count for this conversation since user is viewing it
      clearUnreadCount(conversationId)
    }

    fetchMessages()
  }, [conversationId, supabase, clearUnreadCount])

  // Set up real-time subscription
  useEffect(() => {
    // Subscribe to messages for this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message

          // Add to local state
          setMessages((prev) => {
            // Check if message already exists (avoid duplicates from optimistic updates)
            if (prev.some(m => m.id === newMessage.id || m.client_id === newMessage.client_id)) {
              return prev.map(m =>
                m.client_id === newMessage.client_id
                  ? { ...newMessage, status: newMessage.status || 'sent' }
                  : m
              )
            }
            return [...prev, { ...newMessage, status: newMessage.status || 'sent' }]
          })

          // NOTE: Delivery status is handled by useGlobalMessages at layout level
          // Here we only handle READ status when messages are visible
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message

          // Update local message status
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMessage.id
                ? { ...m, status: updatedMessage.status || m.status }
                : m
            )
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, supabase])

  // Send a message with optimistic update
  const sendMessage = useCallback(async (content: string) => {
    const clientId = crypto.randomUUID()

    // Optimistic update - show message immediately as pending
    const optimisticMessage: MessageWithStatus = {
      id: clientId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      status: 'pending',
      client_id: clientId,
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
    }

    setMessages((prev) => [...prev, optimisticMessage])

    // Insert into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        client_id: clientId,
        status: 'sent',
      })
      .select()
      .single()

    if (error) {
      // Mark as failed on error
      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId ? { ...m, status: 'failed' } : m
        )
      )
      return { error }
    }

    // Update with real message data
    if (data) {
      setMessages((prev) =>
        prev.map((m) =>
          m.client_id === clientId ? { ...data, status: 'sent' } : m
        )
      )
    }

    return { error: null }
  }, [conversationId, currentUserId, supabase])

  // Mark messages as read (with batching)
  const markAsRead = useCallback(async (messageIds: string[]) => {
    await supabase
      .from('messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .in('id', messageIds)
  }, [supabase])

  // Queue read receipt (batched)
  const queueReadReceipt = useCallback((messageId: string) => {
    // Find the message and check if it's from another user and not already read
    const message = messages.find(m => m.id === messageId)
    if (!message || message.sender_id === currentUserId || message.status === 'read') {
      return
    }

    pendingReadsRef.current.add(messageId)

    // Debounce: batch read receipts every 500ms
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current)
    }

    flushTimeoutRef.current = setTimeout(() => {
      if (pendingReadsRef.current.size > 0) {
        const ids = Array.from(pendingReadsRef.current)
        markAsRead(ids)
        pendingReadsRef.current.clear()
      }
    }, 500)
  }, [messages, currentUserId, markAsRead])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current)
      }
    }
  }, [])

  return {
    messages,
    loading,
    sendMessage,
    queueReadReceipt,
  }
}
