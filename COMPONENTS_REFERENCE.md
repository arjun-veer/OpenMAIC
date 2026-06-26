# OpenMAIC - Detailed Component Reference & Interactions

## 📐 Complete Component Hierarchy

```mermaid
graph TD
    App["📱 RootLayout<br/>- Theme Provider<br/>- i18n Provider<br/>- Toaster"]
    
    App --> MainPage["📄 Main Page<br/>page.tsx"]
    MainPage --> UI1["UI Components<br/>Input/Button/Textarea"]
    MainPage --> LanguageSwitcher["🌍 Language Switcher"]
    MainPage --> SettingsDialog["⚙️ Settings Dialog"]
    MainPage --> GenerationToolbar["🎓 Generation Toolbar"]
    MainPage --> AgentBar["🤖 Agent Bar"]
    MainPage --> HeaderComp["🎛️ Header"]
    
    MainPage --> Stage["🎬 Stage Component<br/>- Dispatch edit/playback<br/>- Handle mode toggle<br/>- Edit lock management"]
    
    Stage -->|edit mode| EditChrome["✏️ EditChromeRoot<br/>- Slide editor<br/>- Canvas surface<br/>- Edit controls"]
    Stage -->|playback mode| PlayChrome["▶️ PlaybackChromeRoot<br/>- Scene renderer dispatch<br/>- Controls/buttons<br/>- Agent display"]
    
    EditChrome --> EditorTools["Editor Tools<br/>- Color picker<br/>- Text formatting<br/>- Shape tools"]
    EditChrome --> Canvas["Canvas<br/>- ProseMirror<br/>- Drawing surface<br/>- Media placement"]
    EditChrome --> ProMode["Pro Switch<br/>Toggle to playback"]
    
    PlayChrome --> SceneRenderers["Scene Renderers"]
    SceneRenderers -->|type: slide| SlideRend["📊 Slide Renderer<br/>- Title/content<br/>- Images/media<br/>- Speaker notes"]
    SceneRenderers -->|type: quiz| QuizRend["❓ Quiz Renderer<br/>- Question display<br/>- Answer options<br/>- Grading"]
    SceneRenderers -->|type: interactive| InteractiveRend["🕹️ Interactive Renderer<br/>- iFrame host<br/>- Simulation/game<br/>- 3D canvas"]
    SceneRenderers -->|type: pbl| PBLRend["🔬 PBL Renderer<br/>- Project tasks<br/>- Milestones<br/>- Resources"]
    SceneRenderers -->|type: whiteboard| WhiteboardRend["✏️ Whiteboard<br/>- Drawing canvas<br/>- Collaboration<br/>- Annotations"]
    
    PlayChrome --> RoundtableUI["🔄 Roundtable UI<br/>- Agent avatars<br/>- Status indicators<br/>- Active agent highlight"]
    
    PlayChrome --> ChatUI["💬 Chat Interface<br/>- Message list<br/>- Input box<br/>- Agent responses"]
    
    PlayChrome --> Controls["Playback Controls<br/>- Next/Previous<br/>- Volume control<br/>- Speed control"]
    
    PlayChrome --> MediaPlayer["🔊 Media Player<br/>- Audio playback<br/>- TTS synthesis<br/>- Speech recognition"]
    
    SettingsDialog --> ProviderSettings["Provider Config<br/>- API keys<br/>- Model selection<br/>- Parameters"]
    ProviderSettings --> LLMSelect["LLM Selection<br/>- OpenAI<br/>- Claude<br/>- Gemini<br/>- etc."]
    ProviderSettings --> TTSSelect["TTS Selection<br/>- Azure<br/>- OpenAI<br/>- VoxCPM2<br/>- etc."]
    
    GenerationToolbar --> GenMode["Generation Mode<br/>- Topic input<br/>- PDF upload<br/>- Settings"]
    
    AgentBar --> AgentStatus["Agent Status<br/>- Name/avatar<br/>- Speaking status<br/>- Actions"]
    
    style App fill:#c8e6c9
    style MainPage fill:#bbdefb
    style Stage fill:#fff9c4
    style EditChrome fill:#f8bbd0
    style PlayChrome fill:#b3e5fc
    style SceneRenderers fill:#e1bee7
    style SlideRend fill:#ffc1cc
    style QuizRend fill:#ffe0b2
    style InteractiveRend fill:#d1c4e9
    style PBLRend fill:#c5e1a5
    style WhiteboardRend fill:#ffccbc
```

