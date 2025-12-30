# Editor Platform (EP)

A modern, AI-powered code editor with BPMN 2.0 support, built as a full-stack web application. This platform combines a powerful Monaco-based code editor with an intelligent Claude AI assistant, comprehensive file management, Git integration, and business process modeling capabilities.

## ✨ Features

### Core Editing
- **Monaco Editor Integration** - Industry-standard code editor with syntax highlighting, IntelliSense, and multi-language support
- **BPMN 2.0 Support** - Create and edit business process diagrams using bpmn-js
- **Multi-tab Interface** - Work with multiple files simultaneously
- **Real-time File Watching** - Automatic updates when files change on disk
- **Markdown Preview** - Live rendering of markdown files

### File Management
- **Full File System Access** - Browse, create, edit, delete, move, and copy files
- **Recursive Directory Operations** - Bulk operations on multiple files and folders
- **Path Security** - Built-in protection against accessing restricted folders
- **File Tree Navigation** - Intuitive file explorer with expand/collapse functionality

### AI Assistant
- **Claude Integration** - Powered by Anthropic's Claude API
- **Streaming Responses** - Real-time AI responses with streaming support
- **Conversation History** - SQLite-backed conversation persistence
- **Code-aware Context** - AI understands your codebase and can help with editing tasks

### Version Control
- **Git Integration** - Full Git operations support
- **Branch Management** - Create, switch, and manage Git branches
- **Status Tracking** - View file changes and repository status
- **Commit Operations** - Stage and commit changes directly from the editor

### Developer Experience
- **WebSocket Support** - Real-time bidirectional communication
- **Keyboard Shortcuts** - Efficient navigation and operations
- **Resizable Panels** - Customizable layout to suit your workflow
- **Modern UI** - Clean, responsive interface built with React and Tailwind CSS

## 🏗️ Architecture

This is a **Turborepo monorepo** with the following structure:

```
EP/
├── apps/
│   ├── editor-server/       # Backend API (Koa.js + TypeScript)
│   └── editor-webclient/    # Frontend UI (React + Vite + TypeScript)
├── packages/
│   ├── eslint-config/       # Shared ESLint configurations
│   ├── typescript-config/   # Shared TypeScript configurations
│   └── ui/                  # Shared UI components
└── turbo.json              # Turborepo configuration
```

### Tech Stack

#### Backend (`editor-server`)
- **Koa.js** - Lightweight web framework
- **TypeScript** - Type-safe development
- **Anthropic SDK** - Claude AI integration
- **better-sqlite3** - SQLite database for conversations
- **simple-git** - Git operations
- **ws** - WebSocket server

#### Frontend (`editor-webclient`)
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe development
- **Monaco Editor** - Code editing
- **bpmn-js** - BPMN 2.0 diagram editing
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **marked** - Markdown rendering

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9.0.0
- **Anthropic API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EP
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create `.env` file in `apps/editor-server/`:
   ```env
   PORT=3001
   WORKSPACE_ROOT=.
   CORS_ORIGIN=http://localhost:5173
   CORS_CREDENTIALS=true
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```

   This will start:
   - Backend server at `http://localhost:3001`
   - Frontend dev server at `http://localhost:5173`
   - WebSocket server at `ws://localhost:3001/ws`

### Building for Production

```bash
# Build all apps and packages
pnpm build

# Start production server
cd apps/editor-server
pnpm start
```

Serve the built frontend from `apps/editor-webclient/dist/`.

## 📚 Project Structure

### Backend API Endpoints

#### File Operations
- `GET /api/files` - List files in directory
- `GET /api/files/tree` - Get recursive file tree
- `GET /api/files/content` - Read file content
- `POST /api/files/content` - Save file content
- `POST /api/files/create` - Create new file
- `DELETE /api/files/delete` - Delete file
- `POST /api/files/move` - Move file
- `POST /api/files/copy` - Copy file
- `POST /api/files/rename` - Rename file
- `POST /api/files/bulk-*` - Bulk operations

#### Git Operations
- `GET /api/git/status` - Get repository status
- `GET /api/git/branches` - List branches
- `POST /api/git/branches` - Create/switch branches
- `POST /api/git/commit` - Commit changes

#### Chat/AI
- `POST /api/chat` - Send message to Claude AI
- `GET /api/chat/conversations` - List conversations
- WebSocket at `/ws` - Real-time file watching and AI streaming

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `WORKSPACE_ROOT` | Root directory for file operations | `.` (current directory) |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `*` |
| `CORS_CREDENTIALS` | Enable CORS credentials | `true` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude | Required for AI features |

### Database

The server uses **SQLite** for conversation storage:
- Database file: `apps/editor-server/data/conversations.db`
- Automatic schema initialization
- WAL mode enabled for better concurrency
- Automatic cleanup of old conversations (24 hours)
- Graceful shutdown handling

### Restricted Folders

The following directories are protected from file operations:
- `node_modules/`
- `.git/`
- `dist/`
- `build/`

## 🎯 Development

### Available Scripts

```bash
# Run all apps in development mode
pnpm dev

# Build all apps and packages
pnpm build

# Lint all packages
pnpm lint

# Format code
pnpm format

# Type check
pnpm check-types
```

### Working with Specific Apps

```bash
# Run only the backend
pnpm dev --filter=editor-server

# Run only the frontend
pnpm dev --filter=editor-webclient

# Build specific app
pnpm build --filter=editor-server
```

### Adding Dependencies

```bash
# Add to backend
pnpm add <package> --filter=editor-server

# Add to frontend
pnpm add <package> --filter=editor-webclient

# Add to workspace root
pnpm add <package> -w
```

## 🔧 BPMN 2.0 Support

The editor includes **bpmn-js** for creating and editing BPMN 2.0 diagrams. This allows you to:
- Create business process models
- Edit BPMN diagrams visually
- Import/export BPMN XML files
- Integrate process modeling into your workflow

## 🤝 Contributing

This is a monorepo managed by **Turborepo** and **pnpm workspaces**. When contributing:

1. Make sure all tests pass: `pnpm check-types`
2. Format your code: `pnpm format`
3. Lint your code: `pnpm lint`
4. Build to ensure no errors: `pnpm build`

## 📝 License

Private project - not licensed for public use.

## 🙏 Acknowledgments

- **Monaco Editor** - Microsoft's code editor
- **bpmn-js** - BPMN 2.0 rendering and editing
- **Anthropic Claude** - AI assistance
- **Turborepo** - Monorepo build system
- **Vite** - Next-generation frontend tooling

---

Built with ❤️ using TypeScript, React, and Koa.js
