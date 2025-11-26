// ==========================================
// 🧠 Logic.gs: 데이터 수집 및 계산 전담 모듈 (Final Build with Section Parser)
// ==========================================

// 1. Gemini API 호출
function callGemini(prompt, modelName) {
  const config = getConfig();
  const API_KEY = config.API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`;
  const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }, 
      tools: [{ "google_search": {} }] 
  };
  const options = { 
    method: "post", 
    contentType: "application/json", 
    payload: JSON.stringify(payload), 
    muteHttpExceptions: true 
  };
  for (let i = 0; i < 5; i++) {
    try {
      const res = UrlFetchApp.fetch(url, options);
      if (res.getResponseCode() === 200) {
        const json = JSON.parse(res.getContentText());
        if (json.candidates && json.candidates[0].content) {
            return json.candidates[0].content.parts[0].text.trim();
        }
      }
      Utilities.sleep(Math.pow(2, i) * 1000); 
    } catch (e) { 
      Utilities.sleep(Math.pow(2, i) * 1000); 
    }
  }
  return "❌ AI 응답 실패";
}

// 🔵 [Fixed] Scanner Data Helper: 전역 함수로 복원 (인자 없이 호출 시 내부적으로 처리)
function getScannerData(ticker) {
  const config = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scannerSheet = ss.getSheetByName(config.SCANNER_SHEET_NAME);
  
  if (!scannerSheet) return null;

  // 내부적으로 findScannerData 로직을 수행하거나 직접 조회
  // 여기서는 직접 조회 방식으로 복원 (기존 코드 호환성)
  const dataRange = scannerSheet.getDataRange().getValues();
  if (dataRange.length < 2) return null;

  const headers = dataRange[0];
  const tickerIndex = headers.indexOf("Ticker");
  if (tickerIndex === -1) return null;

  for (let i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][tickerIndex]).toUpperCase() == String(ticker).toUpperCase()) {
      const values = dataRange[i];
      let data = {};
      headers.forEach((header, index) => {
        if (header) data[header] = values[index];
      });
      return data; 
    }
  }
  return null;
}

// 🔵 [New] findScannerData: 시트 객체를 인자로 받는 헬퍼 (Full Portfolio용)
function findScannerData(scannerSheet, ticker) {
  if (!scannerSheet) return null;

  const values = scannerSheet.getDataRange().getValues();
  if (!values || values.length < 2) return null;

  const header = values[0].map(String);

  const tickerCol = header.findIndex(h => h.includes('종목') || h.toLowerCase().includes('ticker'));
  const mddCol    = header.findIndex(h => h.toUpperCase().includes('MDD'));
  const sectorCol = header.findIndex(h => h.includes('섹터') || h.toLowerCase().includes('sector'));

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[tickerCol]) continue;

    if (String(row[tickerCol]).trim().toUpperCase() === String(ticker).trim().toUpperCase()) {
      return {
        MDD: row[mddCol],
        Sector: sectorCol >= 0 ? row[sectorCol] : 'Unknown',
      };
    }
  }
  return null;
}

// 2. Finviz 데이터 (Hybrid: Scanner 우선)
function getFinvizData(ticker) {
  const scannerData = getScannerData(ticker);
  
  if (scannerData) {
     return {
       per: scannerData['P/E'] || "N/A",
       pbr: scannerData['P/B'] || "N/A",
       roe: scannerData['ROE'] || "N/A",
       target: scannerData['Target Price'] || "N/A",
       dividend: scannerData['Dividend Yield'] || "N/A",
       short: scannerData["Short Float"] || "N/A",
       range52: "N/A", 
       insiderOwn: scannerData["Insider Own"] || "N/A",
       insiderTrans: "N/A", 
       instOwn: scannerData["Inst Own"] || "N/A",
       instTrans: "N/A",
       fairValueScore: scannerData['Fair Value Score'] || "N/A",
       upsidePotential: scannerData['Upside Potential'] || "N/A",
       qualityScore: scannerData['Quality Score'] || "N/A",
       growthScore: scannerData['Growth Score'] || "N/A",
       sector: scannerData['Sector'] || "N/A",
       industry: scannerData['Industry'] || "N/A",
       etfInfo: scannerData['ETF Inclusion'] || "N/A",
       psr: scannerData["P/S"] || "N/A",
       source: "PYTHON_SCANNER"
     };
  }

  try {
    const url = `https://finviz.com/quote.ashx?t=${ticker}`;
    const params = { muteHttpExceptions: true, headers: { 'User-Agent': 'Mozilla/5.0' } };
    const html = UrlFetchApp.fetch(url, params).getContentText();
    const getVal = (l) => {
      const regex = new RegExp(">" + l + "[\\s\\S]*?<b[^>]*>([\\s\\S]*?)<\\/b>", "i"); 
      const match = html.match(regex);
      return match ? match[1].replace(/<[^>]*>/g, '').trim() : "N/A";
    };

    const getMeta = (type) => {
        const regex = new RegExp(`f=${type}_[^>]+>([^<]+)<`, 'i');
        const match = html.match(regex);
        return match ? match[1].replace('&amp;', '&').trim() : "N/A";
    };

    return {  
      per: getVal("P/E"), pbr: getVal("P/B"), roe: getVal("ROE"), 
      psr: getVal("P/S"),  
      target: getVal("Target Price"), short: getVal("Short Float"), range52: getVal("52W Range"),  
      dividend: getVal("Dividend %"),
      insiderOwn: getVal("Insider Own"), insiderTrans: getVal("Insider Trans"),
      instOwn: getVal("Inst Own"), instTrans: getVal("Inst Trans"),
      fairValueScore: "N/A", upsidePotential: "N/A", qualityScore: "N/A", growthScore: "N/A", 
      etfInfo: "N/A",
      sector: getMeta('sec'), 
      industry: getMeta('ind'),
      source: "LIVE_CRAWLING"
    };
  } catch (e) {  
    return { source: "ERROR", per:"N/A", pbr:"N/A", roe:"N/A", target:"N/A", dividend:"N/A", fairValueScore:"N/A", sector: "N/A", industry: "N/A", etfInfo: "N/A", psr: "N/A", short: "N/A", insiderOwn: "N/A", instOwn: "N/A" };  
  }
}

