# Nex — Institutional Financial Terminal & ML Sandbox

Nex is a fast, minimal, aesthetic financial intelligence terminal combining classical fundamental equity research, customizable quantitative machine learning, causal news event-graphs, and live cross-market feeds with zero paid API dependencies.

---

## 🏛️ Core Modules & Capabilities

### 1. Cross-Market Asset Coverage & Command Palette (`⌘K`)
- **Indian Equities (NSE/BSE):** RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK, LT, ITC, etc.
- **US Equities:** AAPL, MSFT, NVDA, GOOGL, TSLA, etc.
- **Commodities & Metals:** Gold (`GC=F`), Silver (`SI=F`), Copper (`HG=F`), Crude Oil (`CL=F`).
- **Cryptocurrency Spot:** BTCUSDT, ETHUSDT, SOLUSDT via Binance Vision & CoinGecko.

### 2. Screener.in Consolidated Financial Architecture
- **Consolidated 10-Metric Top Grid:** Market Cap (₹ Cr.), CMP, 52W High/Low, Stock P/E, Book Value, Dividend Yield %, ROCE %, ROE %, Face Value, and Piotroski F-Score.
- **Compounded Growth Rates (CAGR):** Compounded Sales Growth, Profit Growth, Stock Price CAGR, and ROE over 10Y, 5Y, 3Y, and TTM.
- **Consolidated Peer Comparison Table:** Live CMP, P/E, Market Cap, Dividend Yield, and ROCE across sector leaders.
- **Shareholding Distribution Strip:** Promoters, FIIs, DIIs, Public, Government.
- **Full Statement Line-Items:** Annual & Quarterly reporting for Income Statement, Balance Sheet, and Cash Flow.

### 3. Quantitative ML Playground & Model Customizer
- **Real scikit-learn models:** Random Forest, Gradient Boosting (GBM), Extra Trees, Ridge, ElasticNet, k-NN, SVR.
- **Strict Chronological Walk-Forward Validation:** Verified **zero forward look-ahead leakage**.
- **Interactive Train/Test Split Slider:** From 50% to 90%.
- **Direct Hyperparameter Tuning:** Sliders for `n_estimators`, `max_depth`, `learning_rate`, `alpha`, and `k_neighbors`.
- **Configurable Feature Engineering:** Lookback lags, SMA windows, RSI lookback period, volatility windows, volume shifts, and High-Low spreads.
- **Real Backtest Visualizer:** Actual Price vs Model Prediction vs Naive Baseline on held-out test data with Directional Accuracy % and MAE delta.

### 4. Real Targeted News Chain
- Ingests **Google News RSS** targeted specifically to the queried ticker alongside financial feeds (Economic Times, Cointelegraph, Decrypt).
- Builds a 4-step causal transmission chain (*macro $\rightarrow$ policy $\rightarrow$ sector $\rightarrow$ earnings*).
- **5-Day Measured Move Event Study:** Measures asset move and computes excess alpha over the benchmark index.

### 5. Live Board & Fast Hover Preview
- Macro strip (Nifty 50, Sensex, USD/INR, Crude, Gold, India VIX).
- Transparent Composite Market Mood Gauge (40% VIX + 35% 200-DMA + 25% Breadth).
- Sector Treemap Heatmap and Top Gainers / Losers / Volume rankings.
- Fast hover preview displaying asset spot, 24h %, and volume in the top HUD.

---

## 🚀 Quickstart & Local Development

```bash
# Run both Backend (:8000) and Frontend (:5173) concurrently
make dev
```

- **Frontend App:** `http://localhost:5173`
- **Backend API & Swagger Docs:** `http://localhost:8000/docs`
