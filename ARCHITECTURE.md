# OpenMAIC - System Architecture Diagram

## High-Level Architecture

```mermaid
graph TB
    subgraph "🎓 Frontend Layer"
        UI["UI Components<br/>React 19 + TypeScript"]
        Stage["Stage<br/>mode: edit/playback"]
        EditChrome["EditChrome<br/>Pro Mode Editor"]
        PlayChrome["PlayChrome<br/>Content Renderer"]
        Editor["Slide Editor<br/>Canvas/Whiteboard"]
    end

    subgraph "🔄 Client State Management"
        ZustandStore["Zustand Stores<br/>Stage/Canvas/Settings"]
        I18n["i18n<br/>Internationalization"]
        Theme["Theme Provider<br/>Dark/Light Mode"]
    end

    subgraph "🌐 API Layer"
        ChatAPI["POST /chat<br/>Multi-Agent Orchestration"]
        GenAPI["POST /generate/*<br/>Scene Generation"]
        AudioAPI["POST /generate/tts<br/>POST /transcription<br/>Audio Services"]
        MediaAPI["POST /proxy-media<br/>Content Delivery"]
        ValidationAPI["Verify APIs<br/>Model/Provider Check"]
        SearchAPI["POST /web-search<br/>Information Retrieval"]
    end

    subgraph "🤖 Orchestration Engine (LangGraph)"
        Director["Director Node<br/>Agent Selection"]
        AgentGen["Agent Generator<br/>Response Generation"]
        ToolRegistry["Tool Schema Registry<br/>Action Definition"]
        Conv["Conversation Summarizer<br/>Context Compression"]
    end

    subgraph "🎬 Generation Pipeline"
        OutlineGen["Outline Generator<br/>Scene Structure"]
        SceneGen["Scene Generator<br/>Content Creation"]
        SceneBuilder["Scene Builder<br/>Compose Elements"]
        ActionParser["Action Parser<br/>Behavior Logic"]
        PostProc["Post-Processor<br/>Refinement"]
    end

    subgraph "🎨 Scene Renderers"
        SlideRender["Slide Renderer<br/>PPTX/PDFs"]
        QuizRender["Quiz Renderer<br/>Assessment"]
        InteractiveRender["Interactive Renderer<br/>Simulations/Games"]
        PBLRender["PBL Renderer<br/>Project Tasks"]
        WhiteboardRender["Whiteboard Renderer<br/>Diagrams"]
    end

    subgraph "🔌 Provider Integrations"
        LLMProvider["LLM Provider<br/>OpenAI/Claude/Gemini"]
        TTSProvider["TTS Provider<br/>Azure/OpenAI/VoxCPM2"]
        STTProvider["STT Provider<br/>Transcription"]
        SearchProvider["Search Provider<br/>Web/MiniMax/Brave"]
        ImageProvider["Image Provider<br/>Vision Models"]
    end

    subgraph "💾 Data & Storage"
        DB["IndexedDB<br/>Local Store"]
        PDFParse["PDF Parser<br/>Content Extract"]
        DocStore["Document Store<br/>Persistence"]
        MediaStore["Media Store<br/>Audio/Video"]
    end

    subgraph "🛠️ Utilities & Infrastructure"
        Logger["Logger<br/>Debug Tracking"]
        Utils["Utils<br/>Helpers/Config"]
        Export["Export Handler<br/>PPTX/HTML"]
        Import["Import Handler<br/>MAIC DSL"]
    end

    UI --> Stage
    Stage -->|edit| EditChrome --> Editor
    Stage -->|playback| PlayChrome
    Editor --> ZustandStore
    PlayChrome --> ZustandStore
    ZustandStore --> Theme
    ZustandStore --> I18n

    PlayChrome -->|POST /chat| ChatAPI
    PlayChrome -->|POST /generate| GenAPI
    PlayChrome -->|audio| AudioAPI
    PlayChrome -->|media| MediaAPI

    ChatAPI --> Director
    Director -->|streaming| AgentGen
    AgentGen --> ToolRegistry
    GenAPI --> OutlineGen --> SceneGen --> SceneBuilder
    SceneGen --> ActionParser
    SceneBuilder --> PostProc

    Director --> Conv
    Conv --> LLMProvider

    OutlineGen --> LLMProvider
    SceneGen --> LLMProvider
    ActionParser --> LLMProvider

    SceneBuilder -->|render| SlideRender
    SceneBuilder -->|render| QuizRender
    SceneBuilder -->|render| InteractiveRender
    SceneBuilder -->|render| PBLRender
    SceneBuilder -->|render| WhiteboardRender

    PlayChrome --> SlideRender
    PlayChrome --> QuizRender
    PlayChrome --> InteractiveRender
    PlayChrome --> PBLRender
    PlayChrome --> WhiteboardRender

    AudioAPI --> TTSProvider
    AudioAPI --> STTProvider
    MediaAPI --> ImageProvider
    SearchAPI --> SearchProvider

    Export --> DB
    Import --> DB
    DB --> PDFParse
    DocStore --> MediaStore

    GenAPI --> Logger
    ChatAPI --> Logger
```

