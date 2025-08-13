"use client"

import { useSearchParams } from 'next/navigation'
import { VestingDashboardStreams } from '@/components/vesting-dashboard-streams'
import { Suspense } from 'react'
import { Card } from '@/components/ui/card'

function VestingDashboardContent() {
  const searchParams = useSearchParams()
  const contractAddress = searchParams ? searchParams.get('address') : null

  if (!contractAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-black/50 border-white/10 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Contract Address Provided</h2>
          <p className="text-white/70">Please provide a contract address in the URL parameters.</p>
        </Card>
      </div>
    )
  }

  return <VestingDashboardStreams contractAddress={contractAddress} />
}

export default function VestingDashboardPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/20 via-transparent to-transparent blur-3xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Suspense fallback={
          <div className="container mx-auto px-4 py-8">
            <Card className="bg-black/50 border-white/10 p-8 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-white/10 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
              </div>
            </Card>
          </div>
        }>
          <VestingDashboardContent />
        </Suspense>
      </div>
    </div>
  )
}