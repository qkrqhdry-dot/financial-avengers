// ==========================================
// 🚀 [Main.gs] 실행 및 오케스트레이션 (Final Integrated Build)
// ==========================================

// 🔵 [UI] 구글 시트 메뉴 생성
function onOpen() {
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    Logger.log(`onOpen skipped (no UI context): ${e}`);
    return;
  }

  ui.createMenu('💵 The Financial Avengers')
    .addItem('🚀 이사회 소집 (투자 진단 실행)', 'runAvengersAnalysis')
    .addSeparator()
    .addItem('🧠 포트폴리오 리포트 생성', 'generatePortfolioReport')
    .addSeparator()
    .addItem('📖 회의록 열람 (시각화 대시보드)', 'showAvengersDialog')
    .addItem('📊 포트폴리오 전체 판단 (Full Portfolio Fit)', 'openPortfolioDashboard')
    .addToUi();
}

// 🔵 [UI] 선택된 종목의 회의록 팝업 UI 생성
function openAvengersReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const row = sheet.getActiveCell().getRow();

  if (row < 2) {
    Browser.msgBox("종목이 있는 행(2행 이상)을 선택해주세요.");
    return;
  }
  
  const ticker = sheet.getRange(row, 1).getValue(); // A열: 종목
  const advice = sheet.getRange(row, 8).getValue(); // H열: 전문가조언(상세)

  if (!advice || String(advice).length < 50) {
    Browser.msgBox(`[${ticker}] 아직 분석 리포트가 생성되지 않았습니다.\n'🚀 분석 실행'을 먼저 진행해주세요.`);
    return;
  }
  
  const sections = parseAvengersReportSections(advice);

  const template = HtmlService.createTemplateFromFile('AvengersReport');
  template.ticker = ticker;
  template.sections = sections; 

  const html = template.evaluate()
      .setWidth(1000)
      .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, `${ticker} 투자 전략 회의록`);
}

// 🔵 [NEW] 포트폴리오 전체 분석 보고서 생성 함수
function generatePortfolioReport() {
  const config = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet1 = ss.getSheetByName("시트1");
  const pSheet = ensurePortfolioSheet();
  const scannerSheet = ss.getSheetByName(config.SCANNER_SHEET_NAME);

  // 1. 데이터 집계 (Logic.gs 함수 호출)
  const summary = getFullPortfolioData(sheet1, scannerSheet); 
  const safetyRatio = normalizePercentRatio(pSheet.getRange("C7").getValue(), config.SAFETY_CORE_MIN);
  const cashWeight = normalizePercentRatio(pSheet.getRange("C4").getValue(), 0);
  const totalAssets = summary.totalVal;

  // Market Regime 계산
  const regime = classifyMarketRegime(safetyRatio, summary.lossRatio, summary.avgMdd);

  // 데이터 문자열 변환 (안전한 toFixed 사용)
  const topHoldingsStr = summary.topHoldings.slice(0, 5)
    .map(h => `${h.ticker}(${Number(h.weight || 0).toFixed(1)}%)`)
    .join(", ");
  const sectorInfo = summary.sectors.slice(0, 3)
    .map(s => `${s.name}(${Number(s.weight || 0).toFixed(1)}%)`)
    .join(", ");

  // 2. 프롬프트 생성
  const prompt = getFullPortfolioReportPrompt(
    safetyRatio,
    summary.lossRatio,
    summary.avgMdd,
    regime,
    cashWeight,
    topHoldingsStr,
    sectorInfo,
    totalAssets
  );

  // 3. Gemini 호출
  const advice = callGemini(prompt, config.MODEL_NAME);

  // 4. 결과 저장 (Portfolio_Meeting 시트)
  let pmSheet = ss.getSheetByName("Portfolio_Meeting");
  if (!pmSheet) {
    pmSheet = ss.insertSheet("Portfolio_Meeting");
    pmSheet.getRange("A1").setValue("Last Updated");
    pmSheet.getRange("B1").setValue("Report Body");
  }

  const timestamp = new Date().toLocaleString();
  pmSheet.getRange("A2").setValue(timestamp);
  pmSheet.getRange("B2").setValue(advice); 

  // 5. 결과 UI 출력
  showFullPortfolioDialog(advice, summary, safetyRatio, regime);
}