## Detailed Component Architecture

```mermaid
graph TB
    subgraph "Frontend Components"
        direction TB
        subgraph "Layout"
            Header["Header<br/>Navigation/Settings"]
            Roundtable["Roundtable<br/>Agent Discussion"]
            Stage["Stage<br/>Content Area"]
        end
        
        subgraph "Scene Renderers"
            direction LR
            SR1["Slide Renderer"]
            SR2["Quiz Renderer"]
            SR3["Interactive<br/>Renderer"]
            SR4["Whiteboard<br/>Renderer"]
            SR5["3D Canvas"]
        end
        
        subgraph "Agent UI"
            AgentBar["Agent Bar<br/>Status/Controls"]
            Chat["Chat UI<br/>Messages"]
            Whiteboard["Whiteboard<br/>Drawing"]
        end

        subgraph "Settings/Config"
            SettingsDialog["Settings Modal"]
            LanguageSwitcher["Language Selector"]
            ThemeSwitcher["Theme Toggle"]
        end

        Header --> Roundtable
        Roundtable --> Stage
        Stage --> SR1
        Stage --> SR2
        Stage --> SR3
        Stage --> SR4
        Stage --> SR5
        Stage --> AgentBar
        Stage --> Chat
        Stage --> Whiteboard
        SettingsDialog --> LanguageSwitcher
        SettingsDialog --> ThemeSwitcher
    end

    subgraph "State Management (Zustand)"
        direction TB
        StageStore["Stage Store<br/>scenes/mode/currentScene"]
        CanvasStore["Canvas Store<br/>drawing/tools"]
        SettingsStore["Settings Store<br/>apiKeys/providers"]
        SnapshotStore["Snapshot Store<br/>undo/redo"]
        KeyboardStore["Keyboard Store<br/>shortcuts"]
    end

    subgraph "Data Flow"
        direction TB
        UserInput["User Input"]
        UserInput --> StageStore
        UserInput --> CanvasStore
        StageStore --> PlayChrome["PlaybackChrome<br/>Renderer"]
        CanvasStore --> PlayChrome
    end
```

## Generation Pipeline Deep Dive

```mermaid
graph TB
    subgraph "Generation Pipeline"
        Input["User Requirements<br/>Topic/PDF/Document"]
        
        subgraph "Stage 1: Outline"
            direction TB
            BuildContext["Build Course Context"]
            FormatPrompt["Format Agent Prompt"]
            OutlineGen["Generate Outlines<br/>LLM Call"]
            FallbackLogic["Apply Fallbacks"]
        end
        
        subgraph "Stage 2: Content"
            direction TB
            SceneGen["Generate Scenes<br/>Parallel LLM Calls"]
            ContentGen["Generate Content<br/>Text/Images/Actions"]
            ActionGen["Generate Actions<br/>Behaviors"]
            BuildScene["Build Complete Scene"]
        end
        
        subgraph "Post-Processing"
            direction TB
            RepairJSON["JSON Repair"]
            ValidateStructure["Validate Structure"]
            Interactive["Interactive Post-Processor"]
        end
        
        Output["Final Scenes<br/>Ready to Render"]
        
        Input --> BuildContext
        BuildContext --> FormatPrompt
        FormatPrompt --> OutlineGen
        OutlineGen --> FallbackLogic
        FallbackLogic --> SceneGen
        SceneGen --> ContentGen
        ContentGen --> ActionGen
        ActionGen --> BuildScene
        BuildScene --> RepairJSON
        RepairJSON --> ValidateStructure
        ValidateStructure --> Interactive
        Interactive --> Output
    end

    subgraph "LLM Processing"
        LLMProvider["Language Model<br/>Claude/GPT/Gemini"]
        VisionModel["Vision Model<br/>Image Analysis"]
        EmbeddingModel["Embedding Model<br/>Semantic Search"]
    end

    OutlineGen -.->|LLM| LLMProvider
    ContentGen -.->|LLM| LLMProvider
    ActionGen -.->|LLM| LLMProvider
    ContentGen -.->|Vision| VisionModel
```

## Multi-Agent Orchestration (LangGraph)