## 🔄 State Flow Diagram

```mermaid
graph TB
    subgraph StateManagement["🔄 STATE MANAGEMENT LAYERS"]
        direction TB
        
        subgraph ZustandLayers["Zustand Stores"]
            StageStore["StageStore<br/>- scenes<br/>- currentSceneId<br/>- mode: edit/playback<br/>- stage metadata"]
            
            CanvasStore["CanvasStore<br/>- selectedTool<br/>- colors<br/>- zoom level<br/>- drawing state"]
            
            SettingsStore["SettingsStore<br/>- provider configs<br/>- api keys<br/>- model selections<br/>- user preferences"]
            
            SnapshotStore["SnapshotStore<br/>- undo history<br/>- redo history<br/>- checkpoints"]
            
            KeyboardStore["KeyboardStore<br/>- shortcuts<br/>- key bindings<br/>- chord state"]
        end
        
        subgraph ReactContextLayers["React Context API"]
            SceneContext["SceneContext<br/>- Current scene data<br/>- Actions<br/>- Selectors"]
            
            ThemeContext["ThemeContext<br/>- Dark/Light mode<br/>- Color scheme"]
            
            I18nContext["I18nContext<br/>- Current language<br/>- Translations<br/>- Localization"]
        end
        
        subgraph LocalStorage["Local Storage"]
            IndexedDB["IndexedDB (Dexie)<br/>- Stage data<br/>- Scenes<br/>- Media blobs<br/>- User settings"]
            
            SessionStorage["Session Storage<br/>- Temp session data<br/>- Cache<br/>- Transient state"]
        end
    end

    ZustandLayers -.->|persisted| IndexedDB
    ReactContextLayers -.->|consumed by| Components["Components"]
    SessionStorage -.->|transient| Components
    
    style StateManagement fill:#fff3e0
    style ZustandLayers fill:#f3e5f5
    style ReactContextLayers fill:#e1f5fe
    style LocalStorage fill:#f1f8e9
```

## 📊 API Request/Response Flow

```mermaid
sequenceDiagram
    participant Client as 🖥️ Client
    participant API as 🌐 API Route
    participant Orch as 🤖 Orchestration
    participant LLM as 🧠 LLM Provider
    participant TTS as 🔊 TTS Provider
    
    Client->>API: POST /chat<br/>{messages, config, state}
    activate API
    
    API->>Orch: Load director graph
    activate Orch
    
    Orch->>Orch: Parse request state
    Orch->>Orch: Summarize conversation
    Orch->>Orch: Select agent (Director)
    
    Orch->>LLM: Stream LLM completion<br/>with tool use schema
    activate LLM
    
    LLM-->>Orch: text_delta event
    Orch-->>API: StatelessEvent
    API-->>Client: SSE: text_delta
    
    LLM-->>Orch: tool_call event<br/>(e.g., draw_line)
    Orch-->>API: StatelessEvent
    API-->>Client: SSE: tool_call
    Client->>Client: Execute tool locally
    
    LLM-->>Orch: done_reason
    deactivate LLM
    
    Orch-->>API: StatelessEvent complete
    deactivate Orch
    
    API-->>Client: SSE: complete
    deactivate API
    
    Client->>TTS: POST /generate/tts<br/>{text, voice}
    activate TTS
    TTS-->>Client: Audio blob
    deactivate TTS
    
    Client->>Client: Play audio
```

