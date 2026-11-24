import React, { useState, useEffect } from 'react';
import {
  fetchQuote,
  fetchPriceHistory,
  fetchCryptoSpot,
  fetchTreemapAndMovers,
  StockQuote,
  PricePoint,
} from './services/api';
import { SharedChart } from './components/SharedChart';
import { RangeWidgets } from './components/RangeWidgets';
import { CommandPalette } from './components/CommandPalette';
import { FinancialsModule } from './modules/FinancialsModule';
import { LiveBoardModule } from './modules/LiveBoardModule';
import { ModelLabModule } from './modules/ModelLabModule';
import { NewsChainModule } from './modules/NewsChainModule';
import { ComparativeModule } from './modules/ComparativeModule';
import { AccountsModule } from './modules/AccountsModule';
import { EconomicsModule } from './modules/EconomicsModule';
import {
  TrendingUp,
  BarChart2,
  Sparkles,
  Newspaper,
  Scale,
  FileText,
  Globe,
  Search,
  Sun,
  Moon,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState<
    'liveboard' | 'financials' | 'modellab' | 'newschain' | 'comparative' | 'accounts' | 'economics'
  >('liveboard');

  const [selectedTicker, setSelectedTicker] = useState('RELIANCE');
  const [market, setMarket] = useState<'NSE' | 'US' | 'METALS' | 'CRYPTO'>('NSE');
  const [timeframe, setTimeframe] = useState('1Y');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [tickerRibbon, setTickerRibbon] = useState<any[]>([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Minimal Theme & Night Light Toggles
  const [theme, setTheme] = useState<'dark' | 'obsidian' | 'slate'>('dark');
  const [nightLight, setNightLight] = useState(false);

  // Search input state for horizontal top search bar
  const [inlineSearch, setInlineSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchCatalog = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy', market: 'NSE' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'Technology', market: 'NSE' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Financials', market: 'NSE' },
    { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'Technology', market: 'NSE' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sector: 'Financials', market: 'NSE' },
    { symbol: 'ITC', name: 'ITC Ltd.', sector: 'Consumer Staples', market: 'NSE' },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'Capital Goods', market: 'NSE' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecom', market: 'NSE' },
    { symbol: 'SBIN', name: 'State Bank of India', sector: 'Financials', market: 'NSE' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', sector: 'Automotive', market: 'NSE' },
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', market: 'US' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', market: 'US' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', market: 'US' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', market: 'US' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', market: 'US' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', market: 'US' },
    { symbol: 'GOLD', name: 'Gold Futures (COMEX)', sector: 'Precious Metals', market: 'METALS' },
    { symbol: 'SILVER', name: 'Silver Futures', sector: 'Precious Metals', market: 'METALS' },
    { symbol: 'COPPER', name: 'Copper Futures', sector: 'Base Metals', market: 'METALS' },
    { symbol: 'CRUDE', name: 'Crude Oil WTI', sector: 'Energy', market: 'METALS' },
    { symbol: 'BTCUSDT', name: 'Bitcoin Spot', sector: 'Layer 1 Crypto', market: 'CRYPTO' },
    { symbol: 'ETHUSDT', name: 'Ethereum Spot', sector: 'Smart Contracts', market: 'CRYPTO' },
    { symbol: 'SOLUSDT', name: 'Solana Spot', sector: 'High-Throughput L1', market: 'CRYPTO' },
    { symbol: 'BNBUSDT', name: 'BNB Coin', sector: 'Exchange Ecosystem', market: 'CRYPTO' },
    { symbol: 'XRPUSDT', name: 'XRP Ledger', sector: 'Payments', market: 'CRYPTO' },
  ];

  const searchSuggestions = inlineSearch.trim()
    ? searchCatalog.filter(
        (item) =>
          item.symbol.toLowerCase().includes(inlineSearch.toLowerCase()) ||
          item.name.toLowerCase().includes(inlineSearch.toLowerCase()) ||
          item.sector.toLowerCase().includes(inlineSearch.toLowerCase())
      ).slice(0, 7)
    : [];

  const loadAssetData = async (sym: string, mkt = market) => {
    setLoading(true);
    try {
      const [q, h] = await Promise.all([
        fetchQuote(sym, mkt),
        fetchPriceHistory(sym, timeframe, mkt),
      ]);
      setQuote(q);
      setHistory(h);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssetData(selectedTicker, market);
  }, [selectedTicker, timeframe, market]);

  // Dynamic marquee based on selected market
  useEffect(() => {
    if (market === 'CRYPTO') {
      fetchCryptoSpot().then(setTickerRibbon).catch(console.error);
    } else {
      fetchTreemapAndMovers().then((res) => {
        if (market === 'US') {
          setTickerRibbon(res?.marketCatalog?.US || []);
        } else if (market === 'METALS') {
          setTickerRibbon(res?.marketCatalog?.METALS || []);
        } else {
          setTickerRibbon(res?.treemap || []);
        }
      }).catch(console.error);
    }
  }, [market]);

  const handleSelectTicker = (sym: string) => {
    let detectedMarket: 'NSE' | 'US' | 'METALS' | 'CRYPTO' = 'NSE';
    const s = sym.toUpperCase();
    if (s.includes('USDT') || s === 'BTC' || s === 'ETH') {
      detectedMarket = 'CRYPTO';
    } else if (['GOLD', 'SILVER', 'COPPER', 'CRUDE', 'PLATINUM'].includes(s)) {
      detectedMarket = 'METALS';
    } else if (['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'AMZN'].includes(s)) {
      detectedMarket = 'US';
    }
    setMarket(detectedMarket);
    setSelectedTicker(sym);
  };

  const themeBg =
    theme === 'obsidian' ? 'bg-[#090b0e]' : theme === 'slate' ? 'bg-[#0f172a]' : 'bg-[#0d1117]';

  return (
    <div
      className={`min-h-screen ${themeBg} text-gray-200 font-sans flex flex-col selection:bg-zinc-700 transition-colors duration-300 ${
        nightLight ? 'sepia-[0.18]' : ''
      }`}
    >
      {/* 1. Dynamic Smooth Continuous Top Marquee (Changes based on active market) */}
      <div className="bg-[#161b22] border-b border-gray-800 px-4 py-2 flex items-center justify-between text-xs overflow-hidden whitespace-nowrap gap-6">
        <div className="flex items-center space-x-6 overflow-hidden">
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white tracking-wide">NEX</span>
            <span className="text-[10px] text-gray-500 font-mono">v1.3</span>
          </div>

          {/* Continuous scrolling marquee */}
          <div className="flex items-center space-x-8 font-mono text-[11px] animate-marquee">
            {tickerRibbon.map((c, i) => {
              const isPos = (c.changePercent ?? 0) >= 0;
              return (
                <div
                  key={`${c.symbol}-${i}`}
                  onClick={() => handleSelectTicker(c.symbol)}
                  className="flex items-center space-x-1.5 cursor-pointer hover:text-white transition-colors shrink-0"
                >
                  <span className="text-gray-400 font-bold">{c.coin || c.symbol}</span>
                  <span className="text-white">
                    {market === 'NSE' ? '₹' : '$'}
                    {c.price > 10 ? c.price?.toLocaleString() : c.price}
                  </span>
                  <span className={isPos ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {isPos ? '+' : ''}{c.changePercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Category Selector & Aesthetic Theme Switcher */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center bg-[#0d1117] border border-gray-800 rounded-lg p-0.5 text-[11px] font-mono">
            {(['NSE', 'US', 'METALS', 'CRYPTO'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMarket(m);
                  if (m === 'NSE') setSelectedTicker('RELIANCE');
                  if (m === 'US') setSelectedTicker('AAPL');
                  if (m === 'METALS') setSelectedTicker('GOLD');
                  if (m === 'CRYPTO') setSelectedTicker('BTCUSDT');
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  market === m ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Theme Palette & Night Light Toggles */}
          <div className="flex items-center space-x-1 bg-[#0d1117] border border-gray-800 rounded-lg p-1">
            <button
              title="Obsidian Dark"
              onClick={() => setTheme('obsidian')}
              className={`w-3.5 h-3.5 rounded-full bg-black border ${theme === 'obsidian' ? 'border-emerald-400' : 'border-gray-700'}`}
            />
            <button
              title="Classic Dark"
              onClick={() => setTheme('dark')}
              className={`w-3.5 h-3.5 rounded-full bg-[#161b22] border ${theme === 'dark' ? 'border-emerald-400' : 'border-gray-700'}`}
            />
            <button
              title="Slate Blue"
              onClick={() => setTheme('slate')}
              className={`w-3.5 h-3.5 rounded-full bg-[#1e293b] border ${theme === 'slate' ? 'border-emerald-400' : 'border-gray-700'}`}
            />
            <button
              title="Night Light (Warm Filter)"
              onClick={() => setNightLight(!nightLight)}
              className={`ml-1 text-xs p-0.5 rounded ${nightLight ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Eye size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Prominent Horizontal Search Bar with Auto-Suggestions (Positioned right above the Navigation Menu) */}
      <div className="px-6 pt-4 pb-2 max-w-7xl mx-auto w-full relative">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={inlineSearch}
            onChange={(e) => {
              setInlineSearch(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => {
              if (inlineSearch.trim()) setShowSearchDropdown(true);
            }}
            onBlur={() => {
              // slight delay so clicks on dropdown items register
              setTimeout(() => setShowSearchDropdown(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inlineSearch.trim()) {
                handleSelectTicker(inlineSearch.trim().toUpperCase());
                setInlineSearch('');
                setShowSearchDropdown(false);
              } else if (e.key === 'Escape') {
                setShowSearchDropdown(false);
              }
            }}
            placeholder="Search all Indian, US, Commodities, and Crypto assets (type to see auto-suggestions)..."
            className="w-full bg-[#161b22] border border-gray-800 rounded-xl pl-11 pr-20 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 transition-colors shadow-inner font-sans"
          />
          <button
            onClick={() => setIsCommandOpen(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded bg-[#0d1117] text-gray-400 border border-gray-800 hover:text-white"
          >
            ⌘K
          </button>
        </div>

        {/* Live Auto-Suggestions Dropdown */}
        {showSearchDropdown && searchSuggestions.length > 0 && (
          <div className="absolute left-6 right-6 top-[calc(100%-8px)] z-50 bg-[#161b22] border border-gray-800 rounded-xl shadow-2xl overflow-hidden mt-1 divide-y divide-gray-800/60 max-w-7xl">
            <div className="px-3 py-1.5 bg-[#0d1117] text-[10px] font-mono text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Matching Instruments ({searchSuggestions.length})</span>
              <span>Press Enter or Click to View</span>
            </div>
            {searchSuggestions.map((item) => (
              <div
                key={item.symbol}
                onMouseDown={() => {
                  handleSelectTicker(item.symbol);
                  setInlineSearch('');
                  setShowSearchDropdown(false);
                }}
                className="px-4 py-2.5 hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-white">{item.symbol}</span>
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d1117] text-gray-400 border border-gray-800">
                    {item.sector}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {item.market}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Clean Header & Sorted Navigation Tabs */}
      <header className="bg-[#161b22] border-b border-gray-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setActiveModule('liveboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeModule === 'liveboard' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>Live Board</span>
          </button>
          <button
            onClick={() => setActiveModule('financials')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeModule === 'financials' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart2 size={13} />
            <span>Financials & Ratios</span>
          </button>
          <button
            onClick={() => setActiveModule('accounts')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeModule === 'accounts' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={13} />
            <span>Accounts & Ledger</span>
          </button>
          <button
            onClick={() => setActiveModule('comparative')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeModule === 'comparative' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Scale size={13} />
            <span>Comparative</span>
          </button>
          <button
            onClick={() => setActiveModule('modellab')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeModule === 'modellab' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            <span>Model Lab (ML)</span>
          </button>
          <button
            onClick={() => setActiveModule('newschain')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeModule === 'newschain' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Newspaper size={13} />
            <span>News Flow Graph</span>
          </button>
          <button
            onClick={() => setActiveModule('economics')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeModule === 'economics' ? 'bg-zinc-800 text-white font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe size={13} />
            <span>Economics</span>
          </button>
        </div>

        {/* Active Asset Header Strip */}
        {quote && (
          <div className="flex items-center space-x-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-white text-base">{quote.symbol}</span>
                <span className="text-xs text-gray-400">{quote.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0d1117] border border-gray-800 text-gray-400">
                  {quote.sector}
                </span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-lg font-extrabold text-white">
                {quote.currency === 'INR' ? '₹' : '$'}{quote.price?.toLocaleString()}
              </span>
              <span className={`text-xs font-semibold ${quote.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {quote.change >= 0 ? '+' : ''}{quote.changePercent}%
              </span>
            </div>
          </div>
        )}
      </header>

      {/* 4. Hero Visualizer Strip: Shared Chart & Range Indicators */}
      {quote && (
        <div className="px-6 pt-5 pb-2 space-y-4 max-w-7xl mx-auto w-full">
          <SharedChart
            data={history}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            currencySymbol={quote.currency === 'INR' ? '₹' : '$'}
          />
          <RangeWidgets
            price={quote.price}
            dayLow={quote.dayLow}
            dayHigh={quote.dayHigh}
            yearLow={quote.yearLow}
            yearHigh={quote.yearHigh}
            ath={quote.ath}
            athDistance={quote.athDistance}
            currency={quote.currency === 'INR' ? '₹' : '$'}
          />
        </div>
      )}

      {/* 5. Active Plugin Module Content */}
      <main className="flex-1 px-6 py-4 max-w-7xl mx-auto w-full">
        {activeModule === 'liveboard' && (
          <LiveBoardModule onSelectTicker={handleSelectTicker} />
        )}
        {activeModule === 'financials' && (
          <FinancialsModule ticker={selectedTicker} />
        )}
        {activeModule === 'accounts' && (
          <AccountsModule ticker={selectedTicker} />
        )}
        {activeModule === 'comparative' && (
          <ComparativeModule primaryTicker={selectedTicker} />
        )}
        {activeModule === 'modellab' && (
          <ModelLabModule ticker={selectedTicker} />
        )}
        {activeModule === 'newschain' && (
          <NewsChainModule ticker={selectedTicker} />
        )}
        {activeModule === 'economics' && (
          <EconomicsModule />
        )}
      </main>

      {/* 6. Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onSelectTicker={handleSelectTicker}
        onSwitchModule={(m: any) => setActiveModule(m)}
      />

      {/* 7. Minimal Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span>Nex Terminal</span>
          <span>•</span>
          <span>Authentic Institutional Financial System</span>
          <span>•</span>
          <span className="text-emerald-400">Zero Paid APIs</span>
        </div>
        <div className="font-mono text-[11px] text-gray-500">
          NSE/BSE • US Markets • Global Commodities & Metals • Crypto Vision
        </div>
      </footer>
    </div>
  );
}
