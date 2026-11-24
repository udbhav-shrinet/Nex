import React, { useState, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { PricePoint } from '../services/api';
import { Pencil, Slash, Eraser, CandlestickChart, Activity } from 'lucide-react';

interface SharedChartProps {
  data: PricePoint[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  currencySymbol?: string;
}

interface DrawnElement {
  id: string;
  type: 'line' | 'pencil';
  points: { x: number; y: number }[];
}

export const SharedChart: React.FC<SharedChartProps> = ({
  data,
  timeframe,
  onTimeframeChange,
  currencySymbol = '₹',
}) => {
  const [chartMode, setChartMode] = useState<'area' | 'candlestick'>('area');
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(false);
  const [showMA200, setShowMA200] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // Drawing Tools State (Pencil, Trendline, Eraser)
  const [activeTool, setActiveTool] = useState<'none' | 'pencil' | 'line' | 'eraser'>('none');
  const [drawings, setDrawings] = useState<DrawnElement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

  const minPrice = Math.min(...data.map((d) => d.low || d.close).filter(Boolean));
  const maxPrice = Math.max(...data.map((d) => d.high || d.close).filter(Boolean));
  const padding = (maxPrice - minPrice) * 0.05 || 1;

  // Custom Candlestick rendering shape
  const CandlestickBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    if (!payload || payload.open === undefined || payload.close === undefined) return null;

    const isUp = payload.close >= payload.open;
    const color = isUp ? '#10b981' : '#f43f5e';
    const bodyHeight = Math.max(Math.abs(height), 2);
    const wickX = x + width / 2;

    return (
      <g>
        {/* Wick line */}
        <line
          x1={wickX}
          y1={y - 8}
          x2={wickX}
          y2={y + bodyHeight + 8}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Real candle body */}
        <rect
          x={x + 2}
          y={isUp ? y : y}
          width={Math.max(width - 4, 3)}
          height={bodyHeight}
          fill={color}
          rx={1}
        />
      </g>
    );
  };

  // Drawing Canvas Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'none' || activeTool === 'eraser') return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'pencil') {
      setCurrentPoints((prev) => [...prev, { x, y }]);
    } else if (activeTool === 'line' && currentPoints.length > 0) {
      setCurrentPoints([currentPoints[0], { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 1) {
      setDrawings((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: activeTool === 'line' ? 'line' : 'pencil',
          points: currentPoints,
        },
      ]);
    }
    setCurrentPoints([]);
  };

  return (
    <div className="bg-[#161b22] border border-gray-800 rounded-xl p-4 flex flex-col space-y-4 relative">
      {/* Chart Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Timeframe Buttons */}
        <div className="flex items-center space-x-1 bg-[#0d1117] p-1 rounded-lg border border-gray-800">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart View (Area vs Candlestick) */}
        <div className="flex items-center space-x-1 bg-[#0d1117] p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setChartMode('area')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
              chartMode === 'area' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity size={12} />
            <span>Area</span>
          </button>
          <button
            onClick={() => setChartMode('candlestick')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
              chartMode === 'candlestick' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <CandlestickChart size={12} />
            <span>Candles</span>
          </button>
        </div>

        {/* Technical Analysis Drawing Tools Toolbar */}
        <div className="flex items-center space-x-1 bg-[#0d1117] p-1 rounded-lg border border-gray-800">
          <button
            title="Pencil Freehand"
            onClick={() => setActiveTool(activeTool === 'pencil' ? 'none' : 'pencil')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'pencil' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Pencil size={13} />
          </button>
          <button
            title="Trendline (Click & Drag)"
            onClick={() => setActiveTool(activeTool === 'line' ? 'none' : 'line')}
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'line' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Slash size={13} />
          </button>
          <button
            title="Clear All Drawings"
            onClick={() => {
              setDrawings([]);
              setActiveTool('none');
            }}
            className="p-1.5 rounded text-gray-400 hover:text-rose-400 transition-colors"
          >
            <Eraser size={13} />
          </button>
        </div>

        {/* Moving Average Overlays */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMA20(!showMA20)}
            className={`px-2 py-1 rounded border text-[11px] font-mono ${
              showMA20
                ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
                : 'bg-[#0d1117] text-gray-500 border-gray-800'
            }`}
          >
            MA 20
          </button>

          <button
            onClick={() => setShowMA50(!showMA50)}
            className={`px-2 py-1 rounded border text-[11px] font-mono ${
              showMA50
                ? 'bg-sky-950/40 text-sky-300 border-sky-600/40'
                : 'bg-[#0d1117] text-gray-500 border-gray-800'
            }`}
          >
            MA 50
          </button>

          <button
            onClick={() => setShowMA200(!showMA200)}
            className={`px-2 py-1 rounded border text-[11px] font-mono ${
              showMA200
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                : 'bg-[#0d1117] text-gray-500 border-gray-800'
            }`}
          >
            MA 200
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded border text-[11px] ${
              showVolume
                ? 'bg-zinc-800 text-gray-200 border-gray-700'
                : 'bg-[#0d1117] text-gray-500 border-gray-800'
            }`}
          >
            Vol
          </button>
        </div>
      </div>

      {/* Main Canvas with SVG Drawing Overlay */}
      <div className="h-72 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="minimalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => (v.length > 10 ? v.slice(5, 10) : v.slice(5))}
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              orientation="right"
              tickFormatter={(v) => `${currencySymbol}${v.toFixed(0)}`}
            />
            {showVolume && (
              <YAxis
                yAxisId="vol"
                orientation="left"
                domain={[0, 'dataMax * 3']}
                hide
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: '#161b22',
                borderColor: '#30363d',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#f3f4f6',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            {showVolume && (
              <Bar
                dataKey="volume"
                yAxisId="vol"
                fill="#30363d"
                opacity={0.4}
                radius={[2, 2, 0, 0]}
              />
            )}

            {/* Mode 1: Area Mode */}
            {chartMode === 'area' ? (
              <Area
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={1.75}
                fillOpacity={1}
                fill="url(#minimalGrad)"
              />
            ) : (
              /* Mode 2: Real Candlestick Bar Mode */
              <Bar
                dataKey="close"
                shape={<CandlestickBar />}
              />
            )}

            {showMA20 && (
              <Line
                type="monotone"
                dataKey="ma20"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="2 2"
              />
            )}
            {showMA50 && (
              <Line
                type="monotone"
                dataKey="ma50"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="3 3"
              />
            )}
            {showMA200 && (
              <Line
                type="monotone"
                dataKey="ma200"
                stroke="#10b981"
                strokeWidth={1.5}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Technical Drawing Canvas Layer */}
        {activeTool !== 'none' && (
          <svg
            ref={svgRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="absolute inset-0 w-full h-full cursor-crosshair z-20"
          >
            {/* Render saved drawings */}
            {drawings.map((d) => {
              if (d.type === 'line' && d.points.length >= 2) {
                return (
                  <line
                    key={d.id}
                    x1={d.points[0].x}
                    y1={d.points[0].y}
                    x2={d.points[1].x}
                    y2={d.points[1].y}
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                );
              }
              const pathStr = d.points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
              return <path key={d.id} d={pathStr} stroke="#38bdf8" strokeWidth={2} fill="none" />;
            })}

            {/* Currently drawing line */}
            {isDrawing && currentPoints.length > 1 && (
              activeTool === 'line' ? (
                <line
                  x1={currentPoints[0].x}
                  y1={currentPoints[0].y}
                  x2={currentPoints[1].x}
                  y2={currentPoints[1].y}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              ) : (
                <path
                  d={currentPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="none"
                />
              )
            )}
          </svg>
        )}
      </div>
    </div>
  );
};
