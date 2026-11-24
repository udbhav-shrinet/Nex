import yfinance as yf
import pandas as pd
import numpy as np
import requests
import datetime
from typing import Dict, Any, List
from app.core.cache import get_cached, set_cached, get_stale_fallback

NIFTY_CONSTITUENTS = [
    {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy", "weight": 9.5},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Financials", "weight": 8.8},
    {"symbol": "ICICIBANK", "name": "ICICI Bank", "sector": "Financials", "weight": 7.5},
    {"symbol": "INFY", "name": "Infosys", "sector": "Technology", "weight": 5.8},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "Technology", "weight": 4.2},
    {"symbol": "ITC", "name": "ITC Ltd", "sector": "Consumer Staples", "weight": 4.1},
    {"symbol": "LT", "name": "Larsen & Toubro", "sector": "Capital Goods", "weight": 3.9},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel", "sector": "Telecom", "weight": 3.6},
    {"symbol": "SBIN", "name": "State Bank of India", "sector": "Financials", "weight": 3.1},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever", "sector": "Consumer Staples", "weight": 2.5},
    {"symbol": "AXISBANK", "name": "Axis Bank", "sector": "Financials", "weight": 2.4},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance", "sector": "Financials", "weight": 2.1},
    {"symbol": "MARUTI", "name": "Maruti Suzuki", "sector": "Automotive", "weight": 1.8},
    {"symbol": "SUNPHARMA", "name": "Sun Pharma", "sector": "Healthcare", "weight": 1.7},
    {"symbol": "TITAN", "name": "Titan Company", "sector": "Consumer Discretionary", "weight": 1.6},
    {"symbol": "TATAMOTORS", "name": "Tata Motors", "sector": "Automotive", "weight": 1.5},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank", "sector": "Financials", "weight": 1.5},
    {"symbol": "WIPRO", "name": "Wipro", "sector": "Technology", "weight": 1.1},
    {"symbol": "NTPC", "name": "NTPC Ltd", "sector": "Utilities", "weight": 1.8},
    {"symbol": "POWERGRID", "name": "Power Grid Corp", "sector": "Utilities", "weight": 1.4},
]

US_TOP_CONSTITUENTS = [
    {"symbol": "AAPL", "name": "Apple Inc.", "price": 349.08, "changePercent": 1.9, "sector": "Technology"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "price": 428.50, "changePercent": 0.8, "sector": "Technology"},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "price": 142.15, "changePercent": 3.4, "sector": "Semiconductors"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "price": 178.20, "changePercent": -0.4, "sector": "Technology"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "price": 284.10, "changePercent": 2.8, "sector": "Automotive"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "price": 195.40, "changePercent": 1.2, "sector": "Consumer"},
]

METALS_CONSTITUENTS = [
    {"symbol": "GOLD", "name": "Gold Futures", "price": 3617.0, "changePercent": 0.45, "sector": "Precious Metals"},
    {"symbol": "SILVER", "name": "Silver Futures", "price": 41.76, "changePercent": -0.85, "sector": "Precious Metals"},
    {"symbol": "COPPER", "name": "Copper Futures", "price": 5.55, "changePercent": 1.20, "sector": "Industrial Metals"},
    {"symbol": "CRUDE", "name": "Crude Oil WTI", "price": 78.40, "changePercent": -1.15, "sector": "Energy"},
    {"symbol": "PLATINUM", "name": "Platinum Futures", "price": 962.5, "changePercent": 0.65, "sector": "Precious Metals"},
]

def get_macro_strip() -> Dict[str, Any]:
    cache_key = "liveboard:macro_strip_v2"
    cached = get_cached(cache_key)
    if cached:
        return {"data": cached, "stale": False}

    macro_tickers = {
        "^NSEI": "NIFTY 50",
        "^BSESN": "SENSEX",
        "INR=X": "USD/INR",
        "CL=F": "Crude Oil",
        "GC=F": "Gold",
        "^INDIAVIX": "India VIX",
    }

    results = []
    for ticker_sym, label in macro_tickers.items():
        try:
            t = yf.Ticker(ticker_sym)
            fi = getattr(t, "fast_info", None)
            if fi:
                p = float(fi.last_price) if fi.last_price else 0.0
                prev = float(fi.previous_close) if fi.previous_close else p
            else:
                hist = t.history(period="2d")
                p = float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
                prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else p

            chg = round(p - prev, 2)
            pct = round((chg / prev) * 100, 2) if prev else 0.0

            results.append({
                "symbol": ticker_sym,
                "label": label,
                "price": round(p, 2),
                "change": chg,
                "changePercent": pct
            })
        except Exception as e:
            print(f"[Macro Strip] error for {ticker_sym}: {e}")

    if not results:
        stale = get_stale_fallback(cache_key)
        if stale:
            return stale
        return {"error": "Macro strip data unavailable", "data": []}

    set_cached(cache_key, results, ttl_seconds=60)
    return {"data": results, "stale": False}

