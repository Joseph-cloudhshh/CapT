import HeroTickers from "../components/HeroTickers";
import MarketTable from "../components/MarketTable";
import TrendingFeed from "../components/TrendingFeed";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass gold-border mb-4">
          <Sparkles className="w-3 h-3 text-gold" />
          <span className="text-[10px] font-display uppercase tracking-[0.25em] text-gold">Global Market Intelligence</span>
          <Sparkles className="w-3 h-3 text-gold" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight">
          <span className="text-gradient">Market</span>
          <span className="text-gradient-steel"> Pulse</span>
        </h1>
        <p className="text-steel mt-3 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Institutional-grade crypto intelligence. Live prices, real-time analysis, predictive forecasting.
        </p>
      </motion.div>

      <HeroTickers />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-semibold uppercase tracking-[0.15em] text-gradient">Top Assets</h2>
            <p className="text-[10px] text-steel font-mono">↺ Auto-refresh 30s</p>
          </div>
          <MarketTable />
        </div>
        <aside className="hidden lg:block">
          <TrendingFeed />
        </aside>
      </div>

      <div className="lg:hidden">
        <TrendingFeed />
      </div>
    </div>
  );
}