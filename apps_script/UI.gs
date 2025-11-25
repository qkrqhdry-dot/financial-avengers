// ==========================================
// 🖥️ [UI] 메뉴 및 대시보드 (HTML)
// ==========================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('💵 The Financial Avengers')
    .addItem(`🚀 이사회 소집 (투자 진단 실행)`, 'runAvengersAnalysis')
    .addSeparator()
    .addItem(`📖 회의록 열람 (시각화 대시보드)`, 'showAvengersDialog')
    .addToUi();
}

function showAvengersDialog() {
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
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(htmlContent).setWidth(1200).setHeight(900), ' '); 
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
