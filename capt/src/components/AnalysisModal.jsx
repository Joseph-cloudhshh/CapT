import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Target, Clock, Calendar, CalendarDays, ShieldCheck, Activity, Zap, TrendingUp, TrendingDown, BarChart2, Flame, Minus } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { fetchCoinDetail, fetchCoinMarketChart, calculateMTA, calculateRSI, formatNumber } from "../lib/api";
import { cn } from "@/lib/utils";
import SparklineChart from "./SparklineChart";

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

  // MTA base score
  const window = Math.min(prices.length, days === 1 ? 24 : days === 7 ? 168 : prices.length);
  const mta = calculateMTA(prices.slice(-window), volumes.slice(-window), liqRatio);

  // SMA crossover signal
  const sma7 = calcSMA(prices, 7);
  const sma25 = calcSMA(prices, 25);
  const smaCross = sma7 > sma25 ? 0.65 : 0.35;

  // RSI signal
  const rsi = calculateRSI(prices);
  const rsiScore = rsi > 70 ? 0.3 : rsi < 30 ? 0.7 : 0.5 + (50 - rsi) / 200;

  // Volatility-adjusted projection
  const vol = calcVolatility(prices.slice(-Math.min(prices.length, 30)));
  const compositeScore = mta.score * 0.45 + smaCross * 0.3 + rsiScore * 0.25;

  // Price target with volatility cone
  const dailyReturn = (compositeScore - 0.5) * 0.025;
  const projected = currentPrice * Math.pow(1 + dailyReturn, days);
  const changePct = ((projected - currentPrice) / currentPrice) * 100;

  // Confidence = inverse of volatility, scaled
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
// ────────────────────────────────────────────────────────────────────────────

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

      {/* Confidence bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-steel">
          <span>Confidence</span><span className="text-gold">{pred.confidence}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pred.confidence}%` }} transition={{ duration: 0.7, delay: 0.1 }}
            className={cn("h-full rounded-full bg-gradient-to-r", c.bar)} />
        </div>
      </div>

      {/* Price target box */}
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

      {/* Reasoning */}
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

export default function AnalysisModal({ coinId, coinName, coinImage, onClose }) {
  // Parallel queries with aggressive caching
  const [coinQuery, chartQuery] = useQueries({
    queries: [
      { queryKey: ['coin-detail', coinId], queryFn: () => fetchCoinDetail(coinId), staleTime: 60000, gcTime: 300000 },
      { queryKey: ['coin-chart', coinId], queryFn: () => fetchCoinMarketChart(coinId, 30), staleTime: 120000, gcTime: 600000 },
    ],
  });

  const coinData = coinQuery.data;
  const chartData = chartQuery.data;
  const loading = coinQuery.isLoading || chartQuery.isLoading;

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
      sparkline: prices.slice(-168),
      tiers: [
        { icon: Clock, label: "24-Hour Forecast", days: 1, pred: buildPrediction(prices, volumes, 1) },
        { icon: Calendar, label: "1-Week Forecast", days: 7, pred: buildPrediction(prices, volumes, 7) },
        { icon: CalendarDays, label: "1-Month Forecast", days: 30, pred: buildPrediction(prices, volumes, 30) },
      ],
    };
  }, [coinData, chartData]);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(4,6,10,0.9)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: "easeOut" }}
          className="glass-strong gold-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto gold-glow"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gold/10 sticky top-0 glass-strong z-10">
            <div className="flex items-center gap-3">
              {coinImage && <img src={coinImage} alt={coinName} className="w-10 h-10 rounded-full ring-2 ring-gold/25" />}
              <div>
                <h2 className="font-display font-bold tracking-wide text-gradient text-lg">{coinName}</h2>
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3 h-3 text-gold" />
                  <span className="text-[10px] text-steel font-display uppercase tracking-[0.2em]">CapT Intel · Prediction Engine</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg glass gold-border flex items-center justify-center hover:bg-gold/10 transition-colors">
              <X className="w-4 h-4 text-steel" />
            </button>
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

              {/* Sparkline */}
              {analysis.sparkline.length > 0 && (
                <div className="glass gold-border rounded-xl p-3 h-20">
                  <p className="text-[9px] text-steel font-display uppercase tracking-wider mb-1">7-Day Price Action</p>
                  <SparklineChart data={analysis.sparkline} color={analysis.change7d >= 0 ? "#22c55e" : "#ef4444"} height={48} />
                </div>
              )}

              {/* Technical Indicators */}
              <div className="glass gold-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-3.5 h-3.5 text-gold" />
                  <p className="text-[10px] font-display uppercase tracking-[0.2em] text-gold">Technical Indicators</p>
                </div>
                <IndicatorRow label="SMA 7" value={formatNumber(analysis.sma7)} color={analysis.sma7 > analysis.sma25 ? "text-emerald-400" : "text-red-400"} icon={TrendingUp} />
                <IndicatorRow label="SMA 25" value={formatNumber(analysis.sma25)} color="text-foreground" icon={Minus} />
                <IndicatorRow label="SMA Cross" value={analysis.sma7 > analysis.sma25 ? "Bullish ↑" : "Bearish ↓"} color={analysis.sma7 > analysis.sma25 ? "text-emerald-400" : "text-red-400"} icon={Activity} />
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
                Powered by MTA · SMA Crossover · RSI · Volatility Cone analysis. Not financial advice.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}