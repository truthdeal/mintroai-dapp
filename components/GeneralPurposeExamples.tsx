import React from "react"

const EXAMPLES = [
  {
    title: "Trending Latest",
    description: "Show me the trending latest cryptocurrencies in the market."
  },
  {
    title: "Top Gainers & Losers",
    description: "Provide a list of today's top gainers and losers in the crypto market."
  },
  {
    title: "Coin Price, Supply & General Info",
    description: "Please provide full analysis report of coin BTC/ETH/BNB..."
  },
  {
    title: "Exchanges Information",
    description: "Provide details of the exchange Binance."
  },
  {
    title: "Crypto Fear and Greed Index",
    description: "What is the current value of fear and greed index in the crypto market?"
  },
  {
    title: "Latest News",
    description: "Get the latest 5 crypto news and events."
  },
  {
    title: "Token Security (Smart Contract)",
    description: "Check token security of 0x45A01E4e04F14f7A4a6702c74187c5F6222033cd"
  },
  {
    title: "Address Security (Smart Contract)",
    description: "Is 0x6b07E75465654612731139D6F4D5DcEf117E3d55 blacklisted?"
  },
  {
    title: "Source Code of Contract",
    description: "Get source code for 0xe9e7cea3..."
  },
  {
    title: "Creator of Contract",
    description: "Who deployed 0xe9e7cea3... ?"
  },
  {
    title: "BNB/ETH Balance of an Address",
    description: "Check ETH balance of 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on Ethereum."
  },
  {
    title: "BEP20/ERC20 Token Transfers of an Address",
    description: "Which BEP-20 tokens does 0xd9b4753c... hold?"
  }
]

export function GeneralPurposeExamples() {
  return (
    <div
      className="flex flex-col gap-4 p-4 min-h-[350px] md:min-h-[420px] max-h-[70vh] overflow-y-auto bg-black/30 rounded-lg"
    >
      <h2 className="text-lg font-semibold text-white/90 mb-2">Example Questions</h2>
      <ul className="space-y-3">
        {EXAMPLES.map((ex, i) => (
          <li key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="font-medium text-primary mb-1">{ex.title}</div>
            <div className="text-white/80 text-sm">{ex.description}</div>
          </li>
        ))}
      </ul>
    </div>
  )
} 