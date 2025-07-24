"use client"

import { useState } from "react"
import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { TokenCreationForm } from "@/components/token-creation-form"
import { AIChat } from "@/components/ai-chat"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { CustomConnectButton } from "@/components/custom-connect-button"

export default function DappPage() {
  const [useAI, setUseAI] = useState(true)
  const [creationType, setCreationType] = useState("token")

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/20 via-transparent to-transparent blur-3xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Image src="/assets/logo-small.svg" alt="Logo" width={32} height={32} className="relative z-10" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              MintroAI
            </span>
          </Link>
          <CustomConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-24 pb-16 container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - AI Chat */}
          <div className="w-full lg:w-1/2">
            <Card className="bg-black/50 backdrop-blur-xl border-white/10 shadow-xl shadow-primary/10">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <Select value={creationType} onValueChange={(value) => setCreationType(value)}>
                    <SelectTrigger className="w-[180px] bg-black/50 border-white/10 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10">
                      <SelectItem value="token" className="text-white focus:text-white focus:bg-white/10">
                        Token Creation
                      </SelectItem>
                      <SelectItem value="general" className="text-white focus:text-white focus:bg-white/10">
                        General Purpose
                      </SelectItem>
                      {/* <SelectItem value="nft" className="text-white focus:text-white focus:bg-white/10">
                        NFT Creation
                      </SelectItem>
                      <SelectItem value="dao" className="text-white focus:text-white focus:bg-white/10">
                        DAO Creation
                      </SelectItem>
                      <SelectItem value="defi" className="text-white focus:text-white focus:bg-white/10">
                        DeFi Protocol
                      </SelectItem> */}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ai-mode"
                      checked={useAI}
                      onCheckedChange={setUseAI}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor="ai-mode" className="text-white/90">
                      AI Assistant
                    </Label>
                  </div>
                </div>
              </div>
              <AIChat creationType={creationType} />
            </Card>
          </div>

          {/* Right Column - Form */}
          <div className="w-full lg:w-1/2">
            <Card className="bg-black/50 backdrop-blur-xl border-white/10 shadow-xl shadow-primary/10">
              <TokenCreationForm />
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

