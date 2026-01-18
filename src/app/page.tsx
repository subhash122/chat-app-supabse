'use client'

import { AuthForm } from '@/components/auth/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/chat')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Redirecting to /chat
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Chat App
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time messaging with delivery status
        </p>
        <div className="mt-4 flex justify-center gap-4 text-sm text-gray-500">
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
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <AuthForm />
      </div>
    </div>
  )
}
