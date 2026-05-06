import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function SparklineChart({ data, color = "#00d2ff", height = 32 }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((v, i) => ({ i, v }));
  const first = data[0];
  const last = data[data.length - 1];
  const lineColor = last >= first ? "#22c55e" : "#ef4444";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color || lineColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}