// 🔵 [UI] Full Portfolio Fit 대시보드 UI 출력
function showFullPortfolioDialog(advice, summary, safetyRatio, regime) {
  const sections = parseFullPortfolioReport(advice);
  const template = HtmlService.createTemplateFromFile('FullPortfolioReport');
  
  template.sections = sections;
  template.summary = summary;
  template.safetyRatio = safetyRatio;
  template.regime = regime;
  template.date = new Date().toLocaleDateString();

  const html = template.evaluate()
      .setWidth(1200)
      .setHeight(900);
  
  SpreadsheetApp.getUi().showModalDialog(html, '📊 포트폴리오 전체 전략 보고서');
}

// Helper: Bias Score
function calculateBiasScore(techData, finData, brokerageAssetsUSD, cashWeight) {
  const config = getConfig();
  let score = 0;
  const pointsPerFactor = 20;

  const rsi = parseFloat(techData.rsi);
  if (!isNaN(rsi)) {
    if (rsi < 30) score += pointsPerFactor;
    else if (rsi < 40) score += pointsPerFactor / 2;
    else if (rsi > 70) score -= pointsPerFactor;
    else if (rsi > 60) score -= pointsPerFactor / 2;
  }

  const sma200 = parseFloat(techData.sma200);
  const currentPrice = parseFloat(finData.currentPrice);
  if (!isNaN(sma200) && !isNaN(currentPrice) && sma200 > 0) {
    const diff = (currentPrice - sma200) / sma200;
    if (diff > 0.05) score += pointsPerFactor;
    else if (diff < -0.05) score -= pointsPerFactor;
    else if (diff > 0) score += pointsPerFactor / 2;
    else if (diff < 0) score -= pointsPerFactor / 2;
  }

  const macd = parseFloat(techData.macd);
  if (!isNaN(macd)) {
    if (macd > 0) score += pointsPerFactor;
    else score -= pointsPerFactor;
  }

  const earningsYieldText = finData.earningsYield || "N/A";
  if (earningsYieldText !== "N/A") {
    const ey = parseFloat(earningsYieldText.replace('%', '')) / 100;
    const rf = config.RISK_FREE_RATE;
    if (ey > rf + 0.01) score += 10;
    else if (ey < rf - 0.01) score -= 10;
  }
  const pe = parseFloat(finData.per);
  if (pe > 50) score -= 10;
  else if (pe < 15) score += 10;

  if (brokerageAssetsUSD * config.CASH_WEIGHT_MIN > 0) score += pointsPerFactor / 2;
  else if (cashWeight < config.CASH_WEIGHT_MIN && cashWeight > 0) score -= pointsPerFactor / 4;
  else if (cashWeight === 0) score -= pointsPerFactor;
  else score += pointsPerFactor;

  const totalScore = Math.min(Math.max(score, -100), 100);
  let grade, buyRatio, sellRatio;
  if (totalScore >= 40) { grade = "A"; buyRatio = 70; sellRatio = 30; } 
  else if (totalScore >= 15) { grade = "B"; buyRatio = 60; sellRatio = 40; } 
  else if (totalScore >= -14) { grade = "C"; buyRatio = 50; sellRatio = 50; } 
  else if (totalScore >= -39) { grade = "D"; buyRatio = 40; sellRatio = 60; } 
  else { grade = "E"; buyRatio = 30; sellRatio = 70; }

  return { grade, buyRatio, sellRatio, totalScore };
}

// Helper: Safety Core Text Sanitizer
function sanitizeSafetyCoreText(text, safetyRatio, minLimit, tier) {
  const safetyPct = (safetyRatio * 100).toFixed(1) + "%";
  
  if (text.includes("1.0%") || text.includes("1%")) {
    if (safetyRatio >= minLimit) {
        text = text.replace(/Safety Core.*1\.0%.*Critical/gi, `Safety Core는 ${safetyPct}로 안정적이며`);
        text = text.replace(/Safety Core.*1%.*Critical/gi, `Safety Core는 ${safetyPct}로 안정적이며`);
        text = text.replace(/1\.0%/g, safetyPct);
    }
  }

  if (tier === "Normal") {
    text = text.replace(/Risk Tier.*Critical/gi, "Risk Tier는 Normal 수준");
    text = text.replace(/Critical Risk Tier/gi, "Normal Risk Tier");
  }

  return text;
}

