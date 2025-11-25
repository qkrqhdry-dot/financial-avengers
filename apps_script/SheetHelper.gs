// ==========================================
// 📄 [시트] 시트 생성 및 관리
// ==========================================

function ensurePortfolioSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let pSheet = ss.getSheetByName("포트폴리오_대시보드");
  
  if (!pSheet) {
    pSheet = ss.insertSheet("포트폴리오_대시보드");
    
    // 초기 설정
    pSheet.getRange("B2").setValue("--- [입력 필드] ---").setFontWeight("bold");
    pSheet.getRange("C2").setValue("--- [값] ---").setFontWeight("bold");
    
    pSheet.getRange("B3").setValue("📊 총 주식 평가액 (USD)");
    pSheet.getRange("C3").setValue(0);
    
    pSheet.getRange("B4").setValue("💰 보유 현금 (단위: 만원)");
    pSheet.getRange("C4").setValue(1000);  
    pSheet.getRange("C4").setBackground("#fff2cc"); // 노란색 배경
    
    pSheet.getRange("B5").setValue("🛡️ DC+IRP 자산 (단위: 만원)");
    pSheet.getRange("C5").setValue(5000);
    pSheet.getRange("C5").setBackground("#e6f7ff"); // 하늘색 배경
    
    pSheet.getRange("B6").setValue("💱 환율 (USD/KRW)");
    pSheet.getRange("C6").setFormula('=GOOGLEFINANCE("CURRENCY:USDKRW")');
    pSheet.getRange("C6").setNumberFormat("0");

    pSheet.getRange("B7").setValue("🛡️ 안전 자산 비중 (%)");
    // 안전자산 비중 계산 공식: DC+IRP / (총 주식평가액*환율 + 보유현금*10000 + DC+IRP*10000)
    pSheet.getRange("C7").setFormula('=IF((C3*C6 + C4*10000 + C5*10000)=0, 0, (C5*10000) / (C3*C6 + C4*10000 + C5*10000))');
    pSheet.getRange("C7").setNumberFormat("0.0%");

    pSheet.setColumnWidth(2, 200);
    pSheet.setColumnWidth(3, 150);
    SpreadsheetApp.getActiveSpreadsheet().toast("✅ 포트폴리오 대시보드 업데이트! C5에 DC/IRP 자산을 입력하세요.");
  } else {
    // 시트가 이미 있을 경우, 주요 필드만 확인 및 업데이트
    if (pSheet.getRange("B7").getFormula() === "") {
      pSheet.getRange("B7").setValue("🛡️ 안전 자산 비중 (%)");
      pSheet.getRange("C7").setFormula('=IF((C3*C6 + C4*10000 + C5*10000)=0, 0, (C5*10000) / (C3*C6 + C4*10000 + C5*10000))');
      pSheet.getRange("C7").setNumberFormat("0.0%");
    }
  }
  return pSheet;
}
