# Editor Server

Backend server for the editor file explorer functionality.

## Tech Stack

- **Koa.js** - Web framework
- **TypeScript** - Type safety
- **pnpm** - Package manager

## Features

- File tree API endpoints
- File content read/write
- Recursive directory traversal
- Path security validation

## API Endpoints

### GET `/api/files`
Get list of files and folders in a directory.

**Query Parameters:**
- `path` (optional): Directory path. Defaults to workspace root.

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "type": "file" | "folder",
    "path": "string",
    "children": [] // only for folders
  }
]
```

### GET `/api/files/content`
Get content of a file.

**Query Parameters:**
- `path` (required): File path.

**Response:**
```json
{
  "content": "string"
}
```

### POST `/api/files/content`
Save content to a file.

**Body:**
```json
{
  "path": "string",
  "content": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET `/api/files/tree`
Get recursive file tree structure.

**Query Parameters:**
- `path` (optional): Root directory path. Defaults to workspace root.
- `maxDepth` (optional): Maximum depth for recursion. Defaults to 3.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "type": "folder",
  "path": "string",
  "children": [...]
}
```

## Environment Variables

Create a `.env` file in the `apps/editor-server` directory:

### Configuration Options

- `PORT` - Server port (default: 3001)
- `WORKSPACE_ROOT` - Root directory for file operations (default: current working directory)
- `CORS_ORIGIN` - Allowed CORS origins. Use `*` for all origins, or specify comma-separated URLs (default: `*`)
- `CORS_CREDENTIALS` - Enable CORS credentials (cookies, authorization headers) (default: `true`)
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude agent (required for chat functionality)

### Example `.env` file

```env
PORT=3001
WORKSPACE_ROOT=.
CORS_ORIGIN=*
CORS_CREDENTIALS=true
ANTHROPIC_API_KEY=your_api_key_here
```

### Data Storage

The server uses SQLite for conversation storage:
- Database file: `data/conversations.db`
- Automatic schema initialization on first run
- WAL mode for better concurrency
- Automatic cleanup of conversations older than 24 hours
- Graceful shutdown handling

For production, set `CORS_ORIGIN` to specific allowed origins:
```env
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```

