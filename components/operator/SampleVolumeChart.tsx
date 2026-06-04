"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Representative shape only — Phase 2 replaces this with live ticket volume.
const DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  tickets: Math.round(8 + 6 * Math.sin(i / 2) + i * 0.7 + (i % 3)),
}));

export default function SampleVolumeChart() {
  // Render only after mount so ResponsiveContainer has real dimensions
  // (avoids a width/height(-1) warning during static prerender).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-56 w-full" />;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={DATA} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
            labelStyle={{ color: "#64748b" }}
          />
          <Area type="monotone" dataKey="tickets" stroke="#6366f1" strokeWidth={2} fill="url(#vol)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
