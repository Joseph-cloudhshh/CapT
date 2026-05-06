import { useQuery } from "@tanstack/react-query";
import { fetchTrendingCoins, fetchDexLatestProfiles } from "../lib/api";
import { Flame, Zap, ExternalLink, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TrendingFeed() {
  const navigate = useNavigate();
  const { data: trending } = useQuery({ queryKey: ['trending-coins'], queryFn: fetchTrendingCoins, refetchInterval: 60000 });
  const { data: dexProfiles } = useQuery({ queryKey: ['dex-profiles'], queryFn: fetchDexLatestProfiles, refetchInterval: 60000 });

  const trendingCoins = trending?.coins?.slice(0, 8) || [];
  const dexTokens = (Array.isArray(dexProfiles) ? dexProfiles : []).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="glass gold-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-orange-400" />
          <h3 className="text-xs font-display font-semibold uppercase tracking-[0.15em] text-gradient">Trending</h3>
        </div>
        <div className="space-y-0.5">
          {trendingCoins.map((item, i) => {
            const coin = item.item;
            const pct = coin.data?.price_change_percentage_24h?.usd;
            return (
              <div key={coin.id} className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-gold/[0.03] transition-colors group">
                <span className="text-[10px] text-steel font-mono w-3">{i + 1}</span>
                {coin.thumb && <img src={coin.thumb} alt={coin.name} className="w-5 h-5 rounded-full ring-1 ring-gold/20" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{coin.name}</p>
                </div>
                {pct !== undefined && (
                  <span className={`text-xs font-mono ${pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                )}
                <button onClick={() => navigate(`/nexus?coin=${coin.id}`)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-gold-subtle text-gold">
                  <ScanLine className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {dexTokens.length > 0 && (
        <div className="glass gold-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-gold" />
            <h3 className="text-xs font-display font-semibold uppercase tracking-[0.15em] text-gradient">New on DEX</h3>
          </div>
          <div className="space-y-0.5">
            {dexTokens.map((token, i) => (
              <a key={i} href={token.url || '#'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-gold/[0.03] transition-colors">
                {token.icon ? <img src={token.icon} alt="" className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-gold-subtle gold-border" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{token.description || (token.tokenAddress?.slice(0, 8) + '...')}</p>
                  <p className="text-[10px] text-steel">{token.chainId}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-steel" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}