## 🎬 Scene Generation Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 📱 UI
    participant API as 🌐 API
    participant Pipeline as 🔧 Pipeline
    participant LLM as 🧠 LLM
    participant Builder as 🏗️ Builder
    participant Store as 💾 Store
    
    User->>UI: Enter topic + settings
    UI->>API: POST /generate/scene-outlines-stream
    activate API
    
    API->>Pipeline: generateSceneOutlines()
    activate Pipeline
    
    Pipeline->>Pipeline: Build context
    Pipeline->>LLM: Generate outline<br/>(1 LLM call)
    activate LLM
    LLM-->>Pipeline: "Scene 1: Intro\nScene 2: Main\n..."
    deactivate LLM
    
    Pipeline->>Pipeline: Parse outlines
    Pipeline-->>API: Streaming outlines
    deactivate Pipeline
    
    API-->>UI: SSE: outline1, outline2, ...
    deactivate API
    
    UI->>UI: Create Stage<br/>Initialize scenes
    UI->>Store: Save stage to IndexedDB
    Store-->>UI: Stored
    
    UI->>User: Display scene list
    
    User->>UI: Click "Generate Details"
    UI->>API: POST /generate/scene-content<br/>for each scene (parallel)
    activate API
    
    API->>Pipeline: generateSceneContent()<br/>x N (parallel)
    activate Pipeline
    
    par Scene 1
        Pipeline->>LLM: Generate content for scene 1
        LLM-->>Pipeline: Scene JSON
    and Scene 2
        Pipeline->>LLM: Generate content for scene 2
        LLM-->>Pipeline: Scene JSON
    and Scene N
        Pipeline->>LLM: Generate content for scene N
        LLM-->>Pipeline: Scene JSON
    end
    
    Pipeline->>Builder: Build each scene
    activate Builder
    Builder->>Builder: Compose elements
    Builder->>Builder: Resolve media URLs
    Builder-->>Pipeline: Full scene
    deactivate Builder
    
    Pipeline-->>API: Scene JSON array
    deactivate Pipeline
    
    API-->>UI: Response
    deactivate API
    
    UI->>Store: Update scenes in IndexedDB
    Store-->>UI: Stored
    
    UI->>UI: Render scenes
    UI->>User: Display completed classroom
```

## 🎯 User Interaction Flow

```mermaid
graph TD
    Start["🚀 User Visits<br/>open.maic.chat"]
    
    Start --> AccessCheck{"Access Code<br/>Required?"}
    AccessCheck -->|Yes| EnterCode["Enter Access Code"]
    EnterCode --> VerifyCode["POST /access-code/verify"]
    VerifyCode --> CodeCheck{"Valid?"}
    CodeCheck -->|No| Denied["❌ Denied"]
    CodeCheck -->|Yes| ConfigProviders["⚙️ Configure Providers"]
    AccessCheck -->|No| ConfigProviders
    
    ConfigProviders --> SaveConfig["Save to SettingsStore"]
    SaveConfig --> MainUI["Display Main UI"]
    
    MainUI --> UserChoice{"Action?"}
    
    UserChoice -->|Generate Topic| GenTopic["Enter Topic<br/>+ Settings"]
    GenTopic --> GenReq["POST /generate/<br/>scene-outlines-stream"]
    GenReq --> StreamOutlines["Stream Outlines"]
    StreamOutlines --> CreateStage["Create Stage"]
    CreateStage --> DetailGen["Generate Details<br/>POST /generate/scene-content"]
    DetailGen --> RenderScenes["Render Scenes"]
    
    UserChoice -->|Upload PDF| UploadPDF["PDF File Input"]
    UploadPDF --> ParsePDF["Parse PDF<br/>lib/pdf"]
    ParsePDF --> ExtractText["Extract Text<br/>+ Context"]
    ExtractText --> GenTopic
    
    RenderScenes --> ViewScene["View Scene<br/>Current Content"]
    ViewScene --> SceneInteract{"Interact?"}
    
    SceneInteract -->|Read Slide| NextScene["Next Scene"]
    SceneInteract -->|Answer Quiz| SubmitAnswer["Submit Answer"]
    SubmitAnswer --> GradeQuiz["POST /quiz-grade"]
    GradeQuiz --> ShowScore["Show Score"]
    ShowScore --> NextScene
    
    SceneInteract -->|Chat| ChatTrigger["User Message"]
    ChatTrigger --> PostChat["POST /chat<br/>{messages, config}"]
    PostChat --> StreamSSE["Stream SSE<br/>Events"]
    StreamSSE --> ParseEvents["Parse Events<br/>textDelta/toolCall/complete"]
    ParseEvents --> DisplayResponse["Display Agent<br/>Response"]
    DisplayResponse --> ChatContinue["User Continues<br/>Chat?"]
    ChatContinue -->|Yes| ChatTrigger
    ChatContinue -->|No| ViewScene
    
    SceneInteract -->|Edit Slide| ProMode["Switch to Pro Mode<br/>Edit Chrome"]
    ProMode --> EditSlide["Edit Slide Content<br/>Canvas"]
    EditSlide --> SaveEdit["Save Changes"]
    SaveEdit --> ExitEdit["Exit Edit Mode"]
    ExitEdit --> ViewScene
    
    NextScene --> MoreScenes{"More Scenes?"}
    MoreScenes -->|Yes| ViewScene
    MoreScenes -->|No| CompleteCourse["✅ Course Complete"]
    
    CompleteCourse --> Export{"Export?"}
    Export -->|PPTX| GenPPTX["Generate PPTX<br/>pptxgenjs"]
    Export -->|HTML| GenHTML["Generate HTML<br/>Interactive"]
    GenPPTX --> Download["📥 Download"]
    GenHTML --> Download
    Export -->|No| End["Session End"]
    Download --> End
    
    style Start fill:#81c784
    style GenTopic fill:#64b5f6
    style UploadPDF fill:#ffb74d
    style RenderScenes fill:#4dd0e1
    style PostChat fill:#ba68c8
    style ProMode fill:#ce93d8
    style Download fill:#a1887f
    style End fill:#90a4ae
