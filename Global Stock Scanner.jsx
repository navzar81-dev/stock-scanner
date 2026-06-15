import { useState, useRef } from "react";

// ─── COLOUR PALETTE ──────────────────────────────────────────
const C = {
  black:"#0A0A0A", white:"#F0EDE6", gold:"#F4C430", red:"#E03C2F",
  green:"#00C853", blue:"#1A6EFF", purple:"#8B5CF6", cyan:"#00BCD4",
  mid:"#555", grey:"#2A2A2A",
};
const shadow  = "5px 5px 0px #0A0A0A";
const shadowB = "5px 5px 0px #1A6EFF";
const border  = `3px solid ${C.black}`;

// ─── EXCHANGES ───────────────────────────────────────────────
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

// ─── ASSET TYPES ─────────────────────────────────────────────
const ASSET_TYPES = [
  { id:"stock",   label:"Single Stock" },
  { id:"index",   label:"Market Index" },
  { id:"etf",     label:"ETF" },
];

// ─── GLOBAL 10-POINT FRAMEWORK ───────────────────────────────
const FRAMEWORK = [
  { num:"01", title:"Business Moat & Global Competitiveness",  tag:"lt",   desc:"Durable competitive advantage at a global scale — brand, network, IP, switching costs, or regulatory moat." },
  { num:"02", title:"Revenue Growth & Earnings Quality",        tag:"both", desc:"Consistent revenue & EPS growth across cycles. For indices: constituent earnings breadth. Quality of earnings matters more than headline growth." },
  { num:"03", title:"Balance Sheet & Capital Allocation",       tag:"lt",   desc:"Debt levels, FCF generation, buyback track record, dividend history. For indices: aggregate leverage of constituents." },
  { num:"04", title:"Return on Equity & Margins",               tag:"lt",   desc:"ROE/ROIC above cost of capital sustained over 5+ years. Gross/operating margin trajectory vs sector peers globally." },
  { num:"05", title:"Valuation: P/E, EV/EBITDA & Shiller PE",  tag:"both", desc:"Stock: P/E vs sector, EV/EBITDA, PEG. Index: Shiller CAPE vs historical average. Buying at fair or discount value." },
  { num:"06", title:"Management Quality & Governance",          tag:"lt",   desc:"Track record of capital allocation, insider ownership, ESG governance score, shareholder-friendly actions, no major fraud/scandals." },
  { num:"07", title:"Macro, Sector Tailwind & Geopolitics",     tag:"both", desc:"Secular growth themes (AI, clean energy, ageing population, defence). Geopolitical exposure, supply-chain risk, regulatory environment." },
  { num:"08", title:"Technical Setup & Market Breadth",         tag:"st",   desc:"Price vs 50/200 DMA, RSI, MACD. For indices: advance/decline line, % of stocks above 200 DMA, VIX level, put/call ratio." },
  { num:"09", title:"Institutional Flow & Smart Money",         tag:"both", desc:"ETF inflows/outflows, large fund positioning (13F filings for US), hedge fund exposure, options flow, dark pool prints." },
  { num:"10", title:"Currency, Risk & Position Sizing",         tag:"both", desc:"FX risk for non-base-currency investors. Liquidity depth. Correlation to portfolio. Stop-loss, target, max allocation." },
];

// ─── POPULAR SUGGESTIONS ─────────────────────────────────────
const SUGGESTIONS = {
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
  if (v.includes("STRONG BUY")||v.includes("BUY")) return C.green;
  if (v.includes("WATCH")||v.includes("NEUTRAL")) return "#B8860B";
  return C.red;
}
function dotStyle(r) {
  const base={width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",
    justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700};
  if (r==="PASS")    return {...base,background:C.green,color:C.black};
  if (r==="PARTIAL") return {...base,background:C.gold,color:C.black};
  return {...base,background:C.red,color:"#fff"};
}
function repairJSON(str) {
  try { return JSON.parse(str); } catch(_) {}
  let s = str.replace(/,\s*$/, "");
  const quoteCount = (s.match(/(?<!\\)"/g)||[]).length;
  if (quoteCount%2!==0) s+='"';
  const stack=[];
  for(const ch of s){
    if(ch==="{") stack.push("}");
    else if(ch==="[") stack.push("]");
    else if(ch==="}"||ch==="]") stack.pop();
  }
  s+=stack.reverse().join("");
  try { return JSON.parse(s); } catch(_) {}
  throw new Error("AI response could not be parsed. Please try again.");
}

// ─── SUBCOMPONENTS ───────────────────────────────────────────
function SectionLabel({children,mt=24}) {
  return (
    <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:3,textTransform:"uppercase",
      color:C.mid,borderLeft:`4px solid ${C.gold}`,paddingLeft:10,marginBottom:16,marginTop:mt}}>
      {children}
    </div>
  );
}