// 3. 뉴스 검색
function getUSNews(ticker) {
  try {
    const url = `https://news.google.com/rss/search?q=${ticker}+stock&hl=en-US&gl=US&ceid=US:en`;
    const xml = UrlFetchApp.fetch(url).getContentText();
    const titleRegex = new RegExp("<title>(.*?)</title>", "g");
    const matches = xml.match(titleRegex);
    if (!matches) return {raw:"", display:"뉴스 없음", legalRisk: false};
    let raw = [], disp = [];
    let legalRisk = false;
    for (let i = 1; i < Math.min(matches.length, 3); i++) {
      let t = matches[i].replace(/<\/?title>/g, "").replace(" - Google News", "").trim();
      raw.push(t);
      try { disp.push(`• ${LanguageApp.translate(t, 'en', 'ko')}`); } catch (e) { disp.push(`• ${t}`); }
      if (t.toLowerCase().includes("sec") || t.toLowerCase().includes("investigation") || t.toLowerCase().includes("lawsuit")) legalRisk = true;
    }
    return { raw: raw.join(", "), display: disp.join("\n"), legalRisk: legalRisk };
  } catch (e) { return {raw:"", display:"뉴스 수집 실패", legalRisk: false}; }
}

// 4. 퀀트 리스크 지표
function calculateRealRiskMetrics(ticker) {
    const scannerData = getScannerData(ticker);
    
    if (scannerData && scannerData['Sharpe'] !== undefined) {
        return { 
            sharpe: scannerData['Sharpe'], 
            mdd: scannerData['MDD'], 
            vol: scannerData['Volatility'], 
            source: "PYTHON_QUANT"
        };
    }
    return { sharpe: "N/A", mdd: "N/A", vol: "N/A", source: "N/A" };
}

