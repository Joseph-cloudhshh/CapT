import GlassCard from "./GlassCard";
import { formatNumber, calculateTrustScore } from "../lib/api";
import { Shield, TrendingUp, TrendingDown, Droplets, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function IntelDashboard({ coinData, dexData }) {
  if (!coinData && !dexData) return null;

  const price = coinData?.market_data?.current_price?.usd || dexData?.priceUsd;
  const marketCap = coinData?.market_data?.market_cap?.usd || dexData?.fdv;
  const volume24h = coinData?.market_data?.total_volume?.usd || dexData?.volume?.h24;
  const fdv = coinData?.market_data?.fully_diluted_valuation?.usd || dexData?.fdv;
  const change24h = coinData?.market_data?.price_change_percentage_24h || dexData?.priceChange?.h24;
  const liquidity = dexData?.liquidity?.usd || (coinData?.market_data?.total_volume?.usd * 0.05);
  const trustScore = calculateTrustScore(liquidity, marketCap);

  const stats = [
    { label: "Price", value: price ? formatNumber(parseFloat(price)) : "—", icon: DollarSign },
    { label: "Market Cap", value: marketCap ? formatNumber(marketCap) : "—", icon: BarChart3 },
    { label: "24h Volume", value: volume24h ? formatNumber(parseFloat(volume24h)) : "—", icon: TrendingUp },
    { label: "FDV", value: fdv ? formatNumber(fdv) : "—", icon: TrendingDown },
    { label: "Liquidity", value: liquidity ? formatNumber(liquidity) : "—", icon: Droplets },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {stats.map(s => (
          <div key={s.label} className="glass gold-border rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <s.icon className="w-3 h-3 text-gold" />
              <span className="text-[9px] text-steel font-display uppercase tracking-[0.15em]">{s.label}</span>
            </div>
            <p className="text-sm font-bold font-mono">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <GlassCard className="p-4 flex items-center gap-3 gold-border" animate={false}>
          <div className="w-10 h-10 rounded-xl bg-gold-subtle gold-border flex items-center justify-center">
            <Shield className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-[9px] text-steel font-display uppercase tracking-[0.15em]">Trust Score</p>
            <p className={cn("text-base font-bold font-display", trustScore.color)}>{trustScore.label}</p>
            <p className="text-[10px] text-steel font-mono">Liq/MCap {(trustScore.score * 100).toFixed(2)}%</p>
          </div>
        </GlassCard>

        <GlassCard className={cn("p-4 flex items-center gap-3 gold-border", change24h >= 0 ? "bg-emerald-500/[0.03]" : "bg-red-500/[0.03]")} animate={false}>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", change24h >= 0 ? "bg-emerald-500/15" : "bg-red-500/15")}>
            {change24h >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          </div>
          <div>
            <p className="text-[9px] text-steel font-display uppercase tracking-[0.15em]">24h Performance</p>
            <p className={cn("text-base font-bold font-mono", change24h >= 0 ? "text-emerald-400" : "text-red-400")}>
              {change24h ? `${change24h >= 0 ? '+' : ''}${parseFloat(change24h).toFixed(2)}%` : '—'}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}