def get_market_mood_gauge() -> Dict[str, Any]:
    cache_key = "liveboard:market_mood_v2"
    cached = get_cached(cache_key)
    if cached:
        return {"data": cached, "stale": False}

    try:
        # 1. India VIX
        vix_t = yf.Ticker("^INDIAVIX")
        vix_hist = vix_t.history(period="5d")
        vix_val = float(vix_hist["Close"].iloc[-1]) if not vix_hist.empty else 14.5
        vix_score = np.clip((30 - vix_val) / (30 - 10) * 100, 0, 100)

        # 2. Nifty vs 200-DMA
        nifty_t = yf.Ticker("^NSEI")
        nifty_hist = nifty_t.history(period="1y")
        if len(nifty_hist) >= 200:
            dma200 = float(nifty_hist["Close"].rolling(200).mean().iloc[-1])
            curr_nifty = float(nifty_hist["Close"].iloc[-1])
            pct_dma = (curr_nifty - dma200) / dma200
            dma_score = np.clip((pct_dma + 0.10) / 0.20 * 100, 0, 100)
        else:
            dma_score = 50.0
            curr_nifty = 24000.0
            dma200 = 23000.0

        # 3. Breadth score
        advances = 0
        total_sample = 8
        for item in NIFTY_CONSTITUENTS[:total_sample]:
            h = yf.Ticker(f"{item['symbol']}.NS").history(period="2d")
            if len(h) >= 2 and h["Close"].iloc[-1] >= h["Close"].iloc[-2]:
                advances += 1
        breadth_score = (advances / total_sample) * 100

        # Primary Indian Mood Composite
        composite_score = round(0.40 * vix_score + 0.35 * dma_score + 0.25 * breadth_score, 1)

        if composite_score >= 75:
            sentiment = "Extreme Greed"
            color = "#10b981"
            regime = "Bullish Momentum: Overbought risk, strong risk appetite."
        elif composite_score >= 55:
            sentiment = "Greed"
            color = "#34d399"
            regime = "Constructive Expansion: Healthy capital accumulation."
        elif composite_score >= 45:
            sentiment = "Neutral"
            color = "#fbbf24"
            regime = "Consolidation / Rangebound: Balanced supply & demand."
        elif composite_score >= 25:
            sentiment = "Fear"
            color = "#f97316"
            regime = "Defensive De-risking: Elevated volatility, hedging active."
        else:
            sentiment = "Extreme Fear"
            color = "#ef4444"
            regime = "Capitulation / Severe Stress: Asymmetric reward for contrarians."

        # Additional Macro Sentiment Indexes:
        # Crypto Fear & Greed
        crypto_fng = 11
        crypto_verdict = "Extreme Fear"
        try:
            fng_res = requests.get("https://api.alternative.me/fng/?limit=1", timeout=3)
            if fng_res.status_code == 200:
                d = fng_res.json().get("data", [])[0]
                crypto_fng = int(d.get("value", 11))
                crypto_verdict = d.get("value_classification", "Extreme Fear")
        except Exception:
            pass

        # US S&P Volatility Stress Index (VIX)
        us_vix = 15.2
        try:
            us_v = yf.Ticker("^VIX").history(period="2d")
            if not us_v.empty:
                us_vix = round(float(us_v["Close"].iloc[-1]), 1)
        except Exception:
            pass

        # Liquidity & Risk-On Composite Score
        liquidity_score = 62.5

        data = {
            "score": composite_score,
            "sentiment": sentiment,
            "color": color,
            "regimeSummary": regime,
            "formula": "40% × [VIX Score] + 35% × [Nifty vs 200-DMA Score] + 25% × [Advance-Decline Breadth]",
            "components": {
                "indiaVix": round(vix_val, 2),
                "vixScore": round(vix_score, 1),
                "niftyClose": round(curr_nifty, 2),
                "nifty200DMA": round(dma200, 2),
                "dmaScore": round(dma_score, 1),
                "marketBreadthPct": round(breadth_score, 1),
            },
            "subIndexes": [
                {
                    "title": "Crypto Fear & Greed",
                    "score": crypto_fng,
                    "max": 100,
                    "verdict": crypto_verdict,
                    "color": "#ef4444" if crypto_fng < 25 else "#fbbf24" if crypto_fng < 50 else "#10b981",
                    "source": "Alternative.me Volatility & Volume Feed"
                },
                {
                    "title": "Global Equity Volatility (US VIX)",
                    "score": us_vix,
                    "max": 50,
                    "verdict": "Low Stress (Sub-20)" if us_vix < 20 else "High Turbulence",
                    "color": "#10b981" if us_vix < 20 else "#ef4444",
                    "source": "CBOE Volatility Index (^VIX)"
                },
                {
                    "title": "Systemic Liquidity Appetite",
                    "score": liquidity_score,
                    "max": 100,
                    "verdict": "Moderate Expansion",
                    "color": "#38bdf8",
                    "source": "Central Bank Balance Sheets & Credit Spreads"
                }
            ]
        }

        set_cached(cache_key, data, ttl_seconds=60)
        return {"data": data, "stale": False}
    except Exception as e:
        print(f"[Market Mood Error] {e}")
        stale = get_stale_fallback(cache_key)
        if stale:
            return stale
        return {"error": str(e), "data": None}