// 🔵 Helper Functions for Normalization
function normalizeNumber(val, defaultVal) {
  if (val === null || val === undefined || val === "") return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  
  let s = String(val).replace(/,/g, '').trim();
  let n = parseFloat(s);
  return isNaN(n) ? defaultVal : n;
}

function normalizePercentRatio(val, defaultVal) {
  let s = String(val).replace(/%/g, '').replace(/,/g, '').trim();
  let n = parseFloat(s);
  
  if (isNaN(n)) return defaultVal;
  if (n > 1) return n / 100;
  return n;
}

// 🔵 Daily Portfolio Summary 생성 함수
function buildDailyPortfolioSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet(); 
  const config = getConfig();

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  let rows = [];
  let totalStockValueUSD = 0;

  for (let r = 2; r <= lastRow; r++) {
    const ticker = sheet.getRange(r, 1).getValue(); 
    if (!ticker) continue;

    const qty = parseFloat(sheet.getRange(r, 2).getValue() || 0);    
    const curPrice = parseFloat(sheet.getRange(r, 4).getValue() || 0); 
    const adviceText = sheet.getRange(r, 8).getValue(); 

    if (!curPrice || isNaN(curPrice) || curPrice <= 0) continue;

    const tgtWeightRaw = sheet.getRange(r, 6).getValue() || 0;
    let tgtWeightPct = normalizePercentRatio(tgtWeightRaw, 0) * 100; 

    if (!tgtWeightPct || tgtWeightPct <= 0) {
      const autoTgt = parseTargetWeightFromAdvice(adviceText || ""); 
      if (autoTgt > 0) {
        tgtWeightPct = autoTgt;
        sheet.getRange(r, 6).setValue(tgtWeightPct); 
      }
    }
    
    const stockValue = qty * curPrice;
    totalStockValueUSD += stockValue;

    rows.push({ row: r, ticker, qty, curPrice, stockValue, tgtWeight: tgtWeightPct, adviceText });
  }

  if (rows.length === 0) return;

  const pSheet = ensurePortfolioSheet();
  let safetyRatio = normalizePercentRatio(pSheet.getRange("C7").getValue(), config.SAFETY_CORE_MIN);
  let riskTier = (safetyRatio < config.SAFETY_CORE_MIN) ? "Critical" : "Normal";

  let sumSheet = ss.getSheetByName("Daily_Portfolio_Summary");
  if (!sumSheet) {
    sumSheet = ss.insertSheet("Daily_Portfolio_Summary");
    sumSheet.getRange(1, 1, 1, 9).setValues([[
      "종목", "현재비중(%)", "목표비중(%)", "판단", "등급", "변동성(%)", "MDD(%)", "리스크티어", "후보유형"
    ]]).setFontWeight("bold");
    sumSheet.setColumnWidth(2, 120);
    sumSheet.setColumnWidth(3, 120);
  } else {
    const lr = sumSheet.getLastRow();
    if (lr > 1) {
      sumSheet.getRange(2, 1, lr - 1, 9).clearContent();
    }
  }

  let output = [];

  for (let i = 0; i < rows.length; i++) {
    const d = rows[i];
    const curWeight = totalStockValueUSD > 0 ? (d.stockValue / totalStockValueUSD) * 100 : 0;
    const curWeightPct = parseFloat(curWeight.toFixed(1));

    const parsed = parseDecisionAndBias(d.adviceText);
    const aiDecision = parsed.decision; 
    const aiBias = parsed.bias;

    const riskMetrics = calculateRealRiskMetrics(d.ticker);
    const vol = String(riskMetrics.vol || "N/A").replace(/%/g, '').trim();
    const mdd = String(riskMetrics.mdd || "N/A").replace(/%/g, '').trim();

    const tgt = d.tgtWeight; 
    const buyDecisions = ["강력매수", "분할매수", "비중확대", "진입"];
    const sellDecisions = ["전량매도", "비중축소"];
    const biasBuy = ["A", "B"];
    const biasSell = ["D", "E"];
    
    const isBuyCandidate =
      buyDecisions.includes(aiDecision) &&
      biasBuy.includes(aiBias) &&
      curWeight < tgt &&
      riskTier !== "Critical";

    const isSellCandidate =
      !isBuyCandidate && (
        sellDecisions.includes(aiDecision) ||
        (biasSell.includes(aiBias) && curWeight > tgt) ||
        (riskTier === "Critical" && aiBias !== "A")
      );

    let candidateType = "Watchlist";
    if (isBuyCandidate) candidateType = "Buy";
    else if (isSellCandidate) candidateType = "Sell";
    
    output.push([
      d.ticker,
      curWeightPct,
      tgt, 
      aiDecision,
      aiBias,
      vol,
      mdd,
      riskTier,
      candidateType
    ]);
  }

  if (output.length > 0) {
    sumSheet.getRange(2, 1, output.length, 9).setValues(output);
    sumSheet.getRange(2, 2, output.length, 2).setNumberFormat("0.0"); 
  }
}