// 5. 기술적 지표
function calculateTechnicalIndicators(ticker) {
    const scannerData = getScannerData(ticker);
    const config = getConfig();

    if (scannerData) {
        return {
            rsi: scannerData['RSI'] || "N/A",
            sma5: scannerData['SMA5'] || "-",
            sma20: scannerData['SMA20'] || "-",
            sma50: scannerData['SMA50'] || "-",
            sma120: scannerData['SMA120'] || "-",
            sma200: scannerData['SMA200'] || "-",
            macd: scannerData['MACD'] || "-",
            stoch: scannerData['Stoch'] || "-",
            pivot: "-", s1: "-", r1: "-", 
            closes: [] 
        };
    }
    return config.TECH_DEFAULT;
}

// 6. 대체 투자 추천
function getAlternativeSuggestions(currentTicker, currentSector) {
  const config = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scannerSheet = ss.getSheetByName(config.SCANNER_SHEET_NAME);
  
  if (!scannerSheet) return "N/A (Scanner Data 없음)";

  const dataRange = scannerSheet.getDataRange().getValues();
  const headers = dataRange[0];
  const tickerIdx = headers.indexOf("Ticker");
  const sectorIdx = headers.indexOf("Sector");
  const scoreIdx = headers.indexOf("Fair Value Score");
  const compositeIdx = headers.indexOf("Composite Score"); 

  if (tickerIdx == -1 || scoreIdx == -1) return "N/A (Scanner Data 없음)";

  let candidates = [];
  for (let i=1; i<dataRange.length; i++) {
      const row = dataRange[i];
      let score = (compositeIdx !== -1 && row[compositeIdx] !== "") ? parseFloat(row[compositeIdx]) : parseFloat(row[scoreIdx]);
      
      if (row[tickerIdx] !== currentTicker && score >= 70) {
          candidates.push({
              ticker: row[tickerIdx], 
              score: score, 
              sector: row[sectorIdx]
          });
      }
  }
  
  candidates.sort((a,b) => b.score - a.score);
  
  let sectorMatches = candidates.filter(c => c.sector === currentSector);
  let topCandidates = sectorMatches.slice(0, 2); 
  
  if (topCandidates.length < 2 && candidates.length > 0) {
      let others = candidates.filter(c => c.sector !== currentSector);
      topCandidates = topCandidates.concat(others.slice(0, 2 - topCandidates.length));
  }
  
  if (topCandidates.length === 0) return "N/A (Scanner Data 없음)";
  
  return topCandidates.map(c => `${c.ticker} (Score: ${c.score})`).join(", ");
}

// 🔵 Avengers Report 본문에서 DECISION / BIAS_GRADE를 추출하는 헬퍼
function parseDecisionAndBias(adviceText) {
  if (!adviceText) {
    // 본문이 없으면 기본값 반환
    return { decision: "관망", bias: "C" };
  }

  // DECISION= 뒤의 한 줄 전체 (Action Keyword 추출)
  const decisionMatch = String(adviceText).match(/^DECISION\s*=\s*([^\n]+)/m);
  // BIAS_GRADE= 뒤의 A~E 한 글자 추출
  const biasMatch = String(adviceText).match(/BIAS_GRADE\s*=\s*([A-E])/m);

  // DECISION은 괄호 안 텍스트를 제거하고 순수 Action Keyword만 사용
  let decisionRaw = decisionMatch ? decisionMatch[1].trim() : "관망";
  let decision = decisionRaw.replace(/\s*\(.*\)/, '').trim(); 
  let bias = biasMatch ? biasMatch[1].trim() : "C";

  return { decision, bias };
}

// 🔵 Avengers Report(전문가조언(상세))에서 "이 종목의 장기 목표 비중"을 숫자로 추출
function parseTargetWeightFromAdvice(adviceText) {
  if (!adviceText) return 0;

  // 정규식: "이 종목의 장기 목표 비중:" 뒤의 숫자 (소수점 포함)와 % 기호 추출
  const m = String(adviceText).match(/이 종목의 장기 목표 비중:\s*([0-9]+(?:\.[0-9]+)?)(?:\s*)%/);
  if (!m) return 0;

  const n = parseFloat(m[1]);
  if (isNaN(n) || n < 0) return 0;

  // 0~100 범위 값으로 반환 (예: 5 → 5)
  return n;
}

