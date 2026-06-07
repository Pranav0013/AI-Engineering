# AI Engineering

A practical, project-driven curriculum for QA engineers learning to use LLMs as a real testing tool, not a toy.
Each section pairs concept material with reusable prompt assets for testing workflows.

---

## Repository Layout

```text
.
├── LLMBasics/                                   LLM and attention fundamentals
│   ├── attention_interactive.html
│   ├── attention_is_all_you_need.html
│   └── Notes.md
│
├── PromptEngineering/                          Prompt engineering for QA work
│   └── Templates/
│       ├── AntiHallucinationRules.md
│       ├── ApiTestGeneration.md
│       ├── BlankTemplateRicePot.md
│       ├── NegativeTestCases.md
│       ├── RegressionSuite.md
│       ├── RestfulBookerApiTestCases.md
│       ├── RicePot.md
│       ├── RicePotTestCasePrompt.md
│       ├── SecurityTest.md
│       ├── Skill.md
│       ├── TestCaseGenerationPrompt.md
│       └── TestCasesFromProductRequirements.md
│
├── RestAssuredApiTestingFrameWork/             Playwright Python API automation framework
│   ├── framework/                              Fluent API client, request specs, validators, logging
│   ├── tests/                                  pytest API test suites
│   └── test_data/                              JSON payloads and test-case documentation
│
└── BlastFrameWork_Jira_TestPlanner_AI_Agent/   B.L.A.S.T. Jira Test Plan Generator (Production App)
    ├── server/                                 Node.js Express API backend
    ├── src/                                    React frontend with Vite
    ├── tools/                                  Utility scripts (connection verification)
    ├── architecture/                           System design documentation
    ├── package.json                            Dependencies and scripts
    └── vite.config.js                          Vite build configuration
```

---

## LLMBasics

Foundational material on how Large Language Models read text and decide what to output.

- `attention_is_all_you_need.html` explains core Transformer concepts.
- `attention_interactive.html` visualizes self-attention behavior.
- `Notes.md` contains short recap notes.

Open the HTML files locally in any browser. No build step is required.

---

## PromptEngineering

This section turns prompt engineering into a repeatable QA skill.

### Main Templates

- `AntiHallucinationRules.md` gives guardrails so the model uses only provided input.
- `RicePot.md` explains the RICE-POT framework.
- `RicePotTestCasePrompt.md` shows a full structured prompt for test case generation.
- `BlankTemplateRicePot.md` gives a fill-in template for your own use cases.
- `Skill.md` contains prompt-builder guidance for structured QA prompting.

### QA Prompt Files

- `TestCaseGenerationPrompt.md` for basic test case generation.
- `TestCasesFromProductRequirements.md` for PRD-based test coverage.
- `ApiTestGeneration.md` for API-focused test case generation.
- `NegativeTestCases.md` for negative scenario coverage.
- `SecurityTest.md` for security-oriented test ideas.
- `RegressionSuite.md` for regression planning.
- `RestfulBookerApiTestCases.md` as a sample generated output.

---

## RestAssuredApiTestingFrameWork

Enterprise-style API automation framework built with Python, pytest, and Playwright `APIRequestContext`.

### What It Includes

