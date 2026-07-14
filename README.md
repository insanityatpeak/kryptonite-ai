# Kryptonite — Autonomous AI Workflow Builder & Multi-Agent Orchestrator

<div align="center">

![Next.js 15](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white)
![React Flow](https://img.shields.io/badge/React%20Flow-FF0072?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter%20AI-6366F1?style=for-the-badge&logo=openai&logoColor=white)
![Neon Postgres](https://img.shields.io/badge/Neon%20Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=black)

**A visual, drag-and-drop workflow automation platform engineered to connect autonomous AI agents, multi-channel messaging, and live API triggers.**

[Explore Demo](#-quick-start) • [Architecture](#-system-architecture) • [Node Catalog](#-node-catalog) • [Environment Setup](#-configuration)

</div>

---

## ✨ Why Kryptonite?

Traditional workflow automations (like Zapier or Make) treat API steps as isolated silos. **Kryptonite** transforms workflow execution into a collaborative multi-agent ecosystem:

- 🎨 **Visual Drag-and-Drop Canvas:** Built on **React Flow**, allowing you to visually construct complex multi-branch workflows with customizable triggers, AI models, and action nodes.
- 🤖 **Universal OpenRouter Intelligence:** Run cutting-edge AI models (`Llama 3.3`, `DeepSeek R1`, `Gemma 3`) out of the box using **OpenRouter** — with automatic fallback chains and 100% free tier compatibility.
- 💬 **Live Band.ai Room Coordination:** Every execution involving AI nodes automatically spins up a real-time **Band room**. Agents post prompts, thoughts, and outputs into a shared transcript and dynamically pass context downstream via Handlebars templating (`{{openaiAgent.text}}`).
- ⚡ **Decoupled Client/Server Execution:** Nodes run server-side (`src/app/api/workflows/[id]/nodes/[nodeId]/execute-step`) for maximum security. Long-running multi-agent workflows can seamlessly delegate to a **VPS worker** (`worker/server.ts`) to bypass Vercel serverless function timeouts.
- 🔐 **Enterprise-Grade Auth & Security:** Powered by **Better Auth** with JWT session cookies, credential encryption, and rate-limited API routes.

---

## 🚀 Quick Start

Get your local instance of Kryptonite running in **less than 5 minutes**.

### Prerequisites
- **Node.js** `>= 20.x`
- **PostgreSQL Database** (We recommend [Neon Serverless Postgres](https://neon.tech))
- **OpenRouter API Key** (Get your free key at [openrouter.ai/keys](https://openrouter.ai/keys))

### 1. Clone & Install
```bash
git clone https://github.com/insanityatpeak/kryptonite-ai.git
cd kryptonite-ai
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env.local
```

Fill in the required secrets inside `.env.local`:
```env
DATABASE_URL="postgresql://user:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="your_random_64_character_hex_secret"
BETTER_AUTH_URL="http://localhost:3000"
OPENROUTER_API_KEY="sk-or-v1-YOUR_OPENROUTER_KEY"
```

### 3. Sync Database Schema
Baseline your Postgres database with our Prisma migrations:
```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```

Open your browser to **[http://localhost:3000](http://localhost:3000)**, create an account on `/signup`, and start building workflows!

---

## 🧩 Node Catalog

Kryptonite includes over **30+ native nodes** categorized by domain:

### 🎯 Triggers
| Node | Description |
| :--- | :--- |
| **Manual Trigger** | Execute workflows on demand from the dashboard or API |
| **Schedule / Cron** | Run automated recurring jobs on precise cron schedules (`cron-parser` + `Inngest`) |
| **Webhook Trigger** | Receive incoming JSON payloads from third-party services |
| **Stripe Trigger** | React instantly to subscription updates, invoices, and payments |
| **Google Form Trigger** | Capture submissions dynamically from connected forms |

### 🤖 AI & Autonomous Agents
| Node | Model Provider | Description |
| :--- | :--- | :--- |
| **OpenAI Agent** | OpenRouter (`meta-llama/llama-3.3-8b-instruct:free`) | General reasoning, summarization, and data extraction |
| **Anthropic Agent** | OpenRouter (`deepseek/deepseek-r1:free`) | Deep analytical reasoning and structured chain-of-thought |
| **Gemini Agent** | OpenRouter (`google/gemma-3-27b-it:free`) | High-speed semantic text synthesis and creative drafting |
| **Autonomous Search** | Multi-Tool Agent | Recursively searches knowledge bases and queries external APIs |
| **Gmail Search** | Google OAuth | Searches user mailboxes and extracts key email metadata |

### 📬 Messaging & Social Actions
- **Chat/Community:** Slack, Discord, Telegram, WhatsApp
- **Social Media:** Twitter/X, Instagram, LinkedIn, Notion
- **Notifications:** Resend Email (`@resend/node`), Twilio SMS

### 🛠️ Data Utilities
- **Text Summarizer & Classifier:** NLP operations and sentiment tagging
- **Text Splitter & Vector Store:** Chunk text documents and push embeddings for RAG pipelines
- **HTTP Request:** Universal REST client to call arbitrary external webhooks and APIs

---

## 🏗️ System Architecture

```mermaid
graph TD
    User["Dashboard / API Trigger"] -->|"POST /execute"| VercelRoute["Vercel API Route"]
    VercelRoute -->|"Check WORKER_URL"| Router{"Timeout Bypass?"}
    
    Router -->|"No WORKER_URL"| SelfCall["Local /api/run-workflow"]
    Router -->|"WORKER_URL Configured"| VPSWorker["VPS Long-Running Worker"]
    
    SelfCall --> Runner["Topological Workflow Runner"]
    VPSWorker --> Runner
    
    Runner -->|"Topological Sort"| Levels["Parallel Node Execution"]
    Levels -->|"Step Execution"| NodeAPI["Node Step Executor (/execute-step)"]
    
    NodeAPI --> OpenRouter["OpenRouter AI / LLM Engine"]
    NodeAPI --> BandRoom["Band.ai Shared Room Transcript"]
    NodeAPI --> NeonDB[("Neon Postgres Database")]
```

### Execution Flow Details
1. **Topological Sort:** The runner (`src/lib/run-workflow.ts`) analyzes the React Flow graph to determine node dependencies and groups independent nodes into parallel execution levels.
2. **Context Passing:** Outputs from upstream nodes are merged into a unified state payload. Downstream nodes evaluate Handlebars expressions (`{{nodeId.output}}`) dynamically before executing.
3. **Timeout Mitigation:** For complex multi-agent chains that exceed Vercel's 10s (Hobby) or 300s (Pro) serverless limits, Kryptonite delegates execution to the lightweight `worker/server.ts` standalone service.

---

## ⚙️ Configuration

| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | Connection string for Postgres/Neon | `postgresql://...` |
| `BETTER_AUTH_SECRET` | **Yes** | 32+ char secret for signing JWT sessions | — |
| `BETTER_AUTH_URL` | **Yes** | Base URL of your app | `http://localhost:3000` |
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter key to power AI agent nodes | — |
| `BAND_API_KEY` | Recommended | Band.ai API key for multi-agent rooms | — |
| `BAND_API_BASE_URL` | No | Band API base endpoint | `https://api.band.ai/v1` |
| `RESEND_API_KEY` | Optional | Resend API key for sending workflow emails | — |
| `WORKER_URL` | Optional | VPS worker URL (`http://vps-ip:3001`) | — |
| `INTERNAL_API_SECRET` | Optional | Shared secret between Vercel & VPS worker | — |

---

## 📦 Production Deployment

### Deploy to Vercel
1. Push your repository to GitHub.
2. Import the project into **Vercel**.
3. Add your environment variables (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `OPENROUTER_API_KEY`) under **Project Settings > Environment Variables**.
4. Click **Deploy**.

### Optional: Deploy Long-Running Worker (`worker/`)
If your workflows require multi-minute AI reasoning loops:
```bash
cd worker
npm install
npm run build
npm start
```
Point `WORKER_URL` in Vercel to your deployed worker domain.

---

## 📄 License

This project is licensed under the **MIT License**.
