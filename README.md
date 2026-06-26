# 🎬 LangChain Crash Course — AI Movie Recommendation System

> **Full-stack AI application demonstrating LangChain.js integration with Express and Next.js**
>
> A production-quality learning project that showcases how to orchestrate LLM pipelines using LangChain's composable building blocks — from prompt templates to structured output.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture Overview](#architecture-overview)
- [Backend Architecture (Deep Dive)](#backend-architecture-deep-dive)
  - [Phase 1: Project Setup](#phase-1-project-setup--configuration)
  - [Phase 2: Data Models & Validation with Zod](#phase-2-data-models--validation-schemas)
  - [Phase 3: LangChain Service Layer — The Core](#phase-3-core-business-logic---langchain-service)
  - [Phase 4: API Layer — Routes & Controllers](#phase-4-api-routes--controllers)
- [Frontend Architecture](#frontend-architecture)
  - [UI Primitives](#ui-primitives-shadcnui-components)
  - [Application Components](#application-components)
  - [Pages & Routing](#pages--routing)
- [LangChain Concepts Explained](#langchain-concepts-explained)
- [Data Flow Diagram](#full-data-flow)
- [Environment Configuration](#environment-configuration)
- [Setup & Installation](#setup--installation)
- [API Reference](#api-reference)
- [Commit History](#commit-history)

---

## Project Overview

This project is an educational crash course on **LangChain.js for TypeScript/Node.js developers**. It builds a movie recommendation system where:

1. **User** inputs their mood, genre preference, and a custom prompt
2. **Express backend** receives the request and orchestrates a LangChain pipeline
3. **LLM (OpenAI or Google Gemini)** generates personalized movie recommendations
4. **Structured output** is validated through Zod schemas and returned as typed JSON
5. **Next.js frontend** renders beautiful movie cards with ratings, cast, and personalized reasoning

The entire backend is built around **LangChain Core** concepts: `ChatPromptTemplate`, `LCEL (.pipe())`, `.withStructuredOutput()`, multi-provider model routing, and Zod integration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                        │
│                                                                     │
│  page.tsx ──► RecommendationApp ──► fetchMovies() ──► POST /api    │
│                            │                                        │
│  /showcase ──► ConceptsShowcase (educational page)                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP POST
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express + TypeScript)               │
│                                                                     │
│  index.ts ──► routes ──► controllers ──► langchain.service.ts       │
│                                              │                      │
│  ┌───────────────────────────────────────────┴──────────────┐       │
│  │              LangChain Pipeline                          │       │
│  │                                                          │       │
│  │  ChatPromptTemplate                                      │       │
│  │  ├── system: "You are a movie expert..."                 │       │
│  │  └── human: "User request: {userPrompt}..."              │       │
│  │         │                                                 │       │
│  │         ▼                                                 │       │
│  │  .pipe() ──► ChatOpenAI / ChatGoogle                     │       │
│  │         │                                                 │       │
│  │         ▼                                                 │       │
│  │  .withStructuredOutput(RecommendationsSchema)            │       │
│  │         │                                                 │       │
│  │         ▼                                                 │       │
│  │  { movies: [...] }  ← Validated by Zod                   │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture (Deep Dive)

### Phase 1: Project Setup & Configuration

**Files:** `backend/package.json`, `backend/tsconfig.json`, `backend/.env`

The backend is a **Node.js + TypeScript + Express** application using `tsx` for hot-reloading development.

**Key dependencies:**
| Package | Purpose |
|---------|---------|
| `express` + `cors` | HTTP server framework |
| `@langchain/core` | LangChain primitives (prompts, chains, pipes) |
| `@langchain/openai` | OpenAI model integration |
| `@langchain/google` | Google Gemini model integration |
| `langchain` | Full LangChain suite |
| `zod` | Runtime schema validation |
| `dotenv` | Environment variable management |
| `tsx` + `typescript` | TypeScript dev toolchain |

**TypeScript Configuration Highlights:**
```json
{
  "strict": true,
  "target": "ES2022",
  "module": "commonjs",
  "moduleResolution": "node",
  "esModuleInterop": true,
  "outDir": "./dist"
}
```

---

### Phase 2: Data Models & Validation Schemas

**Files:** `backend/src/schemas/movie.schema.ts`

This is where the **contract between LangChain and the application** is defined. Zod schemas serve two purposes:

1. **Validate AI output** — ensures the LLM returns the exact shape we expect
2. **Guide the model** — `z.string().describe(...)` adds descriptions that LangChain passes as hints to the LLM

```typescript
export const MovieSchema = z.object({
  title: z.string().describe("Movie Title"),           // LangChain seeds this
  year: z.number().describe("Release year"),            // description to the model
  genre: z.array(z.string()).describe("List of genre"), // so it knows what
  cast: z.array(z.string()).describe("Top 3 cast members"), // each field means
  reason: z.string().describe("Why this matches the user's mood and preference"),
  rating: z.number().min(1).max(10).describe("IMDB style rating out of 10"),
});

export const RecommendationsSchema = z.object({
  movies: z.array(MovieSchema).describe("List of recommended movies"),
});

// Type inference — single source of truth
export type Movie = z.infer<typeof MovieSchema>;
export type Recommendation = z.infer<typeof RecommendationsSchema>;
```

**Why this matters:** Without Zod, you'd get raw text from the LLM and need to `JSON.parse()` it — error-prone and unsafe. With `.withStructuredOutput(ZodSchema)`, the model returns **typed, validated JSON** directly.

---

### Phase 3: Core Business Logic — LangChain Service

**Files:** `backend/src/services/langchain.service.ts`

This is the **heart of the backend**. It demonstrates 5 critical LangChain concepts:

#### 3.1 Multi-Provider Model Factory

```typescript
function getChatModel() {
  const provider = process.env.LLM_PROVIDER ?? "openai";

  if (provider === "google") {
    return new ChatGoogle({
      model: "gemini-2.5-flash",
      temperature: 0.3,
    });
  }

  return new ChatOpenAI({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.3,
  });
}
```

**Key insight:** LangChain provides a **unified interface** (`ChatModel`) across providers. Swap from OpenAI to Gemini by changing one env var — same chain code, same invocation pattern.

#### 3.2 ChatPromptTemplate

```typescript
const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a movie recommendation expert.
Return high-quality recommendations based on:
- user's request
- genre
- mood
- count
Every movie should feel intentional.
Do not recommend only the most obvious titles every time.`,
  ],
  [
    "human",
    `User request: {userPrompt}

Preferences:
- Genre: {genre}
- Mood: {mood}
- Number of movies: {count}`,
  ],
]);
```

**Architecture:** `ChatPromptTemplate` is a **reusable prompt factory**. It takes variables at runtime and fills them in dynamically — no string concatenation, no injection risks.

- **System message** → Sets the AI's persona and behavior rules (persistent across all requests)
- **Human message** → The actual user input with `{placeholders}` for dynamic values

#### 3.3 LCEL — LangChain Expression Language (.pipe())

```typescript
const chain = promptTemplate.pipe(model);
```

**LCEL** is the **assembly line** of LangChain. It connects components:

```
Input → Prompt Template (fill variables) → Model (call LLM) → Output
```

Each component implements the `Runnable` interface, so they can be chained with `.pipe()`. This composability is LangChain's superpower.

#### 3.4 Raw Text Response

```typescript
export async function getRecommendations(input: { ... }) {
  const chain = promptTemplate.pipe(model);
  const response = await chain.invoke({ ... });
  return response.text;
}
```

Simple chain → raw text. Useful for streaming or when you don't need structured output.

#### 3.5 Structured Output — The Killer Feature

```typescript
const structuredModel = model.withStructuredOutput(RecommendationsSchema);

export async function getStructuredRecommendations(input: { ... }) {
  const chain = promptTemplate.pipe(structuredModel);
  const result = await chain.invoke({ ... });
  return result; // Already typed as { movies: Movie[] }
}
```

**This is where LangChain truly shines.** `.withStructuredOutput()` binds the Zod schema to the model. The chain:
1. Fills the prompt template with user input
2. Sends it to the LLM with schema instructions
3. The LLM returns JSON that matches the schema
4. LangChain validates and parses it automatically

**No `JSON.parse()`. No manual validation. No runtime errors from malformed AI responses.**

---

### Phase 4: API Routes & Controllers

**Files:** `backend/src/index.ts`, `backend/src/routes/`, `backend/src/controllers/`

The API follows a clean **separation of concerns** pattern:

```
Routes (define endpoints) → Controllers (handle request/response) → Services (business logic) → Schemas (validation)
```

**Entry point (`index.ts`):**
```typescript
const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/recommend", recommendRouter);
```

**Controller (`recommended.controller.ts`):**
```typescript
export async function recommendedMovies(req: Request, res: Response) {
  try {
    const { userPrompt, genre, mood, count } = req.body;
    const result = await getStructuredRecommendations({ userPrompt, genre, mood, count: Number(count) });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Something goes wrong" });
  }
}
```

---

## Frontend Architecture

### UI Primitives (shadcn/ui Components)

**Files:** `frontend/src/components/ui/`

Pre-built, accessible, unstyled components from shadcn/ui:
- **Button** — Variants (default, outline, ghost) with size options
- **Card** — Container with header, content, footer sections
- **Badge** — Inline status/tag indicators with variant support
- **Input, Select, Textarea, Label** — Form controls
- **Skeleton** — Loading placeholder animation

Utility: `cn()` function combining `clsx` + `tailwind-merge` for clean conditional classes.

### Application Components

**`MovieCard`** — Renders a single recommendation with:
- Colorful gradient accent bar (5 alternating themes)
- Rating badge (star icon + numeric value)
- Genre badges with color coding
- Cast members display
- "Why this matches you" reasoning section with gradient container

**`MovieCardSkeleton`** — Animated placeholder shown while loading

**`RecommendationApp`** — Main interactive component:
- Form with: text prompt (Textarea), genre Select, mood Select, count Select
- Submit button with loading spinner
- States: **empty** (onboarding message), **loading** (skeleton grid), **error** (red banner), **success** (movie cards), **no results** (amber message)

**`ConceptsShowcase`** — Educational page with 9 LangChain concept cards organized by section:
1. **Foundation:** What is LangChain?, Core Building Blocks
2. **Models:** OpenAI + Gemini Integration
3. **Prompts:** Prompt Template, System Message, Human Message
4. **Chains:** LCEL (.pipe()), .invoke()
5. **Output:** Structured Output + Zod
- Includes full architecture flow diagram

### Pages & Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `RecommendationApp` | Main app — search and view movie recommendations |
| `/showcase` | `ConceptsShowcase` | Educational page explaining LangChain concepts |

---

## LangChain Concepts Explained

| # | Concept | Location | What it demonstrates |
|---|---------|----------|---------------------|
| 1 | **ChatPromptTemplate** | `langchain.service.ts:28-55` | Reusable prompt with `{variables}` — fill-in-the-blank for AI instructions |
| 2 | **System Message** | `langchain.service.ts:31-43` | Sets persona/rules sent on every request before user input |
| 3 | **Human Message** | `langchain.service.ts:46-54` | User's request with dynamic placeholders replaced at runtime |
| 4 | **LCEL (.pipe())** | `langchain.service.ts:65, 91` | Assembly-line chaining: Prompt → Model → Output |
| 5 | **.invoke()** | `langchain.service.ts:69, 93` | Run chain synchronously with one input → one output |
| 6 | **Multi-Provider Model** | `langchain.service.ts:8-24` | Swap OpenAI ↔ Gemini via env variable, same chain code |
| 7 | **.withStructuredOutput()** | `langchain.service.ts:83` | Bind Zod schema to model for validated, typed JSON output |
| 8 | **Zod Integration** | `movie.schema.ts` | `.describe()` feeds field hints to the model for accurate structured output |
| 9 | **Type Inference** | `movie.schema.ts:23-25` | `z.infer<typeof Schema>` keeps frontend/backend types in sync |

---

## Full Data Flow

```
User clicks "Get recommendations"
  │
  ▼
Next.js RecommendationApp
  ├── Reads: prompt, genre, mood, count
  └── Calls: fetchMovies({ userPrompt, genre, mood, count })
        │
        ▼  HTTP POST
  Backend: POST /api/recommend
        │
        ▼
  Express Router
        │
        ▼
  recommendedMovies Controller
        │
        ▼
  langchain.service.ts :: getStructuredRecommendations()
        │
        ├── Fills ChatPromptTemplate with user input
        │     ├── system: "You are a movie expert..."
        │     └── human: "User request: {userPrompt}..."
        │
        ├── .pipe() → ChatOpenAI or ChatGoogle
        │     └── temperature: 0.3 (consistent output)
        │
        ├── .withStructuredOutput(RecommendationsSchema)
        │     └── Zod validates output structure
        │
        └── Returns: { movies: Movie[] }  (typed JSON)
              │
              ▼
        Express sends JSON response
              │
              ▼
  Frontend receives data.movies
        │
        ▼
  Maps movies[] → MovieCard components
        └── Each card shows: title, year, genre badges,
              cast, rating, personalized reason
```

---

## Environment Configuration

### Backend (`.env`)

```env
# LLM Provider: "openai" (default) or "google"
LLM_PROVIDER=openai

# OpenAI Configuration (required if LLM_PROVIDER=openai)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Google Gemini Configuration (required if LLM_PROVIDER=google)
GOOGLE_API_KEY=your-google-api-key

# Server
PORT=8000
```

### Frontend (`.env`)

```env
# Backend API URL (default: http://localhost:8000)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Setup & Installation

### Prerequisites
- **Node.js** >= 18
- An **OpenAI API key** OR **Google Gemini API key**

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start development server (with hot reload)
npm run dev

# Server runs on http://localhost:8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# App runs on http://localhost:3000
```

---

## API Reference

### `POST /api/recommend`

Get AI-powered movie recommendations.

**Request Body:**
```json
{
  "userPrompt": "Suggest movies for a rainy night",
  "genre": "thriller",
  "mood": "relaxed",
  "count": 3
}
```

**Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `userPrompt` | string | "Suggest movies for a rainy night" | Custom prompt describing what the user wants |
| `genre` | string | "thriller" | Preferred genre |
| `mood` | string | "relaxed" | Current mood |
| `count` | number | 2 | Number of recommendations (max 10) |

**Response (200):**
```json
{
  "movies": [
    {
      "title": "The Batman",
      "year": 2022,
      "genre": ["crime", "thriller", "mystery"],
      "cast": ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
      "reason": "Dark, atmospheric noir mystery that matches a cozy rainy night vibe",
      "rating": 8.3
    }
  ]
}
```

**Response (500):**
```json
{
  "error": "Something goes wrong"
}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Commit History

The project was built in **10 logical phases** with sequential commits to demonstrate a natural development flow:

| # | Phase | Commit Message | Files |
|---|-------|----------------|-------|
| 1 | 🏗️ Project Setup | `chore: initialize project with backend and frontend scaffolding` | package.json, tsconfig, .env, next.config |
| 2 | 📐 Data Models | `feat: define Zod validation schemas and shared TypeScript types` | movie.schema.ts, types/movie.ts |
| 3 | ⚙️ LangChain Service | `feat: implement LangChain orchestration layer with multi-provider support` | langchain.service.ts |
| 4 | 🌐 API Layer | `feat: create Express API layer with RESTful recommendation endpoint` | index.ts, routes, controllers |
| 5 | 🎨 UI Primitives | `feat: integrate shadcn/ui component library with Tailwind utility layer` | components/ui/, lib/utils.ts |
| 6 | 📦 App Components | `feat: build movie display components and API client layer` | MovieCard, Skeleton, api.ts |
| 7 | 🖥️ Main App | `feat: implement recommendation form UI and educational concepts page` | RecommendationApp, ConceptsShowcase |
| 8 | 📄 Pages & Layout | `feat: wire up Next.js pages with root layout and global styling` | layout.tsx, page.tsx, globals.css |
| 9 | 🖼️ Static Assets | `chore: add static assets, favicons, and final project polish` | public/, favicon.ico |
| 10 | 📚 Documentation | `docs: add comprehensive project documentation` | README.md |

---

## Why This Project Demonstrates Real Engineering Skills

This project goes beyond a simple "call an API" demo. It shows:

1. **Clean Architecture** — Separation of routes, controllers, services, schemas
2. **Framework-Agnostic Design** — Swap LLM providers without changing business logic
3. **Type Safety** — End-to-end types from Zod schemas → TypeScript inference → UI components
4. **Resilient AI Integration** — Structured output eliminates parsing errors from freeform LLM responses
5. **Modern Tooling** — Next.js 16, shadcn/ui, Tailwind v4, TypeScript strict mode
6. **Developer Experience** — Hot reload with tsx, environment-based configuration
7. **Educational Value** — ConceptsShowcase page that explains every LangChain concept with code snippets

---

## Key Learnings

| Skill | Demonstrated In |
|-------|----------------|
| LangChain pipeline orchestration | `langchain.service.ts` — prompt templates, pipes, structured output |
| Multi-provider AI integration | `getChatModel()` — OpenAI ↔ Gemini swap |
| Schema-driven development | `movie.schema.ts` — Zod schemas as single source of truth |
| TypeScript patterns | Generic types, type inference, strict mode |
| Express API design | Routes, controllers, error handling, CORS |
| Next.js app router | Layouts, pages, client/server components |
| Modern CSS | Tailwind v4, gradients, backdrop-blur, animations |
| Component architecture | Reusable UI primitives, state management, loading states |

---

> Built with LangChain.js, Express, Next.js, TypeScript, and ❤️