```

## 🔧 Tool Execution Pipeline

```mermaid
graph TB
    LLMResponse["LLM Response<br/>text + tool_use"]
    
    Parser["Parse Tool Call<br/>name + arguments"]
    
    ToolSelection{"Which Tool?"}
    
    DrawTool["🖌️ Draw<br/>- drawLine<br/>- drawShape<br/>- drawText"]
    
    SpeakTool["🔊 Speak<br/>- POST /generate/tts<br/>- Play audio<br/>- Stream to browser"]
    
    GestureTool["🤚 Gesture<br/>- Point<br/>- Emphasize<br/>- Express"]
    
    WriteTool["✍️ Write<br/>- Update slide<br/>- Add text<br/>- Format"]
    
    InteractTool["🕹️ Interact<br/>- Click element<br/>- Change state<br/>- Trigger animation"]
    
    ToolSelection -->|draw| DrawTool
    ToolSelection -->|speak| SpeakTool
    ToolSelection -->|gesture| GestureTool
    ToolSelection -->|write| WriteTool
    ToolSelection -->|interact| InteractTool
    
    DrawTool --> Execute["Execute on<br/>Whiteboard"]
    SpeakTool --> Execute
    GestureTool --> Execute
    WriteTool --> Execute
    InteractTool --> Execute
    
    Execute --> Feedback["Visual/Audio<br/>Feedback"]
    
    LLMResponse --> Parser
    Parser --> ToolSelection
    
    style LLMResponse fill:#fff3e0
    style Parser fill:#f3e5f5
    style ToolSelection fill:#ffe0b2
    style DrawTool fill:#c8e6c9
    style SpeakTool fill:#b3e5fc
    style GestureTool fill:#f8bbd0
    style WriteTool fill:#ffe0b2
    style InteractTool fill:#d1c4e9
    style Execute fill:#ffccbc
    style Feedback fill:#a5d6a7
```

## 📱 Component Prop Interfaces

### Stage Component
```typescript
interface StageProps {
  onRetryOutline?: (outlineId: string) => Promise<void>;
}

// Internal state from useStageStore
{
  mode: 'edit' | 'playback' | 'autonomous';
  scenes: Scene[];
  currentSceneId: string;
  generatingOutlines: string[];
  stage?: StageData;
  setMode: (mode: string) => void;
}
```

### PlaybackChromeRoot Component
```typescript
interface PlaybackChromeRootHandle {
  teardown: () => Promise<void>;
}

