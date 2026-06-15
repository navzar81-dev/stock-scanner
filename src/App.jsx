import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// ─── STYLES (inline object helpers) ─────────────────────────
const C = {
  black:"#0A0A0A", white:"#F5F0E8", gold:"#F4C430", red:"#E03C2F",
  green:"#1DB954", blue:"#1A6EFF", purple:"#8B5CF6", cyan:"#00BCD4",
  grey:"#2A2A2A", mid:"#555",
};

const shadow  = "5px 5px 0px #0A0A0A";
const shadowG = "5px 5px 0px #F4C430";
const shadowB = "5px 5px 0px #1A6EFF";
const border  = `3px solid ${C.black}`;

// ─── REGIONS & EXCHANGES ─────────────────────────────────────
const EXCHANGES = [
  { id:"NYSE",    label:"NYSE",         flag:"🇺🇸", region:"US" },
  { id:"NASDAQ",  label:"NASDAQ",       flag:"🇺🇸", region:"US" },
  { id:"LSE",     label:"LSE",          flag:"🇬🇧", region:"Europe" },
  { id:"XETRA",   label:"XETRA (DE)",   flag:"🇩🇪", region:"Europe" },
  { id:"EURONEXT",label:"Euronext",     flag:"🇪🇺", region:"Europe" },
  { id:"HKEX",    label:"HKEX",         flag:"🇭🇰", region:"Asia" },
  { id:"SGX",     label:"SGX",          flag:"🇸🇬", region:"Asia" },
  { id:"TSE",     label:"TSE (Japan)",  flag:"🇯🇵", region:"Asia" },
  { id:"ASX",     label:"ASX",          flag:"🇦🇺", region:"Asia" },
  { id:"INDEX",   label:"Index / ETF",  flag:"📊", region:"Global" },
];

const ASSET_TYPES = [
  { id:"stock",   label:"Single Stock" },
  { id:"index",   label:"Market Index" },
  { id:"etf",     label:"ETF" },
];

const CURRENCIES = ["INR", "USD", "GBP", "EUR", "HKD", "SGD", "JPY", "AUD"];

const regionCol = { "US":C.blue, "Europe":"#8B5CF6", "Asia":C.cyan, "Global":C.gold, "India":C.green };
function exCol(id){ 
  if (id === "NSE" || id === "BSE") return C.green;
  return regionCol[EXCHANGES.find(e=>e.id===id)?.region||"Global"]||C.gold; 
}

// ─── FRAMEWORKS ─────────────────────────────────────────────
const FRAMEWORK_INDIA = [
  { num:"01", title:"Business Quality & Moat",       tag:"lt",   desc:"Competitive advantage, pricing power, market leadership, brand or IP moat." },
  { num:"02", title:"Revenue & Earnings Growth",      tag:"both", desc:"Revenue CAGR >20%, Net Profit CAGR >25% over 3+ years. Consistent, not lumpy." },
  { num:"03", title:"Balance Sheet Strength",         tag:"lt",   desc:"D/E below 0.5x, positive Free Cash Flow, stable receivables, low pledging." },
  { num:"04", title:"Return Ratios: ROE & ROCE",      tag:"lt",   desc:"ROE >15% and ROCE >15%, sustained for 3+ years. Not leverage-driven." },
  { num:"05", title:"Valuation vs Growth (PEG)",      tag:"both", desc:"PEG ratio below 1.5. Stock not priced for perfection. Compare to 5-yr median P/E." },
  { num:"06", title:"Promoter Quality",               tag:"lt",   desc:"Stake >40%, zero pledging, clean SEBI record, open market buying visible." },
  { num:"07", title:"Sector Tailwind & Macro",        tag:"both", desc:"5-year+ policy or demographic tailwind: PLI, defence, green energy, exports." },
  { num:"08", title:"Technical Setup & Volume",       tag:"st",   desc:"Price above 50/200 DMA, RSI 45-70, 3x+ volume on breakout, bullish pattern." },
  { num:"09", title:"Institutional & Smart Money",    tag:"both", desc:"MF fresh entry, FII increasing stake, bulk/block deals at key levels." },
  { num:"10", title:"Risk Control & Position Sizing", tag:"both", desc:"Stop-loss, target, exit rules defined. Max 8-10% portfolio in one stock." },
];

const FRAMEWORK_GLOBAL = [
  { num:"01", title:"Business Moat & Global Competitiveness",  tag:"lt",   desc:"Durable competitive advantage at a global scale — brand, network, IP, switching costs, or regulatory moat." },
  { num:"02", title:"Revenue Growth & Earnings Quality",        tag:"both", desc:"Consistent revenue & EPS growth across cycles. Quality of earnings matters more than headline growth." },
  { num:"03", title:"Balance Sheet & Capital Allocation",       tag:"lt",   desc:"Debt levels, FCF generation, buyback track record, dividend history. Conservative capital management." },
  { num:"04", title:"Return on Equity & Margins",               tag:"lt",   desc:"ROE/ROIC above cost of capital sustained over 5+ years. Gross/operating margin trajectory vs sector peers." },
  { num:"05", title:"Valuation: P/E, EV/EBITDA & Shiller CAPE",  tag:"both", desc:"Stock: P/E vs sector, EV/EBITDA, PEG. Index: Shiller CAPE vs historical average." },
  { num:"06", title:"Management Quality & Governance",          tag:"lt",   desc:"Track record of capital allocation, insider ownership, ESG governance score, scandal-free." },
  { num:"07", title:"Macro, Sector Tailwind & Geopolitics",     tag:"both", desc:"Secular growth themes (AI, clean energy, ageing population, defence). Geopolitical exposure." },
  { num:"08", title:"Technical Setup & Market Breadth",         tag:"st",   desc:"Price vs 50/200 DMA, RSI, MACD. For indices: advance/decline line, put/call ratio." },
  { num:"09", title:"Institutional Flow & Smart Money",         tag:"both", desc:"ETF flows/outflows, fund positioning (13F filings for US), hedge fund exposure." },
  { num:"10", title:"Currency, Risk & Position Sizing",         tag:"both", desc:"FX risk for non-base-currency investors. Liquidity depth. Correlation, stop-loss, target." },
];

// ─── SUGGESTIONS ─────────────────────────────────────────────
const SUGGESTIONS_INDIA = ["RELIANCE", "IREDA", "TCS", "INFY", "TATAMOTORS", "HDFCBANK", "SBIN"];

const SUGGESTIONS_GLOBAL = {
  INDEX:  ["S&P 500","NASDAQ 100","FTSE 100","DAX 40","Nikkei 225","Hang Seng","MSCI World"],
  NYSE:   ["BERKSHIRE HATHAWAY","COCA-COLA","JPMorgan Chase","ExxonMobil","Walmart"],
  NASDAQ: ["APPLE","MICROSOFT","NVIDIA","ALPHABET","AMAZON","META","TESLA"],
  LSE:    ["HSBC","Shell","AstraZeneca","Unilever","BP"],
  XETRA:  ["SAP","Siemens","Allianz","BMW","Volkswagen"],
  HKEX:   ["Alibaba HK","Tencent","Meituan","BYD","HSBC HK"],
  SGX:    ["DBS Group","OCBC","UOB","CapitaLand","Singtel"],
};

// ─── HELPERS ─────────────────────────────────────────────────
function verdictColor(v="") {
  if (v.includes("STRONG BUY") || v.includes("BUY")) return C.green;
  if (v.includes("WATCH") || v.includes("NEUTRAL")) return "#B8860B";
  return C.red;
}

function dotStyle(r) {
  const base = { width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",
    justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color:C.black };
  if (r==="PASS")    return {...base,background:C.green};
  if (r==="PARTIAL") return {...base,background:C.gold};
  return {...base,background:C.red,color:"#fff"};
}

function fmt(pct, portfolio, currencyVal) {
  if (portfolio) {
    const symbolMap = { INR: "₹", USD: "$", GBP: "£", EUR: "€", JPY: "¥", AUD: "A$", HKD: "HK$", SGD: "S$" };
    const curSymbol = symbolMap[currencyVal] || (currencyVal + " ");
    return curSymbol + Math.round(portfolio * pct / 100).toLocaleString("en-IN");
  }
  return pct + "% of portfolio";
}

