# OpenMAIC - Comprehensive Architecture Guide

## 📊 Project Overview

**OpenMAIC** (Open Multi-Agent Interactive Classroom) is a Next.js-based AI platform that transforms any topic or PDF document into an interactive, multi-agent learning experience.

### Key Metrics
- **Tech Stack**: Next.js 16, React 19, TypeScript 5, LangGraph, Tailwind CSS 4
- **Repository**: THU-MAIC/OpenMAIC (MIT License)
- **Lines of Code**: ~50,000+ LOC (frontend, backend, generation pipeline)
- **Supported LLMs**: OpenAI, Anthropic Claude, Google Gemini, MiniMax, Ollama, and 15+ providers
- **TTS/STT Providers**: Azure, OpenAI, VoxCPM2, custom providers
- **Deployment**: Vercel, Docker, Self-hosted
- **Live Demo**: https://open.maic.chat/

---

## 🏗️ Complete Architecture Breakdown

### Layer 1️⃣: Frontend (React/TypeScript)

```
components/
├── stage.tsx                    # Main stage dispatcher (edit/playback modes)
├── header.tsx                   # Navigation, settings, theme toggle
├── agent/
│   ├── agent-bar.tsx           # Agent status and controls
│   └── ...                      # Agent-related components
├── edit/
│   ├── EditChromeRoot.tsx       # Pro mode editor
│   ├── PlaybackChromeRoot.tsx   # Playback engine
│   └── ...                      # Edit utilities
├── chat/                        # Chat UI components
├── canvas/                      # Drawing canvas
├── whiteboard/                  # Whiteboard rendering
├── scene-renderers/             # Different scene type renderers
│   ├── slide-renderer/
│   ├── quiz-renderer/
│   ├── interactive-renderer/
│   └── ...
├── generation/                  # Generation UI
├── roundtable/                  # Multi-agent discussion UI
├── settings/                    # Settings dialog
├── ui/                          # Base UI components (button, input, etc.)
└── ...
```

**Technology**: React Hooks, Zustand Store, Context API, Framer Motion

---

### Layer 2️⃣: State Management (Zustand + React Context)

```
lib/store/
├── stage.ts                     # Main stage state (scenes, current scene, mode)
├── canvas.ts                    # Canvas/drawing state
├── settings.ts                  # User settings, LLM config, providers
├── snapshot.ts                  # Undo/redo history
├── keyboard.ts                  # Keyboard shortcuts state
└── user-profile.ts              # User profile and avatars

lib/contexts/
├── scene-context.ts             # Scene data provider for extensible types
└── ...
```

**Features**:
- Immutable state updates (Immer)
- Time-travel debugging
- Middleware for persistence
- Selectors for derived state

---

### Layer 3️⃣: API Endpoints (Next.js Server Routes)

#### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Multi-agent chat with streaming SSE |
| `/api/generate/scene-outlines-stream` | POST | Generate scene outlines (streaming) |
| `/api/generate/scene-content` | POST | Generate full scene content |
| `/api/generate/scene-actions` | POST | Generate agent actions/behaviors |
| `/api/generate/tts` | POST | Text-to-speech synthesis |
| `/api/generate/voice` | POST | Voice generation with cloning |
| `/api/generate/video` | POST | Video generation |
| `/api/transcription` | POST | Speech-to-text transcription |
| `/api/web-search` | POST | Web search integration |
| `/api/quiz-grade` | POST | Quiz answer evaluation |
| `/api/access-code/verify` | POST | Access code validation |
| `/api/server-providers` | GET | List available providers |
| `/api/verify-model` | POST | Test LLM model connectivity |
| `/api/proxy-media` | GET | Media proxy/CDN |
| `/api/classroom-media/[id]/[...path]` | GET | Classroom media delivery |

**Key Feature**: All endpoints are **stateless** - client sends full state, server processes independently.

---

### Layer 4️⃣: Orchestration Engine (LangGraph)

