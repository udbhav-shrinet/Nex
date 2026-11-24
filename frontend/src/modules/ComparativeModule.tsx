import React, { useState, useEffect } from 'react';
import { fetchQuote, fetchQuantStats, fetchFinancialRatios, StockQuote } from '../services/api';
import { ArrowRight, TrendingUp, TrendingDown, Scale, CheckCircle2 } from 'lucide-react';

interface ComparativeModuleProps {
  primaryTicker: string;
}

export const ComparativeModule: React.FC<ComparativeModuleProps> = ({ primaryTicker }) => {
  const [tickerA, setTickerA] = useState(primaryTicker);
  const [tickerB, setTickerB] = useState('TCS');
  const [quoteA, setQuoteA] = useState<StockQuote | null>(null);
  const [quoteB, setQuoteB] = useState<StockQuote | null>(null);
  const [ratiosA, setRatiosA] = useState<any>(null);
  const [ratiosB, setRatiosB] = useState<any>(null);
  const [quantA, setQuantA] = useState<any>(null);
  const [quantB, setQuantB] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTickerA(primaryTicker);
  }, [primaryTicker]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchQuote(tickerA),
      fetchQuote(tickerB),
      fetchFinancialRatios(tickerA),
      fetchFinancialRatios(tickerB),
      fetchQuantStats(tickerA),
      fetchQuantStats(tickerB),
    ])
      .then(([qA, qB, rA, rB, sA, sB]) => {
        setQuoteA(qA);
        setQuoteB(qB);
        setRatiosA(rA);
        setRatiosB(rB);
        setQuantA(sA);
        setQuantB(sB);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tickerA, tickerB]);

  return (
    <div className="space-y-6">
      {/* Ticker Selectors */}
      <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Scale size={16} className="text-emerald-400" />
            <span>Cross-Asset Institutional Comparative Analysis</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Compare fundamental valuations, return compounding, and quantitative risk profiles side-by-side.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <input
            type="text"
            value={tickerA}
            onChange={(e) => setTickerA(e.target.value.toUpperCase())}
            placeholder="Asset A"
            className="w-28 bg-[#0d1117] border border-gray-800 rounded-lg px-3 py-1.5 text-white font-bold"
          />
          <span className="text-gray-500 font-sans">vs</span>
          <input
            type="text"
            value={tickerB}
            onChange={(e) => setTickerB(e.target.value.toUpperCase())}
            placeholder="Asset B"
            className="w-28 bg-[#0d1117] border border-gray-800 rounded-lg px-3 py-1.5 text-white font-bold"
          />
        </div>
      </div>

      {/* Side-by-side Overview Cards */}
      {quoteA && quoteB && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-lg text-white">{quoteA.symbol}</span>
                <p className="text-xs text-gray-400">{quoteA.name}</p>
              </div>
              <span className={`text-xs font-mono font-semibold ${quoteA.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {quoteA.change >= 0 ? '+' : ''}{quoteA.changePercent}%
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-white mt-2">
              ₹{quoteA.price?.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-lg text-white">{quoteB.symbol}</span>
                <p className="text-xs text-gray-400">{quoteB.name}</p>
              </div>
              <span className={`text-xs font-mono font-semibold ${quoteB.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {quoteB.change >= 0 ? '+' : ''}{quoteB.changePercent}%
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-white mt-2">
              ₹{quoteB.price?.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Multi-Dimensional Comparison Matrix */}
      {ratiosA && ratiosB && quantA && quantB && (
        <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-sans">
                <th className="py-2.5 pr-4">Dimension & Mathematical Metric</th>
                <th className="py-2.5 px-3 text-right font-mono text-white font-bold">{tickerA}</th>
                <th className="py-2.5 px-3 text-right font-mono text-white font-bold">{tickerB}</th>
                <th className="py-2.5 pl-4 text-center font-sans">Relative Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {[
                { label: "Market Cap (₹ Cr.)", a: (quoteA?.marketCap || 0) / 10000000, b: (quoteB?.marketCap || 0) / 10000000, higherBetter: true },
                { label: "Stock P/E Multiple", a: ratiosA.screenerMetrics?.stockPE, b: ratiosB.screenerMetrics?.stockPE, higherBetter: false },
                { label: "ROCE (Operating Efficiency)", a: ratiosA.screenerMetrics?.roce, b: ratiosB.screenerMetrics?.roce, higherBetter: true, suffix: "%" },
                { label: "ROE (Shareholder Return)", a: ratiosA.screenerMetrics?.roe, b: ratiosB.screenerMetrics?.roe, higherBetter: true, suffix: "%" },
                { label: "Piotroski F-Score (/9)", a: ratiosA.institutionalModels?.piotroskiF?.score, b: ratiosB.institutionalModels?.piotroskiF?.score, higherBetter: true },
                { label: "Annualized Volatility (Risk)", a: quantA.annualizedVolatility, b: quantB.annualizedVolatility, higherBetter: false, suffix: "%" },
                { label: "Sharpe Ratio (Risk-Adjusted)", a: quantA.sharpeRatio, b: quantB.sharpeRatio, higherBetter: true },
                { label: "Sortino Ratio (Downside Buffer)", a: quantA.sortinoRatio, b: quantB.sortinoRatio, higherBetter: true },
                { label: "Jensen's Alpha vs Benchmark", a: quantA.jensensAlpha, b: quantB.jensensAlpha, higherBetter: true, suffix: "%" },
                { label: "Max Drawdown (2-Year Peak)", a: quantA.maxDrawdown, b: quantB.maxDrawdown, higherBetter: false, suffix: "%" },
              ].map((row) => {
                const aVal = row.a ?? 0;
                const bVal = row.b ?? 0;
                const winner = row.higherBetter ? (aVal >= bVal ? tickerA : tickerB) : (aVal <= bVal ? tickerA : tickerB);
                return (
                  <tr key={row.label} className="hover:bg-gray-800/30">
                    <td className="py-3 pr-4 font-sans text-gray-300 font-medium">{row.label}</td>
                    <td className={`py-3 px-3 text-right ${winner === tickerA ? 'text-emerald-400 font-bold' : 'text-gray-300'}`}>
                      {row.a !== undefined ? `${row.a.toLocaleString()}${row.suffix || ''}` : 'N/A'}
                    </td>
                    <td className={`py-3 px-3 text-right ${winner === tickerB ? 'text-emerald-400 font-bold' : 'text-gray-300'}`}>
                      {row.b !== undefined ? `${row.b.toLocaleString()}${row.suffix || ''}` : 'N/A'}
                    </td>
                    <td className="py-3 pl-4 text-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-gray-200 font-bold">
                        {winner}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
