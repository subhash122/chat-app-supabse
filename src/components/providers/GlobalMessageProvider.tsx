'use client'

import { GlobalMessageContext } from '@/contexts/GlobalMessageContext'
import { useGlobalMessages } from '@/hooks/useGlobalMessages'
import { useAuth } from '@/hooks/useAuth'
import { ReactNode, useMemo } from 'react'

interface GlobalMessageProviderProps {
  children: ReactNode
}

export function GlobalMessageProvider({ children }: GlobalMessageProviderProps) {
  const { user } = useAuth()
  const { unreadCounts, recentMessages, isConnected, clearUnreadCount, getUnreadCount } =
    useGlobalMessages(user?.id)

  const contextValue = useMemo(() => ({
    unreadCounts,
    recentMessages,
    isConnected,
    clearUnreadCount,
    getUnreadCount,
  }), [unreadCounts, recentMessages, isConnected, clearUnreadCount, getUnreadCount])

  return (
    <GlobalMessageContext.Provider value={contextValue}>
      {children}
    </GlobalMessageContext.Provider>
  )
}