```
lib/orchestration/
├── director-graph.ts            # StateGraph: Director → Agent cycle
├── director-prompt.ts           # Prompt generation for director
├── prompt-builder.ts            # Structured prompt construction
├── ai-sdk-adapter.ts            # Adapter for AI SDK to LangGraph
├── stateless-generate.ts        # Streaming event generation
├── tool-schemas.ts              # Tool/action definitions
├── registry/
│   ├── store.ts                 # Agent registry state
│   ├── types.ts                 # Agent config types
│   └── default-agents/          # Built-in agents
└── summarizers/
    ├── conversation-summary.ts  # Context compression
    ├── message-converter.ts     # Message format conversion
    └── ...
```

**Architecture**:
```
START → DIRECTOR (LLM decision) → [end] → END
           ↓ [next]
        AGENT_GENERATE (LLM response)
           ↓
         END
```

**Streaming**: Each node outputs `StatelessEvent` items via SSE:
- `textDelta`: Partial response text
- `toolCall`: Action execution
- `complete`: Turn finished

---

### Layer 5️⃣: Generation Pipeline

```
lib/generation/
├── generation-pipeline.ts       # Main pipeline orchestration
├── outline-generator.ts         # Stage 1: Generate scene outlines
├── scene-generator.ts           # Stage 2a: Generate scene content
├── scene-builder.ts             # Stage 2b: Compose elements
├── action-parser.ts             # Extract actions from LLM output
├── interactive-post-processor.ts # Post-processing for interactive content
├── prompt-formatters.ts         # Format prompts for LLM
├── json-repair.ts               # Fix malformed JSON
├── pipeline-runner.ts           # Execute pipeline stages
└── pipeline-types.ts            # Type definitions
```

**Two-Stage Process**:

**Stage 1: Outline Generation**
- Input: User requirements, document context
- Process: LLM generates scene blueprints (count, type, topics)
- Output: `SceneOutline[]`

**Stage 2: Content Generation**
- Input: Outline, agent info, context
- Process: Parallel LLM calls for each scene
- Output: Full `Scene` objects with content/actions

**Post-Processing**:
- JSON repair (fix malformed responses)
- Interactive element post-processing
- Action validation and parsing

---

### Layer 6️⃣: Scene Renderers

```
components/scene-renderers/
├── SlideRenderer.tsx            # PowerPoint-style slides
├── QuizRenderer.tsx             # Quiz/assessment interface
├── InteractiveIframeHost.tsx    # Interactive simulations/games
├── PBLRenderer.tsx              # Project-based learning
├── WhiteboardRenderer.tsx       # Collaborative whiteboard
├── stage/
│   ├── scene-stage.tsx          # Scene container
│   ├── playback-chrome.tsx      # Playback controls
│   └── ...
└── ...
```

**Rendering Pipeline**:
1. Scene data arrives from API
2. Appropriate renderer determined by `scene.type`
3. Media URLs resolved (images, audio, video)
4. Components mount and render
5. Event listeners attached for interactivity

---

### Layer 7️⃣: Provider Integrations

```
lib/ai/
├── llm.ts                       # LLM provider implementations
├── providers.ts                 # Provider registry
├── model-metadata.ts            # Model capabilities
└── thinking-config.ts           # Extended thinking config

lib/audio/
├── tts/                         # Text-to-speech providers
├── stt/                         # Speech-to-text providers
└── ...

lib/web-search/
├── web-search.ts               # Web search providers
└── ...
```

**Supported Providers**:
- **LLM**: OpenAI, Claude, Gemini, MiniMax, DeepSeek, Ollama, Azure
- **TTS**: Azure Cognitive Services, OpenAI, VoxCPM2, custom
- **STT**: Azure, OpenAI, Deepgram, custom
- **Search**: Google, Brave, Baidu, MiniMax, Bocha
- **Image**: Vision models from supported LLMs

---

### Layer 8️⃣: Storage & Persistence

```
lib/storage/
├── storage.ts                   # Main storage interface
├── stage-storage.ts             # Stage data persistence
├── media-storage.ts             # Media blob storage
└── ...

lib/document/
├── document-store.ts            # Document persistence
├── pdf-parser.ts                # PDF content extraction
└── ...

lib/export/
├── export-handler.ts            # PPTX/HTML export
├── pptx-builder.ts              # PowerPoint generation
└── ...

lib/import/
├── import-handler.ts            # MAIC DSL import
└── ...
```