// State managed internally
{
  activeSceneId: string;
  activeAgentId: string | null;
  chatMessages: UIMessage[];
  isGenerating: boolean;
  roundtableOpen: boolean;
}
```

### SceneRenderer Components
```typescript
interface SceneRendererProps {
  scene: Scene;
  onSceneChange?: (scene: Scene) => void;
  onNextScene?: () => void;
  isEditable?: boolean;
}

// Scene type discriminated union
type Scene = 
  | SlideScene & { type: 'slide' }
  | QuizScene & { type: 'quiz' }
  | InteractiveScene & { type: 'interactive' }
  | PBLScene & { type: 'pbl' }
  | WhiteboardScene & { type: 'whiteboard' };
```

## 🔐 Security & Validation

```mermaid
graph TB
    Input["User Input"]
    
    Input --> Validate["Validate Input<br/>- Type checking<br/>- Length limits<br/>- Pattern matching"]
    
    Validate --> Sanitize["Sanitize<br/>- XSS prevention<br/>- Script removal<br/>- HTML encode"]
    
    Sanitize --> Authorize["Authorize<br/>- Access code check<br/>- Provider key check<br/>- Rate limit check"]
    
    Authorize --> AuthOK{"Authorized?"}
    
    AuthOK -->|No| Reject["❌ Reject<br/>Error response"]
    AuthOK -->|Yes| Process["Process Request"]
    
    Process --> TypeCheck["Type Check<br/>- JSON schema<br/>- OpenAPI spec"]
    
    TypeCheck --> Execute["Execute Pipeline"]
    Execute --> Response["Response<br/>- Sanitized output<br/>- Validation headers"]
    
    style Input fill:#ffcdd2
    style Validate fill:#ffe0b2
    style Sanitize fill:#f8bbd0
    style Authorize fill:#b3e5fc
    style AuthOK fill:#ffe082
    style TypeCheck fill:#c8e6c9
    style Execute fill:#b2dfdb
    style Response fill:#d1c4e9
```

---

## 📚 Key Type Definitions

```typescript
// User Requirements for Generation
interface UserRequirements {
  topic?: string;
  document?: PdfContent;
  mode: 'generation' | 'discussion';
  sceneCount: number;
  agents: AgentConfig[];
  language: string;
  preferences?: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    format: ('slide' | 'quiz' | 'interactive' | 'pbl')[];
  };
}

// Scene Blueprint
interface SceneOutline {
  id: string;
  index: number;
  type: 'slide' | 'quiz' | 'interactive' | 'pbl' | 'whiteboard';
  title: string;
  topics: string[];
  learningObjectives: string[];
  estimatedDuration: number;
}

// Full Scene Data
interface Scene {
  id: string;
  index: number;
  type: string;
  title: string;
  content: SceneContent;
  media: MediaElement[];
  actions: Action[];
  agents: AgentInfo[];
  metadata: Record<string, any>;
}

// Chat Message
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  agentId?: string;
  content: string;
  timestamp: number;
  actions?: Action[];
}

// Agent Info
interface AgentInfo {
  id: string;
  name: string;
  role: 'teacher' | 'peer' | 'narrator';
  persona: string;
  avatar?: string;
  voice?: VoiceConfig;
  capabilities: string[];
}

// Action (Behavior Instruction)
interface Action {
  id: string;
  type: 'speak' | 'draw' | 'gesture' | 'interact' | 'write';
  target?: string;
  params: Record<string, any>;
  duration?: number;
}

// Streaming Event
type StatelessEvent = 
  | { type: 'textDelta'; index: number; delta: string }
  | { type: 'toolCall'; name: string; args: Record<string, any> }
  | { type: 'complete'; turnCount: number }
  | { type: 'error'; error: string };
```

---

This document provides a complete reference for understanding and navigating the OpenMAIC architecture at the component level, with detailed flows showing how data moves through the system and how users interact with various features.
