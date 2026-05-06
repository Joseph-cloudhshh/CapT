import { motion } from "framer-motion";
import NFTCollections from "../components/NFTCollections";
import ChainExplorer from "../components/ChainExplorer";
import WhaleTracker from "../components/WhaleTracker";
import { Layers } from "lucide-react";

export default function NFTGallery() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass gold-border mb-4">
          <Layers className="w-3 h-3 text-gold" />
          <span className="text-[10px] font-display uppercase tracking-[0.25em] text-gold">{"NFT & Emerging Markets"}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-gradient">
          NFT Gallery
        </h1>
        <p className="text-steel mt-3 text-sm max-w-lg mx-auto leading-relaxed">
          Track floor prices, whale movements, and trending chains in real-time.
        </p>
      </motion.div>

      <section>
        <h2 className="text-xs font-display font-semibold uppercase tracking-[0.2em] text-gradient mb-3">Trending Chains</h2>
        <ChainExplorer />
      </section>

      <section>
        <h2 className="text-xs font-display font-semibold uppercase tracking-[0.2em] text-gradient mb-3">Trending Collections</h2>
        <NFTCollections />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs font-display font-semibold uppercase tracking-[0.2em] text-gradient mb-3">Whale Activity</h2>
          <WhaleTracker />
        </div>
        <div>
          <h2 className="text-xs font-display font-semibold uppercase tracking-[0.2em] text-gradient mb-3">On-Chain Intelligence</h2>
          <div className="glass gold-border rounded-xl p-6 h-full flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="w-16 h-16 rounded-2xl bg-gold-subtle gold-border flex items-center justify-center mb-4 animate-gold-pulse">
              <span className="text-3xl">🔮</span>
            </div>
            <p className="font-display font-semibold text-sm tracking-wide text-gradient mb-2">Real-Time On-Chain Analytics</p>
            <p className="text-xs text-steel max-w-xs leading-relaxed">
              Smart money tracking, liquidity shifts, and large transaction surveillance across all major chains.
            </p>
            <div className="flex gap-2 mt-5">
              {['ETH', 'SOL', 'BASE', 'ARB'].map(chain => (
                <span key={chain} className="px-2.5 py-1 rounded-full glass gold-border text-[10px] font-mono text-gold">{chain}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}