import feedparser
import requests
import json
import time
import urllib.parse
from typing import List, Dict, Any, Optional
from app.core.cache import get_cached, set_cached, get_stale_fallback

# Initialize VADER sentiment analyzer
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    vader_analyzer = SentimentIntensityAnalyzer()
except ImportError:
    vader_analyzer = None

FEEDS = [
    {
        "name": "Economic Times Markets",
        "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "type": "equity"
    },
    {
        "name": "Cointelegraph",
        "url": "https://cointelegraph.com/rss",
        "type": "crypto"
    },
    {
        "name": "Decrypt",
        "url": "https://decrypt.co/feed",
        "type": "crypto"
    },
    {
        "name": "Google News Business",
        "url": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en",
        "type": "macro"
    }
]

def analyze_sentiment_and_tags(title: str, summary: str) -> Dict[str, Any]:
    text = f"{title}. {summary}".strip()
    text_lower = text.lower()
    
    # Quantitative Sentiment Score via VADER
    compound = 0.0
    pos_score = 0.0
    neg_score = 0.0
    neu_score = 1.0
    
    if vader_analyzer:
        vs = vader_analyzer.polarity_scores(text)
        compound = round(vs["compound"], 3)
        pos_score = round(vs["pos"], 3)
        neg_score = round(vs["neg"], 3)
        neu_score = round(vs["neu"], 3)

    if compound >= 0.05:
        sentiment_label = "Bullish"
        sentiment_color = "#10b981"
    elif compound <= -0.05:
        sentiment_label = "Bearish"
        sentiment_color = "#f43f5e"
    else:
        sentiment_label = "Neutral"
        sentiment_color = "#9ca3af"

    tags = []
    if any(k in text_lower for k in ["surge", "rally", "bull", "jump", "high", "gain", "profit", "record", "growth", "boost"]):
        tags.append("Bullish")
    if any(k in text_lower for k in ["crash", "drop", "plunge", "bear", "down", "fall", "loss", "decline", "warn", "slump"]):
        tags.append("Bearish")
    if any(k in text_lower for k in ["sec", "rbi", "sebi", "court", "law", "rule", "regulat", "ban", "policy", "tax", "govt"]):
        tags.append("Regulatory")
    if any(k in text_lower for k in ["q1", "q2", "q3", "q4", "quarter", "revenue", "ebitda", "earnings", "dividend", "profit"]):
        tags.append("Earnings")
    if any(k in text_lower for k in ["inflation", "gdp", "rate hike", "fed", "central bank", "tariffs", "war", "crude", "oil", "gold"]):
        tags.append("Macro")
    if not tags:
        tags.append("General")

    return {
        "tags": tags,
        "sentiment": {
            "label": sentiment_label,
            "score": compound,
            "color": sentiment_color,
            "breakdown": {"positive": pos_score, "negative": neg_score, "neutral": neu_score}
        }
    }

def get_live_news(feed_type: Optional[str] = None, keyword: Optional[str] = None) -> Dict[str, Any]:
    cache_key = f"news_sentiment_v1:{feed_type or 'all'}:{keyword or 'none'}"
    cached = get_cached(cache_key)
    if cached:
        return {"data": cached, "stale": False}

    articles = []

    if keyword and len(keyword.strip()) > 1:
        kw = keyword.strip()
        encoded = urllib.parse.quote(f"{kw} stock financial")
        gnews_url = f"https://news.google.com/rss/search?q={encoded}&hl=en-IN&gl=IN&ceid=IN:en"
        try:
            parsed = feedparser.parse(gnews_url)
            for entry in parsed.entries[:10]:
                title = entry.get("title", "")
                link = entry.get("link", "#")
                pub_date = entry.get("published", "") or entry.get("updated", "")
                summary = entry.get("summary", "")
                source_title = entry.get("source", {}).get("title", "Google News")
                sent_data = analyze_sentiment_and_tags(title, summary)
                articles.append({
                    "title": title,
                    "link": link,
                    "pubDate": pub_date,
                    "source": source_title,
                    "category": "targeted",
                    "tags": sent_data["tags"],
                    "sentiment": sent_data["sentiment"],
                    "summary": summary
                })
        except Exception as e:
            print(f"[News Aggregator] Error fetching targeted Google News for {keyword}: {e}")

    selected_feeds = [f for f in FEEDS if feed_type is None or f["type"] == feed_type or feed_type == "all"]
    for feed_info in selected_feeds:
        try:
            parsed = feedparser.parse(feed_info["url"])
            for entry in parsed.entries[:10]:
                title = entry.get("title", "")
                link = entry.get("link", "#")
                pub_date = entry.get("published", "") or entry.get("updated", "")
                summary = entry.get("summary", "")

                if keyword:
                    kw_lower = keyword.lower()
                    if kw_lower not in title.lower() and kw_lower not in summary.lower():
                        continue

                sent_data = analyze_sentiment_and_tags(title, summary)
                articles.append({
                    "title": title,
                    "link": link,
                    "pubDate": pub_date,
                    "source": feed_info["name"],
                    "category": feed_info["type"],
                    "tags": sent_data["tags"],
                    "sentiment": sent_data["sentiment"],
                    "summary": summary
                })
        except Exception as e:
            print(f"[News Aggregator] Error fetching {feed_info['name']}: {e}")

    if not articles:
        stale = get_stale_fallback(cache_key)
        if stale:
            return stale
        if keyword:
            return get_live_news(feed_type=feed_type, keyword=None)
        return {"data": [], "stale": False}

    seen = set()
    deduped = []
    for a in articles:
        clean_title = a["title"].strip()
        if clean_title not in seen:
            seen.add(clean_title)
            deduped.append(a)

    set_cached(cache_key, deduped, ttl_seconds=180)
    return {"data": deduped, "stale": False}