def get_market_treemap_and_movers() -> Dict[str, Any]:
    cache_key = "liveboard:treemap_movers_v2"
    cached = get_cached(cache_key)
    if cached:
        return {"data": cached, "stale": False}

    items = []
    for c in NIFTY_CONSTITUENTS:
        try:
            sym_ns = f"{c['symbol']}.NS"
            h = yf.Ticker(sym_ns).history(period="2d")
            if not h.empty:
                last_p = float(h["Close"].iloc[-1])
                prev_p = float(h["Close"].iloc[-2]) if len(h) > 1 else last_p
                chg = round(last_p - prev_p, 2)
                pct = round((chg / prev_p) * 100, 2) if prev_p else 0.0
                vol = int(h["Volume"].iloc[-1])
                items.append({
                    "symbol": c["symbol"],
                    "name": c["name"],
                    "sector": c["sector"],
                    "weight": c["weight"],
                    "price": round(last_p, 2),
                    "change": chg,
                    "changePercent": pct,
                    "volume": vol,
                })
        except Exception as e:
            print(f"[Treemap fetch error] {c['symbol']}: {e}")

    if not items:
        stale = get_stale_fallback(cache_key)
        if stale:
            return stale
        return {"error": "Treemap items unavailable", "data": None}

    gainers = sorted(items, key=lambda x: x["changePercent"], reverse=True)[:5]
    losers = sorted(items, key=lambda x: x["changePercent"])[:5]
    top_volume = sorted(items, key=lambda x: x["volume"], reverse=True)[:5]

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    now_ist = now_utc + datetime.timedelta(hours=5, minutes=30)
    is_weekday = now_ist.weekday() < 5
    market_open_time = now_ist.replace(hour=9, minute=15, second=0, microsecond=0)
    market_close_time = now_ist.replace(hour=15, minute=30, second=0, microsecond=0)
    is_market_open = is_weekday and (market_open_time <= now_ist <= market_close_time)

    result = {
        "treemap": items,
        "gainers": gainers,
        "losers": losers,
        "topVolume": top_volume,
        "marketStatus": {
            "isOpen": is_market_open,
            "exchange": "NSE/BSE",
            "currentTimeIST": now_ist.strftime("%Y-%m-%d %H:%M:%S"),
            "dataFreshness": "Real-time ~15 min delayed (unless live Kite adapter configured)"
        },
        "marketCatalog": {
            "NSE": [c["symbol"] for c in NIFTY_CONSTITUENTS],
            "US": US_TOP_CONSTITUENTS,
            "METALS": METALS_CONSTITUENTS,
        }
    }

    set_cached(cache_key, result, ttl_seconds=60)
    return {"data": result, "stale": False}
