import yfinance as yf
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.core.cache import get_cached, set_cached, get_stale_fallback
from app.data.stock_provider import normalize_ticker

def compute_quant_stats(ticker: str, market: str = "NSE", benchmark: str = "^NSEI") -> Dict[str, Any]:
    full_symbol = normalize_ticker(ticker, market)
    cache_key = f"quant_stats_v2:{full_symbol}"
    cached = get_cached(cache_key)
    if cached:
        return {"data": cached, "stale": False}

    try:
        df_stock = yf.Ticker(full_symbol).history(period="2y", interval="1d")
        df_bench = yf.Ticker(benchmark).history(period="2y", interval="1d")

        if df_stock.empty:
            return {"error": f"Insufficient price history for {full_symbol}", "data": None}

        stock_ret = df_stock["Close"].pct_change().dropna()
        bench_ret = df_bench["Close"].pct_change().dropna() if not df_bench.empty else stock_ret

        aligned = pd.concat([stock_ret, bench_ret], axis=1, join="inner").dropna()
        aligned.columns = ["stock", "benchmark"]

        s_ret = aligned["stock"]
        b_ret = aligned["benchmark"]

        ann_vol = float(s_ret.std() * np.sqrt(252))

        start_p = float(df_stock["Close"].iloc[0])
        end_p = float(df_stock["Close"].iloc[-1])
        n_years = len(df_stock) / 252.0
        cagr = float((end_p / start_p) ** (1.0 / n_years) - 1.0) if n_years > 0 and start_p > 0 else 0.0

        cum_ret = (1 + s_ret).cumprod()
        peak = cum_ret.cummax()
        drawdown = (cum_ret - peak) / peak
        max_drawdown = float(drawdown.min())

        cov = np.cov(s_ret, b_ret)[0][1]
        var_b = np.var(b_ret)
        beta = float(cov / var_b) if var_b > 0 else 1.0

        rf_annual = 0.065
        rf_daily = rf_annual / 252
        excess_ret = s_ret - rf_daily
        sharpe = float(excess_ret.mean() / s_ret.std() * np.sqrt(252)) if s_ret.std() > 0 else 0.0

        # Sortino Ratio (Downside deviation only)
        downside_diff = s_ret[s_ret < 0]
        downside_std = float(downside_diff.std() * np.sqrt(252)) if len(downside_diff) > 0 else 0.001
        sortino = float((cagr - rf_annual) / downside_std) if downside_std > 0 else 0.0

        # Treynor Ratio: (Return - Rf) / Beta
        treynor = float((cagr - rf_annual) / beta) if beta != 0 else 0.0

        # Jensen's Alpha: (Stock CAGR) - [Rf + Beta * (Bench CAGR - Rf)]
        b_start = float(df_bench["Close"].iloc[0]) if not df_bench.empty else start_p
        b_end = float(df_bench["Close"].iloc[-1]) if not df_bench.empty else end_p
        b_cagr = float((b_end / b_start) ** (1.0 / n_years) - 1.0) if n_years > 0 and b_start > 0 else 0.0
        jensens_alpha = float((cagr - rf_annual) - beta * (b_cagr - rf_annual))

        # Calmar Ratio: CAGR / abs(Max Drawdown)
        calmar = float(cagr / abs(max_drawdown)) if abs(max_drawdown) > 0 else 0.0

        # Historical Value at Risk (VaR 95% & 99% 1-day)
        var_95 = float(np.percentile(s_ret, 5))
        var_99 = float(np.percentile(s_ret, 1))

        # Expected Shortfall (CVaR 95% - average loss when loss exceeds VaR)
        tail_losses = s_ret[s_ret <= var_95]
        cvar_95 = float(tail_losses.mean()) if len(tail_losses) > 0 else var_95

        counts, bin_edges = np.histogram(s_ret * 100, bins=20)
        dist_bins = []
        for i in range(len(counts)):
            dist_bins.append({
                "range": f"{round(bin_edges[i], 1)}% to {round(bin_edges[i+1], 1)}%",
                "count": int(counts[i]),
                "mid": round((bin_edges[i] + bin_edges[i+1]) / 2, 2)
            })

        stats = {
            "symbol": ticker.upper(),
            "annualizedVolatility": round(ann_vol * 100, 2),
            "cagr": round(cagr * 100, 2),
            "maxDrawdown": round(max_drawdown * 100, 2),
            "beta": round(beta, 2),
            "sharpeRatio": round(sharpe, 2),
            "sortinoRatio": round(sortino, 2),
            "treynorRatio": round(treynor * 100, 2),
            "jensensAlpha": round(jensens_alpha * 100, 2),
            "calmarRatio": round(calmar, 2),
            "var95": round(abs(var_95) * 100, 2),
            "var99": round(abs(var_99) * 100, 2),
            "cvar95": round(abs(cvar_95) * 100, 2),
            "returnsDistribution": dist_bins,
            "observations": len(s_ret)
        }

        set_cached(cache_key, stats, ttl_seconds=3600)
        return {"data": stats, "stale": False}
    except Exception as e:
        print(f"[Error in quant stats] {e}")
        stale = get_stale_fallback(cache_key)
        if stale:
            return stale
        return {"error": str(e), "data": None}

