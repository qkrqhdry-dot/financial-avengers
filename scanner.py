# ==== scanner.py 시작 ====
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import yfinance as yf
import pandas as pd
import numpy as np
import time
from datetime import datetime

# ---------------------------------------------------------
# 1. 설정 (CONFIGURATION)
# ---------------------------------------------------------
# 🚨 사용자님의 구글 시트 이름을 정확히 적어주세요.
SHEET_NAME = "어벤져스" 
TAB_NAME = "Scanner_Data"
JSON_KEY_FILE = "service_account.json"

# 분석 대상 티커 (S&P500 주요 종목 + 관심 종목 추가)
TICKERS = [
    "NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", 
    "AMD", "INTC", "KO", "PEP", "JNJ", "O", "SCHD", "JEPI",
    "AVGO", "JPM", "V", "PG", "MA", "HD", "CVX", "MRK", "ABBV", "SMR"
]

# ---------------------------------------------------------
# 2. 스코어링 알고리즘
# ---------------------------------------------------------
def calculate_scores(info, history):
    scores = {}
    
    # (1) Valuation Score
    pe = info.get('trailingPE', 50) or 50
    pb = info.get('priceToBook', 10) or 10
    peg = info.get('pegRatio', 2.0) or 2.0
    
    val_score = 50
    if pe < 20: val_score += 20
    elif pe > 60: val_score -= 20
    if pb < 3: val_score += 15
    elif pb > 15: val_score -= 15
    if peg < 1.0: val_score += 15
    elif peg > 3.0: val_score -= 15
    scores['Valuation'] = max(0, min(100, val_score))

    # (2) Quality Score
    roe = info.get('returnOnEquity', 0) or 0
    pm = info.get('profitMargins', 0) or 0
    
    qual_score = 40
    if roe > 0.20: qual_score += 30
    elif roe > 0.10: qual_score += 10
    if pm > 0.20: qual_score += 30
    elif pm > 0.10: qual_score += 10
    scores['Quality'] = max(0, min(100, qual_score))

    # (3) Growth Score
    rev_g = info.get('revenueGrowth', 0) or 0
    earn_g = info.get('earningsGrowth', 0) or 0
    
    grow_score = 40
    if rev_g > 0.15: grow_score += 30
    elif rev_g > 0.05: grow_score += 10
    if earn_g > 0.15: grow_score += 30
    scores['Growth'] = max(0, min(100, grow_score))

    # (4) Momentum/Risk Score
    if not history.empty and len(history) > 200:
        daily_ret = history['Close'].pct_change().dropna()
        vol = daily_ret.std() * np.sqrt(252)
        mean_ret = daily_ret.mean() * 252
        sharpe = (mean_ret - 0.045) / vol if vol > 0 else 0
        
        roll_max = history['Close'].cummax()
        dd = (history['Close'] / roll_max) - 1.0
        mdd = dd.min()
        
        scores['Sharpe'] = round(sharpe, 2)
        scores['MDD'] = f"{round(mdd * 100, 2)}%"
        scores['Volatility'] = f"{round(vol * 100, 2)}%"
        
        mom_score = 50
        if sharpe > 1.0: mom_score += 20
        if mdd > -0.20: mom_score += 15
        elif mdd < -0.50: mom_score -= 20
        scores['Momentum'] = max(0, min(100, mom_score))
    else:
        scores['Sharpe'] = 0
        scores['MDD'] = "N/A"
        scores['Volatility'] = "N/A"
        scores['Momentum'] = 50

    # (5) Fair Value Score (Weighted)
    final_score = (scores['Valuation'] * 0.3) + (scores['Quality'] * 0.3) + \
                  (scores['Growth'] * 0.2) + (scores['Momentum'] * 0.2)
    scores['FairValue'] = round(final_score, 1)
    
    # Upside Potential
    curr = info.get('currentPrice', 0)
    target = info.get('targetMeanPrice', 0)
    if curr and target:
        scores['Upside'] = round(((target - curr) / curr) * 100, 1)
    else:
        scores['Upside'] = 0
        
    return scores

# ---------------------------------------------------------
# 3. 메인 실행 (Main)
# ---------------------------------------------------------
def run_scanner():
    print(f"🚀 Python Scanner Started at {datetime.now()}")
    
    # Google Sheet Auth
    try:
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        creds = ServiceAccountCredentials.from_json_keyfile_name(JSON_KEY_FILE, scope)
        client = gspread.authorize(creds)
        sheet = client.open(SHEET_NAME)
        
        try:
            ws = sheet.worksheet(TAB_NAME)
            print(f"✅ Found worksheet: {TAB_NAME}")
        except:
            ws = sheet.add_worksheet(title=TAB_NAME, rows=100, cols=20)
            print(f"🆕 Created worksheet: {TAB_NAME}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        print("👉 Check: 1) JSON file name 2) Sheet Name 3) Shared Permission")
        return

    all_data = []
    # 헤더 (Apps Script와 매핑될 중요 키값들)
    headers = [
        "Ticker", "Sector", "Industry", "Price", "MarketCap", 
        "P/E", "P/B", "ROE", "Dividend Yield", 
        "Sharpe", "MDD", "Volatility", 
        "Valuation Score", "Quality Score", "Growth Score", "Momentum Score", 
        "Fair Value Score", "Upside Potential", "Target Price", "Last Updated"
    ]
    
    print(f"🔍 Scanning {len(TICKERS)} tickers...")

    for ticker in TICKERS:
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            # Data Validation
            if 'regularMarketPrice' not in info and 'currentPrice' not in info:
                print(f"⚠️ Skipping {ticker} (No Data)")
                continue
                
            hist = stock.history(period="2y")
            scores = calculate_scores(info, hist)
            
            price = info.get('currentPrice', info.get('regularMarketPreviousClose', 0))
            
            row = [
                ticker,
                info.get('sector', 'N/A'),
                info.get('industry', 'N/A'),
                price,
                info.get('marketCap', 0),
                round(info.get('trailingPE', 0) or 0, 2),
                round(info.get('priceToBook', 0) or 0, 2),
                f"{round((info.get('returnOnEquity', 0) or 0) * 100, 2)}%",
                f"{round((info.get('dividendYield', 0) or 0) * 100, 2)}%",
                scores['Sharpe'],
                scores['MDD'],
                scores['Volatility'],
                scores['Valuation'],
                scores['Quality'],
                scores['Growth'],
                scores['Momentum'],
                scores['FairValue'],
                scores['Upside'],
                info.get('targetMeanPrice', 0),
                datetime.now().strftime("%Y-%m-%d %H:%M")
            ]
            all_data.append(row)
            print(f"  - {ticker}: FairValue {scores['FairValue']}, Upside {scores['Upside']}%")
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Error {ticker}: {e}")
            continue

    if all_data:
        ws.clear()
        ws.append_row(headers)
        ws.append_rows(all_data)
        # 헤더 볼드체 처리
        ws.format('A1:T1', {'textFormat': {'bold': True}})
        print(f"✅ Updated {len(all_data)} rows to {TAB_NAME} successfully!")
    else:
        print("❌ No data collected.")

if __name__ == "__main__":
    run_scanner()