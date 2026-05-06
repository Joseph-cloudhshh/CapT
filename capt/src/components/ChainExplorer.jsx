import { motion } from "framer-motion";

const chains = [
  { name: "Ethereum", symbol: "ETH", grad: "from-blue-500/20 to-indigo-500/20", text: "text-blue-300", icon: "⟠" },
  { name: "Solana", symbol: "SOL", grad: "from-purple-500/20 to-pink-500/20", text: "text-purple-300", icon: "◎" },
  { name: "Base", symbol: "BASE", grad: "from-cyan-500/20 to-blue-500/20", text: "text-cyan-300", icon: "🔵" },
  { name: "Arbitrum", symbol: "ARB", grad: "from-sky-500/20 to-cyan-500/20", text: "text-sky-300", icon: "🔷" },
  { name: "Polygon", symbol: "POL", grad: "from-violet-500/20 to-purple-500/20", text: "text-violet-300", icon: "⬡" },
  { name: "BNB Chain", symbol: "BNB", grad: "from-amber-500/20 to-yellow-500/20", text: "text-amber-300", icon: "⬢" },
];

export default function ChainExplorer() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {chains.map((c, i) => (
        <motion.div key={c.symbol} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
          <div className={`glass gold-border rounded-xl p-4 text-center group hover:gold-glow transition-all duration-300 cursor-pointer bg-gradient-to-br ${c.grad}`}>
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{c.icon}</div>
            <p className="text-xs font-display font-semibold">{c.name}</p>
            <p className={`text-[10px] font-mono mt-0.5 ${c.text}`}>{c.symbol}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}