// 🔵 [Fix] Avengers Report 전체 텍스트에서 섹션별로 잘라내는 헬퍼 (정규식 보정)
function parseAvengersReportSections(adviceText) {
  const src = String(adviceText || "");

  // 정규식 헬퍼: 헤더 사이의 내용을 추출
  function pick(regex) {
    const m = src.match(regex);
    // 캡처 그룹이 있으면 그 내용을 반환
    if (m && m[1]) {
      return m[1].trim();
    }
    // CEO 섹션처럼 전체 매칭이 필요한 경우 (캡처 그룹 없이)
    if (m && regex.source.startsWith("^")) {
        return m[0].trim(); 
    }
    return "";
  }
  
  return {
    // 1. CEO 최종 결정: 문서 시작부터 "## 🚀 CEO 실행 전략" 전까지 (DECISION, BIAS 포함)
    ceo: pick(/^(?:DECISION[\s\S]*?)?(?=## 🚀 CEO 실행 전략)/m),
    
    // 2. 실행 전략: "## 🚀 CEO 실행 전략" 부터 "## ⚔️" 전까지
    action: pick(/## 🚀 CEO 실행 전략 \(Action Plan\)[\s\S]*?\n([\s\S]*?)(?=## ⚔️|\Z)/m),
    
    // 3. 경쟁사: "## ⚔️ 경쟁사" 부터 "## 📊" 전까지
    competitors: pick(/## ⚔️ 경쟁사 및 대체 투자 \(Alternatives\)[\s\S]*?\n([\s\S]*?)(?=## 📊|\Z)/m),
    
    // 4. 데이터 검증: "## 📊 상세" 부터 "## 📉" 전까지
    dataCheck: pick(/## 📊 상세 데이터 검증 \(Data Check\)[\s\S]*?\n([\s\S]*?)(?=## 📉|\Z)/m),
    
    // 5. 논쟁 요약: "## 📉 핵심" 부터 "## 💎" 전까지
    debate: pick(/## 📉 핵심 논쟁 요약 \(The Debate - ALL VOICES MATTER - One sentence each\)[\s\S]*?\n([\s\S]*?)(?=## 💎|\Z)/m),
    
    // 6. 개별 분석: "## 💎 개별" 부터 "## 🛡️" 전까지
    standalone: pick(/## 💎 개별 종목 관점 분석 \(Standalone Fit\)[\s\S]*?\n([\s\S]*?)(?=## 🛡️|\Z)/m),
    
    // 7. 포트폴리오: "## 🛡️ 포트폴리오" 부터 끝까지
    portfolio: pick(/## 🛡️ 포트폴리오 관점 분석 \(Portfolio Fit\)[\s\S]*?\n([\s\S]*?)(?=\Z)/m),
  };
}

// 🔵 [TASK 4] 목표비중(%) 자동 산출 함수 (규칙 기반)
function calcTargetWeight(decision, riskTier, volStr, mddStr, biasGrade) {
  // 1. 리스크 티어 Critical -> 무조건 0%
  if (riskTier === "Critical") return 0;

  // 2. 기본 룰 (전문가 판단 기반)
  // 매수 계열: 기본 10% (범위 5~15%의 중간값)
  // 관망/매도: 0%
  let baseWeight = 0;
  if (decision.includes("강력매수") || decision.includes("분할매수") || decision.includes("진입") || decision.includes("확대")) {
    baseWeight = 10; 
  } else {
    return 0; // 관망, 매도, 그 외 -> 0%
  }

  // 3. BIAS_GRADE 가중치 적용
  // A: +5, B: +2, C: 0, D: -2, E: -5
  let biasAdj = 0;
  const grade = (biasGrade || "C").trim().toUpperCase();
  if (grade === "A") biasAdj = 5;
  else if (grade === "B") biasAdj = 2;
  else if (grade === "D") biasAdj = -2;
  else if (grade === "E") biasAdj = -5;

  let finalWeight = baseWeight + biasAdj;

  // 4. 리스크 지표 기반 상한(Cap) 적용
  // 문자열 퍼센트 파싱
  let vol = parseFloat(String(volStr).replace(/[%]/g, '')) || 0;
  let mdd = parseFloat(String(mddStr).replace(/[%]/g, '')) || 0; // 보통 음수 (예: -55)

  // 변동성 100% 이상 -> 최대 7%
  if (vol >= 100) {
    finalWeight = Math.min(finalWeight, 7);
  }
  // MDD -50% 이하 (더 큰 낙폭) -> 최대 5%
  if (mdd <= -50) {
    finalWeight = Math.min(finalWeight, 5);
  }

  // 5. 범위 클램핑 (0 ~ 20%)
  finalWeight = Math.max(0, Math.min(finalWeight, 20));

  return finalWeight;
}

// 🔵 [Task A] 시장 레짐(Market Regime) 분류 함수
function classifyMarketRegime(safetyRatio, lossRatio, avgMdd) {
  // safetyRatio: 0~1 (안전자산 비중)
  // lossRatio: 0~1 (손실 종목 비율)
  // avgMdd: 0~100 (양수 값으로 변환된 평균 MDD, 예: 25.5)

  // 1. RISK_OFF (방어 모드)
  // 안전자산이 매우 높거나(80% 이상), 손실 종목이 과반(50%)이면서 시장 하락폭(MDD 20% 이상)이 클 때
  if (safetyRatio >= 0.8 || (lossRatio >= 0.5 && avgMdd >= 20)) {
    return "RISK_OFF";
  }

  // 2. NEUTRAL (중립 모드)
  // 안전자산이 적절하거나, 손실 종목이 일부 발생할 때
  if (safetyRatio >= 0.5 || lossRatio >= 0.3) {
    return "NEUTRAL";
  }

  // 3. RISK_ON (공격 모드)
  // 그 외 상황 (안전자산 < 50% 이고 손실 종목도 적음)
  return "RISK_ON";
}

// 🔵 Scanner 데이터 검증 함수
function validateScannerData() {
  const config = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const scannerSheet = ss.getSheetByName(config.SCANNER_SHEET_NAME);
  
  if (!scannerSheet) {
    Logger.log("❌ Scanner Sheet not found");
    return;
  }

  const dataRange = scannerSheet.getDataRange();
  const values = dataRange.getValues();
  if (values.length < 2) return;

  const headers = values[0];
  const reqCols = {
    "Ticker": headers.indexOf("Ticker"),
    "Price": headers.indexOf("Price"),
    "P/E": headers.indexOf("P/E"),
    "Sharpe": headers.indexOf("Sharpe"),
    "MDD": headers.indexOf("MDD"),
    "Volatility": headers.indexOf("Volatility"),
    "Fair Value Score": headers.indexOf("Fair Value Score"),
    "Upside Potential": headers.indexOf("Upside Potential")
  };

  // Validation 컬럼 확인 또는 생성
  let validColIdx = headers.indexOf("Validation");
  if (validColIdx === -1) {
    validColIdx = headers.length;
    scannerSheet.getRange(1, validColIdx + 1).setValue("Validation").setFontWeight("bold");
  }

  let okCount = 0;
  let warnCount = 0;

  // 2행부터 루프
  for (let i = 1; i < values.length; i++) {
    let row = values[i];
    let warnings = [];

    // Ticker 검사 (빈 값은 OK 처리 후 건너뜀)
    let tickerVal = (row[reqCols["Ticker"]] === undefined || row[reqCols["Ticker"]] === null) ? "" : String(row[reqCols["Ticker"]]).trim();
    if (tickerVal.length === 0) {
      scannerSheet.getRange(i + 1, validColIdx + 1).setValue("OK");
      continue; 
    }

    // Price 검사
    if (reqCols["Price"] !== -1 && (isNaN(parseFloat(row[reqCols["Price"]])) || parseFloat(row[reqCols["Price"]]) <= 0)) {
      warnings.push("Invalid Price");
    }

    // Sharpe 검사 (인덱스 존재 확인 후 접근)
    if (reqCols["Sharpe"] !== -1) {
      let sharpe = parseFloat(row[reqCols["Sharpe"]]);
      if (isNaN(sharpe) || sharpe < -5 || sharpe > 5) {
        warnings.push("Sharpe range");
      }
    }

    // MDD 검사
    if (reqCols["MDD"] !== -1) {
      let mddStr = String(row[reqCols["MDD"]]).replace(/%/g, '').trim();
      let mdd = parseFloat(mddStr);
      if (isNaN(mdd) || Math.abs(mdd) > 100) warnings.push("MDD Invalid");
    }

    // Volatility 검사
    if (reqCols["Volatility"] !== -1) {
      let volStr = String(row[reqCols["Volatility"]]).replace(/%/g, '').trim();
      let vol = parseFloat(volStr);
      if (isNaN(vol) || vol > 200) warnings.push("Vol Invalid");
    }

    // Fair Value Score 검사
    if (reqCols["Fair Value Score"] !== -1) {
      let score = parseFloat(row[reqCols["Fair Value Score"]]);
      if (isNaN(score) || score < 0 || score > 100) warnings.push("FairValue Invalid");
    }
    
    // Upside Potential 검사
    if (reqCols["Upside Potential"] !== -1) {
      let upStr = String(row[reqCols["Upside Potential"]]).replace(/%/g, '').trim();
      let up = parseFloat(upStr);
      if (isNaN(up) || up < -100 || up > 1000) {
        warnings.push("Upside Invalid");
      }
    }

    // 결과 기록
    let result = warnings.length === 0 ? "OK" : "WARN: " + warnings.join(", ");
    scannerSheet.getRange(i + 1, validColIdx + 1).setValue(result);
    
    if (warnings.length === 0) okCount++; else warnCount++;
  }

  Logger.log(`Scanner Validation: ${okCount} rows OK, ${warnCount} rows with WARN`);
  ss.toast(`Scanner Check: ${okCount} OK, ${warnCount} WARN`);
}

// 🔵 [Task 2] 포트폴리오 전체 데이터 집계 헬퍼 (Safe Update)
function getPortfolioSummaryData(sheet1, scannerSheet) {
  const data = sheet1.getDataRange().getValues();
  // A:Ticker(0), B:Qty(1), D:Price(3), F:Target(5), G:Signal(6)
  
  let holdings = [];
  let totalVal = 0;
  let lossCount = 0;
  let mddSum = 0;
  let activeCount = 0;

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    if (!row[0] || row[3] <= 0 || row[1] <= 0) continue; // Ticker, Price, Qty check

    let val = row[1] * row[3];
    totalVal += val;
    
    // Scanner Data for MDD & Sector - [FIXED] Use findScannerData Helper
    let scanData = findScannerData(scannerSheet, row[0]); 
    let mdd = scanData ? parseFloat(String(scanData['MDD']).replace(/[%]/g,'')) : 0;
    
    // Return Check (E열이 수익률이라고 가정, index 4)
    if (row[4] < 0) lossCount++;
    
    mddSum += Math.abs(mdd);
    activeCount++;

    holdings.push({ ticker: row[0], val: val, weight: 0, sector: scanData ? scanData['Sector'] : 'Unknown' });
  }

  // 🔵 [BUG-FIX] 비중 계산 안정화
  holdings.forEach(h => {
    if (totalVal > 0) {
      h.weight = (h.val / totalVal) * 100;
    } else {
      h.weight = 0;
    }
  });
  
  holdings.sort((a, b) => b.weight - a.weight);

  return {
    totalVal: totalVal,
    lossRatio: activeCount > 0 ? lossCount / activeCount : 0,
    avgMdd: activeCount > 0 ? mddSum / activeCount : 0,
    topHoldings: holdings.slice(0, 5) // 상위 5개
  };
}

// 🔵 [Task 2] 포트폴리오 회의록 파서
function parsePortfolioReportSections(text) {
  const src = String(text || "");
  function pick(regex) { return (src.match(regex) || ["", ""])[1].trim(); }

  return {
    regime: pick(/## 🧭 Market Regime & Cash Stance[\s\S]*?\n([\s\S]*?)(?=## 📊|\Z)/),
    stability: pick(/## 📊 안정성 지표[\s\S]*?\n([\s\S]*?)(?=## 🥧|\Z)/),
    allocation: pick(/## 🥧 섹터·자산군 비중 요약[\s\S]*?\n([\s\S]*?)(?=## 🧭|\Z)/),
    fullFit: pick(/## 🧭 포트폴리오 전체 판단[\s\S]*?\n([\s\S]*?)(?=## 🚀|\Z)/),
    action: pick(/## 🚀 Action Plan for Portfolio[\s\S]*?\n([\s\S]*?)(?=## 📉|\Z)/),
    debate: pick(/## 📉 Debate 요약[\s\S]*?\n([\s\S]*?)(?=###|\Z)/)
  };
}

// 🔵 [NEW] 포트폴리오 전체 데이터 집계 헬퍼 (Full Portfolio용)
function getFullPortfolioData(sheet1, scannerSheet) {
  const data = sheet1.getDataRange().getValues();
  
  let holdings = [];
  let totalVal = 0;
  let lossCount = 0;
  let mddSum = 0;
  let activeCount = 0;
  let sectorMap = {};

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let ticker = row[0];
    let qty = row[1];
    let price = row[3];
    let ret = row[4]; // E열: 수익률

    if (!ticker || price <= 0 || qty <= 0) continue;

    let val = qty * price;
    totalVal += val;

    // Scanner Data for MDD & Sector
    let scanData = findScannerData(scannerSheet, ticker);
    let mdd = scanData ? parseFloat(String(scanData['MDD']).replace(/[%]/g, '')) : 0;
    let sector = scanData ? scanData['Sector'] : 'Unknown';

    if (typeof ret === 'number' && ret < 0) lossCount++;

    mddSum += Math.abs(mdd);
    activeCount++;

    if (!sectorMap[sector]) sectorMap[sector] = 0;
    sectorMap[sector] += val;

    holdings.push({ ticker: ticker, val: val, weight: 0, sector: sector, mdd: mdd });
  }

  // 비중 계산
  holdings.forEach(h => h.weight = (totalVal > 0) ? (h.val / totalVal) * 100 : 0);
  holdings.sort((a, b) => b.weight - a.weight);

  // 섹터 비중 계산
  let sectors = [];
  for (let s in sectorMap) {
    sectors.push({ name: s, weight: (totalVal > 0) ? (sectorMap[s] / totalVal) * 100 : 0 });
  }
  sectors.sort((a, b) => b.weight - a.weight);

  return {
    totalVal: totalVal,
    lossRatio: activeCount > 0 ? lossCount / activeCount : 0,
    avgMdd: activeCount > 0 ? mddSum / activeCount : 0,
    topHoldings: holdings,
    sectors: sectors
  };
}

// 🔵 [NEW] Full Portfolio Report 파서
function parseFullPortfolioReport(text) {
  const src = String(text || "");
  function pick(regex) { return (src.match(regex) || ["", ""])[1].trim(); }

  return {
    marketRegime: pick(/## 3\. Market Regime Summary[\s\S]*?현재 시장 상태: (.*?)(?:\n|$)/),
    cashStance: pick(/## 3\. Market Regime Summary[\s\S]*?현금 비중 권고: (.*?)(?:\n|$)/),
    healthCheck: pick(/## 4\. 포트폴리오 건강도 \(Portfolio Health Check\)[\s\S]*?\n([\s\S]*?)(?=## 5\.|\Z)/),
    rebalancing: pick(/## 5\. 리밸런싱 권고 \(Rebalancing Recommendation\)[\s\S]*?\n([\s\S]*?)(?=## 6\.|\Z)/),
    conclusion: pick(/## 6\. Full Portfolio Fit 종합 결론[\s\S]*?\n([\s\S]*?)(?=## 7\.|\Z)/),
    avengers: pick(/## 7\. 어벤저스 의견\(한 줄 요약\)[\s\S]*?\n([\s\S]*?)(?=$)/)
  };
}
