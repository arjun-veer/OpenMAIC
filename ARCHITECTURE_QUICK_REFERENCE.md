# OpenMAIC - Architecture Quick Reference Guide

## 🎯 30-Second Summary

**OpenMAIC** is an open-source AI platform that converts any topic/PDF into an interactive classroom with:
- 🎓 **One-click generation** of multi-agent learning experiences
- 🤖 **Multi-agent orchestration** using LangGraph
- 🎬 **Rich content** (slides, quizzes, simulations, whiteboard)
- 💬 **Real-time interaction** with AI teachers and peers
- 📊 **Editable output** (PPTX, HTML exports)

**Stack**: Next.js 16, React 19, TypeScript 5, LangGraph, Tailwind CSS 4

---

## 🏗️ System Layers (Bottom-Up)

```
┌────────────────────────────────────┐
│     👥 User Facing UI              │  (React 19 Components)
│  Stage, Renderers, Chat, Canvas    │
├────────────────────────────────────┤
│     🔄 State Layer                 │  (Zustand + React Context)
│  Stores, Contexts, Providers       │
├────────────────────────────────────┤
│     🌐 API Routes                  │  (Next.js Route Handlers)
│  /chat, /generate/*, /transcription│
├────────────────────────────────────┤
│     🤖 Orchestration               │  (LangGraph StateGraph)
│  Director, Agent Generator         │
├────────────────────────────────────┤
│     🎬 Generation Pipeline         │  (Multi-stage generation)
│  Outline → Content → Actions       │
├────────────────────────────────────┤
│     🔌 Provider Layer              │  (LLM/TTS/STT/Search)
│  OpenAI, Claude, Azure, etc.       │
├────────────────────────────────────┤
│     💾 Storage Layer               │  (IndexedDB + Server)
│  Dexie, Persistence               │
└────────────────────────────────────┘
```

---

## 📍 Key Components Map

### Frontend Components (`components/`)
| Component | Purpose | Location |
|-----------|---------|----------|
| **Stage** | Mode dispatcher (edit/playback) | `stage.tsx` |
| **EditChrome** | Pro mode editor with canvas | `edit/EditChromeRoot.tsx` |
| **PlayChrome** | Playback renderer engine | `edit/PlaybackChromeRoot.tsx` |
| **SceneRenderers** | Type-specific renderers | `scene-renderers/` |
| **Roundtable** | Agent discussion UI | `roundtable/` |
| **Chat** | Chat interface | `chat/` |
| **Canvas** | Drawing surface (ProseMirror) | `canvas/` |
| **Whiteboard** | Collaborative drawing | `whiteboard/` |

### State Stores (`lib/store/`)
| Store | Manages | Key Fields |
|-------|---------|-----------|
| **StageStore** | Scene collection | `scenes`, `currentSceneId`, `mode` |
| **CanvasStore** | Drawing state | `selectedTool`, `colors`, `zoom` |
| **SettingsStore** | Configuration | `apiKeys`, `models`, `providers` |
| **SnapshotStore** | Undo/Redo | `history`, `checkpoints` |
| **KeyboardStore** | Shortcuts | `bindings`, `chord state` |

### API Endpoints (`app/api/`)
| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/chat` | POST | messages + config | SSE stream (text/tools/complete) |
| `/generate/scene-outlines-stream` | POST | requirements | SSE stream (outlines) |
| `/generate/scene-content` | POST | outline + context | Full scene JSON |
| `/generate/tts` | POST | text + voice config | Audio blob |
| `/transcription` | POST | audio blob | Transcript text |
| `/web-search` | POST | query | Search results |
| `/quiz-grade` | POST | answers + key | Score + feedback |

### Orchestration (`lib/orchestration/`)
| Module | Purpose |
|--------|---------|
| `director-graph.ts` | LangGraph StateGraph definition |
| `director-prompt.ts` | Director decision prompt |
| `stateless-generate.ts` | Event streaming |
| `ai-sdk-adapter.ts` | AI SDK ↔ LangGraph bridge |
| `tool-schemas.ts` | Tool/action definitions |
| `registry/` | Agent configurations |

### Generation Pipeline (`lib/generation/`)
| Module | Stage | Purpose |
|--------|-------|---------|
| `outline-generator.ts` | 1 | Generate scene outlines |
| `scene-generator.ts` | 2a | Generate scene content |
| `scene-builder.ts` | 2b | Compose final scene |
| `action-parser.ts` | 2c | Extract behaviors |
| `post-processor.ts` | Post | Interactive refinements |

---

## 🔄 Data Flow Pathways

### Path 1: Topic → Classroom (Generation)
```
User Input (topic)
    ↓ [POST /generate/scene-outlines-stream]
