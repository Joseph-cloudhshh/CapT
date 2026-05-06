import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fish, ArrowUpRight, ArrowDownRight, Clock, ArrowLeftRight } from "lucide-react";

function genTxs() {
  const wallets = ['0x7a25...3f9c','0xd8f4...b12e','0x3c91...7a2d','0xf29e...5b8a','0x8b3c...d4f1','0x1e7a...9c3b'];
  const coins = ['BTC','ETH','SOL','PEPE','BNB','AVAX'];
  return Array.from({ length: 10 }, (_, i) => {
    const type = ['Buy','Sell','Transfer'][Math.floor(Math.random() * 3)];
    return {
      id: i,
      type,
      amount: (Math.random() * 950000 + 50000).toFixed(0),
      wallet: wallets[Math.floor(Math.random() * wallets.length)],
      coin: coins[Math.floor(Math.random() * coins.length)],
      time: `${Math.floor(Math.random() * 59) + 1}m ago`,
    };
  });
}

const typeConfig = {
  Buy: { icon: ArrowUpRight, bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  Sell: { icon: ArrowDownRight, bg: 'bg-red-500/15', text: 'text-red-400' },
  Transfer: { icon: ArrowLeftRight, bg: 'bg-blue-500/15', text: 'text-blue-400' },
};

export default function WhaleTracker() {
  const [txs, setTxs] = useState(() => genTxs());

  useEffect(() => {
    const interval = setInterval(() => {
      setTxs(prev => [{ ...genTxs()[0], id: Date.now() }, ...prev].slice(0, 10));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass gold-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gold/10 flex items-center gap-2">
        <Fish className="w-4 h-4 text-gold" />
        <h3 className="text-[11px] font-display font-semibold uppercase tracking-[0.15em] text-gradient">Whale Tracker</h3>
        <span className="text-[9px] text-steel font-mono ml-auto">Txns &gt; $50k</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      <div className="divide-y divide-white/[0.025] max-h-[360px] overflow-y-auto">
        <AnimatePresence>
          {txs.map(tx => {
            const cfg = typeConfig[tx.type];
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gold/[0.02] transition-colors">
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <cfg.icon className={`w-4 h-4 ${cfg.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-display font-bold uppercase tracking-wider ${cfg.text}`}>{tx.type}</span>
                    <span className="text-[10px] font-mono text-steel">{tx.coin}</span>
                  </div>
                  <p className="text-sm font-bold font-mono">${parseInt(tx.amount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-steel font-mono">{tx.wallet}</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-steel" />
                    <span className="text-[9px] text-steel">{tx.time}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}