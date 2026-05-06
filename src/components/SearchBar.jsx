import { useState, useCallback } from "react";
import { Search, Loader2, X, ScanLine } from "lucide-react";
import { fetchCoinSearch, fetchDexSearch } from "../lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";

export default function SearchBar({ onSelectCoin, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const doSearch = useCallback(debounce(async (q) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const isAddress = q.length > 30 && !q.includes(' ');
    let items = [];
    if (isAddress) {
      const dex = await fetchDexSearch(q);
      items = (dex?.pairs || []).slice(0, 8).map(p => ({
        id: p.baseToken?.address || q, name: p.baseToken?.name || 'Unknown',
        symbol: p.baseToken?.symbol || '?', thumb: null, type: 'dex', dexData: p,
      }));
    } else {
      const cg = await fetchCoinSearch(q);
      items = (cg?.coins || []).slice(0, 8).map(c => ({
        id: c.id, name: c.name, symbol: c.symbol, thumb: c.thumb, type: 'coingecko', marketCapRank: c.market_cap_rank,
      }));
    }
    setResults(items);
    setOpen(items.length > 0);
    setLoading(false);
  }, 350), []);

  const handleChange = (e) => { setQuery(e.target.value); doSearch(e.target.value); };
  const handleSelect = (item) => { setOpen(false); setQuery(item.name); onSelectCoin?.(item); };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="glass-strong gold-border rounded-2xl flex items-center gap-3 px-5 py-3.5 gold-glow transition-all duration-300 focus-within:gold-glow-strong">
        <Search className="w-4 h-4 text-gold shrink-0" />
        <input type="text" value={query} onChange={handleChange} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search asset, symbol or contract address..."
          className="flex-1 bg-transparent text-foreground placeholder:text-steel/60 text-sm focus:outline-none font-sans" />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gold" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}>
            <X className="w-3.5 h-3.5 text-steel hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute top-full mt-2 left-0 right-0 glass-strong gold-border rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            {results.map((item, i) => (
              <button key={item.id + i} onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gold/[0.04] transition-colors text-left group">
                {item.thumb ? <img src={item.thumb} alt={item.name} className="w-7 h-7 rounded-full ring-1 ring-gold/20" /> :
                  <div className="w-7 h-7 rounded-full bg-gold-subtle gold-border flex items-center justify-center text-[10px] font-bold text-gold">{item.symbol?.charAt(0)}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-steel uppercase font-mono">{item.symbol}</p>
                </div>
                {item.marketCapRank && <span className="text-[10px] text-steel font-mono">#{item.marketCapRank}</span>}
                <span className={cn("text-[9px] font-display font-bold px-2 py-0.5 rounded-full", item.type === 'dex' ? "bg-purple-500/15 text-purple-300" : "bg-gold/10 text-gold")}>
                  {item.type === 'dex' ? 'DEX' : 'CEX'}
                </span>
                <ScanLine className="w-3.5 h-3.5 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}