// ─── MOCK ENGINE (INDIAN & GLOBAL) ───────────────────────────
function getMockAnalysis(name, marketFocus, mode, portfolio, riskProfile, exchange, assetType, currency) {
  const stockClean = name.trim().toUpperCase();
  const symbol = stockClean.split(" ")[0].replace(/[^A-Z0-9]/g, "");

  if (marketFocus === "indian") {
    // Presets for India
    if (symbol === "RELIANCE") {
      return {
        stockName: "Reliance Industries Ltd.",
        symbol: "RELIANCE",
        sector: "Energy, Retail & Telecom",
        marketCap: "Large Cap",
        ltScore: 8.7,
        stScore: 7.2,
        ltVerdict: "BUY",
        stVerdict: "WATCH",
        ltSub: "Solid energy transition runway and retail/telecom market dominance.",
        stSub: "Consolidating near 200-DMA with moderate volume support.",
        criteria: [
          { num: "01", title: "Business Quality & Moat", ltRating: "PASS", stRating: "PASS", analysis: "Dominates retail and telecom sectors in India. Oil-to-chemicals provides stable cash flows to fund green energy ventures.", keyPoints: ["O2C market leader", "Jio/Retail moat"], redFlags: ["High capex gestation"] },
          { num: "02", title: "Revenue & Earnings Growth", ltRating: "PASS", stRating: "PARTIAL", analysis: "Steady revenue growth driven by retail and digital services, though O2C margins remain cyclical.", keyPoints: ["Retail growth >15%", "Steady Jio ARPU"], redFlags: ["O2C margin pressure"] },
          { num: "03", title: "Balance Sheet Strength", ltRating: "PASS", stRating: "PASS", analysis: "Robust balance sheet despite heavy capital expenditure, backed by strong operating cash flows.", keyPoints: ["Net debt manageable", "Strong cash flow"], redFlags: [] },
          { num: "04", title: "Return Ratios: ROE & ROCE", ltRating: "PARTIAL", stRating: "PARTIAL", analysis: "ROE around 10-12% due to massive capital employed in ongoing green energy investments.", keyPoints: ["ROCE stable ~10%", "Heavy asset base"], redFlags: ["Sub-15% return ratios"] },
          { num: "05", title: "Valuation vs Growth (PEG)", ltRating: "PARTIAL", stRating: "PARTIAL", analysis: "Trading near 5-year median PE, reflecting fair valuation but limited PEG margin of safety.", keyPoints: ["PE around 25x", "Fair value range"], redFlags: ["PEG above 2.0x"] },
          { num: "06", title: "Promoter Quality", ltRating: "PASS", stRating: "PASS", analysis: "Promoter stake above 50% with zero pledging and flawless regulatory record.", keyPoints: ["50%+ promoter stake", "Strong Tata-like trust"], redFlags: [] },
          { num: "07", title: "Sector Tailwind & Macro", ltRating: "PASS", stRating: "PASS", analysis: "Major policy tailwinds from PLI schemes and India's green energy transition focus.", keyPoints: ["Green energy PLI", "Domestic consumption"], redFlags: [] },
          { num: "08", title: "Technical Setup & Volume", ltRating: "PARTIAL", stRating: "PASS", analysis: "Stock is hovering above its 200 DMA with RSI around 52, showing accumulation phase.", keyPoints: ["200 DMA support", "RSI neutral-bullish"], redFlags: [] },
          { num: "09", title: "Institutional & Smart Money", ltRating: "PASS", stRating: "PASS", analysis: "FIIs and Mutual Funds hold over 30% aggregate stake with stable institutional inflows.", keyPoints: ["High FII/DII stake", "Stable block deals"], redFlags: [] },
          { num: "10", title: "Risk Control & Position Sizing", ltRating: "PASS", stRating: "PASS", analysis: "Low beta stock offers excellent capital protection. Suggested max position: 10% of portfolio.", keyPoints: ["Max 10% allocation", "Defensive play"], redFlags: [] }
        ],
        riskCapital: {
          conservative: { pct: 8, rationale: "Safe blue chip anchor." },
          moderate:     { pct: 6, rationale: "Moderate risk allocation." },
          aggressive:   { pct: 4, rationale: "Focus on higher beta stocks." },
          stopLoss:  "5% below 200 DMA (₹2380 support)",
          stTarget:  "12-15% upside in 12 weeks",
          ltHorizon: "24-36 months"
        },
        finalRecommendation: "Reliance Industries remains an essential cornerstone for long-term Indian equity portfolios. Accumulate in tranches near major support zones for the green energy transition runway.",
        keyRisks: ["Global refining margin cyclicality", "Slower retail growth"],
        catalysts: ["Potential Jio/Retail IPO listings", "Green energy commissioning"]
      };
    }
    
    if (symbol === "IREDA") {
      return {
        stockName: "Indian Renewable Energy Development Agency Ltd.",
        symbol: "IREDA",
        sector: "Renewable Energy & Power",
        marketCap: "Mid Cap",
        ltScore: 8.4,
        stScore: 9.2,
        ltVerdict: "BUY",
        stVerdict: "STRONG BUY",
        ltSub: "Strategic government lender for India's clean energy goals.",
        stSub: "High volume breakout above resistance with strong momentum.",
        criteria: [
          { num: "01", title: "Business Quality & Moat", ltRating: "PASS", stRating: "PASS", analysis: "Enjoys low cost of borrowing due to sovereign backing. Main financier of renewable energy projects.", keyPoints: ["Sovereign borrowing advantage", "Niche sector leadership"], redFlags: [] },
          { num: "02", title: "Revenue & Earnings Growth", ltRating: "PASS", stRating: "PASS", analysis: "Net profits growing at >30% CAGR over the last 3 years, backed by high loan book expansion.", keyPoints: ["30%+ profit growth", "Loan book expanding"], redFlags: [] },
          { num: "03", title: "Balance Sheet Strength", ltRating: "PARTIAL", stRating: "PASS", analysis: "High leverage as typical of NBFCs, but net NPA ratio is low at 0.9%.", keyPoints: ["Low Net NPA (0.9%)", "Well capitalised"], redFlags: ["Leverage typical of NBFC"] },
          { num: "04", title: "Return Ratios: ROE & ROCE", ltRating: "PASS", stRating: "PASS", analysis: "ROE stands at 16.5%, sustained over 3 years, showing efficient asset utilisation.", keyPoints: ["ROE >15%", "Improving margins"], redFlags: [] },
          { num: "05", title: "Valuation vs Growth (PEG)", ltRating: "PARTIAL", stRating: "PARTIAL", analysis: "P/E is premium, but justified by loan growth. PEG ratio is around 1.3x.", keyPoints: ["PEG ~1.3", "Premium multiples"], redFlags: ["Higher trailing P/E"] },
          { num: "06", title: "Promoter Quality", ltRating: "PASS", stRating: "PASS", analysis: "Owned by Govt of India (75%+ stake). Zero promoter pledging.", keyPoints: ["Govt owned", "Zero pledged shares"], redFlags: [] },
          { num: "07", title: "Sector Tailwind & Macro", ltRating: "PASS", stRating: "PASS", analysis: "Unprecedented government push for green hydrogen, solar panels, and wind power.", keyPoints: ["500GW renewable target", "Govt PLI policy"], redFlags: [] },
          { num: "08", title: "Technical Setup & Volume", ltRating: "PASS", stRating: "PASS", analysis: "Strong consolidation breakout. Volume is 4x the 20-day moving average.", keyPoints: ["Breakout above resistance", "RSI around 66"], redFlags: [] },
          { num: "09", title: "Institutional & Smart Money", ltRating: "PASS", stRating: "PASS", analysis: "FIIs and Mutual Funds steadily increased stakes in the recent quarters.", keyPoints: ["FII share up", "MF backing"], redFlags: [] },
          { num: "10", title: "Risk Control & Position Sizing", ltRating: "PARTIAL", stRating: "PASS", analysis: "Mid-cap volatility implies higher risk. Limit position to 6% of portfolio.", keyPoints: ["Max 6% position", "Set trailing stop-loss"], redFlags: ["Mid-cap volatility"] }
        ],
        riskCapital: {
          conservative: { pct: 3, rationale: "Keep allocation small due to PSU volatility." },
          moderate:     { pct: 6, rationale: "Growth anchor for mid-cap space." },
          aggressive:   { pct: 8, rationale: "Strong play on green energy momentum." },
          stopLoss:  "8% below entry (₹220 key support)",
          stTarget:  "25-30% upside in 8 weeks",
          ltHorizon: "18-24 months"
        },
        finalRecommendation: "IREDA offers excellent exposure to India's green transition. Long-term prospects are secure under sovereign support, while short-term momentum signals are highly bullish.",
        keyRisks: ["NPAs in private developer lending", "Interest rate fluctuations"],
        catalysts: ["Quarterly earnings beat", "Green energy fund raising approvals"]
      };
    }
  } else {
    // Presets for Global Focus
    if (symbol === "AAPL" || symbol === "APPLE") {
      return {
        stockName: "Apple Inc.",
        symbol: "AAPL",
        sector: "Consumer Electronics & Services",
        marketCap: "Mega Cap",
        ltScore: 8.9,
        stScore: 7.5,
        ltVerdict: "BUY",
        stVerdict: "NEUTRAL",
        ltSub: "Unmatched customer ecosystem lock-in and high-margin services compilation.",
        stSub: "Consolidating near all-time highs; looking for catalyst updates.",
        currentPriceNote: "~$185",
        criteria: [
          { num: "01", title: "Business Moat & Global Competitiveness", ltRating: "PASS", stRating: "PASS", analysis: "iOS ecosystem lock-in provides strong pricing power and massive switching costs globally.", keyPoints: ["High customer retention", "Services gross margin >70%"], redFlags: [] },
          { num: "02", title: "Revenue Growth & Earnings Quality", ltRating: "PASS", stRating: "PARTIAL", analysis: "Hardware growth has matured, but services segment compound growth keeps overall cash flows rising.", keyPoints: ["Services growth stable", "Massive share buybacks"], redFlags: ["Sluggish iPhone unit growth"] },
          { num: "03", title: "Balance Sheet & Capital Allocation", ltRating: "PASS", stRating: "PASS", analysis: "Over $100B in FCF generated annually, funding steady dividend growth and industry-leading buybacks.", keyPoints: ["Negative Net Debt goal", "Flawless capital return"], redFlags: [] },
          { num: "04", title: "Return on Equity & Margins", ltRating: "PASS", stRating: "PASS", analysis: "Exceptional ROIC exceeding 50% due to asset-light outsourcing and high-margin software services.", keyPoints: ["ROIC >50%", "High operating margins"], redFlags: [] },
          { num: "05", title: "Valuation: P/E, EV/EBITDA & Shiller CAPE", ltRating: "PARTIAL", stRating: "PARTIAL", analysis: "PE is stretched around 28-30x, premium relative to historical average but justified by cash flows.", keyPoints: ["Trailing PE ~29x", "Premium valuation"], redFlags: ["Stretched relative PE"] },
          { num: "06", title: "Management Quality & Governance", ltRating: "PASS", stRating: "PASS", analysis: "Excellent executive pedigree under Tim Cook. Strong corporate governance and ESG execution.", keyPoints: ["Superb return execution", "Flawless governance"], redFlags: [] },
          { num: "07", title: "Macro, Sector Tailwind & Geopolitics", ltRating: "PARTIAL", stRating: "PARTIAL", analysis: "Tailwinds from global premiumisation, but significant supply-chain and regulatory risk in China/Europe.", keyPoints: ["Premiumisation tailwind", "Regulatory EU pressures"], redFlags: ["China dependency risk"] },
          { num: "08", title: "Technical Setup & Market Breadth", ltRating: "PARTIAL", stRating: "PASS", analysis: "Trading above 50 and 200 DMA with RSI neutral around 54. Broad institutional accumulation.", keyPoints: ["50/200 DMA support", "RSI neutral"], redFlags: [] },
          { num: "09", title: "Institutional Flow & Smart Money", ltRating: "PASS", stRating: "PASS", analysis: "Top holding in global mutual funds and ETFs. Significant smart money conviction.", keyPoints: ["Berkshire cornerstone", "High ETF holding"], redFlags: [] },
          { num: "10", title: "Currency, Risk & Position Sizing", ltRating: "PASS", stRating: "PASS", analysis: "Extremely liquid. Suggested position up to 10% of portfolio. FX exposure is global.", keyPoints: ["High liquidity", "FX diversification"], redFlags: [] }
        ],
        globalContext: {
          peersComparison: "Maintains superior operating margins and capital returns compared to Samsung and global hardware peers.",
          indexBenchmark: "Consistently matches or outperforms the S&P 500 over any 3-year trailing window.",
          analystConsensus: "Consensus: Strong Buy. Median target: $205."
        },
        riskCapital: {
          conservative: { pct: 10, rationale: "Essential global blue chip anchor." },
          moderate:     { pct: 8,  rationale: "Stable compounding focus." },
          aggressive:   { pct: 5,  rationale: "Allocate more to high beta growth." },
          stopLoss:  "7% below recent support level",
          stTarget:  "12-15% upside potential in 10 weeks",
          ltHorizon: "24-36 months minimum",
          keyRisk:   "Increasing antitrust regulation in the US and European Union."
        },
        finalRecommendation: "Apple Inc. remains a cornerstone asset for defensive-growth investors globally. Accumulate in support bands during macro market corrections to secure stable long-term compounding.",
        keyRisks: ["Antitrust regulation", "Hardware replacement cycles"],
        catalysts: ["AI integration announcements", "Services growth expansion"]
      };
    }
  }

  // Dynamic Generator for any other stock name (adapted to selected market framework)
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const mcap = (hash % 4 === 0) ? "Large Cap" : (hash % 4 === 1) ? "Mid Cap" : (hash % 4 === 2) ? "Small Cap" : "Micro Cap";
  const sector = SECTORS[hash % SECTORS.length];
  
  const rawLtScore = 5.2 + (hash % 42) / 10;
  const rawStScore = 4.8 + ((hash >> 2) % 45) / 10;
  const ltScore = parseFloat(rawLtScore.toFixed(1));
  const stScore = parseFloat(rawStScore.toFixed(1));
  
  const getVerdict = (score) => {
    if (score >= 8.5) return "STRONG BUY";
    if (score >= 7.0) return "BUY";
    if (score >= 5.5) return "WATCH";
    return "AVOID";
  };
  
  const ltVerdict = getVerdict(ltScore);
  const stVerdict = getVerdict(stScore);
  
  const subLtOptions = [
    `Strong sector tailwinds coupled with efficient capital management.`,
    `Consistent market share expansion and pricing power in its segment.`,
    `Steady compounder backed by solid promoter pedigree and governance.`,
    `Undervalued player with high asset turnover and robust FCF generation.`,
    `Business is transitioning to high margin offerings, boosting future returns.`
  ];
  
  const subStOptions = [
    `Strong volumes on recent price breakout, hovering above 50-DMA.`,
    `Momentum is rising; RSI at 62 indicates strong buying interest.`,
    `Consolidating near historical support with diminishing selling pressure.`,
    `Smart money accumulation visible in block deal data.`,
    `Near-term catalysts like PLI expansion or contract wins are close.`
  ];
  
  const ltSub = subLtOptions[hash % subLtOptions.length];
  const stSub = subStOptions[(hash >> 1) % subStOptions.length];
  
  const getRating = (criteriaIdx, isLt) => {
    const rIdx = (hash + criteriaIdx + (isLt ? 0 : 2)) % 100;
    if (rIdx < 50) return "PASS";
    if (rIdx < 85) return "PARTIAL";
    return "FAIL";
  };

  const getAnalysisTextIndia = (idx, r) => {
    const map = {
      1: { PASS: "Maintains a strong competitive moat based on brand equity and cost leadership.", PARTIAL: "Possesses a decent brand footprint but faces active competition in key markets.", FAIL: "Operates in a highly fragmented space with low entry barriers and low pricing power." },
      2: { PASS: "Consistently exhibits over 20% revenue growth and 25% profit CAGR over 3 years.", PARTIAL: "Earnings growth is positive but cyclical, showing some lumpiness in margins.", FAIL: "Growth is stagnant or declining, struggling to beat inflation and industry peers." },
      3: { PASS: "Strong balance sheet with a low debt-to-equity ratio (<0.3x) and comfortable interest cover.", PARTIAL: "Moderate debt levels, but offset by high liquidity and stable working capital.", FAIL: "High debt-to-equity ratio or worsening cash conversion cycle raises leverage concerns." },
      4: { PASS: "Superb capital efficiency with both ROE and ROCE exceeding 18% consistently.", PARTIAL: "Return ratios are stable around 12-14%, reflecting standard efficiency levels.", FAIL: "ROE and ROCE are below 10%, indicating sub-optimal capital allocation." },
      5: { PASS: "Highly attractive valuations with a PEG ratio below 1.1x, providing a margin of safety.", PARTIAL: "P/E is in line with historical averages, reflecting fair current valuation.", FAIL: "Trading at highly stretched multiples that price in perfection, leaving no room for error." },
      6: { PASS: "High promoter holding (>55%) with zero pledging and clean corporate governance.", PARTIAL: "Decent promoter holding, but minor pledge levels exist (<5% of holding).", FAIL: "Low promoter stake or pledging concerns raise governance and alignment warnings." },
      7: { PASS: "Backed by strong sector tailwinds, capital subsidy schemes, or structural domestic growth.", PARTIAL: "Neutral sector alignment with standard regulatory developments.", FAIL: "Faces regulatory headwinds, rising input costs, or secular sector decline." },
      8: { PASS: "Bullish chart structure with heavy volume breakout above key resistance levels.", PARTIAL: "Moving sideways in a tight consolidation range; waiting for volume breakout.", FAIL: "Weak technical setup, trading below 200 DMA with bearish momentum signals." },
      9: { PASS: "Active institutional accumulation, with FIIs and domestic MFs raising stakes.", PARTIAL: "Stable institutional holding with minor block deals in recent months.", FAIL: "Institutions are trimming stakes, showing a lack of smart money conviction." },
      10: { PASS: "Low beta profile provides strong downside protection; highly manageable risk profile.", PARTIAL: "Standard volatility; position sizing must be carefully calibrated.", FAIL: "High beta stock prone to sharp gaps; strict stop-loss rules are vital." }
    };
    return map[idx][r];
  };

  const getAnalysisTextGlobal = (idx, r) => {
    const map = {
      1: { PASS: "Enjoys durable global competitive advantages such as high tech switching costs or global IP.", PARTIAL: "Strong regional footprint, but active international challengers exist.", FAIL: "Operates in a highly commoditized global market with zero pricing power." },
      2: { PASS: "Solid high-quality earnings breadth. EPS compounding is stable across economic cycles.", PARTIAL: "Earnings are growing but subject to macroeconomic cyclicality and client cautiousness.", FAIL: "Muted growth or structural decline; struggling to sustain margins vs global peers." },
      3: { PASS: "Excellent balance sheet with low net debt and highly efficient capital allocation schemes (FCF/buybacks).", PARTIAL: "Moderate leverage; interest payments are well covered by steady cash flow.", FAIL: "High debt loads or suboptimal capital returns (lack of buybacks or dividend cuts) visible." },
      4: { PASS: "Outstanding global returns on equity and operating margins exceeding the international sector median.", PARTIAL: "Margins are in line with global averages; return ratios remain stable.", FAIL: "Underperforming cost of capital; return ratios are sub-par." },
      5: { PASS: "Highly attractive valuations with EV/EBITDA and PE multiples at a discount to global sector peers.", PARTIAL: "Valuation is fairly priced, hovering near historical median averages.", FAIL: "Stretched multiples pricing in perfect growth prospects; trading at a massive premium." },
      6: { PASS: "Stellar board governance standards, high insider alignment, and a solid ESG record.", PARTIAL: "Decent governance track record; minor shareholder conflicts exist.", FAIL: "Lack of transparent governance structures or minor regulatory compliance actions." },
      7: { PASS: "Excellent secular themes alignment (such as GenAI, clean tech, or aerospace) with low geopolitical risk.", PARTIAL: "Positioned in growth sectors, but holds notable exposure to international supply chain risks.", FAIL: "Strong geopolitical overhangs, rising tariffs, or severe regulatory barriers in core regions." },
      8: { PASS: "Bullish price action, trading strongly above the 200-DMA with positive market breadth.", PARTIAL: "Trading range-bound in a consolidation pattern; neutral MACD/RSI indicators.", FAIL: "Clear bearish trend trading below major DMA support zones on falling volume." },
      9: { PASS: "Substantial institutional inflows from global ETFs and hedge funds (high 13F filings alignment).", PARTIAL: "Stable fund ownership; quiet options print data and block activity.", FAIL: "Noticeable institutional outflows; hedge funds are actively trimming exposure." },
      10: { PASS: "Low currency volatility risk and high liquidity depth. Manageable risk profile.", PARTIAL: "Calibrated FX volatility; position sizes must account for macro variations.", FAIL: "High currency fluctuations or tight liquidity; requires a tight protective stop-loss." }
    };
    return map[idx][r];
  };

  const activeFramework = marketFocus === "indian" ? FRAMEWORK_INDIA : FRAMEWORK_GLOBAL;
  
  const criteria = activeFramework.map((c, idx) => {
    const ltR = getRating(idx + 1, true);
    const stR = getRating(idx + 1, false);
    return {
      num: c.num,
      title: c.title,
      ltRating: ltR,
      stRating: stR,
      analysis: marketFocus === "indian" 
        ? getAnalysisTextIndia(idx + 1, mode === "lt" ? ltR : mode === "st" ? stR : (ltR === stR ? ltR : "PARTIAL"))
        : getAnalysisTextGlobal(idx + 1, mode === "lt" ? ltR : mode === "st" ? stR : (ltR === stR ? ltR : "PARTIAL")),
      keyPoints: [
        ltR === "PASS" ? "Global leader" : "Consistent compounding",
        stR === "PASS" ? "Strong volume support" : "Consolidation zone"
      ],
      redFlags: ltR === "FAIL" || stR === "FAIL" ? ["Macro tailwind pressure"] : []
    };
  });

  const consPct = Math.max(1, Math.round(rawLtScore * 0.8));
  const modPct = Math.max(2, Math.round(rawLtScore * 1.1));
  const aggPct = Math.max(3, Math.round(rawLtScore * 1.5));
  
  const output = {
    stockName: stockClean + (stockClean.endsWith("LTD") || stockClean.endsWith("LIMITED") ? "" : " Ltd."),
    symbol: symbol,
    exchange: exchange,
    assetType: assetType,
    sector: sector,
    marketCap: mcap,
    currency: currency,
    ltScore: ltScore,
    stScore: stScore,
    ltVerdict: ltVerdict,
    stVerdict: stVerdict,
    ltSub: ltSub,
    stSub: stSub,
    criteria: criteria,
    riskCapital: {
      conservative: { pct: consPct, rationale: "Defensive capital allocation." },
      moderate:     { pct: modPct, rationale: "Growth compounding allocation." },
      aggressive:   { pct: aggPct, rationale: "Momentum sizing guidelines." },
      stopLoss:  `${Math.round(4 + (hash % 6))}% below entry price`,
      stTarget:  `${Math.round(15 + (hash % 15))}-${Math.round(25 + (hash % 15))}% upside potential`,
      ltHorizon: `${Math.round(12 + (hash % 12))}-${Math.round(24 + (hash % 12))} months holding`
    },
    finalRecommendation: `Based on current assessments, ${stockClean} presents a ${ltScore >= 7.0 ? "compelling" : "neutral"} risk-to-reward ratio. We advise a ${ltVerdict.includes("BUY") ? "gradual accumulation" : "watchful waiting"} approach under the current market conditions.`,
    keyRisks: ["Geopolitical changes", "Cost inflation"],
    catalysts: ["Quarterly earnings trends", "Regulatory approvals"]
  };

  if (marketFocus === "global") {
    output.currentPriceNote = `~${currency} ${Math.round(100 + (hash % 400))}`;
    output.globalContext = {
      peersComparison: `Ranks in the upper decile for return margins compared to global sector rivals.`,
      indexBenchmark: `Outperforming its corresponding benchmark index over the trailing 12 months.`,
      analystConsensus: `Consensus: Moderate Buy. Median price target is ~${currency} ${Math.round(150 + (hash % 400))}.`
    };
    output.riskCapital.keyRisk = `Potential currency exchange headwind against local base rates.`;
  }

  return output;
}