Outline Generator (LLM × 1)
    ↓ [SSE streaming]
Create Stage in Store
    ↓ [Client: POST /generate/scene-content]
Scene Generator (LLM × N, parallel)
    ↓ [Response]
Store Scenes in IndexedDB
    ↓ [Client: Render with SceneRenderer]
Display Classroom
```

### Path 2: User Message → Agent Response (Chat)
```
User Message + History
    ↓ [POST /api/chat]
Director Node (Decide which agent)
    ↓
Conversation Summarizer (Compress context)
    ↓
Prompt Builder (Structure)
    ↓
LLM Call (with tool schema)
    ↓ [SSE Events]
Agent Generator (Parse response)
    ↓ [StatelessEvent stream]
Client: textDelta → Update message
Client: toolCall → Execute action
Client: complete → Turn finished
```

### Path 3: Scene Display → User Interaction
```
Scene JSON
    ↓ [Determine renderer by scene.type]
Appropriate Renderer Mount
    ↓ [Resolve media URLs]
Media Proxy / IndexedDB
    ↓ [Blob URLs]
Renderer Display
    ↓ [Event listeners attached]
User Interacts (click/type/etc.)
    ↓ [Trigger state update or API call]
Response: Next scene / Chat / Grade
```

---

## 🎯 Request/Response Patterns

### Stateless Chat Request
```json
{
  "messages": [                    // Message history
    { "role": "user", "content": "..." }
  ],
  "storeState": {                  // Current UI state
    "stage": { "id": "s1" },
    "scenes": [ ... ],
    "currentSceneId": "scene-1",
    "mode": "playback"
  },
  "config": {
    "agentIds": ["teacher", "peer"],
    "sessionType": "discussion"
  },
  "apiKey": "sk-...",              // Provider key
  "model": "gpt-4"
}
```

### SSE Stream Response
```
event: stream
data: {"type":"textDelta","index":0,"delta":"The"}

event: stream
data: {"type":"textDelta","index":0,"delta":" answer"}

event: stream
data: {"type":"toolCall","name":"speak","args":{"text":"...","voice":"..."}}

event: stream
data: {"type":"complete","turnCount":1}
```

---

## 📊 Data Relationships

```
Stage (id, title, createdAt)
├── Scenes (id, index, type, title)
│   ├── SceneContent (title, body, images[])
│   ├── Actions (type, target, params)[]
│   └── Agents (id, name, role)[]
├── Agents (id, name, persona, avatar, voice)
└── Metadata (language, difficulty, tags)

Chat
├── Messages (role, content, agentId, actions)[]
└── State (currentAgent, roundCount, summary)

User
├── Settings (theme, language, providers)
├── Profile (name, avatar)
└── Storage (stages, classrooms, exports)
```

---

## 🎨 UI State Transitions

```
INITIAL
  ↓
[Settings dialog → Configure providers]
  ↓
CONFIGURED
  ↓
[Input topic/PDF]
  ↓
GENERATING_OUTLINES
  ↓ [POST /generate/scene-outlines-stream]
GENERATING_CONTENT
  ↓ [POST /generate/scene-content × N]
READY
  ↓
PLAYBACK_MODE (display scene)
  ├── [User: Next/Chat/Edit]
  ├── [PLAYBACK → CHAT] (post /chat)
  ├── [PLAYBACK → EDIT] (edit chrome)
  ├── [PLAYBACK → QUIZ] (quiz renderer)
  └── [FINAL → EXPORT] (download PPTX/HTML)
  ↓
COMPLETED
```

---

## 🔧 Provider Integration Pattern

```typescript
// Unified provider interface
const provider = getProvider('openai');

// Call through adapter
const response = await provider.generateCompletion({
  model: 'gpt-4',
  messages: [...],
  stream: true,
  tools: [{name, description, parameters}]
});

// Works with: Claude, Gemini, MiniMax, Ollama, Azure, etc.
```

---

## 🛡️ Error Handling Strategy

```
Try-Catch Block
  ├── Provider Error
  │   ├── API Key Invalid → Show settings dialog
  │   ├── Rate Limited → Backoff & retry
  │   └── Model Not Available → Fallback provider
  ├── Generation Error
  │   ├── JSON Parse Failed → Repair & retry
  │   ├── Timeout → Show partial results
  │   └── Content Violation → Notify user
  └── Network Error
      ├── Connection Lost → Offline mode
      ├── 500 Server Error → Retry with backoff
      └── 401 Unauthorized → Re-authenticate
