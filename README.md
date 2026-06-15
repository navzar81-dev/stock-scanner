# Stock & Market Intelligence Engine (V3.0)

An advanced, neo-brutalist web application designed for professional-grade multi-market equity, index, and ETF analysis. The system combines a unified dual-market analysis engine with multi-provider Large Language Model (LLM) backends, capital risk allocation algorithms, and client-side PDF document generation.

---

## Table of Contents
1. [Features Guide](#features-guide)
2. [Setup & Setup Dependencies](#setup--setup-dependencies)
3. [Local Configuration & Proxies](#local-configuration-&-proxies)
4. [Directory Structure](#directory-structure)
5. [End-to-End User Guide](#end-to-end-user-guide)
6. [API & LLM Integration Guidelines](#api--llm-integration-guidelines)

---

## Features Guide

### 1. Dual Market Focus (Indian vs. Global)
The scanner switches dynamically between two modes, adapting the inputs, framework parameters, and mock responses:
* **Indian Market Focus**:
  * **Exchanges**: Locked to `NSE` and `BSE`.
  * **Currency**: Locked to `INR` (`₹`).
  * **Asset Type**: Locked to `Single Stock`.
  * **Framework**: Uses the 10-Point Indian Quality & Promoter-focused checklist.
* **Global Markets Focus**:
  * **Exchanges**: NYSE, NASDAQ, LSE, XETRA, EURONEXT, HKEX, SGX, TSE, ASX, and INDEX (Index/ETF).
  * **Currency**: Supports USD, GBP, EUR, HKD, SGD, JPY, AUD, and INR.
  * **Asset Types**: Single Stock, Market Index, and ETF.
  * **Framework**: Uses the 10-Point Global Equity & Breadth checklist.

### 2. The 10-Point Scoring Frameworks
Scans evaluate assets across ten criteria. Each metric is graded independently for **Long Term (LT)** and **Short Term (ST)** views as `PASS (1.0)`, `PARTIAL (0.5)`, or `FAIL (0.0)`.

| Metric | Indian Market Focus | Global Markets Focus | Primary Focus Type |
| :--- | :--- | :--- | :--- |
| **01** | Business Quality & Moat | Moat & Global Competitiveness | Long Term (Quality) |
| **02** | Revenue & Earnings Growth | Revenue Growth & Earnings Quality | Long/Short Term (Growth) |
| **03** | Balance Sheet Strength | Balance Sheet & Capital Allocation | Long Term (Quality) |
| **04** | Return Ratios: ROE & ROCE | Return on Equity & Margins | Long Term (Quality) |
| **05** | Valuation vs Growth (PEG) | Valuation: PE, EV/EBITDA & Shiller CAPE | Long/Short Term (Valuation) |
| **06** | Promoter Quality | Management Quality & Governance | Long Term (Quality) |
| **07** | Sector Tailwind & Macro | Macro, Sector Tailwind & Geopolitics | Long/Short Term (Macro) |
| **08** | Technical Setup & Volume | Technical Setup & Market Breadth | Short Term (Momentum) |
| **09** | Institutional & Smart Money | Institutional Flow & Smart Money | Long/Short Term (Flows) |
| **10** | Risk Control & Position Sizing | Currency, Risk & Position Sizing | Long/Short Term (Risk) |

### 3. Multi-Provider AI Configurations
The app includes a collapsible configuration drawer supporting eight operational engine configurations:
* **Demo / Mock Mode**: Instant local simulation with comprehensive preset reports (e.g. `RELIANCE` and `APPLE`) or randomized, hash-seeded dynamic mock evaluations.
* **Google Gemini**: Optimized for Gemini 3.5 Flash (default), Gemini 2.0 Flash, Gemini 1.5 Flash, and Gemini 1.5 Pro.
* **Anthropic Claude**: Supports Claude 3.5 Sonnet and Claude 3.5 Haiku.
* **OpenAI**: Supports GPT-4o, GPT-4o-mini, and reasoning models like o1-mini.
* **OpenRouter**: Integrates with any model available in the OpenRouter library (e.g., Llama 3.1).
* **Moonshot Kimi**: Supports moonshot-v1-8k/32k models.
* **Zhipu GLM**: Supports GLM-4 and GLM-4-flash.
* **Local LLM**: Connects directly to local instances (Ollama or LM Studio) with custom model strings and endpoints.

### 4. Risk-Adjusted Capital Allocator
A financial sizing calculator that dynamically parses portfolio values:
* Computes capital allocations for **Conservative**, **Moderate**, and **Aggressive** risk levels.
* Formats currency amounts matching localized separators (e.g. lakh/crore Indian formatting for `INR`, standard formatting for global currencies).
* Provides specific financial targets: Stop-loss Support, ST target bounds, and LT horizon targets.

### 5. Client-Side PDF Report Generator
Generates high-resolution multi-page PDF reports using `html2canvas` and `jsPDF` completely in-browser:
* Styled in the app's premium neo-brutalist theme.
* Automatically expands all 10 criteria details (which are collapsed by default in the interactive view) to ensure printed summaries are comprehensive.
* Splices the offscreen rendered element across multiple A4 pages dynamically.

### 6. Persistent History Log with 3-Month Retention
* Scans are automatically cached in `localStorage` (`stock_scanner_history`).
* Integrates a 90-day (3-month) data retention sweep on app mount to clean older entries, preventing local storage bloating.
* Exposes a `📥 PDF` button on each history item row for instant PDF exports.

---
<img width="1123" height="573" alt="image" src="https://github.com/user-attachments/assets/a31e8533-43f7-4dca-8cdb-0644cb47a006" />
<img width="1123" height="680" alt="Screenshot 2026-06-15 170809" src="https://github.com/user-attachments/assets/4a78e9dc-b526-401c-9a7d-d814d20b9128" />
<img width="1112" height="552" alt="Screenshot 2026-06-15 170921" src="https://github.com/user-attachments/assets/8e52bdbc-f3ce-4ed2-ae9d-48790040cb3f" />




## Setup & Setup Dependencies

### System Requirements
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher (or pnpm / yarn)

### Dependencies
The dependencies are defined inside `package.json`:
* **Core React**: `react` (^19.x), `react-dom` (^19.x)
* **Vite Tooling**: `vite` (^8.x), `@vitejs/plugin-react` (^6.x)
* **PDF Report Libraries**: `jspdf` (^2.5.x), `html2canvas` (^1.4.x)
* **Linting Utilities**: `eslint` (^10.x), `globals` (^17.x)

### Quick Installation
1. Clone or copy the project files to your directory.
2. Open your terminal in the project directory:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173/`.

### Building for Production
To generate a production-ready, minified bundle:
```bash
npm run build
```
This builds the distribution assets in the `/dist` directory. To test the build locally:
```bash
npm run preview
```

---

## Local Configuration & Proxies

To bypass browser Cross-Origin Resource Sharing (CORS) blocks when communicating with external LLM APIs from the frontend, the Vite development server is configured as a reverse proxy. 

The proxy configurations in `vite.config.js` route requests to `/api/<provider>` to the respective API backends:

```javascript
// vite.config.js snippet
export default defineConfig({
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, '')
      },
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, '')
      },
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, '')
      },
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, '')
      },
      '/api/kimi': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kimi/, '')
      },
      '/api/glm': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/glm/, '')
      }
    }
  }
});
```

---

## Directory Structure

```
stock-scanner/
├── dist/                     # Minified production build output
├── node_modules/             # Node packages
├── public/                   # Static browser assets
├── src/
│   ├── assets/               # Image/font assets
│   ├── App.css               # App-specific css classes
│   ├── index.css             # Base reset layout css
│   ├── main.jsx              # Application entrypoint
│   └── App.jsx               # Central unified application component
├── eslint.config.js          # ESLint code style configurations
├── index.html                # Main entry HTML template
├── package.json              # Dependencies and scripts definitions
└── vite.config.js            # Vite configurations and dev proxy rules
```

---

## End-to-End User Guide

### 1. Accessing the Tool & Navigation
Upon loading, the system lands on the **AI Analyser** tab. You can navigate between **AI Analyser**, **History**, and **Framework** tabs via the top navigation bar.

### 2. Configuring the AI Engine
Before running a scan using real LLMs, click the **⚙ AI Engine Config** button in the header:
1. **Choose Provider**: Select your target LLM (e.g. Gemini, OpenAI, Claude).
2. **Enter API Key**: Paste your private key. Keys are saved locally in `localStorage` and are never uploaded to any backend.
3. **Select Model**: Pick the model version (e.g. `gemini-3.5-flash` for Google, or type a custom OpenRouter identifier).
4. For instant testing without keys, select **Demo / Mock Mode (Instant Local Scan)**.

### 3. Running an Analysis (Indian Focus)
1. Ensure the top toggle is set to **🇮🇳 Indian Market Focus**.
2. Select one of the popular options (like `RELIANCE` or `IREDA`) or type a custom symbol.
3. Choose **Analysis Mode**: `Both: LT + ST`, `Long Term Only`, or `Short Term Only`.
4. (Optional) Input your portfolio value (e.g., `1000000` for ₹10 Lakhs) to calculate customized capital position sizing.
5. Click **ANALYSE ▶**. 
6. The checklist will cycle through the loading animation steps.
7. Review the scorecards, capital risk boxes, criteria cards (click to expand for detailed commentary), final recommendations, risks, and catalysts.

### 4. Running an Analysis (Global Focus)
1. Select the top toggle **🌐 Global Markets Focus**.
2. Select the **Asset Type** (Single Stock, Market Index, or ETF).
3. Select the target global exchange from the quick selector row (e.g. `NASDAQ`, `LSE`).
4. Type the ticker symbol (e.g. `AAPL` or `S&P 500`).
5. Choose your reporting base currency from the currency dropdown.
6. Click **ANALYSE ▶**.
7. In the results view, verify the **Global Context** panel (peers comparison, benchmark alignment, and analyst consensus) along with risk sizing formatted in your selected currency.

### 5. Downloading PDF Reports
* **On Results View**: When an analysis completes, click the `📥 DOWNLOAD PDF REPORT` button at the bottom. The report renders offscreen and triggers a document download in your browser.
* **On History Tab**: Navigate to the History tab. You will see a table of previous scans. Click the `📥 PDF` button on any row to instantly download that report as a PDF.

### 6. Caching & Cashing History logs
Navigate to the **History** tab. Clicking any item card will automatically populate the active analyser, configure the corresponding exchange/currencies, and switch your view back to the Analyser tab to let you review or rerun the scan. Caches are stored locally in your browser and entries older than 3 months are pruned automatically.

---

## API & LLM Integration Guidelines

When adding new LLM API integrations:
1. Ensure that the system prompts (`SYSTEM_INDIA` or `SYSTEM_GLOBAL`) are appended as the base context system instruction.
2. Enforce JSON mode or structural schemas if supported by the provider (e.g. using `response_format: { type: "json_object" }` for OpenAI).
3. Setup the reverse proxy endpoint in `vite.config.js` to bypass CORS.
4. Pass the JSON content through the `repairJSON` helper in `App.jsx` to prevent parsing exceptions from truncated or slightly malformed outputs.