// ─── SUBCOMPONENTS ──────────────────────────────────────────
function ScoreCard({label, score, verdict, sub, colorKey, col, bgCol, visible}) {
  if (!visible) return null;
  
  let activeCol = col;
  let activeBg = bgCol;
  
  if (colorKey) {
    activeCol = colorKey === "lt" ? C.green : C.gold;
    activeBg  = colorKey === "lt" ? "#0d2e1a" : "#2e2100";
  }
  
  if (!activeCol) activeCol = C.gold;
  if (!activeBg) activeBg = "#2e2100";
  
  return (
    <div style={{border, boxShadow: shadow, overflow: "hidden", flex: 1, minWidth: 200}}>
      <div style={{padding: "12px 16px", background: activeBg, borderBottom: `2px solid ${activeCol}`, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <span style={{fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: activeCol}}>
          {label}
        </span>
        <div style={{display: "flex", alignItems: "baseline", gap: 4}}>
          <span style={{fontFamily: "'Bebas Neue',cursive", fontSize: 52, lineHeight: 1, color: activeCol}}>
            {score != null ? score.toFixed(1) : "—"}
          </span>
          <span style={{fontFamily: "'Space Mono',monospace", fontSize: 12, color: "#888"}}>/10</span>
        </div>
      </div>
      <div style={{padding: "14px 16px", background: C.white}}>
        <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 18, letterSpacing: 1, color: verdictColor(verdict), marginBottom: 4}}>
          {verdict || "—"}
        </div>
        <div style={{fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.mid, lineHeight: 1.5}}>
          {sub || ""}
        </div>
      </div>
    </div>
  );
}

function RiskBox({label, amount, value, pct, rationale, note, borderCol, accentCol}) {
  const displayAmount = amount || value;
  const displayRationale = rationale || note;
  const displayCol = borderCol || accentCol || C.blue;
  
  return (
    <div style={{border: `2px solid ${C.black}`, borderLeft: `5px solid ${displayCol}`, padding: 12, flex: 1, minWidth: 120, background: C.white}}>
      <div style={{fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: C.mid, marginBottom: 6}}>
        {label}
      </div>
      <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 24, letterSpacing: 1, lineHeight: 1, color: C.black}}>
        {displayAmount || "—"}
      </div>
      <div style={{fontFamily: "'Space Mono',monospace", fontSize: 9, color: C.mid, marginTop: 4}}>
        {pct}% of portfolio
      </div>
      <div style={{fontFamily: "'Space Mono',monospace", fontSize: 9, color: "#888", marginTop: 3, lineHeight: 1.4}}>
        {displayRationale || ""}
      </div>
    </div>
  );
}

function LoadingStep({label, active}) {
  return (
    <div style={{
      fontFamily: "'Space Mono',monospace",
      fontSize: 9,
      letterSpacing: 1,
      textTransform: "uppercase",
      padding: "4px 8px",
      border: `1.5px solid ${active ? C.gold : "#333"}`,
      color: active ? C.gold : "#444",
      transition: "all 0.3s"
    }}>
      {label}
    </div>
  );
}

