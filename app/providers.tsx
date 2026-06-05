'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Toaster } from 'sonner'
import { useState } from 'react'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { InstallPWA } from '@/components/InstallPWA'
import { RealtimeProvider } from '@/components/providers/RealtimeProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            retry: 1,
            retryDelay: 1000,
            refetchOnWindowFocus: false, // Don't refetch on tab switch
          },
          mutations: {
            retry: 0, // Never retry mutations
          }
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
        <Toaster position="bottom-right" theme="dark" richColors />
        <InstallPWA />
        <RealtimeProvider />
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
