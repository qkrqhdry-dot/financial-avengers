// ==========================================
// 🖥️ [UI] 메뉴 및 대시보드 (HTML)
// ==========================================

function showAvengersDialog() {
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    Logger.log(`showAvengersDialog skipped (no UI context): ${e}`);
    return;
  }
  // 백틱(`)을 사용하여 HTML 문자열이 깨지지 않도록 안전하게 작성했습니다.
  var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif; padding: 40px; background-color: #f0f2f5; color: #333; line-height: 1.7; font-size: 16px; }
        .report-container { background: white; max-width: 1100px; margin: 0 auto; padding: 50px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-top: 8px solid #2c3e50; }
        .header { border-bottom: 2px solid #ecf0f1; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        h1 { margin: 0; font-size: 36px; color: #2c3e50; font-weight: 800; letter-spacing: -0.5px; }
        .sub-title { font-size: 14px; color: #e74c3c; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 5px; }
        .date { color: #7f8c8d; font-weight: 600; font-size: 14px; }
        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 25px; margin-bottom: 40px; }
        .dashboard-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 16px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-align: center; transition: transform 0.2s; }
        .dashboard-card:hover { transform: translateY(-3px); }
        .card-title { font-size: 13px; color: #95a5a6; font-weight: 700; display: block; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .big-value { font-size: 28px; font-weight: 900; color: #2c3e50; }
        .signal-box { display: inline-block; padding: 8px 24px; border-radius: 50px; color: white; font-weight: bold; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
        h2 { color: #34495e; font-size: 22px; margin-top: 50px; margin-bottom: 20px; padding-left: 15px; border-left: 5px solid #3498db; font-weight: 800; letter-spacing: -0.5px; }
        ul { padding-left: 20px; margin-bottom: 20px; }
        li { margin-bottom: 10px; }
        strong { color: #e74c3c; background-color: rgba(231, 76, 60, 0.08); padding: 2px 6px; border-radius: 4px; }
        .strategy-box { background-color: #fcfdfd; border: 2px solid #d6eaf8; border-radius: 15px; padding: 25px; margin: 30px 0; box-shadow: 0 5px 15px rgba(52, 152, 219, 0.05); }
        .strategy-title { font-size: 18px; font-weight: 900; color: #2980b9; margin-bottom: 15px; display: block; }
        .competitor-box { background-color: #fdfefe; border: 2px solid #f5cba7; border-radius: 15px; padding: 25px; margin: 30px 0; box-shadow: 0 5px 15px rgba(230, 126, 34, 0.05); }
        .competitor-title { font-size: 18px; font-weight: 900; color: #d35400; margin-bottom: 15px; display: block; }
        .btn-area { text-align: center; margin-top: 60px; }
        button { background-color: #2c3e50; color: white; border: none; padding: 16px 50px; border-radius: 50px; cursor: pointer; font-size: 18px; font-weight: bold; box-shadow: 0 5px 20px rgba(44, 62, 80, 0.3); transition: all 0.3s; }
        button:hover { background-color: #34495e; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(44, 62, 80, 0.4); }
        .loader { text-align: center; padding: 100px; color: #7f8c8d; font-size: 18px; }
        .error-box { background: #fff; border: 2px solid #c0392b; color: #c0392b; padding: 30px; border-radius: 10px; text-align: center; }
      </style>
      <script>
        function loadData() {
          document.getElementById('report-content').innerHTML = '<div class="loader">📊 The Financial Avengers가 데이터를 분석 중입니다...</div>';
          google.script.run.withSuccessHandler(displayReport).withFailureHandler(showError).getSelectedRowData();
        }
        
        function showError(err) {
            var container = document.getElementById('report-content');
            container.innerHTML = '<div class="error-box"><h3>🚨 시스템 오류</h3><p>' + err + '</p><br><button onclick="google.script.host.close()">닫기</button></div>';
        }
        
        function displayReport(rawData) {
          var container = document.getElementById('report-content');
          var data;
          try { 
            data = JSON.parse(rawData); 
          } catch (e) {
            container.innerHTML = '<div class="error-box"><h3>데이터 파싱 오류</h3><p>데이터 형식이 올바르지 않습니다.</p><br><button onclick="google.script.host.close()">닫기</button></div>';
            return;
          }
          
          if (data.error) {
             container.innerHTML = '<div class="error-box"><h3>⚠️ 확인 필요</h3><p>' + data.error + '</p><br><button onclick="google.script.host.close()">닫기</button></div>';
             return;
          }

          var signalColor = '#95a5a6';
          var sig = data.signal || "";
          if (sig.includes('매수') || sig.includes('확대') || sig.includes('Buy') || sig.includes('진입')) signalColor = '#e74c3c';
          else if (sig.includes('매도') || sig.includes('축소') || sig.includes('Reject')) signalColor = '#3498db';
          else if (sig.includes('관망') || sig.includes('Hold')) signalColor = '#f39c12';
          else if (sig.includes('오류') || sig.includes('금지')) signalColor = '#e74c3c';  

          var rawAdvice = data.advice || "";

          // 🚨 [UI Cleanup]: 상단의 메타데이터(DECISION, BIAS 등) 제거 로직 (안전한 Regex 사용)
          rawAdvice = rawAdvice.replace(/^DECISION=.*[\\r\\n]*/gm, "");
          rawAdvice = rawAdvice.replace(/^BIAS_GRADE=.*[\\r\\n]*/gm, "");
          rawAdvice = rawAdvice.replace(/^BIAS_SCORE=.*[\\r\\n]*/gm, "");
          rawAdvice = rawAdvice.trim();

          // 섹션 스타일링 적용
          rawAdvice = rawAdvice.replace(/## 🚀 실행 전략(.*?)(?=(##|$))/s, '<div class="strategy-box"><span class="strategy-title">🚀 CEO 실행 전략 (Action Plan)</span>$1</div>');
          rawAdvice = rawAdvice.replace(/## ⚔️ 경쟁사 비교 및 대안(.*?)(?=(##|$))/s, '<div class="competitor-box"><span class="competitor-title">⚔️ 경쟁사 및 대체 투자 (Alternatives)</span>$1</div>');
          
          var formattedBody = rawAdvice
            .replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>')
            .replace(/^[-•] (.*)/gm, '<li>$1</li>')
            .replace(/\\n/g, '<br>');
          formattedBody = formattedBody.replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>');

          var rsiDisplay = data.rsi;
          if (!rsiDisplay || rsiDisplay === "N/A" || rsiDisplay === "-") rsiDisplay = "<span style='font-size:16px; color:#bdc3c7;'>AI 확인중</span>";

          var returnRateVal = data.returnRate;
          var returnColor = '#333';
          if (returnRateVal === "신규진입") {
             returnColor = '#f39c12'; 
          } else {
             returnColor = parseFloat(returnRateVal) >= 0 ? '#e74c3c' : '#3498db';
          }

          var html = '<div class="report-container">' +
            '  <div class="header">' +
            '    <div>' +
            '      <div class="sub-title">The Financial Avengers Report</div>' +
            '      <h1>' + data.ticker + ' 투자 전략 회의록</h1>' +
            '    </div>' +
            '    <div class="date">' + new Date().toLocaleDateString() + '</div>' +
            '  </div>' +
            '  <div class="dashboard-grid">' +
            '    <div class="dashboard-card">' +
            '      <span class="card-title">현재 수익률</span>' +
            '      <div class="big-value" style="color: ' + returnColor + '">' + returnRateVal + '</div>' +
            '    </div>' +
            '    <div class="dashboard-card">' +
            '      <span class="card-title">CEO 최종 결정</span>' +
            '      <div style="margin-top:8px;">' +
            '        <span class="signal-box" style="background-color: ' + signalColor + '">' + data.signal.replace(/🔥|✅|👀|❄️|❌/g, '').trim() + '</span>' +
            '      </div>' +
            '    </div>' +
            '    <div class="dashboard-card">' +
            '      <span class="card-title">RSI (과열 지표)</span>' +
            '      <div class="big-value">' + rsiDisplay + '</div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="report-body">' +
                 formattedBody +
            '  </div>' +
            '  <div class="btn-area">' +
            '    <button onclick="google.script.host.close()">회의 종료</button>' +
            '  </div>' +
            '</div>';

          container.innerHTML = html;
        }
        window.onload = loadData;
      </script>
    </head>
    <body><div id="report-content"></div></body>
    </html>
  `;
  ui.showModalDialog(HtmlService.createHtmlOutput(htmlContent).setWidth(1200).setHeight(900), ' ');
}

// 🔵 [UI] 포트폴리오 전체 판단 전용 대시보드
function openPortfolioDashboard() {
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    Logger.log(`openPortfolioDashboard skipped (no UI context): ${e}`);
    return;
  }

  var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif; padding: 40px; background-color: #f7f9fb; color: #2c3e50; line-height: 1.7; font-size: 16px; }
        .report-container { background: white; max-width: 1100px; margin: 0 auto; padding: 50px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-top: 8px solid #2c3e50; }
        .header { border-bottom: 2px solid #ecf0f1; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        h1 { margin: 0; font-size: 32px; color: #2c3e50; font-weight: 800; letter-spacing: -0.5px; }
        .date { color: #7f8c8d; font-weight: 600; font-size: 14px; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 40px; }
        .dashboard-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 16px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
        .card-title { font-size: 13px; color: #95a5a6; font-weight: 700; display: block; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .big-value { font-size: 26px; font-weight: 900; color: #2c3e50; }
        .section-title { color: #34495e; font-size: 20px; margin-top: 40px; margin-bottom: 12px; padding-left: 15px; border-left: 5px solid #3498db; font-weight: 800; letter-spacing: -0.5px; }
        .pill { display: inline-block; padding: 8px 16px; border-radius: 999px; background: #ecf0f1; color: #2c3e50; font-weight: 700; margin-right: 8px; }
        .text-block { background: #fcfdfd; border: 1px solid #dfe6e9; border-radius: 14px; padding: 22px; box-shadow: 0 5px 15px rgba(52, 152, 219, 0.05); }
        .list { list-style: none; padding: 0; margin: 0; }
        .list li { margin-bottom: 8px; color: #2c3e50; }
        .loader { text-align: center; padding: 80px; color: #7f8c8d; font-size: 18px; }
        .error-box { background: #fff; border: 2px solid #c0392b; color: #c0392b; padding: 30px; border-radius: 10px; text-align: center; }
        .btn-area { text-align: center; margin-top: 40px; }
        button { background-color: #2c3e50; color: white; border: none; padding: 14px 40px; border-radius: 50px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 5px 20px rgba(44, 62, 80, 0.3); transition: all 0.3s; }
        button:hover { background-color: #34495e; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(44, 62, 80, 0.4); }
      </style>
      <script>
        function loadPortfolioData() {
          document.getElementById('portfolio-content').innerHTML = '<div class="loader">📊 포트폴리오 전체 판단 데이터를 불러오는 중입니다...</div>';
          google.script.run.withSuccessHandler(renderPortfolio).withFailureHandler(showPortfolioError).getPortfolioDashboardData();
        }

        function showPortfolioError(err) {
          var container = document.getElementById('portfolio-content');
          container.innerHTML = '<div class="error-box"><h3>🚨 시스템 오류</h3><p>' + err + '</p><br><button onclick="google.script.host.close()">닫기</button></div>';
        }

        function renderPortfolio(raw) {
          var container = document.getElementById('portfolio-content');
          var data;
          try {
            data = JSON.parse(raw);
          } catch (e) {
            container.innerHTML = '<div class="error-box"><h3>데이터 파싱 오류</h3><p>데이터 형식이 올바르지 않습니다.</p><br><button onclick="google.script.host.close()">닫기</button></div>';
            return;
          }

          if (data.error) {
            container.innerHTML = '<div class="error-box"><h3>⚠️ 확인 필요</h3><p>' + data.error + '</p><br><button onclick="google.script.host.close()">닫기</button></div>';
            return;
          }

          var conclusion = data.sections && data.sections.conclusion ? data.sections.conclusion : '분석 본문이 없습니다.';
          var avengers = data.sections && data.sections.avengers ? data.sections.avengers : '';
          var safetyPct = (Number(data.safetyRatio || 0) * 100).toFixed(1) + '%';
          var lossPct = (Number(data.summary && data.summary.lossRatio || 0) * 100).toFixed(1) + '%';
          var mddPct = (Number(data.summary && data.summary.avgMdd || 0)).toFixed(1) + '%';
          var regime = data.regime || 'N/A';

          function listToHtml(items) {
            if (!items || !items.length) return '<li>데이터 없음</li>';
            return items.slice(0,5).map(function(it){
              var weight = typeof it.weight === 'number' ? it.weight.toFixed(1) + '%' : '-';
              return '<li><strong>' + (it.ticker || it.name || '-') + '</strong> · ' + weight + '</li>';
            }).join('');
          }

          var conclusionHtml = conclusion.replace(/\n/g, '<br>');
          var avengersHtml = avengers ? '<div class="text-block" style="margin-top:16px;"><strong>어벤저스 한 줄 요약</strong><br>' + avengers.replace(/\n/g, '<br>') + '</div>' : '';

          var html = '<div class="report-container">' +
            '  <div class="header">' +
            '    <h1>📊 포트폴리오 전체 판단 (Full Portfolio Fit)</h1>' +
            '    <div class="date">' + (data.date || '') + '</div>' +
            '  </div>' +
            '  <div class="dashboard-grid">' +
            '    <div class="dashboard-card"><span class="card-title">안전자산 비중</span><div class="big-value">' + safetyPct + '</div></div>' +
            '    <div class="dashboard-card"><span class="card-title">손실 포지션 비율</span><div class="big-value">' + lossPct + '</div></div>' +
            '    <div class="dashboard-card"><span class="card-title">평균 MDD</span><div class="big-value">' + mddPct + '</div></div>' +
            '  </div>' +
            '  <div class="text-block">' +
            '    <div class="section-title">Full Portfolio Fit 종합 결론</div>' +
                 conclusionHtml +
                 avengersHtml +
            '  </div>' +
            '  <div class="section-title">상위 편입 종목</div>' +
            '  <ul class="list">' + listToHtml(data.summary ? data.summary.topHoldings : []) + '</ul>' +
            '  <div class="section-title">주요 섹터 비중</div>' +
            '  <ul class="list">' + listToHtml(data.summary ? data.summary.sectors : []) + '</ul>' +
            '  <div class="section-title">Market Regime</div>' +
            '  <div class="pill">' + regime + '</div>' +
            '  <div class="btn-area"><button onclick="google.script.host.close()">닫기</button></div>' +
            '</div>';

          container.innerHTML = html;
        }
        window.onload = loadPortfolioData;
      </script>
    </head>
    <body><div id="portfolio-content"></div></body>
    </html>
  `;

  ui.showModalDialog(HtmlService.createHtmlOutput(htmlContent).setWidth(1200).setHeight(900), ' ');
}

// 팝업 대시보드에서 선택된 행의 데이터를 가져오는 함수
function getSelectedRowData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  
  if (row < 2) return JSON.stringify({ error: "종목이 있는 행을 선택해주세요." });
  
  const ticker = sheet.getRange(row, 1).getValue(); 
  const returnRate = sheet.getRange(row, 5).getValue(); 
  const techInfoRaw = ""; 
  const signal = sheet.getRange(row, 7).getValue(); 
  const advice = sheet.getRange(row, 8).getValue(); 

  let returnRateStr = typeof returnRate === 'number' ? (returnRate * 100).toFixed(2) + "%" : String(returnRate);
  const techInfo = String(techInfoRaw); 

  let rsiVal = "N/A";
  const rsiMatch = techInfo.match(/RSI:\s*([\d\.]+)/);
  if (rsiMatch && rsiMatch[1]) rsiVal = rsiMatch[1];

  if (!ticker || ticker === "") return JSON.stringify({ error: "유효한 티커가 없습니다." });

  return JSON.stringify({
      ticker: ticker || "N/A",
      returnRate: returnRateStr || "신규진입",
      rsi: rsiVal || "N/A",
      signal: signal || "진단 전",
      advice: advice || "분석이 필요합니다."
  });
}

// 🔵 포트폴리오 전체 판단 데이터를 반환 (추가 API 호출 없음)
function getPortfolioDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();
  const pmSheet = ss.getSheetByName("Portfolio_Meeting");

  if (!pmSheet) {
    return JSON.stringify({ error: "포트폴리오 전체 판단 리포트가 없습니다. '이사회 소집 (투자 진단 실행)'을 먼저 실행해주세요." });
  }

  const advice = pmSheet.getRange("B2").getValue();
  if (!advice || String(advice).trim() === "") {
    return JSON.stringify({ error: "포트폴리오 전체 판단 텍스트가 비어 있습니다. 리포트를 먼저 생성해주세요." });
  }

  const sheet1 = ss.getSheetByName("시트1");
  const scannerSheet = ss.getSheetByName(config.SCANNER_SHEET_NAME);
  const pSheet = ensurePortfolioSheet();

  const summary = getFullPortfolioData(sheet1, scannerSheet);
  const safetyRatio = normalizePercentRatio(pSheet.getRange("C7").getValue(), config.SAFETY_CORE_MIN);
  const cashWeight = normalizePercentRatio(pSheet.getRange("C4").getValue(), 0);
  const regime = classifyMarketRegime(safetyRatio, summary.lossRatio, summary.avgMdd);

  const sections = parseFullPortfolioReport(advice);

  return JSON.stringify({
    sections: { conclusion: sections.conclusion, avengers: sections.avengers },
    summary: summary,
    safetyRatio: safetyRatio,
    cashWeight: cashWeight,
    regime: regime,
    date: new Date().toLocaleDateString()
  });
}
