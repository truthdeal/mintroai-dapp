import '@rainbow-me/rainbowkit/styles.css'
import "./globals.css"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import type { Metadata } from 'next'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MintroAI DApp",
  description: "AI-powered Smart Contract Creation Platform",
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