```

---

## 📈 Performance Optimization Strategies

| Layer | Optimization | Implementation |
|-------|-------------|-----------------|
| **Frontend** | Code splitting | Next.js dynamic imports |
| **Rendering** | Memoization | React.memo, useMemo |
| **API** | Streaming | SSE for real-time |
| **Generation** | Parallelization | Promise.all for scenes |
| **Storage** | Caching | IndexedDB + localStorage |
| **LLM** | Context compression | Conversation summarizer |
| **Network** | Compression | gzip encoding |

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured (`.env.local`)
- [ ] LLM provider keys set (OpenAI, Claude, etc.)
- [ ] TTS/STT provider configured
- [ ] Database initialized
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] SSL/TLS enabled
- [ ] CDN configured
- [ ] Backup strategy set
- [ ] Monitoring alerts configured

---

## 📚 File Structure Quick Reference

```
OpenMAIC/
├── app/
│   ├── page.tsx              # Main UI entry
│   ├── layout.tsx            # Root layout
│   └── api/
│       ├── chat/route.ts     # Multi-agent chat
│       ├── generate/
│       │   ├── scene-outlines-stream/
│       │   ├── scene-content/
│       │   └── tts/
│       └── ...
├── components/
│   ├── stage.tsx             # Main dispatcher
│   ├── edit/                 # Pro mode
│   ├── scene-renderers/      # Renderers
│   └── ...
├── lib/
│   ├── ai/                   # LLM integrations
│   ├── generation/           # Pipeline
│   ├── orchestration/        # LangGraph
│   ├── store/                # Zustand stores
│   ├── types/                # TypeScript types
│   ├── utils/                # Helpers
│   └── ...
├── public/                   # Static assets
├── tests/                    # Test suites
├── packages/
│   ├── @maic/                # MAIC packages
│   └── ...
├── package.json
├── tsconfig.json
├── next.config.ts
└── ...
```

---

## 🎓 Learning Path

1. **Start**: `app/page.tsx` - Main UI entry point
2. **State**: `lib/store/stage.ts` - Understand state management
3. **API**: `app/api/chat/route.ts` - Stateless request pattern
4. **Orchestration**: `lib/orchestration/director-graph.ts` - LangGraph
5. **Generation**: `lib/generation/generation-pipeline.ts` - Content creation
6. **Rendering**: `components/scene-renderers/` - Different scene types
7. **Advanced**: `lib/orchestration/registry/` - Agent system

---

## 🔗 Key APIs & Integrations

### LLM Integration
- **AI SDK**: Unified interface for all LLM providers
- **LangChain**: Agent framework
- **LangGraph**: Graph-based orchestration

### Storage
- **Dexie**: IndexedDB wrapper
- **jszip**: ZIP export
- **pptxgenjs**: PowerPoint generation

### UI/UX
- **Motion/Framer Motion**: Animations
- **Radix UI**: Accessible components
- **Tailwind CSS**: Styling

### Media
- **Web Audio API**: Audio playback/recording
- **Canvas API**: Drawing/visualization
- **ProseMirror**: Rich text editing

---

## 📊 Architecture Patterns Used

1. **Separation of Concerns**: Clear layer boundaries
2. **Stateless Design**: Horizontal scalability
3. **Event-Driven**: SSE for real-time updates
4. **Provider Pattern**: Pluggable provider implementations
5. **Factory Pattern**: Scene renderer selection
6. **Observer Pattern**: Zustand subscriptions
7. **Strategy Pattern**: Different generation strategies
8. **Adapter Pattern**: AI SDK ↔ LangGraph

---

## ⚡ Quick Commands

```bash
# Development
pnpm dev                          # Start dev server

# Building
pnpm build                        # Build for production
pnpm start                        # Start production server

# Testing
pnpm test                         # Run unit tests
pnpm test:e2e                     # Run E2E tests

# Code Quality
pnpm lint                         # Run ESLint
pnpm format                       # Format with Prettier
pnpm check:i18n-keys             # Validate i18n keys

# Deployment
docker build -t openmaic .        # Build Docker image
docker run -p 3000:3000 openmaic # Run container
```

---

## 🌟 Key Achievements

✅ **1-click Generation** - Full classroom from topic/PDF
✅ **Multi-Agent** - Realistic classroom with multiple agents
✅ **Stateless** - Horizontally scalable architecture
✅ **Streaming** - Real-time SSE responses
✅ **Rich Content** - 5+ scene types
✅ **Export** - PPTX + HTML
✅ **OpenSource** - MIT license
✅ **Extensible** - Plugin architecture for agents/renderers
✅ **TypeScript** - Full type safety
✅ **Production-Ready** - Deployed at scale

---

**For more details, see**: 
- [ARCHITECTURE.md](ARCHITECTURE.md) - Mermaid diagrams
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) - Detailed guide
- [COMPONENTS_REFERENCE.md](COMPONENTS_REFERENCE.md) - Component interactions
