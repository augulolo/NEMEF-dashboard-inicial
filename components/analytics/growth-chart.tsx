"use client";

import React, { useMemo } from "react";

export interface Series {
  label: string;
  color: string;
  data: number[];
  isOwn?: boolean;
}

export interface GrowthChartProps {
  series: Series[];
  height?: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const PADDING = { top: 16, right: 16, bottom: 32, left: 48 };
const VIEWBOX_WIDTH = 600;

export function GrowthChart({ series, height = 200 }: GrowthChartProps) {
  const activeSeries = useMemo(
    () => series.filter((s) => s.data.length > 0),
    [series]
  );

  if (activeSeries.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground text-sm"
        style={{ height }}
      >
        Sin datos para mostrar.
      </div>
    );
  }

  // Normalize all series to the same length (max length, pad with last value)
  const maxLen = Math.max(...activeSeries.map((s) => s.data.length));
  const normalized = activeSeries.map((s) => {
    if (s.data.length === maxLen) return s;
    const last = s.data[s.data.length - 1] ?? 0;
    return {
      ...s,
      data: [...s.data, ...Array(maxLen - s.data.length).fill(last)],
    };
  });

  const allValues = normalized.flatMap((s) => s.data);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const valueRange = rawMax - rawMin || 1;

  const chartW = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const toX = (i: number) =>
    PADDING.left + (maxLen <= 1 ? chartW / 2 : (i / (maxLen - 1)) * chartW);

  const toY = (v: number) =>
    PADDING.top + chartH - ((v - rawMin) / valueRange) * chartH;

  // Build Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = rawMin + (valueRange / 4) * i;
    const y = toY(value);
    return { value, y };
  });

  // Build X-axis labels
  const xLabels = Array.from({ length: maxLen }, (_, i) => ({
    label: `S${i + 1}`,
    x: toX(i),
  }));

  // Thin out x labels if too many
  const xStep = maxLen > 12 ? Math.ceil(maxLen / 8) : 1;

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
        width="100%"
        height={height}
        aria-label="Gráfico de crecimiento de seguidores"
        role="img"
      >
        {/* Grid lines */}
        {yTicks.map(({ y }, i) => (
          <line
            key={i}
            x1={PADDING.left}
            x2={VIEWBOX_WIDTH - PADDING.right}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map(({ value, y }, i) => (
          <text
            key={i}
            x={PADDING.left - 6}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={10}
            fill="currentColor"
            opacity={0.5}
          >
            {formatCount(Math.round(value))}
          </text>
        ))}

        {/* X axis labels */}
        {xLabels.map(({ label, x }, i) =>
          i % xStep === 0 ? (
            <text
              key={i}
              x={x}
              y={height - PADDING.bottom + 14}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              opacity={0.45}
            >
              {label}
            </text>
          ) : null
        )}

        {/* Series lines */}
        {normalized.map((s) => {
          const pts = s.data
            .map((v, i) => `${toX(i)},${toY(v)}`)
            .join(" ");
          return (
            <polyline
              key={s.label}
              points={pts}
              fill="none"
              stroke={s.color}
              strokeWidth={s.isOwn ? 2.5 : 1.5}
              strokeOpacity={s.isOwn ? 1 : 0.6}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.isOwn ? undefined : undefined}
            />
          );
        })}

        {/* Dots on last point */}
        {normalized.map((s) => {
          const lastIdx = s.data.length - 1;
          const cx = toX(lastIdx);
          const cy = toY(s.data[lastIdx]);
          return (
            <circle
              key={`dot-${s.label}`}
              cx={cx}
              cy={cy}
              r={s.isOwn ? 4 : 3}
              fill={s.color}
              opacity={s.isOwn ? 1 : 0.7}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-1">
        {normalized.map((s) => {
          const currentValue = s.data[s.data.length - 1];
          return (
            <div key={s.label} className="flex items-center gap-1.5">
              <span
                className="inline-block rounded-full shrink-0"
                style={{
                  width: s.isOwn ? 10 : 8,
                  height: s.isOwn ? 10 : 8,
                  backgroundColor: s.color,
                  opacity: s.isOwn ? 1 : 0.7,
                }}
              />
              <span className="text-xs text-muted-foreground">
                {s.label}
              </span>
              <span className="text-xs font-medium tabular-nums">
                {formatCount(currentValue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
