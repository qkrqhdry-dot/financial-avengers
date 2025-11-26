// ==== Config.gs 시작 ====
function getConfig() {
  return {
    // API 키 (스크립트 속성에서 가져옴)
    API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || "GEMINI_API_KEY",
    
    // 모델명
    MODEL_NAME: "models/gemini-2.5-flash-latest",

    // 파라미터
    TARGET_ANNUAL_RETURN: 0.20, 
    RISK_FREE_RATE: 0.045,      
    SAFETY_CORE_MIN: 0.40,      
    CASH_WEIGHT_MIN: 0.05,      
    MIN_RESPONSE_LENGTH: 500,   
    MAX_ANALYSIS_ROWS: 30,      
    
    // 🔵 Python Scanner 데이터 시트명
    SCANNER_SHEET_NAME: "Scanner_Data",

    // 기술적 지표 기본값
    TECH_DEFAULT: {
      rsi: "N/A",
      sma5: "-", sma20: "-", sma50: "-", sma120: "-", sma200: "-",
      pivot: "-", s1: "-", r1: "-",
      stoch: "-", macd: "-",
      closes: []
    }
  };
}