- Rest Assured-like fluent syntax using `given().when().then()`.
- Reusable request specification and response validation helpers.
- Support for `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
- pytest fixtures for API client setup and teardown.
- Configuration through environment variables.
- Structured logging and pytest HTML reporting support.
- Data-driven request payloads in JSON.
- Test-case documentation in Markdown and CSV formats.

### Run The API Tests

```bash
cd RestAssuredApiTestingFrameWork
poetry install
poetry run pytest
```

### Generate HTML Report

```bash
poetry run pytest --html=reports/api-report.html --self-contained-html
```

---

## BlastFrameWork_Jira_TestPlanner_AI_Agent

**B.L.A.S.T. (Build, Learn, Automate, Structure, Test)** — A full-stack production application that generates AI-powered, QA-ready test plans from Jira issues using Groq LLM and Jira API integration.

### Project Overview

This is an end-to-end web application demonstrating real-world integration of:

- **Jira API** for fetching issue context and metadata
- **Groq LLM API** for intelligent test plan generation
- **React frontend** with persistent settings management
- **Node.js backend** serving as an API gateway and orchestrator

**Live Deployment:** https://testingpartner.vercel.app

### What It Does

1. **Accept a Jira issue ID** (e.g., `DOC-3706`)
2. **Fetch issue details** from Jira using email/token authentication
3. **Generate structured test plans** using Groq's LLM with fallback BLAST templates
4. **Produce QA-ready outputs:**
   - Test scenarios and cases with steps
   - Risk assessment and mitigation
   - Automation candidates
   - Entry/exit criteria and scope
   - Downloadable Markdown and JSON formats

### Technology Stack

**Frontend:**

- React 19 with Vite
- Lucide React icons
- localStorage for client-side profile management
- CSS custom styling

**Backend:**

- Node.js (ESM)
- Native HTTP server (no Express)
- Jira REST API v3 integration
- Groq API integration

**DevOps:**

- Vite for build and dev
- Vercel for frontend deployment
- Environment variables for secure credential management

### Key Features

#### 1. **Settings Management**

- **Current Settings Tab:** Edit Jira and Groq credentials in real-time
- **Saved Settings Tab:** Save multiple named profiles (e.g., "Development", "Production")
- **Profile Loading:** Click any saved profile to instantly populate settings
- **Profile Deletion:** Remove outdated profiles with one click
- **Persistence:** All settings stored in browser's localStorage (no server storage)

#### 2. **Multi-User Support**

- Each user/browser maintains independent settings profiles
- No server-side authentication required
- Settings never transmitted to production backend
- Fully client-side encryption of sensitive data

#### 3. **Test Plan Generation**

- Structured output with test scenarios, cases, and risks
- Multiple view tabs: Summary, Test Cases, Risks, Raw JSON
- Download options: Markdown and JSON formats
- Generation mode visibility (native BLAST fallback or Groq-powered)

#### 4. **Connection Testing**

- Real-time verification of Jira and Groq connectivity
- Visual status indicators (Connected / Needs Attention)
- Health check endpoint for deployment verification

### Project Structure

```
BlastFrameWork_Jira_TestPlanner_AI_Agent/
├── server/
│   ├── index.js              Main API server (port 5174)
│   ├── env.js                Environment config & validation
│   ├── jiraClient.js         Jira API wrapper
│   ├── groqClient.js         Groq API wrapper
│   └── testPlanCreator.js    BLAST test plan generator
├── src/
│   ├── App.jsx               Main React component (450+ lines)
│   ├── main.jsx              React entry point
│   └── styles.css            Responsive CSS styling
├── tools/
│   └── verify_connections.mjs  CLI tool for connection verification
├── scripts/
│   └── dev.mjs               Dev server launcher
├── package.json              Dependencies & npm scripts
├── vite.config.js            Vite build configuration
├── .env                       Environment variables (git-ignored)
└── .gitignore                Git ignore rules
```

### Running Locally

#### Prerequisites

- Node.js v23.8.0+
- npm or yarn
- Jira API token and email
- Groq API key

#### Setup

```bash
cd BlastFrameWork_Jira_TestPlanner_AI_Agent

# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env
# Edit .env with your credentials
```

#### Development Mode (Two Terminals)

**Terminal 1 — Backend API:**

```bash
npm run api
# Listens on http://127.0.0.1:5174
```

**Terminal 2 — React Dev Server:**

```bash
npm run react
# Listens on http://localhost:5173
# Proxies /api/* requests to backend
```

Then open: **http://localhost:5173**

#### Production Build

```bash
npm run build          # Build React app to dist/
npm run api           # Serve built app + API
```

Then open: **http://127.0.0.1:5174**

### Environment Variables

Required in `.env`:

```bash
GROQ_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxx"           # Groq API key
JIRA_EMAIL="your-email@company.com"                 # Jira account email
JIRA_TOKEN="ATATT3xFfGF0xxxxxxxxxxxxxxxxxxxxxxxxx" # Jira API token
JIRA_BASE_URL="https://your-domain.atlassian.net"   # Jira instance URL
```

**Optional:**

```bash
API_PORT=5174        # Backend port (default: 5174)
PORT=5174            # Alias for API_PORT
```

### npm Scripts

```bash
npm run dev           # Start both frontend & backend (dev mode)
npm run api           # Start backend API only
npm run react         # Start React dev server with Vite
npm run build         # Build production bundle
npm run preview       # Preview production build locally
npm run verify        # Test Jira/Groq connections
```

### API Endpoints

| Method | Endpoint                | Purpose                             |
| ------ | ----------------------- | ----------------------------------- |
| GET    | `/api/health`           | Health check                        |
| GET    | `/api/config/status`    | Check which env vars are configured |
| POST   | `/api/connections/test` | Test Jira + Groq connectivity       |
| POST   | `/api/test-plan`        | Generate test plan from Jira issue  |

### Deployment

#### Frontend (Vercel)

```bash
vercel deploy --prod
```

- Automatically builds with `npm run build`
- Serves `dist/` directory
- Environment variable: `VITE_API_URL` for backend URL

#### Backend (Render.com or similar)

1. Sign up on https://render.com
2. Create Web Service from GitHub repo
3. Build: `npm install`
4. Start: `npm run api`
5. Add environment variables (GROQ_KEY, JIRA_EMAIL, JIRA_TOKEN, JIRA_BASE_URL)
6. Copy deployed backend URL
7. Set `VITE_API_URL` in Vercel environment variables

### Known Limitations & Future Improvements

- **Groq Fallback:** If Groq API fails, uses native BLAST template (no AI)
- **No Auth:** Settings not synced across devices; stored client-side only
- **Rate Limiting:** Depends on Jira and Groq rate limits
- **Future Enhancements:**
  - Multi-language test plan generation
  - Custom test plan templates
  - Team collaboration & shared profiles
  - Database-backed settings sync
  - Export to Xray, TestRail, Zephyr

### Troubleshooting

**"The React app received HTML instead of API JSON"**

- Start backend with `npm run api` first
- Verify `API_PORT` matches dev server config
- Check CORS headers

**"Groq generation was unavailable"**

- Verify `GROQ_KEY` in `.env`
- Check Groq API quota and rate limits
- Confirm model name (default: `llama-3.3-70b-versatile`)

**"Jira connection failed"**

- Verify `JIRA_TOKEN` and `JIRA_EMAIL`
- Ensure `JIRA_BASE_URL` is correct (e.g., `https://your-domain.atlassian.net`)
- Test with CLI: `npm run verify`

