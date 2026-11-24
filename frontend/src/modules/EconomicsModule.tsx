import React, { useState, useEffect } from 'react';
import { fetchLiveBoardMacro } from '../services/api';
import { Globe, TrendingUp, TrendingDown, Percent, Landmark, BarChart3 } from 'lucide-react';

export const EconomicsModule: React.FC = () => {
  const [macro, setMacro] = useState<any[]>([]);

  useEffect(() => {
    fetchLiveBoardMacro().then(setMacro).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Globe size={16} className="text-emerald-400" />
            <span>Macroeconomics & Monetary Policy Terminal</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Key macroeconomic leading indicators, sovereign bond yield curves, central bank interest rates, and foreign exchange telemetry.
          </p>
        </div>
      </div>

      {/* Sovereign Key Rates Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4">
          <span className="text-[11px] text-gray-400 block font-sans">RBI Repo Rate</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">6.50%</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Unchanged (Neutral Stance)</span>
        </div>
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4">
          <span className="text-[11px] text-gray-400 block font-sans">India 10Y Sovereign Yield</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">6.82%</span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">-4 bps this month</span>
        </div>
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4">
          <span className="text-[11px] text-gray-400 block font-sans">US Federal Funds Target</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">4.75%</span>
          <span className="text-[10px] text-sky-400 font-mono mt-0.5 block">Easing Cycle Initiated</span>
        </div>
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4">
          <span className="text-[11px] text-gray-400 block font-sans">India GDP Real Growth</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">+7.2%</span>
          <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">Fastest G20 Major Economy</span>
        </div>
      </div>

      {/* Inflation, Liquidity & Commodity Transmission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-2">
            <Percent size={14} className="text-emerald-400" />
            <span>Inflation & Purchasing Power</span>
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">India CPI (Retail)</span>
              <span className="text-white font-semibold">4.85% (Target: 4.0% ± 2)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">India WPI (Wholesale)</span>
              <span className="text-white font-semibold">2.36%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">US Core CPI</span>
              <span className="text-white font-semibold">3.28%</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
            Domestic retail inflation remains within the RBI tolerance band, allowing room for growth-supportive open market liquidity.
          </p>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-2">
            <Landmark size={14} className="text-sky-400" />
            <span>Central Bank FX Reserves</span>
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">RBI Foreign Reserves</span>
              <span className="text-white font-semibold">$695.4 Billion</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">Import Cover</span>
              <span className="text-emerald-400 font-semibold">11.4 Months</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">Current Account Deficit (CAD)</span>
              <span className="text-white font-semibold">1.1% of GDP</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
            Record foreign currency buffers provide robust insulation against global currency fluctuations and crude supply shocks.
          </p>
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-2">
            <BarChart3 size={14} className="text-amber-400" />
            <span>Yield Curve Inversion Watch</span>
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">US 10Y - 2Y Spread</span>
              <span className="text-emerald-400 font-semibold">+14 bps (Normalizing)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">India 10Y - 1Y Spread</span>
              <span className="text-white font-semibold">+22 bps</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 font-sans">Crude Oil Transmission</span>
              <span className="text-white font-semibold">$78.4 / bbl</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
            Yield curves have dis-inverted globally, pointing toward soft-landing expectations rather than near-term recessionary contraction.
          </p>
        </div>
      </div>
    </div>
  );
};
