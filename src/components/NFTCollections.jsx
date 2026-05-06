import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTrendingCoins } from "../lib/api";
import AnalysisModal from "./AnalysisModal";
import { motion } from "framer-motion";
import { Image, ScanLine } from "lucide-react";

export default function NFTCollections() {
  const [analyzing, setAnalyzing] = useState(null);
  const { data: trending, isLoading } = useQuery({
    queryKey: ['trending-nfts'],
    queryFn: fetchTrendingCoins,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const nfts = trending?.nfts?.slice(0, 8) || [];

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => <div key={i} className="glass gold-border rounded-xl h-52 animate-pulse" />)}
    </div>
  );

  if (nfts.length === 0) return (
    <div className="glass gold-border rounded-xl py-12 text-center">
      <Image className="w-8 h-8 text-steel mx-auto mb-2" />
      <p className="text-sm text-steel">No trending NFT data available</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {nfts.map((nft, i) => (
          <motion.div key={nft.id || i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="glass gold-border rounded-xl overflow-hidden group cursor-pointer hover:gold-glow transition-all duration-300">
              <div className="aspect-square relative overflow-hidden bg-muted">
                {nft.thumb ? (
                  <img src={nft.thumb} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gold-subtle">
                    <Image className="w-10 h-10 text-gold opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                  <button
                    onClick={() => nft.id && setAnalyzing({ id: nft.id, name: nft.name, image: nft.thumb })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/90 text-black text-xs font-display font-bold tracking-wide"
                  >
                    <ScanLine className="w-3 h-3" />
                    Analyze
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-display font-medium text-sm truncate">{nft.name}</p>
                <div className="flex items-center justify-between mt-1">
                  {nft.data?.floor_price && <p className="text-[10px] text-steel">Floor: {nft.data.floor_price}</p>}
                  {nft.data?.floor_price_in_usd_24h_percentage_change !== undefined && (
                    <span className={`text-[10px] font-mono font-bold ${parseFloat(nft.data.floor_price_in_usd_24h_percentage_change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {parseFloat(nft.data.floor_price_in_usd_24h_percentage_change) >= 0 ? '+' : ''}{parseFloat(nft.data.floor_price_in_usd_24h_percentage_change).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {analyzing && (
        <AnalysisModal
          coinId={analyzing.id}
          coinName={analyzing.name}
          coinImage={analyzing.image}
          onClose={() => setAnalyzing(null)}
        />
      )}
    </>
  );
}