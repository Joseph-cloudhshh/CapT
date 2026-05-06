import { useMemo } from "react";
import GlassCard from "./GlassCard";
import { calculateMTA, calculateRSI, formatNumber } from "../lib/api";
import { cn } from "@/lib/utils";
import { Brain, Clock, Calendar, CalendarDays, Target } from "lucide-react";
import { motion } from "framer-motion";

function PredictPrice(currentPrice, score, days) {
  if (!currentPrice) return null;
  const dailyBias = (score - 0.5) * 0.04;
  const projected = currentPrice * Math.pow(1 + dailyBias, days);
  return { price: projected, change: ((projected - currentPrice) / currentPrice) * 100 };
}

export default function PredictiveEngine({ coinData, chartData }) {
  const result = useMemo(() => {
    if (!coinData || !chartData) return null;
    const prices = chartData.prices?.map(p => p[1]) || [];
    const volumes = chartData.total_volumes?.map(v => v[1]) || [];
    const currentPrice = coinData.market_data?.current_price?.usd || 0;
    const marketCap = coinData.market_data?.market_cap?.usd || 0;
    const volume = coinData.market_data?.total_volume?.usd || 0;
    const liqRatio = marketCap > 0 ? (volume * 0.05) / marketCap : 0.5;
    const rsi = calculateRSI(prices);
    const short = calculateMTA(prices.slice(-24), volumes.slice(-24), liqRatio);
    const medium = calculateMTA(prices.slice(-168), volumes.slice(-168), liqRatio);
    const long = calculateMTA(prices, volumes, liqRatio);
    return {
      currentPrice, rsi,
      tiers: [
        { icon: Clock, label: "24-Hour", days: 1, ...short },
        { icon: Calendar, label: "1-Week", days: 7, ...medium },
        { icon: CalendarDays, label: "1-Month", days: 30, ...long },
      ]
    };
  }, [coinData, chartData]);

  if (!result) return null;

  const sigColor = { Bullish: "text-emerald-400", Neutral: "text-amber-400", Bearish: "text-red-400" };
  const barColor = { Bullish: "from-emerald-500 to-emerald-400", Neutral: "from-amber-500 to-amber-400", Bearish: "from-red-500 to-red-400" };

  return (
    <GlassCard className="p-0 overflow-hidden gold-border" animate={false}>
      <div className="px-5 py-4 border-b border-gold/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gold-subtle gold-border flex items-center justify-center">
          <Brain className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm tracking-wide text-gradient">Predictive Engine</h3>
          <p className="text-[10px] text-steel font-display uppercase tracking-wider">Multi-Factor Analysis</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] text-steel font-mono">RSI</p>
          <p className={cn("text-sm font-bold font-mono", result.rsi > 70 ? 'text-red-400' : result.rsi < 30 ? 'text-emerald-400' : 'text-gold')}>{result.rsi.toFixed(1)}</p>
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {result.tiers.map((tier, i) => {
          const pred = PredictPrice(result.currentPrice, tier.score, tier.days);
          return (
            <motion.div key={tier.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <tier.icon className="w-4 h-4 text-steel" />
                  <span className="text-sm font-display font-medium tracking-wide">{tier.label}</span>
                </div>
                <span className={cn("text-sm font-bold font-display", sigColor[tier.signal])}>{tier.signal}</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(tier.score * 100)}%` }} transition={{ duration: 0.7, delay: 0.3 + i * 0.1 }}
                  className={cn("h-full rounded-full bg-gradient-to-r", barColor[tier.signal])} />
              </div>
              {pred && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-gold" />
                    <span className="font-mono font-semibold">{formatNumber(pred.price)}</span>
                  </div>
                  <span className={cn("font-mono font-bold", pred.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {pred.change >= 0 ? '+' : ''}{pred.change.toFixed(2)}%
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}