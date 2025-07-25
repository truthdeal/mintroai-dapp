import React from "react"

const EXAMPLES = [
  {
    title: "Trending Latest Cryptocurrencies",
    description: "Show me the trending latest cryptocurrencies in the market with their prices and 24hr changes."
  },
  {
    title: "Top Gainers & Losers Today",
    description: "Provide a list of today's top gainers and losers in the crypto market."
  },
  {
    title: "Token Security Analysis",
    description: "Check token security of 0x45A01E4e04F14f7A4a6702c74187c5F6222033cd for honeypot detection and malicious code."
  },
  {
    title: "Smart Contract Source Code",
    description: "Get source code for 0xe9e7cea3dedca5984780bafc599bd69add087d56 and analyze its functions."
  },
  {
    title: "Contract Creator & Deployment",
    description: "Who deployed 0x25931894a86D47441213199621F1F2994e1c39Aa and when was it created?"
  },
  {
    title: "Address Security Check",
    description: "Is 0x6b07E75465654612731139D6F4D5DcEf117E3d55 blacklisted or involved in any scam activities?"
  },
  {
    title: "Gas Prices for Deployment",
    description: "What are the current gas prices on Ethereum for fast contract deployment?"
  },
  {
    title: "DeFi Total Value Locked",
    description: "Get current DeFi TVL across all protocols and analyze the trend."
  },
  {
    title: "Token Holder Analysis",
    description: "Provide the most profitable traders of token 0x25931894a86D47441213199621F1F2994e1c39Aa on Ethereum."
  },
  {
    title: "Crypto Fear & Greed Index",
    description: "What is the current value of fear and greed index in the crypto market?"
  },
  {
    title: "Latest Crypto News",
    description: "Get the latest 5 crypto news and events affecting the market."
  },
  {
    title: "Bitcoin Market Analysis",
    description: "Please provide full analysis report of Bitcoin including price, supply, and market cap."
  },
  {
    title: "Ethereum Network Stats",
    description: "Provide complete analysis of ETH including current price, gas fees, and network activity."
  },
  {
    title: "Exchange Information",
    description: "Provide details of Binance exchange including trading pairs, volume, and trust score."
  },
  {
    title: "Wallet Balance Check",
    description: "Check ETH balance and token holdings of 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on Ethereum."
  },
  {
    title: "Cross-Chain Bridge Analysis",
    description: "List the top cross-chain bridges by volume and their supported networks."
  },
  {
    title: "NFT Collection Stats",
    description: "Fetch NFT collection stats for 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d including floor price and volume."
  },
  {
    title: "Stablecoin Market Data",
    description: "Provide stablecoin market cap distribution across different blockchains."
  },
  {
    title: "DEX Volume Comparison",
    description: "Compare the 24-hour trading volumes between Uniswap and PancakeSwap."
  },
  {
    title: "Yield Farming Opportunities",
    description: "Fetch all yield values for Compound protocol with APY predictions."
  },
  {
    title: "Token Price Predictions",
    description: "Provide hourly price predictions for BTC and ETH for the next 24 hours."
  },
  {
    title: "Phishing Site Detection",
    description: "Analyze https://wallet-connect.xyz and determine if it's a phishing site."
  },
  {
    title: "Wallet Transaction History",
    description: "Provide recent transaction history of wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on Polygon."
  },
  {
    title: "Protocol Revenue Analysis",
    description: "Fetch revenue data for Uniswap-v2 and analyze its weekly growth trends."
  },
  {
    title: "Social Sentiment Analysis",
    description: "What are the top mentioned cryptocurrencies on social media by KOLs right now?"
  }
]

export function GeneralPurposeExamples({ onExampleClick }: { onExampleClick?: (text: string) => void }) {
  return (
    <div
      className="flex flex-col gap-4 p-4 h-[90vh] lg:h-[80vh] overflow-y-auto bg-black/30 rounded-lg"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💡</span>
        <h2 className="text-lg font-semibold text-white/90">Example Questions</h2>
      </div>
      <ul className="space-y-3 flex-1 overflow-y-auto">
        {EXAMPLES.map((ex, i) => (
          <li
            key={i}
            className="bg-white/5 rounded-lg p-3 border border-white/10 cursor-pointer hover:bg-primary/10 transition-colors"
            tabIndex={0}
            onClick={() => onExampleClick?.(ex.description)}
            onKeyDown={e => { if (e.key === 'Enter') onExampleClick?.(ex.description) }}
            aria-label={ex.description}
          >
            <div className="font-medium text-primary mb-1">{ex.title}</div>
            <div className="text-white/80 text-sm">{ex.description}</div>
          </li>
        ))}
      </ul>
      <div className="mt-2 pt-3 border-t border-white/10">
        <div className="text-center">
          <p className="text-white/50 text-xs">
            Powered by ChainGPT • Real-time crypto data & analysis
          </p>
        </div>
      </div>
    </div>
  )
} 