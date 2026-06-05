"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Reads theme-aware chart colors from CSS vars so it works on the dark operator
// surfaces and (anywhere else) on light.
function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // chart vars are scoped per-theme; read from a dark container if present
  const darkEl = document.querySelector('[data-theme="dark"]');
  const scoped = darkEl ? getComputedStyle(darkEl).getPropertyValue(name).trim() : "";
  return scoped || v || fallback;
}

export default function VolumeChart({ data }: { data: { day: string; tickets: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-56 w-full" />;

  const line = cssVar("--chart-line", "#7c84e8");
  const grid = cssVar("--chart-grid", "#23262d");
  const axis = cssVar("--chart-axis", "#8a8f98");

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line} stopOpacity={0.35} />
              <stop offset="100%" stopColor={line} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${grid}`,
              background: cssVar("--surface", "#141519").startsWith("#")
                ? cssVar("--surface", "#141519")
                : `rgb(${cssVar("--surface", "20 21 25")})`,
              color: `rgb(${cssVar("--foreground", "230 232 236")})`,
              fontSize: 12,
            }}
            labelStyle={{ color: axis }}
            cursor={{ stroke: grid }}
          />
          <Area type="monotone" dataKey="tickets" stroke={line} strokeWidth={2} fill="url(#vol)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