**Storage Layers**:
1. **Client-side**: IndexedDB (via Dexie) for local persistence
2. **Memory**: Zustand stores for active state
3. **Server-side**: Optional persistent storage

**Export Formats**:
- **PPTX**: Native PowerPoint files (via pptxgenjs)
- **HTML**: Interactive HTML5 pages
- **JSON**: MAIC DSL format
- **ZIP**: Packaged classroom export

---

## 🔄 Key Data Flows

### Flow 1️⃣: Lesson Generation

```
User Input (Topic/PDF)
    ↓
POST /generate/scene-outlines-stream
    ↓
Outline Generator (LLM)
    ↓
SSE Stream: Outline1, Outline2, ... (client builds stage)
    ↓
Create Stage + Scenes in IndexedDB
    ↓
Client: Request detailed content for each scene
    ↓
POST /generate/scene-content (parallel)
    ↓
Scene Generator (LLM per scene)
    ↓
Build Scene (compose media, actions)
    ↓
Response: Full Scene JSON
    ↓
Client: Render scene in appropriate renderer
```

### Flow 2️⃣: Multi-Agent Chat

```
User Message + Chat History
    ↓
POST /api/chat (with full state)
    ↓
Director Graph:
  1. Director Node: Decide which agent speaks
  2. Summarize conversation context
  3. Build structured prompt
  4. Call LLM with tool use
    ↓
Agent Generator Node:
  1. Stream text deltas via SSE
  2. Parse tool calls (draw, speak, gesture, etc.)
  3. Execute tools on client
    ↓
Client receives StatelessEvents:
  1. textDelta → Update message text
  2. toolCall → Execute action (draw on whiteboard, speak, etc.)
  3. complete → Turn finished, ready for next message
    ↓
User reads response, optionally continues chat
```

### Flow 3️⃣: Scene Rendering

```
Scene Object (JSON):
  {
    id: "scene-1",
    type: "slide" | "quiz" | "interactive",
    content: { /* ... */ },
    media: [ /* images, audio, video */ ],
    actions: [ /* agent behaviors */ ]
  }
    ↓
Determine Renderer based on type
    ↓
Resolve Media URLs:
  - Stored in IndexedDB → Blob URL
  - Remote → Proxy via /api/proxy-media
    ↓
Mount Renderer Component
    ↓
Attach Event Listeners:
  - User clicks → Quiz answer selected
  - Interactive element → Simulation state change
  - Audio control → Play/pause
    ↓
Render Output with interactions enabled
```

---

## 📦 Key Dependencies

### Frontend Framework
- `next@16.1.2` - React framework with SSR
- `react@19` - UI library
- `typescript@5` - Type safety
- `tailwindcss@4` - Styling
- `motion@12.27.5` - Animations (Framer Motion)

### State & Storage
- `zustand` - State management
- `immer` - Immutable updates
- `dexie` - IndexedDB wrapper
- `i18next` - Internationalization

### LLM & Orchestration
- `langchain@core@1.1.16` - LangChain core
- `@langchain/langgraph@1.1.1` - Graph-based orchestration
- `ai@6.0.168` - AI SDK (unified LLM interface)
- `@ai-sdk/*` - Provider SDKs (OpenAI, Claude, Gemini)
- `@modelcontextprotocol/sdk` - MCP integration

### Editor & Rendering
- `prosemirror-*` - Rich text editing
- `@xyflow/react` - Flow visualization
- `pptxgenjs` - PowerPoint generation
- `echarts` - Chart rendering
- `katex` - Math rendering
- `jszip` - ZIP file creation

### Media & Audio
- `@napi-rs/canvas` - Server-side canvas
- `lucide-react` - Icons

### Testing
- `vitest` - Unit testing
- `playwright` - E2E testing

---

## 🎯 Key Architectural Patterns

### 1️⃣ Stateless API Design
- Clients send complete state with each request
- Servers are horizontally scalable
- No session management overhead
- Client handles resumption on interruption

