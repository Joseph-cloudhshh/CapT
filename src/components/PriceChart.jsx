import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import GlassCard from "./GlassCard";

export default function PriceChart({ chartData, title = "Price History (30d)" }) {
  if (!chartData?.prices) return null;

  const data = chartData.prices.map(([ts, price]) => ({
    date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price,
  }));

  const first = data[0]?.price || 0;
  const last = data[data.length - 1]?.price || 0;
  const isUp = last >= first;
  const color = isUp ? "#22c55e" : "#ef4444";

  return (
    <GlassCard className="p-0 overflow-hidden gold-border" animate={false}>
      <div className="px-5 py-3 border-b border-gold/10">
        <h3 className="text-[11px] font-display font-semibold uppercase tracking-[0.15em] text-gradient">{title}</h3>
      </div>
      <div className="px-2 py-4 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(120,136,152,0.8)', fontFamily: 'JetBrains Mono' }} interval="preserveStartEnd" />
            <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(120,136,152,0.8)', fontFamily: 'JetBrains Mono' }}
              tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(2)}`} width={58} />
            <Tooltip
              contentStyle={{ background: 'rgba(8,10,14,0.95)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', fontSize: '11px', color: '#b8c4d4', fontFamily: 'JetBrains Mono' }}
              formatter={v => [`$${v.toFixed(v >= 1 ? 2 : 6)}`, 'Price']}
            />
            <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#priceGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}