// CoinGecko API helpers (free tier)
const CG_BASE = 'https://api.coingecko.com/api/v3';
const DS_BASE = 'https://api.dexscreener.com';

async function safeFetch(url, timeout = 8000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
  } catch (error) {
    if (error.name === 'AbortError') console.warn('Fetch timeout:', url);
    return null;
  }
}

export async function fetchGlobalData() {
  const data = await safeFetch(`${CG_BASE}/global`);
  return data?.data || null;
}

export async function fetchTopCoins(page = 1, perPage = 100) {
  return safeFetch(`${CG_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=24h,7d`) || [];
}

export async function fetchCoinSearch(query) {
  return safeFetch(`${CG_BASE}/search?query=${encodeURIComponent(query)}`) || { coins: [] };
}

export async function fetchCoinDetail(id) {
  return safeFetch(`${CG_BASE}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`);
}

export async function fetchCoinMarketChart(id, days = 30) {
  return safeFetch(`${CG_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`) || { prices: [], total_volumes: [] };
}

export async function fetchTrendingCoins() {
  return safeFetch(`${CG_BASE}/search/trending`) || { coins: [], nfts: [] };
}

// DexScreener endpoints
export async function fetchDexLatestProfiles() {
  return safeFetch(`${DS_BASE}/token-profiles/latest/v1`) || [];
}

export async function fetchDexSearch(query) {
  return safeFetch(`${DS_BASE}/latest/dex/search?q=${encodeURIComponent(query)}`) || { pairs: [] };
}

export async function fetchDexPairsByToken(address) {
  return safeFetch(`${DS_BASE}/latest/dex/tokens/${address}`) || { pairs: [] };
}

// NFT data from CoinGecko
export async function fetchNFTList() {
  return safeFetch(`${CG_BASE}/nfts/list?per_page=100&page=1`) || [];
}

export async function fetchNFTDetail(id) {
  const data = await safeFetch(`${CG_BASE}/nfts/${id}`);
  if (data) return data;
  // Fallback: try to fetch as a coin if NFT fails
  return fetchCoinDetail(id);
}

export async function fetchNFTMarketChart(id, days = 30) {
  // Try NFT endpoint first
  let data = await safeFetch(`${CG_BASE}/nfts/${id}/market_chart?vs_currency=usd&days=${days}`);
  if (data) return data;
  
  // Fallback to coin market chart
  return fetchCoinMarketChart(id, days);
}

// Unified asset detail fetcher - handles both coins and NFTs
export async function fetchAssetDetail(id, type = 'auto') {
  if (type === 'nft' || type === 'auto') {
    const nftData = await fetchNFTDetail(id);
    if (nftData?.market_data) return { ...nftData, assetType: 'nft' };
  }
  
  const coinData = await fetchCoinDetail(id);
  return coinData ? { ...coinData, assetType: 'coin' } : null;
}

// Unified asset chart fetcher
export async function fetchAssetChart(id, days = 30, type = 'auto') {
  if (type === 'nft' || type === 'auto') {
    const nftChart = await fetchNFTMarketChart(id, days);
    if (nftChart?.prices) return { ...nftChart, assetType: 'nft' };
  }
  
  const coinChart = await fetchCoinMarketChart(id, days);
  return coinChart ? { ...coinChart, assetType: 'coin' } : null;
}

// Predictive MTA calculation
export function calculateMTA(priceData, volumeData, liquidityRatio) {
  if (!priceData || priceData.length < 2) return { score: 0.5, signal: 'Neutral', reasoning: 'Insufficient data' };

  // Price delta (normalized momentum over recent period)
  const recentPrices = priceData.slice(-24);
  const priceStart = recentPrices[0];
  const priceEnd = recentPrices[recentPrices.length - 1];
  const priceDelta = priceStart > 0 ? (priceEnd - priceStart) / priceStart : 0;
  const normalizedPriceDelta = Math.max(-1, Math.min(1, priceDelta * 10));

  // Volume momentum
  let volMomentum = 0.5;
  if (volumeData && volumeData.length >= 2) {
    const recentVol = volumeData.slice(-12);
    const olderVol = volumeData.slice(-24, -12);
    const recentAvg = recentVol.reduce((a, b) => a + b, 0) / recentVol.length;
    const olderAvg = olderVol.length > 0 ? olderVol.reduce((a, b) => a + b, 0) / olderVol.length : recentAvg;
    volMomentum = olderAvg > 0 ? Math.max(0, Math.min(1, recentAvg / olderAvg)) : 0.5;
  }

  // Liquidity depth score
  const liqScore = liquidityRatio ? Math.max(0, Math.min(1, liquidityRatio)) : 0.5;

  // MTA formula
  const score = ((normalizedPriceDelta + 1) / 2) * 0.4 + volMomentum * 0.4 + liqScore * 0.2;
  const clampedScore = Math.max(0, Math.min(1, score));

  let signal, reasoning;
  if (clampedScore > 0.65) {
    signal = 'Bullish';
    reasoning = `Price momentum is positive (${(priceDelta * 100).toFixed(2)}% change) with ${volMomentum > 0.6 ? 'increasing' : 'steady'} volume. Liquidity depth is ${liqScore > 0.5 ? 'healthy' : 'moderate'}, supporting upward continuation.`;
  } else if (clampedScore > 0.4) {
    signal = 'Neutral';
    reasoning = `Market is consolidating with ${Math.abs(priceDelta * 100).toFixed(2)}% price movement. Volume is ${volMomentum > 0.5 ? 'stable' : 'declining'} and liquidity is ${liqScore > 0.5 ? 'adequate' : 'thin'}. Expect sideways action.`;
  } else {
    signal = 'Bearish';
    reasoning = `Price shows negative momentum (${(priceDelta * 100).toFixed(2)}% decline) with ${volMomentum < 0.4 ? 'declining' : 'flat'} volume. Liquidity depth is ${liqScore > 0.3 ? 'moderate' : 'concerning'}, suggesting continued weakness.`;
  }

  return { score: clampedScore, signal, reasoning };
}

// Calculate RSI
export function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return 50;
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  const recent = changes.slice(-period);
  let gains = 0, losses = 0;
  recent.forEach(c => {
    if (c > 0) gains += c;
    else losses += Math.abs(c);
  });
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Trust score: liquidity to market cap ratio
export function calculateTrustScore(liquidity, marketCap) {
  if (!liquidity || !marketCap || marketCap === 0) return { score: 0, label: 'Unknown', color: 'text-muted-foreground' };
  const ratio = liquidity / marketCap;
  if (ratio > 0.1) return { score: ratio, label: 'High Trust', color: 'text-emerald-400' };
  if (ratio > 0.03) return { score: ratio, label: 'Moderate', color: 'text-amber-400' };
  return { score: ratio, label: 'Low Trust ⚠️', color: 'text-red-400' };
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '—';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  return `$${num.toFixed(6)}`;
}

export function formatPercent(num) {
  if (num === null || num === undefined) return '—';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}