function ScoreCard({label,score,verdict,sub,col,bgCol,visible}) {
  if(!visible) return null;
  return (
    <div style={{border,boxShadow:shadow,overflow:"hidden",flex:1,minWidth:190}}>
      <div style={{padding:"12px 16px",background:bgCol,borderBottom:`2px solid ${col}`,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,fontWeight:700,
          letterSpacing:2,textTransform:"uppercase",color:col}}>{label}</span>
        <div style={{display:"flex",alignItems:"baseline",gap:4}}>
          <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:50,lineHeight:1,color:col}}>
            {score!=null?score.toFixed(1):"—"}
          </span>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#888"}}>/10</span>
        </div>
      </div>
      <div style={{padding:"13px 16px",background:C.white}}>
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,letterSpacing:1,
          color:verdictColor(verdict),marginBottom:3}}>{verdict||"—"}</div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.mid,lineHeight:1.5}}>{sub||""}</div>
      </div>
    </div>
  );
}

function RiskBox({label,value,pct,note,accentCol}) {
  return (
    <div style={{border:`2px solid ${C.black}`,borderLeft:`5px solid ${accentCol}`,
      padding:"11px 13px",flex:1,minWidth:110,background:C.white}}>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,
        textTransform:"uppercase",color:C.mid,marginBottom:5}}>{label}</div>
      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,letterSpacing:1,
        lineHeight:1,color:C.black}}>{value||"—"}</div>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.mid,marginTop:3}}>{pct}% of portfolio</div>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888",
        marginTop:3,lineHeight:1.4}}>{note||""}</div>
    </div>
  );
}

