'use client'

import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 10000,
        errorRetryCount: 3,
        shouldRetryOnError: true,
        errorRetryInterval: 5000,
        // refreshInterval: 300000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
