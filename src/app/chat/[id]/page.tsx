'use client'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useMessages } from '@/hooks/useMessages'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types/database'

export default function ChatRoomPage() {
  const params = useParams()
  const conversationId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [loadingConvo, setLoadingConvo] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    queueReadReceipt,
  } = useMessages(conversationId, user?.id || '')

  // Fetch conversation and other user's profile
  useEffect(() => {
    if (!user || !conversationId) return

    const fetchConversation = async () => {
      const { data: convo } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convo) {
        const otherUserId = convo.user1_id === user.id ? convo.user2_id : convo.user1_id

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single()

        setOtherUser(profile)
      }
      setLoadingConvo(false)
    }

    fetchConversation()
  }, [user, conversationId, supabase])

  const handleSend = async (content: string) => {
    await sendMessage(content)
  }

  if (authLoading || loadingConvo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/chat')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          {otherUser && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {otherUser.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {otherUser.username}
                </p>
                <p className="text-xs text-gray-500">
                  {otherUser.is_online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto bg-white dark:bg-gray-800">
        {messagesLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={user.id}
            onMessageVisible={queueReadReceipt}
          />
        )}
        <MessageInput onSend={handleSend} />
      </div>

      {/* Tick System Legend */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-gray-400">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
            Sent
          </span>
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 16" fill="currentColor" className="w-5 h-4 text-gray-400">
              <path d="M15.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
              <path d="M21.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-1-1a.5.5 0 0 1 .708-.708l.646.647 6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
            Delivered
          </span>
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 16" fill="currentColor" className="w-5 h-4 text-blue-500">
              <path d="M15.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
              <path d="M21.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-1-1a.5.5 0 0 1 .708-.708l.646.647 6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
            Read
          </span>
        </div>
      </div>
    </div>
  )
}
