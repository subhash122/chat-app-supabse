'use client'

import type { MessageStatus as Status } from '@/types/database'

interface MessageStatusProps {
  status: Status | string | null
}

// Single check mark SVG
function SingleCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
    </svg>
  )
}

// Double check mark SVG
function DoubleCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      fill="currentColor"
      className={className}
    >
      <path d="M15.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L8.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
      <path d="M21.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-1-1a.5.5 0 0 1 .708-.708l.646.647 6.646-6.647a.5.5 0 0 1 .708 0z" />
    </svg>
  )
}

// Clock icon for pending state
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
    </svg>
  )
}

export function MessageStatus({ status }: MessageStatusProps) {
  switch (status) {
    case 'pending':
      return (
        <ClockIcon className="w-4 h-4 text-gray-400" />
      )
    case 'sent':
      return (
        <SingleCheck className="w-4 h-4 text-gray-400" />
      )
    case 'delivered':
      return (
        <DoubleCheck className="w-5 h-4 text-gray-400" />
      )
    case 'read':
      return (
        <DoubleCheck className="w-5 h-4 text-blue-500" />
      )
    default:
      return (
        <SingleCheck className="w-4 h-4 text-gray-400" />
      )
  }
}