```mermaid
graph TB
    subgraph "Orchestration State Graph"
        direction TB
        
        subgraph "Input State"
            Msgs["Messages<br/>Chat History"]
            StoreState["Store State<br/>Current Stage/Scene"]
            Config["Config<br/>AgentIDs/Type"]
        end
        
        subgraph "Nodes"
            START[["START"]]
            Director["Director Node<br/>Decision Making"]
            AgentGen["Agent Generate<br/>Response Generation"]
            END[["END"]]
        end
        
        subgraph "Processing"
            ConvSummarize["Summarize Conv<br/>Context"]
            PromptBuilder["Build Prompt<br/>Structure"]
            CallLLM["Call LLM<br/>Streaming"]
            ParseResponse["Parse Response<br/>Format"]
        end
        
        START --> Director
        Director -->|end| END
        Director -->|next| AgentGen
        AgentGen --> END
        
        Director --> ConvSummarize
        ConvSummarize --> PromptBuilder
        PromptBuilder --> CallLLM
        CallLLM --> ParseResponse
        ParseResponse --> AgentGen
    end

    subgraph "Output Stream"
        SSE["SSE Events<br/>Real-time"]
        TextDelta["Text Delta"]
        ToolCall["Tool Call"]
        Complete["Complete"]
        
        ParseResponse --> SSE
        SSE --> TextDelta
        SSE --> ToolCall
        SSE --> Complete
    end
```

## API Endpoints & Data Flow

```mermaid
graph TB
    subgraph "POST /chat"
        direction TB
        ChatReq["Request<br/>messages/config"]
        Director["Director Graph"]
        ChatResp["SSE Stream<br/>Events"]
    end

    subgraph "POST /generate/scene-outlines-stream"
        direction TB
        OutlineReq["Request<br/>requirements"]
        OutlineGen["Outline Generator"]
        OutlineStream["Streaming Outlines"]
    end

    subgraph "POST /generate/scene-content"
        direction TB
        ContentReq["Request<br/>outline/context"]
        ContentGen["Scene Generator"]
        ContentResp["Full Scene JSON"]
    end

    subgraph "POST /generate/tts"
        direction TB
        TTSReq["Request<br/>text/voice"]
        TTSProvider["TTS Service"]
        AudioResp["Audio Blob"]
    end

    subgraph "POST /transcription"
        direction TB
        TranscribeReq["Request<br/>audio blob"]
        STTProvider["STT Service"]
        TextResp["Transcript"]
    end

    subgraph "POST /web-search"
        direction TB
        SearchReq["Request<br/>query"]
        SearchProvider["Search Service"]
        Results["Search Results"]
    end

    ChatReq --> Director --> ChatResp
    OutlineReq --> OutlineGen --> OutlineStream
    ContentReq --> ContentGen --> ContentResp
    TTSReq --> TTSProvider --> AudioResp
    TranscribeReq --> STTProvider --> TextResp
    SearchReq --> SearchProvider --> Results
```

## Storage Architecture

```mermaid
graph TB
    subgraph "Client Storage"
        IDB["IndexedDB<br/>Local Persistence"]
        LocalState["Local State<br/>Zustand"]
        SessionStore["Session Store<br/>Temp Data"]
    end

    subgraph "Blob Storage"
        MediaBlobs["Media Blobs<br/>Audio/Images"]
        PDFBuffer["PDF Buffer<br/>Raw Data"]
    end

    subgraph "Document Management"
        StageData["Stage Data<br/>scenes/slides"]
        QuizData["Quiz Data<br/>questions/answers"]
        MediaData["Media Data<br/>URLs/metadata"]
    end

    IDB --> StageData
    IDB --> QuizData
    IDB --> MediaData
    LocalState --> SessionStore
    MediaBlobs --> IDB
    PDFBuffer --> IDB
```

## Key Type Definitions

- **Scene**: Base unit of learning content (slide/quiz/interactive/PBL)
- **Stage**: Collection of scenes + metadata
- **Agent**: AI character with personality/actions
- **Action**: Behavioral instruction (speak/draw/gesture)
- **Message**: Chat item with role/content
- **SceneOutline**: Blueprint before full generation
- **GenerationContext**: Configuration for generation pipeline
- **StatelessEvent**: Streaming event type (textDelta/toolCall/complete)

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5, Next.js 16 |
| **State** | Zustand, Immer |
| **Styling** | Tailwind CSS 4, Motion |
| **Rendering** | Custom Canvas, Three.js, ProseMirror |
| **LLM** | LangGraph, AI SDK, LangChain |
| **Generation** | Custom Pipeline, JSON Repair |
| **Audio** | Web Audio API, TTS/STT Providers |
| **Export** | pptxgenjs, jszip |
| **Testing** | Vitest, Playwright |
| **Storage** | IndexedDB (Dexie) |
| **Internationalization** | i18next |
| **Icons** | Lucide React |

## Data Models

```mermaid
graph TB
    Stage["Stage<br/>id/title/scenes"]
    Scene["Scene<br/>id/type/content"]
    Agent["Agent<br/>id/name/persona"]
    Message["Message<br/>role/content/agent"]
    MediaElement["MediaElement<br/>id/url/type"]
    Action["Action<br/>type/target/params"]

    Stage -->|contains| Scene
    Scene -->|has| Agent
    Agent -->|produces| Message
    Scene -->|contains| MediaElement
    Agent -->|performs| Action
```