---

## How to Use This Repo

### Learning Path

1. **Start with `LLMBasics/`** if you want to understand how LLM behavior works fundamentally
   - Read `attention_is_all_you_need.html` for Transformer concepts
   - Play with `attention_interactive.html` to visualize attention
   - Review `Notes.md` for quick recaps

2. **Explore `PromptEngineering/Templates/`** to learn structured QA prompting
   - Start with `RicePot.md` for the framework
   - Use `BlankTemplateRicePot.md` as a template for your own prompts
   - Reference specific templates:
     - `TestCaseGenerationPrompt.md` for basic generation
     - `TestCasesFromProductRequirements.md` for PRD-based coverage
     - `ApiTestGeneration.md` for API testing
     - `AntiHallucinationRules.md` to reduce model hallucinations

3. **Build API automation with `RestAssuredApiTestingFrameWork/`**
   - Read the README in that directory
   - Run pytest tests to see fluent API in action
   - Customize request specs and validators for your API

4. **Deploy & extend `BlastFrameWork_Jira_TestPlanner_AI_Agent/`**
   - Clone the project and run locally (`npm install && npm run api` + `npm run react`)
   - Integrate with your own Jira instance
   - Deploy frontend to Vercel and backend to Render/Railway
   - Extend with custom test plan templates
   - Add team collaboration features

### Quick Start Workflows

**Generate test cases quickly:**

1. Copy `PromptEngineering/Templates/RicePotTestCasePrompt.md`
2. Paste into Claude/ChatGPT
3. Replace placeholders with your requirements
4. Get structured test cases

**Automate API tests:**

1. Open `RestAssuredApiTestingFrameWork/`
2. Review `tests/test_valid_api_flows.py`
3. Create new test file with `given().when().then()` syntax
4. Run with `poetry run pytest`

**Generate from Jira in production:**

1. Visit https://testingpartner.vercel.app
2. Fill in Jira credentials and Groq API key
3. Enter Jira issue ID
4. Click "Generate Test Plan"
5. Download Markdown or JSON

## Requirements

- Any modern LLM such as GPT, Claude, Gemini, or DeepSeek (for prompt engineering templates)
- Node.js v23.8+ for the B.L.A.S.T. frontend and backend
- npm or yarn for dependency management
- Python 3.9+ for the API automation framework
- Poetry for installing and running the API automation framework dependencies
- Jira account with API token (for B.L.A.S.T. integration)
- Groq API key (for B.L.A.S.T. test plan generation)

## Previous Chapters & Updates

`a2eb280` - Chapter 01: LLM basics with interactive attention visualizations
`dfe2653` - Chapter 02: Prompt engineering with RICE-POT framework and Selenium project
`current` - Chapter 03: B.L.A.S.T. full-stack Jira test plan generator with React, Node.js, Vite, Vercel deployment, and multi-profile settings management
