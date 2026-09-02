# AI Data Analyst Platform 📊🤖

An autonomous, full-stack **AI Data Analyst Platform** orchestrated with **LangGraph**, powered by **OpenRouter** (`nvidia/nemotron-3.5-lightning:free` with automatic fallback to `google/gemma-4-31b-it:free`), and executed safely inside an isolated **E2B Sandbox** (with local subprocess fallback).

---

## 🌟 Key Features

1. **Multi-Format Tabular Ingestion**:
   - Drag & drop upload for `.csv`, `.xlsx`, `.xls`, `.txt` (delimited), and `.json`.
   - Automatic delimiter detection and data type inference.
   - Extract lightweight schema footprint: row/column counts, memory usage, missing cell counts, and first 5 rows (`df.head()`).
   - One-click sample datasets (*Titanic Survivors*, *Customer Churn*, *Sales & Profit Forecast*).

2. **Multi-Agent Orchestration via LangGraph**:
   - **Data Engineer Agent**: Cleans missing values, removes duplicates, parses dates, normalizes column names, scales and encodes categorical features with `pandas` and `scikit-learn.preprocessing`.
   - **Visualization Agent**: Generates interactive exploratory charts using `plotly.express`, rendered directly in the UI via standalone CDN HTML.
   - **ML Forecaster Agent**: Detects target variables, builds automated preprocessing pipelines (`ColumnTransformer`), trains baseline models (`RandomForest`), evaluates metrics, and appends predictions back onto the dataset.

3. **Secure Sandbox Execution**:
   - Executes generated Python code inside an ephemeral cloud sandbox via **E2B Code Interpreter** (or isolated local sandbox).
   - Mounts the dataset, runs the code, captures `stdout`/`stderr`, and streams output artifacts (`.csv`, `.xlsx`, `.html`).

4. **Modern UI/UX**:
   - Built with Next.js 14 (App Router), React, Tailwind CSS, and Lucide icons.
   - Interactive data tables, Plotly visualization viewer with fullscreen support, generated Python script inspector with copy-to-clipboard, and live execution terminal logs.

---

## 🏗️ Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │           Next.js 14 Web Frontend           │
                               │  - FileUploader    - DataPreview (df.head)   │
                               │  - ActionPanel     - ResultsView (Plotly)    │
                               └──────────────────────┬───────────────────────┘
                                                      │ REST API
                               ┌──────────────────────▼───────────────────────┐
                               │             FastAPI Backend Server           │
                               │  - File Parser & Metadata Footprint Extractor│
                               │  - Session & Artifact Registries             │
                               └──────────────────────┬───────────────────────┘
                                                      │ State Machine
                               ┌──────────────────────▼───────────────────────┐
                               │               LangGraph Router               │
                               │   ┌──────────────────────────────────────┐   │
                               │   │   OpenRouter Multi-Model Factory     │   │
                               │   │   1. nvidia/nemotron-3.5-lightning   │   │
                               │   │   2. google/gemma-4-31b-it (fallback)│   │
                               │   └──────────────────┬───────────────────┘   │
                               │                      │                       │
                               │    ┌─────────────────┼──────────────────┐    │
                               │    ▼                 ▼                  ▼    │
                               │ Data Engineer   Visualization     ML Forecaster
                               │    │                 │                  │    │
                               │    └─────────────────┼──────────────────┘    │
                               │                      ▼                       │
                               │            Code Extractor & AST Validator    │
                               └──────────────────────┬───────────────────────┘
                                                      │ Python Code & Dataset
                               ┌──────────────────────▼───────────────────────┐
                               │         E2B Sandbox / Isolated Runner        │
                               │  - Mount Dataset File                        │
                               │  - Execute Python in Secure Environment      │
                               │  - Capture stdout, stderr, & Output Artifacts│
                               └──────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# (Optional) Create & activate virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows
source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and configure OpenRouter/E2B keys
cp .env.example .env

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🧪 Running Tests

Run the full automated test suite (parser, LangGraph router, code extractor, sandbox execution, and FastAPI endpoints):

```bash
# From the project root
python -m pytest backend/tests/ -v
```

---

## ⚙️ Environment Variables

Create a `.env` file in `backend/.env` with the following:

```env
# OpenRouter Configuration (Primary LLM)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
PRIMARY_MODEL=nvidia/nemotron-3.5-lightning:free
FALLBACK_MODEL=google/gemma-4-31b-it:free

# E2B Sandbox API Key (Optional for cloud execution, fallback available)
E2B_API_KEY=your_e2b_api_key

# Backend Settings
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## 📁 Repository Structure

```
Ai-Assistant/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint (Upload, Action, Artifacts)
│   │   ├── config.py                # Pydantic Settings & environment loader
│   │   ├── parser.py                # Tabular dataset ingestion & schema footprint
│   │   ├── graph/
│   │   │   ├── state.py             # LangGraph state schema (AgentState)
│   │   │   ├── prompts.py           # Specialized prompts for each agent
│   │   │   ├── llm.py               # OpenRouter LLM factory with fallbacks
│   │   │   ├── nodes.py             # Agent nodes & AST code extractor
│   │   │   ├── router.py            # Routing logic
│   │   │   └── workflow.py          # Compiled StateGraph workflow
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic request/response models
│   │   └── sandbox/
│   │       └── runner.py            # E2B Sandbox & isolated local execution runner
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example
│   └── tests/
│       ├── test_api.py              # API endpoint tests
│       ├── test_graph.py            # LangGraph routing & extraction tests
│       ├── test_parser.py           # Tabular parser tests
│       ├── test_sandbox.py          # Sandbox execution tests
│       └── test_e2e_flow.py         # Live OpenRouter integration tests
├── frontend/
│   ├── package.json                 # Next.js 14, Tailwind CSS, Lucide
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Dark theme root layout
│   │   │   ├── page.tsx             # Main dashboard
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Header with real-time status
│   │   │   ├── FileUploader.tsx     # Drag & drop upload with sample datasets
│   │   │   ├── DataPreview.tsx      # Schema footprint & df.head() table
│   │   │   ├── ActionPanel.tsx      # 3 Action cards & refinement prompts
│   │   │   ├── ResultsView.tsx      # Plotly renderer, file downloads, logs
│   │   │   └── CodeViewer.tsx       # Syntax-highlighted code drawer
│   │   └── lib/
│   │       ├── api.ts               # Axios client
│   │       └── types.ts             # TypeScript interfaces
│   └── .env.example
├── .gitignore
└── README.md
```