// 🔵 스캐너 검증 실행용 함수
function runScannerValidation() {
  validateScannerData();
}

// --- Main Execution ---
function runAvengersAnalysis() {
  const config = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const todayObj = new Date();
  const today = todayObj.toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'});
  const currentYear = todayObj.getFullYear();
  const currentMonth = todayObj.toLocaleString('default', { month: 'long' });

  const MIN_RESPONSE_LENGTH = config.MIN_RESPONSE_LENGTH;
  if (!config.API_KEY || config.API_KEY.length < 30) {
    Browser.msgBox("⚠️ 오류: API 키를 확인하세요.");
    return;
  }

  ss.toast(`🚀 Financial Avengers 가동 중... (${today})`, "System Active");

  const sheet = ss.getActiveSheet();
  const pSheet = ensurePortfolioSheet();
  
  const SAFETY_CORE_MIN = config.SAFETY_CORE_MIN;
  const CASH_WEIGHT_MIN = config.CASH_WEIGHT_MIN;
  const TARGET_ANNUAL_RETURN = config.TARGET_ANNUAL_RETURN;

  const rawSafetyRatio = pSheet.getRange("C7").getValue();
  const rawExchangeRate = pSheet.getRange("C6").getValue();
  const rawCashInput = pSheet.getRange("C4").getValue(); 
  const rawSafetyKRW = pSheet.getRange("C5").getValue();

  let safetyRatio = normalizePercentRatio(rawSafetyRatio, SAFETY_CORE_MIN);
  if (safetyRatio < 0) safetyRatio = 0;
  if (safetyRatio > 1) safetyRatio = 1;

  const cashKRW = normalizeNumber(rawCashInput, 0) * 10000;
  let exchangeRate = normalizeNumber(rawExchangeRate, 1400);
  if (exchangeRate <= 0) exchangeRate = 1400;
  const safetyKRW = normalizeNumber(rawSafetyKRW, 0) * 10000;

  const lastRow = sheet.getLastRow();
  const maxRow = Math.min(lastRow, config.MAX_ANALYSIS_ROWS + 1);

  if (maxRow < 2) { Browser.msgBox("분석할 종목이 없습니다."); return; }
  
  const inputData = sheet.getRange(2, 1, maxRow - 1, 3).getValues();
  let totalStockValueUSD = 0;
  let portfolioData = [];
  
  for (let i = 0; i < inputData.length; i++) {
    let ticker = inputData[i][0];
    let qty = inputData[i][1];          
    let myPrice = inputData[i][2];      
    
    let currentPrice = 0;
    let scanner = getScannerData(ticker); // Logic.gs

    if (scanner && scanner['Price'] && scanner['Price'] !== "N/A") {
      currentPrice = parseFloat(scanner['Price']);
    } 
    
    if ((!currentPrice || currentPrice === 0 || isNaN(currentPrice)) && ticker) {
      const tempCell = sheet.getRange(i + 2, 4); 
      tempCell.setFormula(`=GOOGLEFINANCE("${ticker}", "price")`);
      SpreadsheetApp.flush(); 
      let gfPrice = tempCell.getValue();
      
      if (typeof gfPrice === 'number' && gfPrice > 0) {
        currentPrice = gfPrice;
      }
      tempCell.clearContent(); 
    }

    if (ticker && typeof currentPrice === 'number' && currentPrice > 0) {
      sheet.getRange(i + 2, 4).setValue(currentPrice); 
      
      let quantity = (qty === "" || isNaN(qty)) ? 0 : qty;
      let stockValue = quantity * currentPrice;
      totalStockValueUSD += stockValue;
      portfolioData.push({ rowIndex: i, ticker, myPrice, quantity, currentPrice, stockValue });
    } else {
      portfolioData.push({ rowIndex: i, ticker: null, quantity: 0, stockValue: 0, currentPrice: 0 });
    }
  }

  pSheet.getRange("C3").setValue(totalStockValueUSD);
  SpreadsheetApp.flush();

  const cashUSD = cashKRW / exchangeRate;
  const safetyUSD = safetyKRW / exchangeRate;
  const brokerageAssetsUSD = totalStockValueUSD + cashUSD;
  const totalAssetsUSD = brokerageAssetsUSD + safetyUSD;
  const cashWeight = (brokerageAssetsUSD > 0) ? (cashUSD / brokerageAssetsUSD) : 0;
  
  // Market Regime Calculation
  let lossCount = 0;
  let totalMddSum = 0;
  let mddCount = 0;
  let activeStockCount = 0;

  for (let i = 0; i < portfolioData.length; i++) {
    let d = portfolioData[i];
    if (!d.ticker) continue;
    activeStockCount++;

    let currentRet = 0;
    if (d.quantity > 0 && d.myPrice > 0) {
      currentRet = (d.currentPrice - d.myPrice) / d.myPrice;
    }
    if (currentRet < 0) lossCount++;

    let sData = getScannerData(d.ticker);
    if (sData && sData['MDD']) {
      let mddVal = Math.abs(parseFloat(String(sData['MDD']).replace(/[%]/g, '')) || 0);
      totalMddSum += mddVal;
      mddCount++;
    }
  }

  const lossRatio = activeStockCount > 0 ? (lossCount / activeStockCount) : 0;
  const avgMdd = mddCount > 0 ? (totalMddSum / mddCount) : 0;

  const marketRegime = classifyMarketRegime(safetyRatio, lossRatio, avgMdd);
  
  const marketRegimeInfo = `
    [📉 MARKET REGIME DATA]:
    - Current Regime: **${marketRegime}**
    - Portfolio Loss Ratio: ${(lossRatio * 100).toFixed(1)}%
    - Avg Portfolio MDD: -${avgMdd.toFixed(1)}%
    - Safety Core: ${(safetyRatio * 100).toFixed(1)}%
  `;

  let portfolioSummary = `[TOTAL WEALTH OVERVIEW]\n`;
  portfolioSummary += `- Total Net Worth: $${totalAssetsUSD.toLocaleString()}\n`;
  portfolioSummary += `- 🛡️ Safety Core (DC+IRP): $${safetyUSD.toLocaleString()} (**${(safetyRatio * 100).toFixed(1)}%**)\n`;
  portfolioSummary += `- 🚀 Growth Engine (Brokerage) Total: $${brokerageAssetsUSD.toLocaleString()} (Cash Weight: ${(cashWeight * 100).toFixed(1)}%)\n`;
  portfolioSummary += `------------------------\n`;
  
  portfolioData.forEach(d => {
    if (d.ticker && d.quantity > 0) { 
        let w = brokerageAssetsUSD > 0 ? (d.stockValue / brokerageAssetsUSD) : 0; 
        portfolioSummary += `- ${d.ticker}: Alloc ${(w*100).toFixed(1)}%\n`;
    }
  });

  let marketContext = "시장 상황 분석 실패";
  let qtStatus = "불명확";
  try {
    ss.toast(`🧠 경제 지표 분석 중...`, "Avengers AI");
    SpreadsheetApp.flush();
    const contextPrompt = `
      [Today's Date]: ${today}
      [Role]: Chief Economist.
      [TASK]: SEARCH for MACRO DATA (${currentYear}):
      1. Fed Rate & Powell Speech (${currentMonth})
      2. CPI/PCE Inflation
      3. Unemployment Rate
      4. Fear & Greed / VIX
      5. QT Status
      [OUTPUT]: Summarize Macro Situation & QT Status.
    `;
    marketContext = callGemini(contextPrompt, config.MODEL_NAME);
    const lines = marketContext.split('\n');
    const qtMatch = lines.find(line => line.includes("QT 상태"));
    if (qtMatch) qtStatus = qtMatch.replace(/.*\[QT 상태:\s*/, '').replace(/\]\s*$/, '').trim();
  } catch (e) { Logger.log("Macro Error: " + e.toString()); }

  for (let i = 0; i < portfolioData.length; i++) {
    let data = portfolioData[i];
    if (!data.ticker || data.currentPrice <= 0) continue;

    let ticker = data.ticker;
    let myPrice = data.myPrice;
    let row = i + 2; 
    let signalCell = sheet.getRange(row, 7); 
    let statusCell = sheet.getRange(row, 8); 
    let currentVal = statusCell.getValue();
    
    if (currentVal !== "" && !currentVal.toString().includes("오류") && !currentVal.toString().includes("분석 중")) continue;

    statusCell.setValue(`⏳ ${ticker} 분석 중...`);
    SpreadsheetApp.flush();

    try {
      if (data.quantity > 0 && myPrice > 0) {
        let returnRate = (data.currentPrice - myPrice) / myPrice;
        sheet.getRange(row, 5).setValue(returnRate).setNumberFormat("0.00%"); 
      } else {
        sheet.getRange(row, 5).setValue("신규진입");
      }
      
      const finData = getFinvizData(ticker);
      finData.currentPrice = data.currentPrice;
      
      let peValue = parseFloat(finData.per);
      finData.earningsYield = (!isNaN(peValue) && peValue > 0) ? (1 / peValue * 100).toFixed(2) + "%" : "N/A";
      
      let techData = getConfig().TECH_DEFAULT;
      try { techData = calculateTechnicalIndicators(ticker); } catch (e) { Logger.log("Tech Error: " + e); }
      
      let realMetrics = calculateRealRiskMetrics(ticker);
      const newsObj = getUSNews(ticker);
      const scannerRecommendation = getAlternativeSuggestions(ticker, finData.sector);

      let allowedActions = [];
      let riskTier = "Low";
      if (safetyRatio < SAFETY_CORE_MIN) {
          riskTier = "Critical";
          allowedActions = ["관망", "비중축소", "전량매도"]; 
      } else {
          riskTier = "Normal";
          allowedActions = ["강력매수", "분할매수", "관망", "비중축소", "전량매도"];
      }
      if (cashWeight < CASH_WEIGHT_MIN) allowedActions = allowedActions.filter(a => a !== "강력매수");

      let coreEngineBrief = `
        [⚖️ CORE RISK ENGINE OUTPUT]
        - Current Risk Tier: **${riskTier}**
        - Safety Core Status: ${(safetyRatio*100).toFixed(1)}% (Target > ${SAFETY_CORE_MIN*100}%)
        - Allowed Actions: **[${allowedActions.join(", ")}]**
      `;

      const biasResult = calculateBiasScore(techData, finData, brokerageAssetsUSD, cashWeight);

      let scannerPromptSection = (finData.source === "PYTHON_SCANNER") 
          ? `[PYTHON SCANNER DATA]: Fair Value ${finData.fairValueScore}, Upside ${finData.upsidePotential}%, Quality ${finData.qualityScore}`
          : `[PYTHON SCANNER DATA]: UNAVAILABLE (Using Fallback)`;

      const industryInfo = (finData.sector && finData.sector !== "N/A") ? `${finData.sector} / ${finData.industry}` : "Unknown";
      const safetyCoreString = (safetyRatio * 100).toFixed(1) + "%";

      let totalQuantity = data.quantity;
      let currentWeight = 0;
      if (brokerageAssetsUSD > 0 && data.stockValue > 0) {
         currentWeight = (data.stockValue / brokerageAssetsUSD) * 100; 
      }

      let scannerData = getScannerData(ticker);
      let rsiVal = scannerData ? scannerData['RSI'] : "N/A";

      let prompt = `
        ${getSystemPrompt(newsObj.legalRisk, allowedActions, brokerageAssetsUSD, data.currentPrice, totalQuantity, currentWeight, TARGET_ANNUAL_RETURN)} 

        [CRITICAL DATA OVERRIDE - DO NOT INVENT]:
        - **Safety Core**: ${safetyCoreString} (Use this exact value)
        - **Risk Tier**: ${riskTier} (If Normal, do not say Critical)
        - **Current Price**: $${data.currentPrice}
        - **User's Portfolio Safety Ratio**: ${safetyRatio.toFixed(3)}
        - **RSI**: ${rsiVal} (Use this EXACT value. Do NOT calculate.)

        ${marketRegimeInfo} 

        [Date]: ${today}
        [Target]: ${ticker}
        
        [💰 MACRO]: ${marketContext} (QT: ${qtStatus})
        [💼 PORTFOLIO]: ${portfolioSummary}
        ${coreEngineBrief}
        [Position]: ${data.quantity > 0 ? "Holding" : "Watchlist (Zero Qty)"}

        ${scannerPromptSection}
        [Industry]: ${industryInfo}
        
        [Recommendation Data]:
        - **Alternative Candidate (Scanner Only):** ${scannerRecommendation}

        [Detailed Financial Data]:
        - Quant: Sharpe ${realMetrics.sharpe}, MDD ${realMetrics.mdd}, Vol ${realMetrics.vol} ([SRC: ${realMetrics.source}])
        - Earn Yield: ${finData.earningsYield}
        - RSI: ${techData.rsi}, Stoch: ${techData.stoch}
        - Valuation: P/E ${finData.per}, P/B ${finData.pbr}, ROE ${finData.roe}
        - Target: ${finData.target}
        
        [Bias Score]: Grade ${biasResult.grade} (Buy ${biasResult.buyRatio}% / Sell ${biasResult.sellRatio}%)
        
        [MISSION]:
        1. **Competitors**: Use Finviz/Industry Leaders in ${industryInfo}.
        2. **Alternatives**: Use ONLY [Recommendation Data]. If N/A, say N/A.
        3. **Translation**: 'The Debate' to KOREAN.
      `;

      let advice = callGemini(prompt, config.MODEL_NAME); 
      
      if (advice.length < MIN_RESPONSE_LENGTH || advice.startsWith("❌")) {
          signalCell.setValue("🚫 응답 실패");
          statusCell.setValue("❌ 응답 실패 (길이/API)").setWrap(true);
          continue;
      }
      
      advice = sanitizeSafetyCoreText(advice, safetyRatio, SAFETY_CORE_MIN, riskTier);

      const headerSection = advice.substring(0, 1000); 
      const decisionKeyMatch = headerSection.match(/DECISION\s*=\s*([^\n]+)/i);
      let finalDecisionText = decisionKeyMatch ? decisionKeyMatch[1].trim().replace(/\s*\(.*\)/, '').trim() : "관망";
      
      if (!/^DECISION\s*=/m.test(advice)) advice = `DECISION=${finalDecisionText}\n` + advice;

      let signal = "🤔 관망";
      if (finalDecisionText.includes("전량매도") || finalDecisionText.includes("축소")) signal = "❄️ 매도/축소";
      else if (finalDecisionText.includes("강력매수")) signal = "🔥 강력매수";
      else if (finalDecisionText.includes("분할매수") || finalDecisionText.includes("진입")) signal = "✅ 분할매수/진입";
      
      signalCell.setValue(signal); 
      statusCell.setValue(advice).setWrap(true); 

      const parsedLocal = parseDecisionAndBias(advice); 
      
      const autoTargetPct = calcTargetWeight(
        finalDecisionText, 
        riskTier, 
        realMetrics.vol, 
        realMetrics.mdd, 
        parsedLocal.bias
      );

      const currentTgt = sheet.getRange(row, 6).getValue();
      if (!currentTgt || currentTgt === 0 || String(currentTgt).trim() === "") {
         sheet.getRange(row, 6).setValue(autoTargetPct);
      }

    } catch (e) {
      statusCell.setValue("🚨 에러: " + e.toString());
    }
  }
  
  buildDailyPortfolioSummary();
  
  Browser.msgBox("✅ 분석 완료 (Summary & Target Weight Updated)");
}