### 2️⃣ Streaming Over Polling
- SSE for real-time responses
- Reduces latency and bandwidth
- `StatelessEvent` protocol for structured updates
- Client-side event parsing and state updates

### 3️⃣ Two-Stage Generation
- **Stage 1** (Fast): Outline generation (LLM once)
- **Stage 2** (Parallel): Scene content (LLM × scene count)
- Enables progressive rendering
- User sees structure before details

### 4️⃣ Modular Renderers
- Each scene type has dedicated renderer
- Renderer contracts well-defined
- Easy to add new scene types
- Isolated rendering logic

### 5️⃣ Provider Abstraction
- Unified interface for all LLM/TTS/STT providers
- Easy provider swapping
- Multi-provider support in single session
- Fallback chains for reliability

### 6️⃣ Client-Side Persistence
- IndexedDB for offline capability
- Reduces server storage load
- Enables quick app restore
- Export/import for portability

---

## 🔌 Integration Points

### External APIs
- OpenAI API (GPT models, embeddings)
- Anthropic API (Claude models)
- Google Gemini API
- Azure Cognitive Services (TTS, STT)
- Web search APIs
- Image generation APIs

### Internal Services
- PDF parsing service
- Media proxy service
- Quiz grading service
- Access code verification service

### Framework Integrations
- OpenClaw (messaging apps)
- Model Context Protocol (MCP)
- Vercel deployment
- Docker containerization

---

## 📊 Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Outline Generation** | 2-5s | Single LLM call |
| **Scene Generation** | 10-30s | Parallel scene LLM calls |
| **TTS Latency** | 1-3s | Per-sentence generation |
| **Chat Response** | 3-10s | Depends on LLM |
| **Scene Rendering** | <500ms | React component mount |
| **IndexedDB Query** | <50ms | Typical operations |
| **API Response Streaming** | Real-time | SSE protocol |

---

## 🛡️ Security Features

1. **Access Code Authentication** - Optional per-deployment
2. **API Key Validation** - Per-request provider authentication
3. **CORS Protection** - Restricted cross-origin access
4. **Rate Limiting** - Provider-level rate limit handling
5. **Content Validation** - JSON schema validation
6. **Type Safety** - Full TypeScript coverage

---

## 🚀 Deployment Targets

1. **Vercel** (Recommended)
   - One-click deployment
   - Serverless functions
   - Edge middleware

2. **Docker**
   - Dockerized application
   - Docker Compose for local dev
   - Container registry ready

3. **Self-Hosted**
   - Node.js + Next.js standalone
   - Custom domain + SSL
   - Full control over data

---

## 📈 Scalability Considerations

✅ **Horizontal**: Stateless API design allows multi-instance deployments
✅ **Vertical**: Efficient generation pipeline with parallel processing
✅ **Caching**: Memoization at multiple levels
✅ **CDN**: Static assets easily cacheable
✅ **Database**: Pluggable storage backends
✅ **Provider**: Multi-provider support prevents single-point failure

---

## 🎓 Learning Resources

The codebase is well-structured with:
- Clear separation of concerns
- Comprehensive TypeScript types
- Extensive comments and documentation
- Well-organized folder structure
- Example configurations
- Test suites for validation

**Entry Points**:
- [app/page.tsx](app/page.tsx) - Main UI entry
- [app/api/chat/route.ts](app/api/chat/route.ts) - Chat API
- [lib/generation/generation-pipeline.ts](lib/generation/generation-pipeline.ts) - Generation pipeline
- [lib/orchestration/director-graph.ts](lib/orchestration/director-graph.ts) - Multi-agent logic

---

## 📝 Summary

OpenMAIC demonstrates a production-grade architecture combining:
- ✅ Modern frontend (React 19, Zustand)
- ✅ Stateless backend (Next.js)
- ✅ AI orchestration (LangGraph)
- ✅ Complex generation pipeline
- ✅ Multi-renderer system
- ✅ Provider abstraction
- ✅ Client-side storage
- ✅ Streaming SSE
- ✅ Full TypeScript
- ✅ Comprehensive testing

It's an excellent reference for building AI-powered educational applications, demonstrating best practices in modern web development, LLM integration, and scalable architecture.
