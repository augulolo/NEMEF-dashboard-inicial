import { cn } from "@/lib/utils";

export function Sparkline({
  data,
  className,
  positive = true,
}: {
  data: number[];
  className?: string;
  positive?: boolean;
}) {
  if (data.length < 2) return null;
  const w = 80;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(" ");
  const stroke = positive ? "stroke-emerald-400" : "stroke-red-400";
  const fill = positive ? "fill-emerald-400/10" : "fill-red-400/10";
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("inline-block", className)} width={w} height={h}>
      <polygon points={area} className={fill} stroke="none" />
      <polyline points={points} fill="none" className={stroke} strokeWidth={1.5} />
    </svg>
  );
}
