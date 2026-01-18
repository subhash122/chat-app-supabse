'use client'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useGlobalMessageContext } from '@/contexts/GlobalMessageContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Profile, Conversation } from '@/types/database'

type ConversationWithProfile = Conversation & {
  otherUser: Profile
}

export default function ChatListPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { getUnreadCount, isConnected } = useGlobalMessageContext()
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Fetch conversations
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      // Fetch conversations
      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false })

      if (convos) {
        // Fetch profiles for other users
        const otherUserIds = convos.map(c =>
          c.user1_id === user.id ? c.user2_id : c.user1_id
        )

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', otherUserIds)

        const profileMap = new Map(profilesData?.map(p => [p.id, p]) || [])

        const conversationsWithProfiles = convos.map(c => ({
          ...c,
          otherUser: profileMap.get(c.user1_id === user.id ? c.user2_id : c.user1_id)!
        })).filter(c => c.otherUser)

        setConversations(conversationsWithProfiles)
      }

      // Fetch all profiles for new chat
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)

      setProfiles(allProfiles || [])
      setLoading(false)
    }

    fetchData()
  }, [user, supabase])

  const startConversation = async (otherUserId: string) => {
    if (!user) return

    // Order IDs to match CHECK constraint (user1_id < user2_id)
    const [user1_id, user2_id] = [user.id, otherUserId].sort()

    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id)
      .single()

    if (existing) {
      router.push(`/chat/${existing.id}`)
      return
    }

    // Create new conversation
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({ user1_id, user2_id })
      .select()
      .single()

    if (!error && newConvo) {
      router.push(`/chat/${newConvo.id}`)
    }
  }

  if (authLoading || loading) {
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chats</h1>
            {/* Connection indicator */}
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} title={isConnected ? 'Connected' : 'Connecting...'} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Chat
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* New Chat Modal */}
        {showNewChat && (
          <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Start a new conversation</h2>
            {profiles.length === 0 ? (
              <p className="text-gray-500">No other users available</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => startConversation(profile.id)}
                    className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {profile.username[0].toUpperCase()}
                    </div>
                    <span className="text-gray-900 dark:text-white">{profile.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Click "New Chat" to start a conversation</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {conversations.map((convo) => {
                const unreadCount = getUnreadCount(convo.id)
                return (
                  <button
                    key={convo.id}
                    onClick={() => router.push(`/chat/${convo.id}`)}
                    className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {convo.otherUser.username[0].toUpperCase()}
                      </div>
                      {/* Unread badge */}
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {convo.otherUser.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Click to open chat'}
                      </p>
                    </div>
                    {/* Arrow indicator */}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