// ─── CRITERION CARD ──────────────────────────────────────────
function CriterionCard({c, mode}) {
  const [open, setOpen] = useState(false);
  const ltR = c.ltRating || "FAIL";
  const stR = c.stRating || "FAIL";
  const displayR = mode==="lt" ? ltR : mode==="st" ? stR : (ltR===stR ? ltR : "PARTIAL");

  return (
    <div style={{border,boxShadow:"3px 3px 0 #0A0A0A",marginBottom:10,background:C.white,overflow:"hidden"}}>
      <div onClick={()=>setOpen(!open)} style={{display:"grid",gridTemplateColumns:"36px 1fr auto",alignItems:"center",gap:10,padding:"13px 15px",cursor:"pointer",background:open?C.black:C.white,borderBottom:`2px solid ${open?C.gold:"transparent"}`,transition:"background 0.15s"}}>
        <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:26,color:C.gold,lineHeight:1}}>{c.num}</span>
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:17,letterSpacing:0.5,color:open?C.white:C.black}}>{c.title}</div>
          {mode==="both" && (
            <div style={{display:"flex",gap:8,marginTop:2}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.green}}>LT: {ltR}</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#555"}}>·</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.gold}}>ST: {stR}</span>
            </div>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={dotStyle(displayR)}>{displayR==="PASS"?"✓":displayR==="PARTIAL"?"~":"✗"}</div>
          <span style={{fontSize:18,fontWeight:"bold",color:open?C.gold:"#888"}}>{open?"−":"+"}</span>
        </div>
      </div>
      {open && (
        <div style={{padding:16}}>
          <p style={{fontSize:13,lineHeight:1.75,color:"#333",marginBottom:12}}>{c.analysis||""}</p>
          {(c.keyPoints||[]).map((p,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:7,fontSize:13,color:"#333"}}>
              <span style={{color:C.blue,minWidth:16}}>→</span><span>{p}</span>
            </div>
          ))}
          {(c.redFlags||[]).filter(Boolean).map((f,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:7,fontSize:13,color:C.red}}>
              <span style={{minWidth:16}}>⚠</span><span>{f}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────
export default function StockIntelligenceEngine() {
  const [activeTab, setActiveTab] = useState("analyse");
  const [marketFocus, setMarketFocus] = useState("indian"); // indian | global
  const [stock, setStock]         = useState("");
  const [mode, setMode]           = useState("both");
  const [portfolio, setPortfolio] = useState("");
  const [riskProfile, setRiskProfile] = useState("moderate");

  // Global specific fields
  const [exchange, setExchange]   = useState("NSE");
  const [assetType, setAssetType] = useState("stock");
  const [currency, setCurrency]   = useState("INR");

  const [phase, setPhase]         = useState("input"); // input | loading | results
  const [loadStep, setLoadStep]   = useState(0);
  const [error, setError]         = useState("");
  const [result, setResult]       = useState(null);
  const [history, setHistory]     = useState(() => {
    try {
      const cached = localStorage.getItem("stock_scanner_history");
      if (cached) {
        const parsed = JSON.parse(cached);
        const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
        return parsed.filter(item => {
          if (!item.timestamp) return true;
          return (Date.now() - item.timestamp) < ninetyDaysMs;
        });
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
    return [];
  });
  const [printData, setPrintData]   = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Configuration States
  const [provider, setProvider]   = useState("demo");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("stock_scanner_gemini_key") || "");
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem("stock_scanner_anthropic_key") || "");
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem("stock_scanner_openai_key") || "");
  const [openrouterKey, setOpenrouterKey] = useState(() => localStorage.getItem("stock_scanner_openrouter_key") || "");
  const [kimiKey, setKimiKey]     = useState(() => localStorage.getItem("stock_scanner_kimi_key") || "");
  const [glmKey, setGlmKey]       = useState(() => localStorage.getItem("stock_scanner_glm_key") || "");
  const [localKey, setLocalKey]   = useState(() => localStorage.getItem("stock_scanner_local_key") || "");

  const [geminiModel, setGeminiModel] = useState("gemini-3.5-flash");
  const [anthropicModel, setAnthropicModel] = useState("claude-3-5-sonnet-latest");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o-mini");
  const [kimiModel, setKimiModel] = useState("moonshot-v1-8k");
  const [glmModel, setGlmModel] = useState("glm-4-flash");
  const [openrouterModel, setOpenrouterModel] = useState(() => localStorage.getItem("stock_scanner_openrouter_model") || "meta-llama/llama-3.1-8b-instruct:free");
  const [localModel, setLocalModel] = useState(() => localStorage.getItem("stock_scanner_local_model") || "llama3");
  const [localEndpoint, setLocalEndpoint] = useState(() => localStorage.getItem("stock_scanner_local_endpoint") || "http://localhost:11434");

  const [showSettings, setShowSettings] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem("stock_scanner_history", JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  const STEPS = ["Business Moat","Growth Metrics","Balance Sheet","Return Ratios","Valuation","Governance Profile","Sector Tailwind","Technical Check","Institutional flow","Risk Sizing"];

  // ── run loading animation ──
  function startLoading() {
    setPhase("loading");
    setError("");
    let s = 0;
    timerRef.current = setInterval(()=>{ setLoadStep(s); s=(s+1)%10; }, 400);
  }
  function stopLoading() {
    clearInterval(timerRef.current);
    setLoadStep(0);
  }

  // ── SYSTEM PROMPTS ──
  const SYSTEM_INDIA = `You are an expert Indian stock market analyst with 20+ years of NSE/BSE experience. Analyse stocks across a strict 10-point framework and return ONLY valid JSON — no markdown, no preamble.

FRAMEWORK:
1. Business Quality & Moat — competitive advantage, pricing power, brand, IP, market leadership
2. Revenue & Earnings Growth — Revenue CAGR >20%, Net Profit CAGR >25%, consistent
3. Balance Sheet Strength — D/E below 0.5x, positive FCF, stable receivables
4. Return Ratios ROE & ROCE — ROE >15%, ROCE >15%, sustained 3+ years
5. Valuation vs Growth PEG — PEG below 1.5, not priced for perfection
6. Promoter Quality — stake >40%, zero pledging, clean SEBI record
7. Sector Tailwind & Macro — PLI, defence, green energy, exports, policy alignment
8. Technical Setup & Volume — price above 50/200 DMA, RSI 45-70, volume on breakout
9. Institutional & Smart Money — MF fresh entry, FII stake, bulk/block deals
10. Risk Control — stop-loss, target, exit thesis, position sizing

SCORING: Each criterion → PASS(1.0) / PARTIAL(0.5) / FAIL(0.0). LT score weights quality criteria 1,3,4,6 more. ST score weights momentum criteria 2,5,8,9 more. Be specific, honest and balanced. Use knowledge up to mid-2026.

CRITICAL: Keep each "analysis" field to 1-2 short sentences. Keep "keyPoints" to max 2 items, each under 10 words. Keep "redFlags" to max 1 item. Keep "finalRecommendation" to 2 sentences. Keep all string values concise. The entire JSON must fit within 6000 tokens.`;

  const SYSTEM_GLOBAL = `You are a world-class global equity and index analyst with 25 years of experience across NYSE, NASDAQ, LSE, XETRA, HKEX, SGX, and major global indices. You analyse assets using a strict 10-point global framework and return ONLY valid JSON — no markdown, no preamble.

GLOBAL 10-POINT FRAMEWORK:
1. Business Moat & Global Competitiveness — brand, network effect, IP, switching costs, regulatory moat at global scale
2. Revenue Growth & Earnings Quality — consistent revenue/EPS growth, quality of earnings, analyst estimate trend
3. Balance Sheet & Capital Allocation — FCF, debt levels, buyback track record, dividend yield/growth, credit rating
4. Return on Equity & Margins — ROE/ROIC vs WACC, gross/operating margin vs global sector peers, 5-year trend
5. Valuation: P/E, EV/EBITDA & Shiller CAPE — absolute and relative valuation, forward P/E, PEG, sector comparison, index CAPE
6. Management Quality & Governance — capital allocation history, insider ownership, ESG score, shareholder returns, scandal-free
7. Macro, Sector Tailwind & Geopolitics — secular theme alignment, geopolitical risk, supply chain, regulatory exposure
8. Technical Setup & Market Breadth — price vs 50/200 DMA, RSI, MACD, for indices: A/D line, % above 200 DMA, VIX, put/call
9. Institutional Flow & Smart Money — ETF inflows, 13F filings, fund positioning, options flow, dark pool
10. Currency Risk & Position Sizing — FX exposure, liquidity depth, correlation, stop-loss, target, max allocation %

For INDICES and ETFs: adapt scoring to macro/breadth metrics rather than single-company fundamentals.

SCORING: PASS=1.0, PARTIAL=0.5, FAIL=0.0 per criterion for LT and ST independently. LT weights quality criteria 1,3,4,6 most. ST weights momentum criteria 2,5,7,8,9 most. Be specific, honest, balanced. Use knowledge up to mid-2026. Keep responses concise. Total JSON must fit within 6000 tokens.`;

  // ── RUN ANALYSIS ──
  async function runAnalysis() {
    const s = stock.trim();
    if (!s) { setError("Please enter a ticker symbol or company name."); return; }
    setError("");

    const isInd = marketFocus === "indian";
    const SYSTEM = isInd ? SYSTEM_INDIA : SYSTEM_GLOBAL;
    const port = parseFloat(portfolio) || null;
    const modeText = mode==="both" ? "both Long Term (1 year+) and Short Term (up to 3 months, 20%+ target)"
                   : mode==="lt"   ? "Long Term (1 year+)"
                                   : "Short Term (up to 3 months, 20%+ target)";

    let userMsg = "";
    if (isInd) {
      userMsg = `Analyse Indian stock: "${s}" for ${modeText}.
${port ? `Investor portfolio: ₹${port.toLocaleString("en-IN")}.` : "Portfolio size not specified."}
Investor risk profile: ${riskProfile}.

Return EXACTLY this JSON (no extra keys, no markdown):
{
  "stockName": "Full company name",
  "symbol": "NSE symbol",
  "sector": "Sector",
  "marketCap": "Large Cap / Mid Cap / Small Cap / Micro Cap",
  "ltScore": <0-10 one decimal>,
  "stScore": <0-10 one decimal>,
  "ltVerdict": "STRONG BUY" or "BUY" or "WATCH" or "AVOID",
  "stVerdict": "STRONG BUY" or "BUY" or "WATCH" or "AVOID",
  "ltSub": "One line LT rationale",
  "stSub": "One line ST rationale",
  "criteria": [
    {
      "num": "01",
      "title": "Business Quality & Moat",
      "ltRating": "PASS" or "PARTIAL" or "FAIL",
      "stRating": "PASS" or "PARTIAL" or "FAIL",
      "analysis": "2 sentences max. Specific facts and clear reasoning only.",
      "keyPoints": ["point 1", "point 2"],
      "redFlags": ["flag 1"] or []
    }
  ],
  "riskCapital": {
    "conservative": { "pct": <number>, "rationale": "one line" },
    "moderate":     { "pct": <number>, "rationale": "one line" },
    "aggressive":   { "pct": <number>, "rationale": "one line" },
    "stopLoss":  "e.g. 7% below entry",
    "stTarget":  "e.g. 22-28% upside in 8-10 weeks",
    "ltHorizon": "e.g. 18-24 months minimum"
  },
  "finalRecommendation": "2 sentences max — balanced verdict with actionable suggestion.",
  "keyRisks": ["risk 1", "risk 2"],
  "catalysts": ["catalyst 1", "catalyst 2"]
}`;
    } else {
      userMsg = `Analyse the global ${assetType}: "${s}" listed on ${exchange} for ${modeText}.
${port ? `Investor portfolio value: ${currency} ${port.toLocaleString()}.` : "Portfolio size not specified."}
Report currency: ${currency}.
Asset type: ${assetType}.

Return EXACTLY this JSON (no extra keys, no markdown):
{
  "assetName": "Full official name",
  "ticker": "Ticker symbol",
  "exchange": "${exchange}",
  "assetType": "${assetType}",
  "sector": "Sector or index category",
  "marketCap": "Mega/Large/Mid/Small Cap or Index",
  "currency": "${currency}",
  "currentPriceNote": "Approximate price level or range as of mid-2026 (e.g. ~$185, ~22,000 pts)",
  "ltScore": <0.0-10.0>,
  "stScore": <0.0-10.0>,
  "ltVerdict": "STRONG BUY|BUY|WATCH|NEUTRAL|AVOID|STRONG AVOID",
  "stVerdict": "STRONG BUY|BUY|WATCH|NEUTRAL|AVOID|STRONG AVOID",
  "ltSub": "One line LT rationale",
  "stSub": "One line ST rationale",
  "criteria": [
    {
      "num": "01",
      "title": "Business Moat & Global Competitiveness",
      "ltRating": "PASS|PARTIAL|FAIL",
      "stRating": "PASS|PARTIAL|FAIL",
      "analysis": "1-2 sentences. Specific facts about this asset.",
      "keyPoints": ["max 2 points, under 10 words each"],
      "redFlags": ["max 1 flag or empty array"]
    }
  ],
  "globalContext": {
    "peersComparison": "1 sentence vs global sector peers",
    "indexBenchmark": "Performance vs relevant benchmark index",
    "analystConsensus": "consensus rating and average price target"
  },
  "riskCapital": {
    "conservative": { "pct": <number>, "rationale": "one line" },
    "moderate":     { "pct": <number>, "rationale": "one line" },
    "aggressive":   { "pct": <number>, "rationale": "one line" },
    "stopLoss":  "e.g. 7-8% below entry",
    "stTarget":  "e.g. 18-25% upside in 6-10 weeks",
    "ltHorizon": "e.g. 2-3 years minimum",
    "keyRisk":   "Single biggest risk in one sentence"
  },
  "finalRecommendation": "2-3 sentences: balanced recommendation.",
  "keyRisks": ["risk 1", "risk 2"],
  "catalysts": ["catalyst 1", "catalyst 2"]
}`;
    }

    // 1. Handle Demo / Mock Mode
    if (provider === "demo") {
      startLoading();
      await new Promise(resolve => setTimeout(resolve, 3500));
      try {
        const mockData = getMockAnalysis(s, marketFocus, mode, port, riskProfile, exchange, assetType, currency);
        stopLoading();
        setResult(mockData);
        setPhase("results");
        setHistory(h => [{
          assetName: mockData.stockName || mockData.assetName,
          ticker: mockData.symbol || mockData.ticker,
          exchange: isInd ? "NSE" : exchange,
          assetType: isInd ? "stock" : assetType,
          mode,
          ltScore: mockData.ltScore,
          stScore: mockData.stScore,
          ltVerdict: mockData.ltVerdict,
          stVerdict: mockData.stVerdict,
          date: new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"}),
          timestamp: Date.now(),
          result: mockData,
          portfolio: port,
          currency: isInd ? "INR" : currency,
          riskProfile
        }, ...h]);
      } catch (e) {
        stopLoading();
        setPhase("input");
        setError("Analysis failed: " + e.message);
      }
      return;
    }

    // 2. Handle API mode setup
    startLoading();

    try {
      let parsed = null;
      
      if (provider === "anthropic") {
        if (!anthropicKey) {
          throw new Error("Anthropic API Key is missing. Add it in 'AI Engine Config' above.");
        }
        
        const response = await fetch("/api/anthropic/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "x-api-key": anthropicKey
          },
          body: JSON.stringify({
            model: anthropicModel,
            max_tokens: 4000,
            system: SYSTEM,
            messages: [{ role:"user", content: userMsg }]
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(()=>({}));
          throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let text = (data.content||[]).map(b=>b.text||"").join("");
        text = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
        parsed = repairJSON(text);

      } else if (provider === "gemini") {
        if (!geminiKey) {
          throw new Error("Gemini API Key is missing. Add it in 'AI Engine Config' above.");
        }

        const response = await fetch(`/api/gemini/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${SYSTEM}\n\nUser Message:\n${userMsg}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2
            }
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(()=>({}));
          throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        text = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
        parsed = repairJSON(text);

      } else if (provider === "openai") {
        if (!openaiKey) {
          throw new Error("OpenAI API Key is missing. Add it in 'AI Engine Config' above.");
        }

        const response = await fetch("/api/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: userMsg }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(()=>({}));
          throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
        text = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
        parsed = repairJSON(text);

      } else if (provider === "openrouter") {
        if (!openrouterKey) {
          throw new Error("OpenRouter API Key is missing. Add it in 'AI Engine Config' above.");
        }

        const response = await fetch("/api/openrouter/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`,
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Stock Scanner"
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: userMsg }
            ],
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(()=>({}));
          throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
        text = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
        parsed = repairJSON(text);

      } else if (provider === "kimi") {
        if (!kimiKey) {
          throw new Error("Kimi API Key is missing. Add it in 'AI Engine Config' above.");
        }

        const response = await fetch("/api/kimi/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${kimiKey}`
          },
          body: JSON.stringify({
            model: kimiModel,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: userMsg }
            ],
            temperature: 0.3
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(()=>({}));
          throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
        text = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
        parsed = repairJSON(text);

      } else if (provider === "glm") {
        if (!glmKey) {
          throw new Error("GLM API Key is missing. Add it in 'AI Engine Config' above.");
        }

        const response = await fetch("/api/glm/v4/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${glmKey}`
          },
          body: JSON.stringify({
            model: glmModel,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: userMsg }
            ],
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(()=>({}));
          throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
        text = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
        parsed = repairJSON(text);

      } else if (provider === "local") {
        const url = `${localEndpoint.replace(/\/$/, '')}/v1/chat/completions`;
        const localHeaders = { "Content-Type": "application/json" };
        if (localKey) {
          localHeaders["Authorization"] = `Bearer ${localKey}`;
        }

        const response = await fetch(url, {
          method: "POST",
          headers: localHeaders,
          body: JSON.stringify({
            model: localModel,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: userMsg }
            ],
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const err = await response.text().catch(()=>"");
          throw new Error(err || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content || "";
        text = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
        parsed = repairJSON(text);
      }

      stopLoading();
      setResult(parsed);
      setPhase("results");

      const entry = {
        assetName: parsed.stockName || parsed.assetName || s.toUpperCase(),
        ticker: parsed.symbol || parsed.ticker || s.toUpperCase(),
        exchange: isInd ? "NSE" : exchange,
        assetType: isInd ? "stock" : assetType,
        mode,
        ltScore: parsed.ltScore,
        stScore: parsed.stScore,
        ltVerdict: parsed.ltVerdict,
        stVerdict: parsed.stVerdict,
        date: new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"}),
        timestamp: Date.now(),
        result: parsed,
        portfolio: port,
        currency: isInd ? "INR" : currency,
        riskProfile
      };
      setHistory(h => [entry, ...h]);

    } catch(err) {
      stopLoading();
      setPhase("input");
      setError("Analysis failed: " + err.message);
    }
  }

  // ── JSON repair: handle truncated responses ──
  function repairJSON(str) {
    try { return JSON.parse(str); } catch(_) {}
    let s = str.replace(/,\s*$/, "");
    const quoteCount = (s.match(/(?<!\\)"/g)||[]).length;
    if (quoteCount % 2 !== 0) s += '"';
    const stack = [];
    for (const ch of s) {
      if (ch==="{") stack.push("}");
      else if (ch==="[") stack.push("]");
      else if (ch==="}"||ch==="]") stack.pop();
    }
    s += stack.reverse().join("");
    try { return JSON.parse(s); } catch(_) {}
    throw new Error("AI response could not be parsed. Please try again.");
  }

  function resetAnalysis() { setPhase("input"); setResult(null); setStock(""); setPortfolio(""); setError(""); }

  async function handleDownloadPDF(entry) {
    if (isPrinting) return;
    setIsPrinting(true);
    setPrintData(entry);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const element = document.getElementById("pdf-print-capture");
      if (!element) {
        throw new Error("Print capture DOM element not found");
      }
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#F5F0E8"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `${(entry.ticker || entry.symbol || "REPORT").toUpperCase()}_Scan_Report_${entry.date || "Download"}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF: " + err.message);
    } finally {
      setPrintData(null);
      setIsPrinting(false);
    }
  }

  const activeFramework = marketFocus === "indian" ? FRAMEWORK_INDIA : FRAMEWORK_GLOBAL;
  const suggestions = marketFocus === "indian" ? SUGGESTIONS_INDIA : (SUGGESTIONS_GLOBAL[exchange] || []);

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",color:C.black,background:C.white,minHeight:"100vh"}}>

      {/* GOOGLE FONTS */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap');
        input,select{font-family:'Space Mono',monospace;}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-track{background:#1a1a1a;} ::-webkit-scrollbar-thumb{background:#F4C430;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>

      {/* HEADER */}
      <div style={{background:C.black,padding:"28px 24px 24px",borderBottom:`4px solid ${C.gold}`}}>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.gold,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>
          ▶ MULTI-MARKET INTELLIGENCE &nbsp;·&nbsp; NSE/BSE & GLOBAL &nbsp;·&nbsp; V3.0
        </div>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:"clamp(36px,8vw,68px)",lineHeight:0.92,color:C.white,letterSpacing:2,marginBottom:12}}>
          STOCK & <span style={{color:C.gold}}>MARKET</span> INTELLIGENCE
        </div>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#888",lineHeight:1.6,maxWidth:560}}>
          Analyze Indian and global assets using specialized 10-point scoring systems. Computes long/short metrics, capital guidance, and options benchmarking.
        </div>

        {/* Global exchange quick-select row (Visible in Global mode) */}
        {marketFocus === "global" && (
          <div style={{display:"flex", gap:8, marginTop:18, flexWrap:"wrap"}}>
            {EXCHANGES.map(ex => (
              <button key={ex.id} onClick={() => { setExchange(ex.id); if (ex.id === "INDEX") setAssetType("index"); else if (assetType === "index") setAssetType("stock"); }}
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700,
                  padding: "5px 11px", border: `2px solid ${exchange === ex.id ? C.gold : "#444"}`,
                  background: exchange === ex.id ? "#1a1a1a" : "transparent",
                  color: exchange === ex.id ? C.gold : "#888", cursor: "pointer",
                  letterSpacing: 1, transition: "all 0.15s", whiteSpace: "nowrap"
                }}>
                {ex.flag} {ex.label}
              </button>
            ))}
          </div>
        )}

        {/* AI CONFIG TOGGLER */}
        <div style={{marginTop:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12}}>
          <button onClick={() => setShowSettings(!showSettings)} style={{
            background: showSettings ? C.gold : "transparent",
            color: showSettings ? C.black : C.white,
            border: `2px solid ${C.gold}`,
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            padding: "6px 14px",
            cursor: "pointer",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            transition: "all 0.15s"
          }}>
            {showSettings ? "✕ Hide Config" : "⚙ AI Engine Config"}
          </button>
          
          <div style={{fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#888"}}>
            Active Engine: <span style={{color: C.gold, fontWeight: 700}}>{provider === "demo" ? "LOCAL SCAN (DEMO)" : provider.toUpperCase()}</span>
          </div>
        </div>

        {/* AI CONFIG DRAWERS */}
        {showSettings && (
          <div style={{
            marginTop: 16,
            background: "#141414",
            border: `2px solid ${C.gold}`,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            textAlign: "left"
          }}>
            <div style={{display: "flex", gap: 12, flexWrap: "wrap"}}>
              {/* Provider Selection */}
              <div style={{flex: "1 1 200px"}}>
                <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>AI Provider</label>
                <select value={provider} onChange={e => setProvider(e.target.value)} style={{
                  width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "8px 10px", outline: "none", cursor: "pointer", fontSize: 11
                }}>
                  <option value="demo">Demo / Mock Mode (Instant Local Scan)</option>
                  <option value="gemini">Google Gemini API</option>
                  <option value="anthropic">Anthropic Claude API</option>
                  <option value="openai">OpenAI API</option>
                  <option value="openrouter">OpenRouter API</option>
                  <option value="kimi">Moonshot Kimi API</option>
                  <option value="glm">Zhipu GLM API</option>
                  <option value="local">Local LLM (Ollama / LM Studio)</option>
                </select>
              </div>

              {/* Model Selection */}
              {provider === "gemini" && (
                <div style={{flex: "1 1 200px"}}>
                  <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>Gemini Model</label>
                  <select value={geminiModel} onChange={e => setGeminiModel(e.target.value)} style={{
                    width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "8px 10px", outline: "none", cursor: "pointer", fontSize: 11
                  }}>
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Recommended)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Economic)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (High intelligence)</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash (Newest & Fast)</option>
                  </select>
                </div>
              )}
              
              {provider === "anthropic" && (
                <div style={{flex: "1 1 200px"}}>
                  <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>Claude Model</label>
                  <select value={anthropicModel} onChange={e => setAnthropicModel(e.target.value)} style={{
                    width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "8px 10px", outline: "none", cursor: "pointer", fontSize: 11
                  }}>
                    <option value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest</option>
                    <option value="claude-3-5-haiku-latest">claude-3-5-haiku-latest</option>
                  </select>
                </div>
              )}

              {provider === "openai" && (
                <div style={{flex: "1 1 200px"}}>
                  <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>OpenAI Model</label>
                  <select value={openaiModel} onChange={e => setOpenaiModel(e.target.value)} style={{
                    width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "8px 10px", outline: "none", cursor: "pointer", fontSize: 11
                  }}>
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                    <option value="gpt-4o">gpt-4o (High Intelligence)</option>
                    <option value="o1-mini">o1-mini (Reasoning Model)</option>
                  </select>
                </div>
              )}

              {provider === "openrouter" && (
                <div style={{flex: "1 1 200px"}}>
                  <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>OpenRouter Model Name</label>
                  <input type="text" value={openrouterModel} onChange={e => { setOpenrouterModel(e.target.value); localStorage.setItem("stock_scanner_openrouter_model", e.target.value); }} style={{
                    width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "9px 10px", outline: "none", fontSize: 11
                  }} placeholder="e.g. meta-llama/llama-3.1-8b-instruct:free" />
                </div>
              )}

              {provider === "kimi" && (
                <div style={{flex: "1 1 200px"}}>
                  <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>Kimi Model</label>
                  <select value={kimiModel} onChange={e => setKimiModel(e.target.value)} style={{
                    width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "8px 10px", outline: "none", cursor: "pointer", fontSize: 11
                  }}>
                    <option value="moonshot-v1-8k">moonshot-v1-8k</option>
                    <option value="moonshot-v1-32k">moonshot-v1-32k</option>
                  </select>
                </div>
              )}

              {provider === "glm" && (
                <div style={{flex: "1 1 200px"}}>
                  <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>GLM Model</label>
                  <select value={glmModel} onChange={e => setGlmModel(e.target.value)} style={{
                    width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "8px 10px", outline: "none", cursor: "pointer", fontSize: 11
                  }}>
                    <option value="glm-4-flash">glm-4-flash (Fast & Free Tier)</option>
                    <option value="glm-4">glm-4 (Premium)</option>
                  </select>
                </div>
              )}

              {provider === "local" && (
                <>
                  <div style={{flex: "1 1 200px"}}>
                    <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>Local Model Name</label>
                    <input type="text" value={localModel} onChange={e => { setLocalModel(e.target.value); localStorage.setItem("stock_scanner_local_model", e.target.value); }} style={{
                      width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "9px 10px", outline: "none", fontSize: 11
                    }} placeholder="e.g. llama3" />
                  </div>
                  <div style={{flex: "1 1 200px"}}>
                    <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>Local API Endpoint URL</label>
                    <input type="text" value={localEndpoint} onChange={e => { setLocalEndpoint(e.target.value); localStorage.setItem("stock_scanner_local_endpoint", e.target.value); }} style={{
                      width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "9px 10px", outline: "none", fontSize: 11
                    }} placeholder="e.g. http://localhost:11434" />
                  </div>
                </>
              )}
            </div>

            {/* API Key Input */}
            {provider !== "demo" && (
              <div>
                <label style={{fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.gold, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1}}>
                  {provider === "gemini" ? "Gemini API Key" : 
                   provider === "anthropic" ? "Anthropic API Key" : 
                   provider === "openai" ? "OpenAI API Key" :
                   provider === "openrouter" ? "OpenRouter API Key" :
                   provider === "kimi" ? "Kimi API Key" :
                   provider === "glm" ? "GLM API Key" :
                   "Local Server Auth Token (Optional)"}
                </label>
                <input 
                  type="password" 
                  value={
                    provider === "gemini" ? geminiKey : 
                    provider === "anthropic" ? anthropicKey : 
                    provider === "openai" ? openaiKey : 
                    provider === "openrouter" ? openrouterKey : 
                    provider === "kimi" ? kimiKey : 
                    provider === "glm" ? glmKey : 
                    localKey
                  } 
                  onChange={e => {
                    const val = e.target.value;
                    if (provider === "gemini") { setGeminiKey(val); localStorage.setItem("stock_scanner_gemini_key", val); }
                    else if (provider === "anthropic") { setAnthropicKey(val); localStorage.setItem("stock_scanner_anthropic_key", val); }
                    else if (provider === "openai") { setOpenaiKey(val); localStorage.setItem("stock_scanner_openai_key", val); }
                    else if (provider === "openrouter") { setOpenrouterKey(val); localStorage.setItem("stock_scanner_openrouter_key", val); }
                    else if (provider === "kimi") { setKimiKey(val); localStorage.setItem("stock_scanner_kimi_key", val); }
                    else if (provider === "glm") { setGlmKey(val); localStorage.setItem("stock_scanner_glm_key", val); }
                    else if (provider === "local") { setLocalKey(val); localStorage.setItem("stock_scanner_local_key", val); }
                  }} 
                  placeholder={
                    provider === "gemini" ? "Enter AIzaSy..." : 
                    provider === "anthropic" ? "Enter sk-ant-..." : 
                    provider === "openai" ? "Enter sk-..." : 
                    provider === "openrouter" ? "Enter sk-or-..." :
                    provider === "kimi" ? "Enter Kimi API Key..." :
                    provider === "glm" ? "Enter GLM API Key..." :
                    "Optional Bearer Token..."
                  } 
                  style={{
                    width: "100%", background: "#222", border: "2px solid #444", color: C.white, padding: "9px 12px", outline: "none", fontSize: 12, letterSpacing: 1.5
                  }} 
                />
                <span style={{fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#666", marginTop: 6, display: "block"}}>
                  {provider === "local" ? 
                    "For local models, direct requests are made to your local endpoint. Make sure Ollama or LM Studio is running and has CORS enabled." :
                    "⚠ Keys are stored locally in your browser cache. All requests are proxied securely through the local node server to avoid CORS blocks."
                  }
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAB NAV */}
      <div style={{display:"flex",borderBottom:`3px solid ${C.black}`,background:C.white,position:"sticky",top:0,zIndex:100}}>
        {[["analyse","AI Analyser"],["history","History"],["framework","Framework"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",padding:"12px 16px",border:"none",borderRight:`2px solid ${C.black}`,flex:1,cursor:"pointer",background:activeTab===id?C.black:C.white,color:activeTab===id?C.gold:C.mid,transition:"all 0.15s"}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"24px 16px 60px"}}>

        {/* ═══ ANALYSER TAB ═══ */}
        {activeTab==="analyse" && (
          <div>
            {/* Market focus selectors */}
            <div style={{display: "flex", border: `3px solid ${C.black}`, marginBottom: 18, background: C.white, boxShadow: shadow}}>
              <button onClick={() => { setMarketFocus("indian"); setExchange("NSE"); setCurrency("INR"); setAssetType("stock"); setStock(""); }} style={{
                flex: 1, padding: "12px 14px", border: "none", borderRight: `3px solid ${C.black}`, cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                background: marketFocus === "indian" ? C.black : C.white, color: marketFocus === "indian" ? C.gold : C.black, transition: "all 0.15s"
              }}>
                🇮🇳 Indian Market Focus (NSE / BSE)
              </button>
              <button onClick={() => { setMarketFocus("global"); setExchange("NASDAQ"); setCurrency("USD"); setAssetType("stock"); setStock(""); }} style={{
                flex: 1, padding: "12px 14px", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                background: marketFocus === "global" ? C.black : C.white, color: marketFocus === "global" ? C.gold : C.black, transition: "all 0.15s"
              }}>
                🌐 Global Markets Focus
              </button>
            </div>

            {/* INPUT */}
            {(phase==="input" || phase==="loading") && (
              <div style={{background:C.black,border,boxShadow:marketFocus === "indian" ? shadowG : shadowB,padding:24,marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:26,color:C.gold,letterSpacing:1,marginBottom:4}}>
                  {marketFocus === "indian" ? "ANALYSE INDIAN STOCKS" : "ANALYSE GLOBAL ASSETS"}
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#666",letterSpacing:1,marginBottom:20}}>
                  {marketFocus === "indian" ? "ENTER NSE/BSE SYMBOL OR COMPANY NAME · SCORED ACROSS 10 INDIAN CRITERIA" : "STOCKS · INDICES · ETFs · SCORED ACROSS 10 GLOBAL CRITERIA"}
                </div>

                {/* Asset type selection (Global focus only) */}
                {marketFocus === "global" && (
                  <div style={{marginBottom: 16}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#777",marginBottom:7}}>Asset Type</div>
                    <div style={{display:"flex",gap:8}}>
                      {ASSET_TYPES.map(at=>(
                        <button key={at.id} onClick={()=>setAssetType(at.id)}
                          style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,
                            padding:"6px 12px",border:`2px solid ${assetType===at.id?C.gold:"#444"}`,
                            background:assetType===at.id?C.gold:"transparent",
                            color:assetType===at.id?C.black:"#888",cursor:"pointer",letterSpacing:1}}>
                          {at.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
                  <div style={{flex:"2 1 200px"}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#777",marginBottom:6}}>
                      {marketFocus === "indian" ? "Stock Symbol / Name" : (assetType === "index" ? "Index Name" : assetType === "etf" ? "ETF Ticker" : "Ticker / Company Name")}
                    </div>
                    <input value={stock} onChange={e=>setStock(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runAnalysis()}
                      placeholder={marketFocus === "indian" ? "e.g. RELIANCE, IREDA, TCS..." : (assetType === "index" ? "e.g. S&P 500, FTSE 100..." : assetType === "etf" ? "e.g. SPY, QQQ..." : "e.g. APPLE, NVDA, HSBC...")} 
                      disabled={phase==="loading"}
                      style={{width:"100%",fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,color:C.white,background:"#1a1a1a",border:`2px solid ${error?"#E03C2F":"#444"}`,padding:"11px 13px",letterSpacing:2,textTransform:"uppercase",outline:"none"}} />
                  </div>
                  <div style={{flex:"1 1 140px"}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#777",marginBottom:6}}>Analysis Mode</div>
                    <select value={mode} onChange={e=>setMode(e.target.value)} disabled={phase==="loading"}
                      style={{width:"100%",fontSize:11,fontWeight:700,color:C.white,background:"#1a1a1a",border:"2px solid #444",padding:"11px 10px",outline:"none",cursor:"pointer"}}>
                      <option value="both">Both: LT + ST</option>
                      <option value="lt">Long Term Only</option>
                      <option value="st">Short Term Only</option>
                    </select>
                  </div>
                  <div style={{flex:"0 0 auto",alignSelf:"flex-end"}}>
                    <button onClick={runAnalysis} disabled={phase==="loading"}
                      style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:2,color:C.black,background:phase==="loading"?"#444":C.gold,border:`2px solid ${phase==="loading"?"#444":C.gold}`,padding:"11px 22px",cursor:phase==="loading"?"not-allowed":"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                      {phase==="loading" ? "ANALYSING..." : "ANALYSE ▶"}
                    </button>
                  </div>
                </div>

                {/* Portfolio row */}
                <div style={{marginTop:6}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#777",marginBottom:6}}>Portfolio Size & Risk Sizing Currency (Optional)</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <input type="number" value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="Total portfolio value" disabled={phase==="loading"}
                      style={{flex:"2 1 180px",fontSize:12,color:C.white,background:"#1a1a1a",border:"2px solid #444",padding:"9px 12px",outline:"none"}} />
                    {marketFocus === "indian" ? (
                      <select disabled style={{flex:"1 1 140px",fontSize:11,color:C.white,background:"#1a1a1a",border:"2px solid #444",padding:"9px 10px",outline:"none",cursor:"not-allowed"}}>
                        <option value="INR">INR (Locked)</option>
                      </select>
                    ) : (
                      <select value={currency} onChange={e=>setCurrency(e.target.value)} disabled={phase==="loading"}
                        style={{flex:"1 1 140px",fontSize:11,color:C.white,background:"#1a1a1a",border:"2px solid #444",padding:"9px 10px",outline:"none",cursor:"pointer"}}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Suggestions badges */}
                {suggestions.length > 0 && (
                  <div style={{marginTop: 16}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#555",marginBottom:8}}>Popular Options</div>
                    <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                      {suggestions.map(s => (
                        <button key={s} onClick={()=>setStock(s)} disabled={phase==="loading"}
                          style={{
                            fontFamily:"'Space Mono',monospace",fontSize:9,padding:"5px 11px",
                            border:"1.5px solid #444",background:"transparent",color:"#888",
                            cursor:"pointer",letterSpacing:0.5,transition:"all 0.15s"
                          }}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
                          onMouseLeave={e=>e.currentTarget.style.borderColor="#444"}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && <div style={{marginTop:14,border:`2px solid ${C.red}`,padding:"10px 14px",fontFamily:"'Space Mono',monospace",fontSize:11,color:C.red,lineHeight:1.6}}>⚠ {error}</div>}
              </div>
            )}

            {/* LOADING */}
            {phase==="loading" && (
              <div style={{background:C.black,border,padding:"32px 24px",textAlign:"center",marginBottom:20}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:42,color:C.gold,letterSpacing:4,animation:"pulse 1.2s ease-in-out infinite"}}>
                  {stock.toUpperCase()}
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#555",marginTop:8,letterSpacing:2}}>
                  {marketFocus === "indian" ? "SCANNING INDIAN MARKET SCENARIOS..." : "SCANNING GLOBAL SCENARIOS..."}
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:18,flexWrap:"wrap"}}>
                  {STEPS.map((s,i)=><LoadingStep key={i} label={s} active={loadStep===i}/>)}
                </div>
              </div>
            )}

            {/* RESULTS */}
            {phase==="results" && result && (
              <div>
                {/* Result header */}
                <div style={{background:C.black,border,boxShadow:shadow,padding:"18px 22px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:36,color:C.gold,letterSpacing:3,lineHeight:1}}>
                        {result.symbol || result.ticker || stock.toUpperCase()}
                      </div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,padding:"4px 10px",border:`1.5px solid ${exCol(result.exchange || exchange)}`,color:exCol(result.exchange || exchange),letterSpacing:1}}>
                        {result.exchange || (marketFocus === "indian" ? "NSE" : exchange)}
                      </div>
                      {result.assetType && result.assetType !== "stock" && (
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,padding:"4px 10px",border:"1.5px solid #555",color:"#888",letterSpacing:1}}>
                          {result.assetType.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#666",marginTop:4,letterSpacing:1}}>
                      {result.stockName || result.assetName} · {result.sector} · {result.marketCap}
                      {result.currentPriceNote && <span> · {result.currentPriceNote}</span>}
                    </div>
                  </div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,padding:"6px 14px",border:`2px solid ${C.gold}`,color:C.gold,letterSpacing:2,textTransform:"uppercase",alignSelf:"center"}}>
                    {mode==="both"?"LT + ST ANALYSIS":mode==="lt"?"LONG TERM ONLY":"SHORT TERM ONLY"}
                  </div>
                </div>

                {/* Score cards */}
                <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                  <ScoreCard label="Long Term Score"  score={result.ltScore} verdict={result.ltVerdict} sub={result.ltSub} colorKey="lt" visible={mode!=="st"} />
                  <ScoreCard label="Short Term Score" score={result.stScore} verdict={result.stVerdict} sub={result.stSub} colorKey="st" visible={mode!=="lt"} />
                </div>

                {/* Global Context Block (Global Focus only) */}
                {marketFocus === "global" && result.globalContext && (
                  <div style={{border:`2px solid ${C.purple}`,boxShadow:`4px 4px 0 ${C.purple}`,padding:"14px 18px",marginBottom:14,background:C.white}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:C.purple,letterSpacing:1,marginBottom:10}}>🌐 GLOBAL CONTEXT INFORMATION</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
                      {result.globalContext.peersComparison && (
                        <div style={{borderLeft:`3px solid ${C.purple}`,paddingLeft:10}}>
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.purple,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>vs Peers</div>
                          <div style={{fontSize:12,color:"#333",lineHeight:1.5}}>{result.globalContext.peersComparison}</div>
                        </div>
                      )}
                      {result.globalContext.indexBenchmark && (
                        <div style={{borderLeft:`3px solid ${C.purple}`,paddingLeft:10}}>
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.purple,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>vs Benchmark</div>
                          <div style={{fontSize:12,color:"#333",lineHeight:1.5}}>{result.globalContext.indexBenchmark}</div>
                        </div>
                      )}
                      {result.globalContext.analystConsensus && (
                        <div style={{borderLeft:`3px solid ${C.purple}`,paddingLeft:10}}>
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.purple,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Analyst consensus</div>
                          <div style={{fontSize:12,color:"#333",lineHeight:1.5}}>{result.globalContext.analystConsensus}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Capital */}
                {result.riskCapital && (
                  <div style={{border:`3px solid ${C.blue}`,boxShadow:`5px 5px 0 ${C.blue}`,padding:20,marginBottom:14,background:C.white}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,color:C.blue,letterSpacing:1,marginBottom:14}}>💰 RISK CAPITAL GUIDANCE</div>
                    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                      <RiskBox label="Conservative" amount={fmt(result.riskCapital.conservative?.pct, parseFloat(portfolio)||null, marketFocus === "indian" ? "INR" : currency)} pct={result.riskCapital.conservative?.pct} rationale={result.riskCapital.conservative?.rationale} borderCol={C.green} />
                      <RiskBox label="Moderate"     amount={fmt(result.riskCapital.moderate?.pct,     parseFloat(portfolio)||null, marketFocus === "indian" ? "INR" : currency)} pct={result.riskCapital.moderate?.pct}     rationale={result.riskCapital.moderate?.rationale}     borderCol={C.gold}  />
                      <RiskBox label="Aggressive"   amount={fmt(result.riskCapital.aggressive?.pct,   parseFloat(portfolio)||null, marketFocus === "indian" ? "INR" : currency)} pct={result.riskCapital.aggressive?.pct}   rationale={result.riskCapital.aggressive?.rationale}   borderCol={C.red}   />
                    </div>
                    <div style={{marginTop:12,fontFamily:"'Space Mono',monospace",fontSize:10,color:"#888",lineHeight:1.7}}>
                      {[result.riskCapital.stopLoss && `Stop-Loss: ${result.riskCapital.stopLoss}`,
                        result.riskCapital.stTarget  && `ST Target: ${result.riskCapital.stTarget}`,
                        result.riskCapital.ltHorizon && `LT Horizon: ${result.riskCapital.ltHorizon}`,
                        result.riskCapital.keyRisk && `Key Risk: ${result.riskCapital.keyRisk}`
                      ].filter(Boolean).join("  ·  ")}
                    </div>
                  </div>
                )}

                {/* Breakdown */}
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:3,textTransform:"uppercase",color:C.mid,borderLeft:`4px solid ${C.gold}`,paddingLeft:10,marginBottom:16,marginTop:20}}>
                  10-Point {marketFocus === "indian" ? "Indian" : "Global"} Criteria Breakdown — tap to expand
                </div>
                {(result.criteria||[]).map((c,i)=><CriterionCard key={i} c={c} mode={mode}/>)}

                {/* Final recommendation */}
                <div style={{background:C.black,border,boxShadow:shadowG,padding:22,marginBottom:16}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:12}}>▶ AI FINAL RECOMMENDATION</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#ccc",lineHeight:1.85}}>{result.finalRecommendation}</div>
                  {result.keyRisks?.length>0 && (
                    <div style={{marginTop:14,fontFamily:"'Space Mono',monospace",fontSize:11,color:C.red,lineHeight:1.7}}>
                      <strong>KEY RISKS:</strong> {result.keyRisks.join(" · ")}
                    </div>
                  )}
                  {result.catalysts?.length>0 && (
                    <div style={{marginTop:8,fontFamily:"'Space Mono',monospace",fontSize:11,color:C.green,lineHeight:1.7}}>
                      <strong>CATALYSTS:</strong> {result.catalysts.join(" · ")}
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div style={{border:"2px solid #ccc",padding:"10px 14px",marginTop:4,fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888",lineHeight:1.7}}>
                  ⚠ DISCLAIMER: AI-generated analysis for educational purposes only. Not financial or investment advice. Always verify with actual records before committing capital.
                </div>

                <div style={{display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap"}}>
                  <button onClick={() => {
                    const activeEntry = {
                      assetName: result.stockName || result.assetName || stock.toUpperCase(),
                      ticker: result.symbol || result.ticker || stock.toUpperCase(),
                      exchange: marketFocus === "indian" ? "NSE" : exchange,
                      assetType: marketFocus === "indian" ? "stock" : assetType,
                      mode,
                      ltScore: result.ltScore,
                      stScore: result.stScore,
                      ltVerdict: result.ltVerdict,
                      stVerdict: result.stVerdict,
                      date: new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"}),
                      result: result,
                      portfolio: portfolio ? parseFloat(portfolio) : null,
                      currency: marketFocus === "indian" ? "INR" : currency,
                      riskProfile
                    };
                    handleDownloadPDF(activeEntry);
                  }}
                  disabled={isPrinting}
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    fontFamily: "'Space Mono',monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    padding: "12px 20px",
                    border,
                    background: C.gold,
                    color: C.black,
                    cursor: isPrinting ? "not-allowed" : "pointer",
                    boxShadow: "3px 3px 0 #0A0A0A",
                    transition: "all 0.15s"
                  }}>
                    {isPrinting ? "⏳ GENERATING PDF..." : "📥 DOWNLOAD PDF REPORT"}
                  </button>

                  <button onClick={resetAnalysis} style={{flex: 1, minWidth: "200px", fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", padding: "12px 20px", border: "2px solid #555", background: "transparent", color: "#888", cursor: "pointer"}}>
                    ↺ ANALYSE ANOTHER STOCK
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY TAB ═══ */}
        {activeTab==="history" && (
          <div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:3,textTransform:"uppercase",color:C.mid,borderLeft:`4px solid ${C.gold}`,paddingLeft:10,marginBottom:20}}>Previously Analysed Stocks</div>
            {history.length===0 ? (
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#888",textAlign:"center",padding:32,border:"2px dashed #ccc",letterSpacing:1}}>No assets analysed yet.<br/>Run your first analysis to see history here.</div>
            ) : history.map((h,i)=>(
              <div key={i} onClick={()=>{setResult(h.result);setMode(h.mode);setPortfolio(h.portfolio?String(h.portfolio):"");setPhase("results");setActiveTab("analyse"); if(h.exchange === "NSE" || h.exchange === "BSE") { setMarketFocus("indian"); } else { setMarketFocus("global"); setExchange(h.exchange); setAssetType(h.assetType); setCurrency(h.currency); }}}
                style={{border:`2px solid ${C.black}`,padding:"13px 15px",marginBottom:10,display:"grid",gridTemplateColumns:"auto 1fr auto auto auto auto",alignItems:"center",gap:12,cursor:"pointer",background:C.white,transition:"all 0.12s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#f0ead9"}
                onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,padding:"3px 8px",border:`1.5px solid ${exCol(h.exchange)}`,color:exCol(h.exchange),letterSpacing:1}}>{h.exchange}</div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,letterSpacing:1}}>{h.ticker}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888"}}>{h.assetName?.slice(0, 30)}</div>
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,padding:"3px 8px",border:`1.5px solid ${h.mode==="lt"?C.green:h.mode==="st"?C.gold:C.blue}`,color:h.mode==="lt"?C.green:h.mode==="st"?C.gold:C.blue,textTransform:"uppercase",letterSpacing:1}}>
                  {h.mode==="both"?"LT+ST":h.mode.toUpperCase()}
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,color:C.mid}}>LT {h.ltScore}/10 · ST {h.stScore}/10</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#999"}}>{h.date}</div>
                <button onClick={(e) => { e.stopPropagation(); handleDownloadPDF(h); }}
                  disabled={isPrinting}
                  title="Download report as PDF"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "4px 8px",
                    border: `1.5px solid ${C.black}`,
                    background: C.gold,
                    color: C.black,
                    cursor: isPrinting ? "not-allowed" : "pointer",
                    boxShadow: "2px 2px 0px #0A0A0A",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translate(-1px, -1px)"; e.currentTarget.style.boxShadow = "3px 3px 0px #0A0A0A"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "2px 2px 0px #0A0A0A"; }}
                >
                  {isPrinting && printData === h ? "⏳..." : "📥 PDF"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ═══ FRAMEWORK TAB ═══ */}
        {activeTab==="framework" && (
          <div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:3,textTransform:"uppercase",color:C.mid,borderLeft:`4px solid ${C.gold}`,paddingLeft:10,marginBottom:20}}>The 10-Point Scoring Framework</div>
            
            {/* Exchange Legend */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
              {Object.entries(regionCol).map(([r,col])=>(
                <div key={r} style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'Space Mono',monospace",fontSize:9,color:col,letterSpacing:1}}>
                  <div style={{width:10,height:10,background:col}}/>
                  {r.toUpperCase()}
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
              {activeFramework.map((f,i)=>{
                const tMap = { lt: C.green, st: C.gold, both: C.blue };
                const tLabel = { lt: "Long Term", st: "Short Term", both: "LT + ST" };
                return (
                  <div key={i} style={{border:`2px solid ${C.black}`,padding:"13px 14px",boxShadow:`2px 2px 0 ${C.black}`,background:C.white}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:C.gold,lineHeight:1}}>{f.num}</div>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,marginBottom:4}}>{f.title}</div>
                    <div style={{fontSize:11,color:C.mid,lineHeight:1.5,marginBottom:8}}>{f.desc}</div>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"2px 6px",border:`1.5px solid ${tMap[f.tag]}`,color:tMap[f.tag],letterSpacing:1,textTransform:"uppercase"}}>
                      {tLabel[f.tag]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div style={{background:C.black,borderTop:`3px solid ${C.gold}`,padding:"16px 24px",fontFamily:"'Space Mono',monospace",fontSize:9,color:"#444",textAlign:"center",letterSpacing:1,lineHeight:1.8}}>
        <span style={{color:C.gold}}>STOCK INTELLIGENCE ENGINE v3.0</span> · UNIFIED INDIAN & GLOBAL MARKETS · CORE AI DEVELOPMENTS<br/>
        NOT REGISTERED INVESTMENT ADVICE · FOR EDUCATIONAL USE ONLY
      </div>

      {/* OFFSCREEN PDF PRINT CAPTURE ELEMENT */}
      {printData && (
        <div id="pdf-print-capture" style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: "800px",
          background: C.white,
          color: C.black,
          padding: "30px",
          boxSizing: "border-box"
        }}>
          {/* Header */}
          <div style={{
            background: C.black,
            padding: "24px",
            borderBottom: `4px solid ${C.gold}`,
            color: C.white,
            marginBottom: "20px",
            boxShadow: "5px 5px 0px #0A0A0A"
          }}>
            <div style={{fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.gold, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6}}>
              ▶ MULTI-MARKET SCAN REPORT · SYSTEM CACHE RECORD
            </div>
            <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 42, lineHeight: 1, letterSpacing: 2, marginBottom: 8}}>
              STOCK & <span style={{color: C.gold}}>MARKET</span> INTELLIGENCE
            </div>
            <div style={{fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#888"}}>
              Date of Scan: {printData.date} · System version v3.0
            </div>
          </div>

          {/* Summary */}
          <div style={{
            background: C.black,
            border: `3px solid ${C.black}`,
            boxShadow: "5px 5px 0px #0A0A0A",
            padding: "16px 20px",
            color: C.white,
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 6}}>
                <span style={{fontFamily: "'Bebas Neue',cursive", fontSize: 32, color: C.gold, letterSpacing: 3, lineHeight: 1}}>
                  {printData.ticker || printData.symbol}
                </span>
                <span style={{fontFamily: "'Space Mono',monospace", fontSize: 9, padding: "4px 10px", border: `1.5px solid ${C.gold}`, color: C.gold, letterSpacing: 1}}>
                  {printData.exchange}
                </span>
                {printData.assetType && printData.assetType !== "stock" && (
                  <span style={{fontFamily: "'Space Mono',monospace", fontSize: 9, padding: "4px 10px", border: "1.5px solid #555", color: "#888", letterSpacing: 1}}>
                    {printData.assetType.toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#aaa"}}>
                {printData.assetName} · {printData.result?.sector} · {printData.result?.marketCap}
                {printData.result?.currentPriceNote && <span> · {printData.result?.currentPriceNote}</span>}
              </div>
            </div>
            <div style={{fontFamily: "'Space Mono',monospace", fontSize: 10, fontWeight: 700, padding: "6px 14px", border: `2px solid ${C.gold}`, color: C.gold, letterSpacing: 2, textTransform: "uppercase"}}>
              {printData.mode === "both" ? "LT + ST ANALYSIS" : printData.mode === "lt" ? "LONG TERM" : "SHORT TERM"}
            </div>
          </div>

          {/* Scores */}
          <div style={{display: "flex", gap: 12, marginBottom: 20}}>
            {printData.mode !== "st" && (
              <div style={{border: `3px solid ${C.black}`, overflow: "hidden", flex: 1, minWidth: 150}}>
                <div style={{padding: "12px 16px", background: "#0d2e1a", borderBottom: `2px solid ${C.green}`, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <span style={{fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, color: C.green, textTransform: "uppercase"}}>Long Term Score</span>
                  <span style={{fontFamily: "'Bebas Neue',cursive", fontSize: 36, color: C.green}}>{printData.ltScore != null ? printData.ltScore.toFixed(1) : "—"}/10</span>
                </div>
                <div style={{padding: "12px 16px", background: C.white}}>
                  <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: verdictColor(printData.ltVerdict), marginBottom: 4}}>{printData.ltVerdict}</div>
                  <div style={{fontFamily: "'Space Mono',monospace", fontSize: 9, color: C.mid, lineHeight: 1.4}}>{printData.result?.ltSub}</div>
                </div>
              </div>
            )}
            {printData.mode !== "lt" && (
              <div style={{border: `3px solid ${C.black}`, overflow: "hidden", flex: 1, minWidth: 150}}>
                <div style={{padding: "12px 16px", background: "#2e2100", borderBottom: `2px solid ${C.gold}`, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <span style={{fontFamily: "'Space Mono',monospace", fontSize: 9, fontWeight: 700, color: C.gold, textTransform: "uppercase"}}>Short Term Score</span>
                  <span style={{fontFamily: "'Bebas Neue',cursive", fontSize: 36, color: C.gold}}>{printData.stScore != null ? printData.stScore.toFixed(1) : "—"}/10</span>
                </div>
                <div style={{padding: "12px 16px", background: C.white}}>
                  <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: verdictColor(printData.stVerdict), marginBottom: 4}}>{printData.stVerdict}</div>
                  <div style={{fontFamily: "'Space Mono',monospace", fontSize: 9, color: C.mid, lineHeight: 1.4}}>{printData.result?.stSub}</div>
                </div>
              </div>
            )}
          </div>

          {/* Global Context Block (Global Focus only) */}
          {printData.exchange !== "NSE" && printData.exchange !== "BSE" && printData.result?.globalContext && (
            <div style={{border: `2px solid ${C.purple}`, padding: "14px 18px", marginBottom: "20px", background: C.white}}>
              <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 16, color: C.purple, letterSpacing: 1, marginBottom: 8}}>🌐 GLOBAL CONTEXT INFORMATION</div>
              <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                {printData.result.globalContext.peersComparison && (
                  <div style={{borderLeft: `3px solid ${C.purple}`, paddingLeft: 10, fontSize: 11}}>
                    <strong>Peers:</strong> {printData.result.globalContext.peersComparison}
                  </div>
                )}
                {printData.result.globalContext.indexBenchmark && (
                  <div style={{borderLeft: `3px solid ${C.purple}`, paddingLeft: 10, fontSize: 11}}>
                    <strong>Benchmark:</strong> {printData.result.globalContext.indexBenchmark}
                  </div>
                )}
                {printData.result.globalContext.analystConsensus && (
                  <div style={{borderLeft: `3px solid ${C.purple}`, paddingLeft: 10, fontSize: 11}}>
                    <strong>Consensus:</strong> {printData.result.globalContext.analystConsensus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk Capital */}
          {printData.result?.riskCapital && (
            <div style={{border: `3px solid ${C.blue}`, padding: "16px", marginBottom: "20px", background: C.white}}>
              <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 18, color: C.blue, letterSpacing: 1, marginBottom: 12}}>💰 RISK CAPITAL GUIDANCE</div>
              <div style={{display: "flex", gap: 10, marginBottom: 12}}>
                <div style={{border: `2px solid ${C.black}`, borderLeft: `5px solid ${C.green}`, padding: 10, flex: 1, background: C.white}}>
                  <div style={{fontFamily: "'Space Mono',monospace", fontSize: 8, color: C.mid, textTransform: "uppercase"}}>Conservative</div>
                  <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 18}}>{fmt(printData.result.riskCapital.conservative?.pct, printData.portfolio, printData.currency)}</div>
                  <div style={{fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#888", marginTop: 2}}>{printData.result.riskCapital.conservative?.rationale}</div>
                </div>
                <div style={{border: `2px solid ${C.black}`, borderLeft: `5px solid ${C.gold}`, padding: 10, flex: 1, background: C.white}}>
                  <div style={{fontFamily: "'Space Mono',monospace", fontSize: 8, color: C.mid, textTransform: "uppercase"}}>Moderate</div>
                  <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 18}}>{fmt(printData.result.riskCapital.moderate?.pct, printData.portfolio, printData.currency)}</div>
                  <div style={{fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#888", marginTop: 2}}>{printData.result.riskCapital.moderate?.rationale}</div>
                </div>
                <div style={{border: `2px solid ${C.black}`, borderLeft: `5px solid ${C.red}`, padding: 10, flex: 1, background: C.white}}>
                  <div style={{fontFamily: "'Space Mono',monospace", fontSize: 8, color: C.mid, textTransform: "uppercase"}}>Aggressive</div>
                  <div style={{fontFamily: "'Bebas Neue',cursive", fontSize: 18}}>{fmt(printData.result.riskCapital.aggressive?.pct, printData.portfolio, printData.currency)}</div>
                  <div style={{fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#888", marginTop: 2}}>{printData.result.riskCapital.aggressive?.rationale}</div>
                </div>
              </div>
              <div style={{fontFamily: "'Space Mono',monospace", fontSize: 9, color: "#777"}}>
                {[
                  printData.result.riskCapital.stopLoss && `Stop-Loss: ${printData.result.riskCapital.stopLoss}`,
                  printData.result.riskCapital.stTarget && `ST Target: ${printData.result.riskCapital.stTarget}`,
                  printData.result.riskCapital.ltHorizon && `LT Horizon: ${printData.result.riskCapital.ltHorizon}`,
                  printData.result.riskCapital.keyRisk && `Key Risk: ${printData.result.riskCapital.keyRisk}`
                ].filter(Boolean).join("  ·  ")}
              </div>
            </div>
          )}

          {/* Criteria Breakdown */}
          <div style={{fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.mid, borderLeft: `4px solid ${C.gold}`, paddingLeft: 10, marginBottom: 12}}>
            10-Point Criteria Breakdown
          </div>
          {(printData.result?.criteria || []).map((c, idx) => {
            const displayR = printData.mode === "lt" ? c.ltRating : printData.mode === "st" ? c.stRating : (c.ltRating === c.stRating ? c.ltRating : "PARTIAL");
            return (
              <div key={idx} style={{border: `2px solid ${C.black}`, marginBottom: 10, background: C.white, padding: "12px 16px"}}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #eaeaea", paddingBottom: 6, marginBottom: 8}}>
                  <div style={{display: "flex", alignItems: "center", gap: 10}}>
                    <span style={{fontFamily: "'Bebas Neue',cursive", fontSize: 20, color: C.gold}}>{c.num}</span>
                    <span style={{fontFamily: "'Bebas Neue',cursive", fontSize: 15}}>{c.title}</span>
                  </div>
                  <div style={{display: "flex", alignItems: "center", gap: 8}}>
                    {printData.mode === "both" && (
                      <span style={{fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#777"}}>
                        LT: {c.ltRating} | ST: {c.stRating}
                      </span>
                    )}
                    <div style={dotStyle(displayR)}>{displayR === "PASS" ? "✓" : displayR === "PARTIAL" ? "~" : "✗"}</div>
                  </div>
                </div>
                <div style={{fontSize: 12, lineHeight: 1.6, color: "#333", marginBottom: 6}}>
                  {c.analysis}
                </div>
                {c.keyPoints?.length > 0 && (
                  <div style={{fontSize: 11, color: C.mid, display: "flex", gap: 12, flexWrap: "wrap"}}>
                    {c.keyPoints.map((kp, kpi) => <span key={kpi} style={{marginRight: 10}}>→ {kp}</span>)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Final recommendation */}
          <div style={{background: C.black, border: `3px solid ${C.black}`, padding: "20px", color: C.white, marginTop: 20}}>
            <div style={{fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: C.gold, marginBottom: 8}}>
              ▶ FINAL RECOMMENDATION
            </div>
            <div style={{fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#ccc", lineHeight: 1.7}}>
              {printData.result?.finalRecommendation}
            </div>
            {printData.result?.keyRisks?.length > 0 && (
              <div style={{marginTop: 10, fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.red}}>
                <strong>RISKS:</strong> {printData.result.keyRisks.join(" · ")}
              </div>
            )}
            {printData.result?.catalysts?.length > 0 && (
              <div style={{marginTop: 6, fontFamily: "'Space Mono',monospace", fontSize: 10, color: C.green}}>
                <strong>CATALYSTS:</strong> {printData.result.catalysts.join(" · ")}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div style={{border: "2px solid #ccc", padding: "10px 14px", marginTop: 20, fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#888", lineHeight: 1.5}}>
            ⚠ DISCLAIMER: AI-generated analysis based on data up to mid-2026. For educational purposes only. Not financial or SEBI-registered investment advice. Always verify with actual records before committing capital.
          </div>
        </div>
      )}
    </div>
  );
}
