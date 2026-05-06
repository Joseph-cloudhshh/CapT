import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCoinDetail, fetchCoinMarketChart, fetchDexPairsByToken } from "../lib/api";
import SearchBar from "../components/SearchBar";
import IntelDashboard from "../components/IntelDashboard";
import PredictiveEngine from "../components/PredictiveEngine";
import PriceChart from "../components/PriceChart";
import AnalysisModal from "../components/AnalysisModal";
import { motion } from "framer-motion";
import { Loader2, ScanLine, Crosshair } from "lucide-react";

export default function Nexus() {
  const [selected, setSelected] = useState(null);
  const [coinId, setCoinId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const coin = params.get('coin');
    if (coin) {
      setCoinId(coin);
      setSelected({ id: coin, name: coin, type: 'coingecko' });
      setShowModal(true);
    }
  }, []);

  const handleSelect = (item) => {
    setSelected(item);
    if (item.type === 'coingecko') {
      setCoinId(item.id);
    }
    setShowModal(true);
  };

  const { data: coinData, isLoading } = useQuery({
    queryKey: ['coin-detail', coinId],
    queryFn: () => fetchCoinDetail(coinId),
    enabled: !!coinId,
    staleTime: 30000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['coin-chart', coinId],
    queryFn: () => fetchCoinMarketChart(coinId, 30),
    enabled: !!coinId,
    staleTime: 60000,
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass gold-border mb-4">
          <Crosshair className="w-3 h-3 text-gold" />
          <span className="text-[10px] font-display uppercase tracking-[0.25em] text-gold">Intelligence Engine</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-gradient">The Nexus</h1>
        <p className="text-steel mt-3 text-sm max-w-lg mx-auto leading-relaxed">
          Search any asset. Receive deep predictive analysis with price targets.
        </p>
      </motion.div>

      <SearchBar onSelectCoin={handleSelect} initialQuery={selected?.name || ""} />

      {isLoading && selected && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
        </div>
      )}

      {!isLoading && coinData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              {coinData.image?.large && <img src={coinData.image.large} alt={coinData.name} className="w-12 h-12 rounded-full ring-2 ring-gold/25" />}
              <div>
                <h2 className="text-2xl font-display font-bold text-gradient">{coinData.name}</h2>
                <p className="text-xs text-steel uppercase font-mono">{coinData.symbol} {coinData.market_cap_rank && `· #${coinData.market_cap_rank}`}</p>
              </div>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-subtle gold-border-strong text-gold font-display text-sm font-semibold tracking-wide hover:gold-glow-strong hover:bg-gold/10 transition-all duration-200">
              <ScanLine className="w-4 h-4" />
              Analyze
            </button>
          </div>

          <IntelDashboard coinData={coinData} dexData={null} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriceChart chartData={chartData} />
            <PredictiveEngine coinData={coinData} chartData={chartData} />
          </div>
        </motion.div>
      )}

      {!isLoading && !coinData && !selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-gold-subtle gold-border flex items-center justify-center mx-auto mb-4 animate-gold-pulse">
            <ScanLine className="w-10 h-10 text-gold" />
          </div>
          <p className="text-steel text-sm max-w-xs mx-auto leading-relaxed">
            Search any cryptocurrency or paste a contract address for in-depth predictive analysis.
          </p>
        </motion.div>
      )}

      {showModal && coinId && (
        <AnalysisModal
          coinId={coinId}
          coinName={coinData?.name || selected?.name || coinId}
          coinImage={coinData?.image?.large}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}