function CriterionCard({c,mode}) {
  const [open,setOpen]=useState(false);
  const ltR=c.ltRating||"FAIL", stR=c.stRating||"FAIL";
  const displayR=mode==="lt"?ltR:mode==="st"?stR:(ltR===stR?ltR:"PARTIAL");
  return (
    <div style={{border,boxShadow:"3px 3px 0 #0A0A0A",marginBottom:9,
      background:C.white,overflow:"hidden"}}>
      <div onClick={()=>setOpen(!open)} style={{display:"grid",
        gridTemplateColumns:"36px 1fr auto",alignItems:"center",gap:10,
        padding:"13px 15px",cursor:"pointer",
        background:open?C.black:C.white,
        borderBottom:`2px solid ${open?C.gold:"transparent"}`,transition:"background 0.15s"}}>
        <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:26,color:C.gold,lineHeight:1}}>
          {c.num}
        </span>
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:17,letterSpacing:0.5,
            color:open?C.white:C.black}}>{c.title}</div>
          {mode==="both"&&(
            <div style={{display:"flex",gap:8,marginTop:2}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.green}}>LT: {ltR}</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#555"}}>·</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.gold}}>ST: {stR}</span>
            </div>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={dotStyle(displayR)}>
            {displayR==="PASS"?"✓":displayR==="PARTIAL"?"~":"✗"}
          </div>
          <span style={{fontSize:18,fontWeight:"bold",color:open?C.gold:"#888"}}>{open?"−":"+"}</span>
        </div>
      </div>
      {open&&(
        <div style={{padding:16}}>
          <p style={{fontSize:13,lineHeight:1.75,color:"#333",marginBottom:11}}>{c.analysis||""}</p>
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

function LoadingStep({label,active}) {
  return (
    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:1,
      textTransform:"uppercase",padding:"4px 8px",
      border:`1.5px solid ${active?C.gold:"#333"}`,
      color:active?C.gold:"#444",transition:"all 0.3s"}}>
      {label}
    </div>
  );
}

function ExchangeBadge({ex,selected,onClick}) {
  return (
    <button onClick={()=>onClick(ex.id)} style={{
      fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,
      padding:"7px 12px",border:`2px solid ${selected?C.gold:C.black}`,
      background:selected?C.black:C.white,
      color:selected?C.gold:C.black,
      cursor:"pointer",letterSpacing:1,transition:"all 0.15s",
      display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",
    }}>
      <span>{ex.flag}</span><span>{ex.label}</span>
    </button>
  );
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────
const SYSTEM = `You are a world-class global equity and index analyst with 25 years of experience across NYSE, NASDAQ, LSE, XETRA, HKEX, SGX, and major global indices. You analyse assets using a strict 10-point global framework and return ONLY valid JSON — no markdown, no preamble.

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

SCORING: PASS=1.0, PARTIAL=0.5, FAIL=0.0 per criterion for LT and ST independently.
LT weights: criteria 1,3,4,6 most important.
ST weights: criteria 2,5,7,8,9 most important.

VERDICTS: "STRONG BUY", "BUY", "WATCH", "NEUTRAL", "AVOID", "STRONG AVOID"
Be specific, honest, balanced. Use knowledge up to mid-2026. Keep responses concise.`;

// ─── MAIN APP ────────────────────────────────────────────────
export default function GlobalStockScanner() {
  const [activeTab, setActiveTab] = useState("analyse");
  const [assetType, setAssetType] = useState("stock");
  const [exchange,  setExchange]  = useState("NASDAQ");
  const [ticker,    setTicker]    = useState("");
  const [mode,      setMode]      = useState("both");
  const [portfolio, setPortfolio] = useState("");
  const [currency,  setCurrency]  = useState("USD");

  const [phase,     setPhase]     = useState("input");
  const [loadStep,  setLoadStep]  = useState(0);
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState(null);
  const [history,   setHistory]   = useState([]);

  const timerRef = useRef(null);

  const STEPS = ["Moat","Earnings","Balance Sheet","ROE/Margins",
    "Valuation","Governance","Macro","Technicals","Smart Money","Risk"];

  const CURRENCIES = ["USD","GBP","EUR","HKD","SGD","JPY","AUD","INR"];

  const suggestions = SUGGESTIONS[exchange] || [];

  function startLoading() {
    setPhase("loading"); setError("");
    let s=0;
    timerRef.current=setInterval(()=>{ setLoadStep(s); s=(s+1)%10; },420);
  }
  function stopLoading() { clearInterval(timerRef.current); setLoadStep(0); }

  async function runAnalysis() {
    const t = ticker.trim();
    if (!t) { setError("Please enter a ticker symbol or name."); return; }
    setError("");
    startLoading();

    const port = parseFloat(portfolio)||null;
    const modeText = mode==="both"?"both Long Term (1 year+) and Short Term (up to 3 months, 20%+ target)"
                   : mode==="lt"  ?"Long Term (1 year+ multi-bagger)"
                                  :"Short Term (up to 3 months, 20%+ target)";
    const exObj = EXCHANGES.find(e=>e.id===exchange)||{};
    const assetLabel = assetType==="index"?"market index":assetType==="etf"?"ETF":"stock";

    const userMsg = `Analyse the global ${assetLabel}: "${t}" listed on ${exchange} (${exObj.region||"Global"}) for ${modeText}.
${port?`Investor portfolio value: ${currency} ${port.toLocaleString()}.`:"Portfolio size not specified."}
Report currency: ${currency}.
Asset type: ${assetType}.

Return EXACTLY this JSON (concise — total under 5000 tokens, no markdown):
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
    "analystConsensus": "e.g. Buy / Hold / Sell consensus and avg price target if known"
  },
  "riskCapital": {
    "conservative": { "pct": <2-5>, "rationale": "one line" },
    "moderate":     { "pct": <5-10>, "rationale": "one line" },
    "aggressive":   { "pct": <10-15>, "rationale": "one line" },
    "stopLoss":  "e.g. 7-8% below entry",
    "stTarget":  "e.g. 18-25% upside in 6-10 weeks",
    "ltHorizon": "e.g. 2-3 years minimum",
    "keyRisk":   "Single biggest risk in one sentence"
  },
  "finalRecommendation": "2-3 sentences: balanced verdict, key risk, actionable suggestion.",
  "keyRisks": ["risk 1", "risk 2"],
  "catalysts": ["catalyst 1", "catalyst 2"]
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:8000,
          system:SYSTEM,
          messages:[{role:"user",content:userMsg}]
        })
      });
      if(!res.ok){
        const e=await res.json().catch(()=>({}));
        throw new Error(e.error?.message||`HTTP ${res.status}`);
      }
      const data=await res.json();
      let text=(data.content||[]).map(b=>b.text||"").join("");
      text=text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const parsed=repairJSON(text);

      stopLoading();
      setResult(parsed);
      setPhase("results");

      setHistory(h=>[{
        assetName:parsed.assetName||t,
        ticker:parsed.ticker||t.toUpperCase(),
        exchange,assetType,mode,
        ltScore:parsed.ltScore,stScore:parsed.stScore,
        ltVerdict:parsed.ltVerdict,stVerdict:parsed.stVerdict,
        date:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"}),
        result:parsed,portfolio:port,currency
      },...h]);

    } catch(err) {
      stopLoading();
      setPhase("input");
      setError("Analysis failed: "+err.message);
    }
  }

  function resetAnalysis(){ setPhase("input");setResult(null);setTicker("");setError(""); }
  function fmtAmount(pct){
    const port=parseFloat(portfolio)||null;
    if(port) return currency+" "+Math.round(port*pct/100).toLocaleString();
    return pct+"% of portfolio";
  }

  // ── REGION COLOURS ──
  const regionCol = { "US":C.blue, "Europe":"#8B5CF6", "Asia":C.cyan, "Global":C.gold };
  function exCol(id){ return regionCol[EXCHANGES.find(e=>e.id===id)?.region||"Global"]||C.gold; }

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",color:C.black,background:C.white,minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&display=swap');
        input,select,button{font-family:'Space Mono',monospace;}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#1a1a1a;}
        ::-webkit-scrollbar-thumb{background:#F4C430;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.25}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{background:C.black,padding:"26px 24px 22px",borderBottom:`4px solid ${C.gold}`}}>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.gold,
          letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>
          ▶ GLOBAL MARKETS &nbsp;·&nbsp; NYSE · NASDAQ · LSE · XETRA · HKEX · SGX &nbsp;·&nbsp; V1.0
        </div>
        <div style={{fontFamily:"'Bebas Neue',cursive",
          fontSize:"clamp(32px,7vw,64px)",lineHeight:0.9,
          color:C.white,letterSpacing:2,marginBottom:12}}>
          GLOBAL <span style={{color:C.gold}}>STOCK &</span><br/>
          <span style={{color:C.cyan}}>INDEX</span> SCANNER
        </div>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#888",
          lineHeight:1.6,maxWidth:580}}>
          AI analysis across NYSE, NASDAQ, LSE, XETRA, HKEX, SGX and major global indices.
          10-point global framework — dual Long Term & Short Term scores with risk capital guidance.
        </div>

        {/* Exchange quick-select row */}
        <div style={{display:"flex",gap:8,marginTop:18,flexWrap:"wrap"}}>
          {EXCHANGES.map(ex=>(
            <button key={ex.id} onClick={()=>{setExchange(ex.id);if(ex.id==="INDEX")setAssetType("index");else if(assetType==="index")setAssetType("stock");}}
              style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,
                padding:"5px 11px",border:`2px solid ${exchange===ex.id?C.gold:"#444"}`,
                background:exchange===ex.id?"#1a1a1a":"transparent",
                color:exchange===ex.id?C.gold:"#888",cursor:"pointer",
                letterSpacing:1,transition:"all 0.15s",whiteSpace:"nowrap"}}>
              {ex.flag} {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",borderBottom:`3px solid ${C.black}`,background:C.white,
        position:"sticky",top:0,zIndex:100,overflowX:"auto"}}>
        {[["analyse","🔍 Analyser"],["history","📋 History"],["framework","📐 Framework"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,
              letterSpacing:1,textTransform:"uppercase",padding:"12px 14px",
              border:"none",borderRight:`2px solid ${C.black}`,flex:1,cursor:"pointer",
              background:activeTab===id?C.black:C.white,
              color:activeTab===id?C.gold:C.mid,transition:"all 0.15s",whiteSpace:"nowrap"}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{maxWidth:880,margin:"0 auto",padding:"22px 16px 60px"}}>

        {/* ════ ANALYSER ════ */}
        {activeTab==="analyse"&&(
          <div>
            {/* INPUT PANEL */}
            {(phase==="input"||phase==="loading")&&(
              <div style={{background:C.black,border,boxShadow:shadowB,padding:22,marginBottom:18}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:24,color:C.gold,
                  letterSpacing:1,marginBottom:3}}>ANALYSE A GLOBAL ASSET</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#555",
                  letterSpacing:1,marginBottom:18}}>
                  STOCKS · INDICES · ETFs &nbsp;·&nbsp; AI-SCORED ACROSS 10 GLOBAL CRITERIA
                </div>

                {/* Asset type toggle */}
                <div style={{marginBottom:14}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,
                    textTransform:"uppercase",color:"#777",marginBottom:7}}>Asset Type</div>
                  <div style={{display:"flex",gap:8}}>
                    {ASSET_TYPES.map(at=>(
                      <button key={at.id} onClick={()=>setAssetType(at.id)}
                        style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,
                          padding:"7px 14px",border:`2px solid ${assetType===at.id?C.gold:"#444"}`,
                          background:assetType===at.id?C.gold:"transparent",
                          color:assetType===at.id?C.black:"#888",cursor:"pointer",letterSpacing:1}}>
                        {at.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main input row */}
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
                  <div style={{flex:"2 1 200px"}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,
                      textTransform:"uppercase",color:"#777",marginBottom:6}}>
                      {assetType==="index"?"Index Name":assetType==="etf"?"ETF Ticker":"Ticker / Company Name"}
                    </div>
                    <input value={ticker} onChange={e=>setTicker(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&runAnalysis()}
                      placeholder={assetType==="index"?"e.g. S&P 500, FTSE 100, Nikkei 225...":assetType==="etf"?"e.g. QQQ, SPY, VWRL...":"e.g. APPLE, NVDA, HSBC..."}
                      disabled={phase==="loading"}
                      style={{width:"100%",fontSize:13,fontWeight:700,color:C.white,
                        background:"#1a1a1a",border:`2px solid ${error?"#E03C2F":"#444"}`,
                        padding:"10px 12px",letterSpacing:1.5,textTransform:"uppercase",outline:"none"}} />
                  </div>
                  <div style={{flex:"1 1 120px"}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,
                      textTransform:"uppercase",color:"#777",marginBottom:6}}>Mode</div>
                    <select value={mode} onChange={e=>setMode(e.target.value)} disabled={phase==="loading"}
                      style={{width:"100%",fontSize:11,fontWeight:700,color:C.white,
                        background:"#1a1a1a",border:"2px solid #444",padding:"10px 8px",outline:"none",cursor:"pointer"}}>
                      <option value="both">LT + ST</option>
                      <option value="lt">Long Term</option>
                      <option value="st">Short Term</option>
                    </select>
                  </div>
                  <div style={{flex:"0 0 auto",alignSelf:"flex-end"}}>
                    <button onClick={runAnalysis} disabled={phase==="loading"}
                      style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:2,
                        color:C.black,background:phase==="loading"?"#333":C.gold,
                        border:`2px solid ${phase==="loading"?"#333":C.gold}`,
                        padding:"10px 20px",cursor:phase==="loading"?"not-allowed":"pointer",
                        whiteSpace:"nowrap",transition:"all 0.15s"}}>
                      {phase==="loading"?"SCANNING...":"ANALYSE ▶"}
                    </button>
                  </div>
                </div>

                {/* Portfolio + currency row */}
                <div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,
                    textTransform:"uppercase",color:"#777",marginBottom:6}}>
                    Portfolio Size & Currency (Optional — for capital guidance)
                  </div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <input type="number" value={portfolio} onChange={e=>setPortfolio(e.target.value)}
                      placeholder="Portfolio value e.g. 50000" disabled={phase==="loading"}
                      style={{flex:"2 1 150px",fontSize:12,color:C.white,background:"#1a1a1a",
                        border:"2px solid #444",padding:"8px 12px",outline:"none"}} />
                    <select value={currency} onChange={e=>setCurrency(e.target.value)} disabled={phase==="loading"}
                      style={{flex:"1 1 80px",fontSize:11,color:C.white,background:"#1a1a1a",
                        border:"2px solid #444",padding:"8px 8px",outline:"none",cursor:"pointer"}}>
                      {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Suggestions */}
                {suggestions.length>0&&(
                  <div style={{marginTop:14}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,
                      textTransform:"uppercase",color:"#555",marginBottom:7}}>Popular on {exchange}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {suggestions.map(s=>(
                        <button key={s} onClick={()=>setTicker(s)} disabled={phase==="loading"}
                          style={{fontFamily:"'Space Mono',monospace",fontSize:9,padding:"4px 10px",
                            border:"1.5px solid #444",background:"transparent",color:"#888",
                            cursor:"pointer",letterSpacing:0.5,transition:"all 0.15s"}}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
                          onMouseLeave={e=>e.currentTarget.style.borderColor="#444"}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error&&(
                  <div style={{marginTop:14,border:`2px solid ${C.red}`,padding:"10px 14px",
                    fontFamily:"'Space Mono',monospace",fontSize:11,color:C.red,lineHeight:1.6}}>
                    ⚠ {error}
                  </div>
                )}
              </div>
            )}

            {/* LOADING */}
            {phase==="loading"&&(
              <div style={{background:C.black,border,padding:"30px 22px",
                textAlign:"center",marginBottom:18}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:38,color:C.gold,
                  letterSpacing:4,animation:"pulse 1.2s ease-in-out infinite"}}>
                  {ticker.toUpperCase()}
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#555",
                  marginTop:8,letterSpacing:2}}>
                  GLOBAL INTELLIGENCE SCAN IN PROGRESS...
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:7,marginTop:16,flexWrap:"wrap"}}>
                  {STEPS.map((s,i)=><LoadingStep key={i} label={s} active={loadStep===i}/>)}
                </div>
              </div>
            )}

            {/* RESULTS */}
            {phase==="results"&&result&&(
              <div style={{animation:"slideIn 0.3s ease"}}>

                {/* Result header */}
                <div style={{background:C.black,border,boxShadow:shadow,
                  padding:"16px 20px",marginBottom:12,
                  display:"flex",justifyContent:"space-between",
                  alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:32,
                        color:C.gold,letterSpacing:3,lineHeight:1}}>
                        {result.ticker||ticker.toUpperCase()}
                      </div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,
                        padding:"4px 10px",border:`1.5px solid ${exCol(exchange)}`,
                        color:exCol(exchange),letterSpacing:1}}>
                        {result.exchange||exchange}
                      </div>
                      {result.assetType&&(
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,
                          padding:"4px 10px",border:"1.5px solid #555",color:"#888",letterSpacing:1}}>
                          {result.assetType.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#aaa",lineHeight:1.4}}>
                      {result.assetName}
                    </div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#666",marginTop:3}}>
                      {result.sector} · {result.marketCap}
                      {result.currentPriceNote&&<span> · {result.currentPriceNote}</span>}
                    </div>
                  </div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,
                    padding:"6px 14px",border:`2px solid ${C.gold}`,color:C.gold,
                    letterSpacing:2,textTransform:"uppercase",alignSelf:"center"}}>
                    {mode==="both"?"LT + ST ANALYSIS":mode==="lt"?"LONG TERM":"SHORT TERM"}
                  </div>
                </div>

                {/* Score cards */}
                <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                  <ScoreCard label="Long Term Score"  score={result.ltScore}
                    verdict={result.ltVerdict} sub={result.ltSub}
                    col={C.green} bgCol="#0d2e1a" visible={mode!=="st"} />
                  <ScoreCard label="Short Term Score" score={result.stScore}
                    verdict={result.stVerdict} sub={result.stSub}
                    col={C.gold}  bgCol="#2e2100" visible={mode!=="lt"} />
                </div>

                {/* Global Context strip */}
                {result.globalContext&&(
                  <div style={{border:`2px solid ${C.purple}`,boxShadow:`4px 4px 0 ${C.purple}`,
                    padding:"14px 18px",marginBottom:12,background:C.white}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:C.purple,
                      letterSpacing:1,marginBottom:10}}>🌐 GLOBAL CONTEXT</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
                      {[
                        ["vs Peers",      result.globalContext.peersComparison],
                        ["vs Benchmark",  result.globalContext.indexBenchmark],
                        ["Analyst View",  result.globalContext.analystConsensus],
                      ].map(([k,v])=>v&&(
                        <div key={k} style={{borderLeft:`3px solid ${C.purple}`,paddingLeft:10}}>
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.purple,
                            letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{k}</div>
                          <div style={{fontSize:12,color:"#333",lineHeight:1.5}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Capital */}
                {result.riskCapital&&(
                  <div style={{border:`3px solid ${C.blue}`,boxShadow:`5px 5px 0 ${C.blue}`,
                    padding:18,marginBottom:12,background:C.white}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,color:C.blue,
                      letterSpacing:1,marginBottom:12}}>💰 RISK CAPITAL GUIDANCE</div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
                      <RiskBox label="Conservative" value={fmtAmount(result.riskCapital.conservative?.pct)}
                        pct={result.riskCapital.conservative?.pct} note={result.riskCapital.conservative?.rationale} accentCol={C.green}/>
                      <RiskBox label="Moderate"     value={fmtAmount(result.riskCapital.moderate?.pct)}
                        pct={result.riskCapital.moderate?.pct}     note={result.riskCapital.moderate?.rationale}     accentCol={C.gold}/>
                      <RiskBox label="Aggressive"   value={fmtAmount(result.riskCapital.aggressive?.pct)}
                        pct={result.riskCapital.aggressive?.pct}   note={result.riskCapital.aggressive?.rationale}   accentCol={C.red}/>
                    </div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#777",lineHeight:1.8}}>
                      {[
                        result.riskCapital.stopLoss  && `Stop-Loss: ${result.riskCapital.stopLoss}`,
                        result.riskCapital.stTarget   && `ST Target: ${result.riskCapital.stTarget}`,
                        result.riskCapital.ltHorizon  && `LT Horizon: ${result.riskCapital.ltHorizon}`,
                        result.riskCapital.keyRisk    && `⚠ Key Risk: ${result.riskCapital.keyRisk}`,
                      ].filter(Boolean).join("  ·  ")}
                    </div>
                  </div>
                )}

                {/* Breakdown */}
                <SectionLabel mt={20}>10-Point Global Criteria Breakdown — tap to expand</SectionLabel>
                {(result.criteria||[]).map((c,i)=><CriterionCard key={i} c={c} mode={mode}/>)}

                {/* Final Rec */}
                <div style={{background:C.black,border,boxShadow:`5px 5px 0 ${C.gold}`,
                  padding:20,marginBottom:14}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:3,
                    textTransform:"uppercase",color:C.gold,marginBottom:10}}>▶ AI FINAL RECOMMENDATION</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#ccc",
                    lineHeight:1.85}}>{result.finalRecommendation}</div>
                  {result.keyRisks?.length>0&&(
                    <div style={{marginTop:12,fontFamily:"'Space Mono',monospace",fontSize:11,
                      color:C.red,lineHeight:1.7}}>
                      <strong>RISKS: </strong>{result.keyRisks.join("  ·  ")}
                    </div>
                  )}
                  {result.catalysts?.length>0&&(
                    <div style={{marginTop:7,fontFamily:"'Space Mono',monospace",fontSize:11,
                      color:C.green,lineHeight:1.7}}>
                      <strong>CATALYSTS: </strong>{result.catalysts.join("  ·  ")}
                    </div>
                  )}
                </div>

                <div style={{border:"2px solid #ccc",padding:"10px 14px",
                  fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888",lineHeight:1.7}}>
                  ⚠ DISCLAIMER: AI-generated analysis using training data up to mid-2026. For educational purposes only.
                  Not financial advice. Prices and fundamentals change — always verify with live data before investing.
                </div>

                <button onClick={resetAnalysis}
                  style={{width:"100%",marginTop:12,fontFamily:"'Space Mono',monospace",
                    fontSize:11,letterSpacing:2,textTransform:"uppercase",padding:"12px 20px",
                    border:"2px solid #555",background:"transparent",color:"#888",cursor:"pointer"}}>
                  ↺ ANALYSE ANOTHER ASSET
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ HISTORY ════ */}
        {activeTab==="history"&&(
          <div>
            <SectionLabel mt={0}>Previously Analysed Assets</SectionLabel>
            {history.length===0?(
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#888",
                textAlign:"center",padding:32,border:"2px dashed #ccc",letterSpacing:1}}>
                No assets analysed yet.<br/>Run your first global analysis above.
              </div>
            ):history.map((h,i)=>(
              <div key={i} onClick={()=>{
                  setResult(h.result);setMode(h.mode);
                  setExchange(h.exchange);setAssetType(h.assetType);
                  setCurrency(h.currency||"USD");
                  if(h.portfolio)setPortfolio(String(h.portfolio));
                  setPhase("results");setActiveTab("analyse");
                }}
                style={{border:`2px solid ${C.black}`,padding:"12px 14px",marginBottom:9,
                  display:"grid",gridTemplateColumns:"auto 1fr auto auto auto",
                  alignItems:"center",gap:12,cursor:"pointer",background:C.white,
                  transition:"all 0.12s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#ece6d5"}
                onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,
                  padding:"3px 8px",border:`1.5px solid ${exCol(h.exchange)}`,
                  color:exCol(h.exchange),letterSpacing:1}}>{h.exchange}</div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,letterSpacing:1}}>{h.ticker}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888"}}>{h.assetName?.slice(0,30)}</div>
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,
                  padding:"3px 8px",border:"1.5px solid #aaa",color:"#777",letterSpacing:1}}>
                  {h.mode==="both"?"LT+ST":h.mode.toUpperCase()}
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,color:C.mid}}>
                  LT {h.ltScore}/10 · ST {h.stScore}/10
                </div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#999"}}>{h.date}</div>
              </div>
            ))}
          </div>
        )}

        {/* ════ FRAMEWORK ════ */}
        {activeTab==="framework"&&(
          <div>
            <SectionLabel mt={0}>The 10-Point Global Scoring Framework</SectionLabel>

            {/* Exchange legend */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
              {Object.entries(regionCol).map(([r,col])=>(
                <div key={r} style={{display:"flex",alignItems:"center",gap:6,
                  fontFamily:"'Space Mono',monospace",fontSize:9,color:col,letterSpacing:1}}>
                  <div style={{width:10,height:10,background:col}}/>
                  {r} MARKETS
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:11}}>
              {FRAMEWORK.map((f,i)=>{
                const tagCol=f.tag==="lt"?C.green:f.tag==="st"?C.gold:C.blue;
                const tagLabel=f.tag==="lt"?"Long Term":f.tag==="st"?"Short Term":"LT + ST";
                return(
                  <div key={i} style={{border:`2px solid ${C.black}`,padding:"13px 14px",
                    boxShadow:`2px 2px 0 ${C.black}`,background:C.white}}>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:C.gold,lineHeight:1}}>{f.num}</div>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,marginBottom:4,lineHeight:1.1}}>{f.title}</div>
                    <div style={{fontSize:11,color:C.mid,lineHeight:1.5,marginBottom:8}}>{f.desc}</div>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"2px 7px",
                      border:`1.5px solid ${tagCol}`,color:tagCol,letterSpacing:1,textTransform:"uppercase"}}>
                      {tagLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Index scoring note */}
            <div style={{marginTop:20,border:`2px solid ${C.cyan}`,
              boxShadow:`4px 4px 0 ${C.cyan}`,padding:"16px 18px",background:C.white}}>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:C.cyan,
                letterSpacing:1,marginBottom:10}}>📊 HOW INDICES ARE SCORED DIFFERENTLY</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
                {[
                  ["Criterion 1 — Moat","Replaced by: market concentration, top-10 constituent quality, sector diversity"],
                  ["Criterion 2 — Growth","Replaced by: blended EPS growth of constituents, earnings breadth (% beating estimates)"],
                  ["Criterion 3 — Balance Sheet","Replaced by: aggregate debt-to-equity of index, credit quality of components"],
                  ["Criterion 5 — Valuation","Uses Shiller CAPE ratio vs 20-year average. CAPE >30 = expensive for most indices"],
                  ["Criterion 8 — Technicals","Includes market breadth: % stocks above 200 DMA, A/D line, VIX level, put/call ratio"],
                  ["Criterion 9 — Smart Money","ETF inflow/outflow trends, futures positioning (COT reports), global fund allocation shifts"],
                ].map(([k,v])=>(
                  <div key={k} style={{borderLeft:`3px solid ${C.cyan}`,paddingLeft:10}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.cyan,
                      letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{k}</div>
                    <div style={{fontSize:11,color:"#444",lineHeight:1.5}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div style={{background:C.black,borderTop:`3px solid ${C.gold}`,padding:"14px 22px",
        fontFamily:"'Space Mono',monospace",fontSize:9,color:"#444",
        textAlign:"center",letterSpacing:1,lineHeight:1.8}}>
        <span style={{color:C.gold}}>GLOBAL STOCK & INDEX SCANNER v1.0</span>
        {" "}· AI-POWERED BY CLAUDE · NYSE · NASDAQ · LSE · XETRA · HKEX · SGX<br/>
        NOT FINANCIAL ADVICE · FOR EDUCATIONAL USE ONLY · ALWAYS VERIFY WITH LIVE DATA
      </div>
    </div>
  );
}