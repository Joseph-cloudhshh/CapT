import { useQuery } from "@tanstack/react-query";
import { fetchGlobalData, formatNumber } from "../lib/api";
import { TrendingUp, Bitcoin, DollarSign, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const tickerDefs = [
  { label: "Total Market Cap", key: "total_market_cap", changeKey: "market_cap_change_percentage_24h_usd", icon: DollarSign, suffix: "" },
  { label: "BTC Dominance", key: "btc_dom", icon: Bitcoin },
  { label: "24h Volume", key: "total_volume", icon: BarChart3 },
  { label: "Active Assets", key: "active_cryptocurrencies", icon: TrendingUp },
];

export default function HeroTickers() {
  const { data: global, isLoading } = useQuery({
    queryKey: ['global-data'],
    queryFn: fetchGlobalData,
    refetchInterval: 30000,
  });

  const values = {
    total_market_cap: global ? formatNumber(global.total_market_cap?.usd) : null,
    btc_dom: global ? `${global.market_cap_percentage?.btc?.toFixed(1)}%` : null,
    total_volume: global ? formatNumber(global.total_volume?.usd) : null,
    active_cryptocurrencies: global?.active_cryptocurrencies?.toLocaleString(),
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tickerDefs.map((t, i) => (
        <motion.div key={t.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <div className="glass gold-border rounded-xl p-4 h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-display uppercase tracking-[0.15em] text-steel">{t.label}</p>
              <div className="w-7 h-7 rounded-lg bg-gold-subtle flex items-center justify-center">
                <t.icon className="w-3.5 h-3.5 text-gold" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-display tracking-tight text-gradient">
              {isLoading ? <span className="inline-block w-20 h-7 rounded bg-muted animate-pulse" /> : values[t.key] || '—'}
            </p>
            {t.changeKey && global && (
              <p className={`text-[11px] mt-1 font-mono ${global[t.changeKey] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {global[t.changeKey] >= 0 ? '▲' : '▼'} {Math.abs(global[t.changeKey]).toFixed(2)}% 24h
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}