def compute_correlation_matrix(tickers: List[str], market: str = "NSE", window_days: int = 30) -> Dict[str, Any]:
    cache_key = f"corr:{':'.join(sorted(tickers))}:{window_days}"
    cached = get_cached(cache_key)
    if cached:
        return {"data": cached, "stale": False}

    try:
        returns_dict = {}
        for sym in tickers:
            full_sym = normalize_ticker(sym, market)
            df = yf.Ticker(full_sym).history(period=f"{max(window_days + 40, 60)}d", interval="1d")
            if not df.empty:
                returns_dict[sym.upper()] = df["Close"].pct_change().dropna().tail(window_days)

        df_returns = pd.DataFrame(returns_dict).dropna()
        corr_matrix = df_returns.corr().round(2)

        result = {
            "tickers": list(corr_matrix.columns),
            "matrix": corr_matrix.values.tolist(),
            "windowDays": window_days
        }

        set_cached(cache_key, result, ttl_seconds=1800)
        return {"data": result, "stale": False}
    except Exception as e:
        print(f"[Error in correlation matrix] {e}")
        stale = get_stale_fallback(cache_key)
        if stale:
            return stale
        return {"error": str(e), "data": None}

def calculate_everyday_calc(calc_type: str, params: Dict[str, float]) -> Dict[str, Any]:
    if calc_type == "sip":
        p = params.get("monthlyInvestment", 5000)
        r = (params.get("annualRate", 12) / 100) / 12
        n = params.get("years", 10) * 12
        total_invested = p * n
        maturity_value = p * (((1 + r) ** n - 1) / r) * (1 + r)
        wealth_gain = maturity_value - total_invested
        return {
            "type": "sip",
            "totalInvested": round(total_invested, 2),
            "wealthGain": round(wealth_gain, 2),
            "maturityValue": round(maturity_value, 2)
        }
    elif calc_type == "lumpsum":
        p = params.get("investment", 100000)
        r = params.get("annualRate", 12) / 100
        t = params.get("years", 10)
        maturity_value = p * ((1 + r) ** t)
        return {
            "type": "lumpsum",
            "totalInvested": round(p, 2),
            "wealthGain": round(maturity_value - p, 2),
            "maturityValue": round(maturity_value, 2)
        }
    elif calc_type == "emi":
        p = params.get("principal", 1000000)
        r = (params.get("annualRate", 8.5) / 100) / 12
        n = params.get("years", 20) * 12
        emi = (p * r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)
        total_payment = emi * n
        total_interest = total_payment - p
        return {
            "type": "emi",
            "monthlyEmi": round(emi, 2),
            "totalInterest": round(total_interest, 2),
            "totalPayment": round(total_payment, 2)
        }
    elif calc_type == "fd":
        p = params.get("principal", 100000)
        r = params.get("annualRate", 7.0) / 100
        t = params.get("years", 5)
        n = 4
        maturity = p * ((1 + r/n) ** (n*t))
        return {
            "type": "fd",
            "principal": round(p, 2),
            "interestEarned": round(maturity - p, 2),
            "maturityValue": round(maturity, 2)
        }
    return {"error": "Unknown calculator type"}
