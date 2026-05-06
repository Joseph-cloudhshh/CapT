import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Target, Clock, Calendar, CalendarDays, ShieldCheck, Activity, Zap, TrendingUp, TrendingDown, BarChart2, Flame, Minus, RefreshCw } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { fetchAssetDetail, fetchAssetChart, calculateMTA, calculateRSI, formatNumber } from "../lib/api";
import { cn } from "@/lib/utils";
import SparklineChart from "./SparklineChart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// ── Prediction engine ───────────────────────────────────────────────────────
function calcSMA(arr, n) {
  if (arr.length < n) return arr[arr.length - 1] || 0;
  return arr.slice(-n).reduce((a, b) => a + b, 0) / n;
}

function calcVolatility(prices) {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

function buildPrediction(prices, volumes, days) {
  if (!prices || prices.length < 10) return { score: 0.5, signal: "Neutral", targetPrice: null, changePct: 0, confidence: 50 };

  const currentPrice = prices[prices.length - 1];
  const liqRatio = volumes.length > 0 ? Math.min(1, (volumes[volumes.length - 1] / Math.max(...prices)) * 0.001) : 0.5;

  const window = Math.min(prices.length, days === 1 ? 24 : days === 7 ? 168 : prices.length);
  const mta = calculateMTA(prices.slice(-window), volumes.slice(-window), liqRatio);

  const sma7 = calcSMA(prices, 7);
  const sma25 = calcSMA(prices, 25);
  const smaCross = sma7 > sma25 ? 0.65 : 0.35;

  const rsi = calculateRSI(prices);
  const rsiScore = rsi > 70 ? 0.3 : rsi < 30 ? 0.7 : 0.5 + (50 - rsi) / 200;

  const vol = calcVolatility(prices.slice(-Math.min(prices.length, 30)));
  const compositeScore = mta.score * 0.45 + smaCross * 0.3 + rsiScore * 0.25;

  const dailyReturn = (compositeScore - 0.5) * 0.025;
  const projected = currentPrice * Math.pow(1 + dailyReturn, days);
  const changePct = ((projected - currentPrice) / currentPrice) * 100;

  const confidence = Math.round(Math.max(30, Math.min(92, 75 - vol * 300)));

  const signal = compositeScore > 0.58 ? "Bullish" : compositeScore < 0.42 ? "Bearish" : "Neutral";

  const smaCrossText = sma7 > sma25 ? `SMA7 (${formatNumber(sma7)}) crossed above SMA25 (${formatNumber(sma25)}) — bullish crossover.` : `SMA7 (${formatNumber(sma7)}) below SMA25 (${formatNumber(sma25)}) — bearish crossover.`;
  const rsiText = rsi > 70 ? `RSI ${rsi.toFixed(1)}: overbought — watch for pullback.` : rsi < 30 ? `RSI ${rsi.toFixed(1)}: oversold — bounce potential.` : `RSI ${rsi.toFixed(1)}: neutral momentum.`;
  const volText = `Daily volatility ${(vol * 100).toFixed(2)}% — ${vol > 0.04 ? 'high' : vol > 0.02 ? 'moderate' : 'low'} risk environment.`;

  return {
    score: compositeScore,
    signal,
    targetPrice: projected,
    changePct,
    confidence,
    rsi,
    sma7,
    sma25,
    volatility: vol,
    reasoning: `${smaCrossText} ${rsiText} ${volText} ${mta.reasoning}`,
  };
}

const sigColors = {
  Bullish: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", change: "text-emerald-400", bar: "from-emerald-500 to-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/15" },
  Bearish: { badge: "bg-red-500/15 text-red-400 border-red-500/30", change: "text-red-400", bar: "from-red-500 to-red-400", bg: "bg-red-500/5 border-red-500/15" },
  Neutral: { badge: "bg-amber-500/15 text-amber-400 border-amber-500/30", change: "text-amber-400", bar: "from-amber-500 to-amber-400", bg: "bg-amber-500/5 border-amber-500/15" },
};

function ForecastTier({ icon: Icon, label, days, pred, currentPrice }) {
  const c = sigColors[pred.signal];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass gold-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold-subtle flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="text-sm font-display font-semibold tracking-wide">{label}</span>
        </div>
        <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border", c.badge)}>{pred.signal}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-steel">
          <span>Confidence</span><span className="text-gold">{pred.confidence}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pred.confidence}%` }} transition={{ duration: 0.7, delay: 0.1 }}
            className={cn("h-full rounded-full bg-gradient-to-r", c.bar)} />
        </div>
      </div>

      {pred.targetPrice && (
        <div className={cn("rounded-lg p-3 border flex items-center justify-between", c.bg)}>
          <div>
            <p className="text-[9px] text-steel font-display uppercase tracking-wider">Price Target</p>
            <p className="text-lg font-bold font-mono">{formatNumber(pred.targetPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-steel font-display uppercase tracking-wider">Expected Move</p>
            <p className={cn("text-xl font-bold font-mono", c.change)}>
              {pred.changePct >= 0 ? '+' : ''}{pred.changePct.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-steel leading-relaxed border-l-2 border-gold/20 pl-3">{pred.reasoning}</p>
    </motion.div>
  );
}

function IndicatorRow({ label, value, color, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-steel" />
        <span className="text-[11px] text-steel font-display uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn("text-sm font-bold font-mono", color)}>{value}</span>
    </div>
  );
}

function PriceChart({ data, isLoading }) {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="glass gold-border rounded-xl p-4 h-64 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-8 h-8 text-gold/50 mx-auto mb-2" />
          <p className="text-sm text-steel">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass gold-border rounded-xl p-4">
      <p className="text-[10px] font-display uppercase tracking-wider text-gold mb-3">Price Chart (30-Day)</p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4a573" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#d4a573" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis 
            dataKey="date" 
            stroke="#888" 
            style={{ fontSize: '11px' }} 
            tick={{ fill: '#888' }}
          />
          <YAxis 
            stroke="#888" 
            style={{ fontSize: '11px' }} 
            tick={{ fill: '#888' }}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(4,6,10,0.9)', 
              border: '1px solid rgba(212,165,115,0.2)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#d4a573' }}
            formatter={(value) => formatNumber(value)}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#d4a573" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function VolumeChart({ data, isLoading }) {
  if (isLoading || !data || data.length === 0) return null;

  return (
    <div className="glass gold-border rounded-xl p-4">
      <p className="text-[10px] font-display uppercase tracking-wider text-gold mb-3">Volume Chart (30-Day)</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis 
            dataKey="date" 
            stroke="#888" 
            style={{ fontSize: '11px' }}
            tick={{ fill: '#888' }}
          />
          <YAxis 
            stroke="#888" 
            style={{ fontSize: '11px' }}
            tick={{ fill: '#888' }}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(4,6,10,0.9)', 
              border: '1px solid rgba(212,165,115,0.2)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#d4a573' }}
            formatter={(value) => formatNumber(value)}
          />
          <Area 
            type="monotone" 
            dataKey="volume" 
            stroke="#a78bfa" 
            fill="#a78bfa" 
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnalysisModalV2({ coinId, coinName, coinImage, onClose, assetType = 'auto' }) {
  const [chartTimeline, setChartTimeline] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [coinQuery, chartQuery] = useQueries({
    queries: [
      { 
        queryKey: ['asset-detail', coinId, assetType], 
        queryFn: () => fetchAssetDetail(coinId, assetType),
        staleTime: 60000, 
        gcTime: 300000,
        retry: 2
      },
      { 
        queryKey: ['asset-chart', coinId, chartTimeline, assetType], 
        queryFn: () => fetchAssetChart(coinId, chartTimeline, assetType),
        staleTime: 120000, 
        gcTime: 600000,
        retry: 2
      },
    ],
  });

  const coinData = coinQuery.data;
  const chartData = chartQuery.data;
  const loading = coinQuery.isLoading || chartQuery.isLoading;

  // Format chart data for recharts
  const chartForDisplay = useMemo(() => {
    if (!chartData?.prices) return [];
    const priceData = chartData.prices || [];
    const volumeData = chartData.total_volumes || [];
    
    return priceData.map((point, idx) => ({
      date: new Date(point[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: point[1],
      volume: volumeData[idx]?.[1] || 0,
      timestamp: point[0]
    })).slice(-chartTimeline);
  }, [chartData, chartTimeline]);

  const analysis = useMemo(() => {
    if (!coinData || !chartData) return null;
    const prices = chartData.prices?.map(p => p[1]) || [];
    const volumes = chartData.total_volumes?.map(v => v[1]) || [];
    const currentPrice = coinData.market_data?.current_price?.usd || 0;

    const rsi = calculateRSI(prices);
    const sma7 = calcSMA(prices, 7);
    const sma25 = calcSMA(prices, 25);
    const vol = calcVolatility(prices.slice(-30));

    return {
      currentPrice,
      rsi,
      sma7,
      sma25,
      volatility: vol,
      change24h: coinData.market_data?.price_change_percentage_24h,
      change7d: coinData.market_data?.price_change_percentage_7d,
      ath: coinData.market_data?.ath?.usd,
      atl: coinData.market_data?.atl?.usd,
      marketCap: coinData.market_data?.market_cap?.usd,
      sparkline: prices.slice(-168),
      tiers: [
        { icon: Clock, label: "24-Hour Forecast", days: 1, pred: buildPrediction(prices, volumes, 1) },
        { icon: Calendar, label: "1-Week Forecast", days: 7, pred: buildPrediction(prices, volumes, 7) },
        { icon: CalendarDays, label: "1-Month Forecast", days: 30, pred: buildPrediction(prices, volumes, 30) },
      ],
    };
  }, [coinData, chartData]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      coinQuery.refetch();
      chartQuery.refetch();
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [autoRefresh, coinQuery, chartQuery]);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(4,6,10,0.9)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: "easeOut" }}
          className="glass-strong gold-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto gold-glow"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gold/10 sticky top-0 glass-strong z-10">
            <div className="flex items-center gap-3 flex-1">
              {coinImage && <img src={coinImage} alt={coinName} className="w-10 h-10 rounded-full ring-2 ring-gold/25" />}
              <div>
                <h2 className="font-display font-bold tracking-wide text-gradient text-lg">{coinName}</h2>
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3 h-3 text-gold" />
                  <span className="text-[10px] text-steel font-display uppercase tracking-[0.2em]">CapT Intel · Prediction Engine</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  coinQuery.refetch();
                  chartQuery.refetch();
                }}
                className="w-8 h-8 rounded-lg glass gold-border flex items-center justify-center hover:bg-gold/10 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4 text-steel" />
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-lg glass gold-border flex items-center justify-center hover:bg-gold/10 transition-colors">
                <X className="w-4 h-4 text-steel" />
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gold-subtle gold-border flex items-center justify-center animate-gold-pulse">
                  <Zap className="w-7 h-7 text-gold" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-gold/30 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gold font-display tracking-widest uppercase">Crunching Data</p>
                <p className="text-[10px] text-steel mt-1">Running MTA · SMA · RSI · Volatility Engine</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && analysis && (
            <div className="p-5 space-y-4">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: "Current Price", value: formatNumber(analysis.currentPrice), icon: Target, color: "text-gold" },
                  { label: "RSI (14)", value: analysis.rsi.toFixed(1), icon: Activity, color: analysis.rsi > 70 ? 'text-red-400' : analysis.rsi < 30 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: "24h Change", value: analysis.change24h ? `${analysis.change24h >= 0 ? '+' : ''}${analysis.change24h.toFixed(2)}%` : '—', icon: analysis.change24h >= 0 ? TrendingUp : TrendingDown, color: analysis.change24h >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: "Volatility", value: `${(analysis.volatility * 100).toFixed(2)}%/day`, icon: BarChart2, color: analysis.volatility > 0.04 ? 'text-red-400' : analysis.volatility > 0.02 ? 'text-amber-400' : 'text-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="glass gold-border rounded-xl p-3 text-center">
                    <s.icon className={cn("w-4 h-4 mx-auto mb-1.5", s.color)} />
                    <p className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</p>
                    <p className="text-[9px] text-steel font-display uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Timeline selector */}
              <div className="flex gap-2">
                {[7, 14, 30, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setChartTimeline(days)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-display font-semibold tracking-wide transition-all",
                      chartTimeline === days
                        ? "glass gold-border text-gold"
                        : "glass text-steel hover:text-gold"
                    )}
                  >
                    {days}D
                  </button>
                ))}
              </div>

              {/* Live Charts */}
              <PriceChart data={chartForDisplay} isLoading={loading} />
              <VolumeChart data={chartForDisplay} isLoading={loading} />

              {/* Sparkline */}
              {analysis.sparkline.length > 0 && (
                <div className="glass gold-border rounded-xl p-3 h-20">
                  <p className="text-[9px] text-steel font-display uppercase tracking-wider mb-1">7-Day Price Action</p>
                  <SparklineChart data={analysis.sparkline} color={analysis.change7d >= 0 ? "#22c55e" : "#ef4444"} height={48} />
                </div>
              )}

              {/* Technical Indicators */}
              <div className="glass gold-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-gold" />
                    <p className="text-[10px] font-display uppercase tracking-[0.2em] text-gold">Technical Indicators</p>
                  </div>
                  <label className="flex items-center gap-2 text-[10px]">
                    <input 
                      type="checkbox" 
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-3 h-3"
                    />
                    <span className="text-steel">Auto-Refresh</span>
                  </label>
                </div>
                <IndicatorRow label="SMA 7" value={formatNumber(analysis.sma7)} color={analysis.sma7 > analysis.sma25 ? "text-emerald-400" : "text-red-400"} icon={TrendingUp} />
                <IndicatorRow label="SMA 25" value={formatNumber(analysis.sma25)} color="text-foreground" icon={Minus} />
                <IndicatorRow label="SMA Cross" value={analysis.sma7 > analysis.sma25 ? "Bullish ↑" : "Bearish ↓"} color={analysis.sma7 > analysis.sma25 ? "text-emerald-400" : "text-red-400"} icon={Activity} />
                <IndicatorRow label="Market Cap" value={formatNumber(analysis.marketCap)} color="text-gold" icon={BarChart2} />
                <IndicatorRow label="ATH" value={formatNumber(analysis.ath)} color="text-emerald-400" icon={TrendingUp} />
                <IndicatorRow label="ATL" value={formatNumber(analysis.atl)} color="text-red-400" icon={TrendingDown} />
              </div>

              {/* Forecast Tiers */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                  <p className="text-[10px] font-display uppercase tracking-[0.2em] text-gold">Price Predictions</p>
                </div>
              </div>
              {analysis.tiers.map((tier, i) => (
                <motion.div key={tier.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <ForecastTier {...tier} currentPrice={analysis.currentPrice} />
                </motion.div>
              ))}

              <p className="text-[9px] text-steel/40 text-center leading-relaxed pt-1">
                Powered by MTA · SMA Crossover · RSI · Volatility Cone analysis. Charts update every minute. Not financial advice.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
