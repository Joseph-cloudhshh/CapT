import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTopCoins, fetchTrendingCoins, fetchNFTList, formatNumber } from "../lib/api";
import AnalysisModalV2 from "../components/AnalysisModalV2";
import { motion } from "framer-motion";
import { Search, Zap, Layers, TrendingUp, Image } from "lucide-react";
import GlassCard from "../components/GlassCard";

export default function Predict() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [analyzing, setAnalyzing] = useState(null);

  // Fetch all data sources
  const { data: topCoins, isLoading: loadingTop } = useQuery({
    queryKey: ['top-coins-predict'],
    queryFn: () => fetchTopCoins(1, 50),
    staleTime: 60000,
    refetchInterval: 300000,
  });

  const { data: trending, isLoading: loadingTrending } = useQuery({
    queryKey: ['trending-all'],
    queryFn: fetchTrendingCoins,
    staleTime: 60000,
    refetchInterval: 300000,
  });

  const { data: nftList, isLoading: loadingNfts } = useQuery({
    queryKey: ['nft-list-predict'],
    queryFn: fetchNFTList,
    staleTime: 60000,
    refetchInterval: 300000,
  });

  // Combine and filter data
  const trendingCoins = trending?.coins?.slice(0, 20) || [];
  const trendingNfts = trending?.nfts?.slice(0, 20) || [];
  const nfts = Array.isArray(nftList) ? nftList.slice(0, 30) : [];

  const filterAssets = (assets, type) => {
    if (!searchQuery) return assets;
    return assets.filter(asset => {
      const name = asset.name?.toLowerCase() || '';
      const symbol = asset.symbol?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return name.includes(query) || symbol.includes(query);
    });
  };

  const filteredTrending = filterAssets(trendingCoins, 'coin');
  const filteredTop = filterAssets(topCoins || [], 'coin');
  const filteredNfts = filterAssets(trendingNfts, 'nft');
  const filteredNftList = filterAssets(nfts, 'nft');

  const tabs = [
    { id: 'trending', label: 'Trending 🔥', icon: TrendingUp },
    { id: 'top', label: 'Top Coins 📊', icon: Zap },
    { id: 'nfts', label: 'Trending NFTs 🖼️', icon: Layers },
    { id: 'all-nfts', label: 'All NFTs 📸', icon: Image },
  ];

  const renderAssets = () => {
    const isLoading = {
      trending: loadingTrending,
      top: loadingTop,
      nfts: loadingTrending,
      'all-nfts': loadingNfts,
    }[activeTab];

    const assets = {
      trending: filteredTrending.map(c => ({ ...c, type: 'coin' })),
      top: filteredTop.map(c => ({ ...c, type: 'coin' })),
      nfts: filteredNfts.map(n => ({ ...n, type: 'nft' })),
      'all-nfts': filteredNftList.map(n => ({ ...n, type: 'nft' })),
    }[activeTab];

    if (isLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass gold-border rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      );
    }

    if (assets.length === 0) {
      return (
        <GlassCard className="py-12 text-center">
          <Search className="w-8 h-8 text-steel mx-auto mb-2" />
          <p className="text-sm text-steel">No assets found matching "{searchQuery}"</p>
        </GlassCard>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {assets.map((asset, i) => (
          <motion.div
            key={asset.id || i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <AssetCard
              asset={asset}
              type={asset.type}
              onAnalyze={() => setAnalyzing({ ...asset, type: asset.type })}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass gold-border mb-4">
          <Zap className="w-3 h-3 text-gold" />
          <span className="text-[10px] font-display uppercase tracking-[0.25em] text-gold">
            AI-Powered Analytics
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-gradient">
          Prediction Engine
        </h1>
        <p className="text-steel mt-3 text-sm max-w-lg mx-auto leading-relaxed">
          Analyze any coin or NFT with AI-driven predictions, live charts, and technical indicators.
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
        <input
          type="text"
          placeholder="Search coins or NFTs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl glass gold-border text-sm font-display focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all font-display text-sm ${
                activeTab === tab.id
                  ? 'glass gold-border text-gold'
                  : 'glass text-steel hover:text-gold'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Assets Grid */}
      {renderAssets()}

      {/* Analysis Modal */}
      {analyzing && (
        <AnalysisModalV2
          coinId={analyzing.id}
          coinName={analyzing.name}
          coinImage={analyzing.thumb || analyzing.image?.thumb}
          assetType={analyzing.type}
          onClose={() => setAnalyzing(null)}
        />
      )}
    </div>
  );
}

function AssetCard({ asset, type, onAnalyze }) {
  const isCoin = type === 'coin';
  const image = isCoin ? asset.image : (asset.thumb || asset.image?.thumb);
  const name = asset.name;
  const symbol = asset.symbol?.toUpperCase();
  const change24h = isCoin ? asset.price_change_percentage_24h : asset.data?.floor_price_in_usd_24h_percentage_change;
  const price = isCoin ? asset.current_price : asset.data?.floor_price;
  const marketCap = isCoin ? asset.market_cap : asset.market_cap_usd;

  const changeNum = parseFloat(change24h || 0);
  const changeColor = changeNum >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="glass gold-border rounded-xl overflow-hidden group cursor-pointer hover:gold-glow transition-all duration-300">
      <div className="aspect-square relative overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gold-subtle">
            {isCoin ? (
              <Zap className="w-10 h-10 text-gold opacity-40" />
            ) : (
              <Image className="w-10 h-10 text-gold opacity-40" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-between p-3">
          <span className={cn(
            "px-2 py-1 rounded text-[10px] font-bold",
            changeColor === 'text-emerald-400'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          )}>
            {changeNum >= 0 ? '+' : ''}{changeNum.toFixed(2)}%
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze();
            }}
            className="w-full px-2 py-1.5 rounded-lg bg-gold/90 text-black text-[11px] font-display font-bold tracking-wide hover:bg-gold transition-colors"
          >
            Analyze
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-display font-semibold text-sm truncate">{name}</p>
            {symbol && <p className="text-[10px] text-steel">{symbol}</p>}
          </div>
        </div>
        {price && <p className="text-xs font-mono text-gold">{formatNumber(price)}</p>}
        {marketCap && (
          <p className="text-[9px] text-steel mt-1">
            {isCoin ? 'Cap: ' : 'Market: '}{formatNumber(marketCap)}
          </p>
        )}
      </div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
