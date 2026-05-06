import { useQuery } from "@tanstack/react-query";
import { fetchTopCoins, formatNumber, formatPercent } from "../lib/api";
import SparklineChart from "./SparklineChart";
import { Loader2, ScanLine } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function MarketTable() {
  const navigate = useNavigate();
  const { data: coins, isLoading } = useQuery({
    queryKey: ['top-coins'],
    queryFn: () => fetchTopCoins(1, 50),
    refetchInterval: 30000,
    staleTime: 20000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
        <span className="ml-2 text-sm text-muted-foreground font-mono">Loading market data...</span>
      </div>
    );
  }

  return (
    <div className="glass gold-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/10">
              <th className="text-left px-4 py-3 text-[10px] font-display font-medium text-steel uppercase tracking-[0.15em]">#</th>
              <th className="text-left px-4 py-3 text-[10px] font-display font-medium text-steel uppercase tracking-[0.15em]">Asset</th>
              <th className="text-right px-4 py-3 text-[10px] font-display font-medium text-steel uppercase tracking-[0.15em]">Price</th>
              <th className="text-right px-4 py-3 text-[10px] font-display font-medium text-steel uppercase tracking-[0.15em] hidden sm:table-cell">24h</th>
              <th className="text-right px-4 py-3 text-[10px] font-display font-medium text-steel uppercase tracking-[0.15em] hidden md:table-cell">Mkt Cap</th>
              <th className="text-right px-4 py-3 text-[10px] font-display font-medium text-steel uppercase tracking-[0.15em] hidden lg:table-cell">7d</th>
              <th className="px-4 py-3 text-[10px] font-display font-medium text-steel uppercase tracking-[0.15em]">Action</th>
            </tr>
          </thead>
          <tbody>
            {coins?.map((coin, i) => {
              const change = coin.price_change_percentage_24h;
              return (
                <motion.tr
                  key={coin.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.01, 0.3) }}
                  className="border-b border-white/[0.02] hover:bg-gold/[0.02] transition-colors group"
                >
                  <td className="px-4 py-3 text-steel font-mono text-xs">{coin.market_cap_rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" />
                        <div className="absolute inset-0 rounded-full ring-1 ring-gold/20" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{coin.name}</p>
                        <p className="text-[10px] text-steel uppercase font-mono">{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-sm">
                    {formatNumber(coin.current_price)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-xs hidden sm:table-cell font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercent(change)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-steel hidden md:table-cell">
                    {formatNumber(coin.market_cap)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="w-[90px] ml-auto">
                      <SparklineChart data={coin.sparkline_in_7d?.price} color={change >= 0 ? "#22c55e" : "#ef4444"} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/nexus?coin=${coin.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-subtle gold-border text-gold text-xs font-medium hover:gold-glow-strong hover:bg-gold/10 transition-all duration-200 font-display tracking-wide whitespace-nowrap"
                    >
                      <ScanLine className="w-3 h-3" />
                      Analyze
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}