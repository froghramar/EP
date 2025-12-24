import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { WORKSPACE_ROOT, CLAUDE_MODEL } from '../config';
import { isSafePath } from '../utils/pathUtils';
import { isRestrictedPath } from '../utils/restrictedFolders';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  message: string;
  toolsUsed?: string[];
}

/**
 * File system tools available to the agent
 */
const tools: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the workspace. Use this to examine code, configuration files, or any text-based files.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The relative path to the file from the workspace root',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or update a file in the workspace. Use this to create new files or modify existing ones.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The relative path to the file from the workspace root',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'list_files',
    description: 'List files and directories in a given path. Use this to explore the project structure.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The relative path to the directory from the workspace root (use "." for root)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_files',
    description: 'Search for files containing specific text or patterns. Use this to find code, functions, or specific content.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The text or pattern to search for',
        },
        path: {
          type: 'string',
          description: 'Optional: limit search to a specific directory',
        },
      },
      required: ['query'],
    },
  },
];

/**
 * Execute a tool call
 */
async function executeTool(toolName: string, toolInput: any): Promise<string> {
  try {
    switch (toolName) {
      case 'read_file': {
        const filePath = join(WORKSPACE_ROOT, toolInput.path);
        
        if (!isSafePath(filePath)) {
          return JSON.stringify({ error: 'Access denied: path outside workspace' });
        }
        
        if (isRestrictedPath(filePath)) {
          return JSON.stringify({ error: 'Access denied: cannot read restricted folders' });
        }
        
        const content = await readFile(filePath, 'utf-8');
        return JSON.stringify({ content, path: toolInput.path });
      }

      case 'write_file': {
        const filePath = join(WORKSPACE_ROOT, toolInput.path);
        
        if (!isSafePath(filePath)) {
          return JSON.stringify({ error: 'Access denied: path outside workspace' });
        }
        
        if (isRestrictedPath(filePath)) {
          return JSON.stringify({ error: 'Access denied: cannot write to restricted folders' });
        }
        
        await writeFile(filePath, toolInput.content, 'utf-8');
        return JSON.stringify({ success: true, path: toolInput.path });
      }

      case 'list_files': {
        const dirPath = join(WORKSPACE_ROOT, toolInput.path);
        
        if (!isSafePath(dirPath)) {
          return JSON.stringify({ error: 'Access denied: path outside workspace' });
        }
        
        const entries = await readdir(dirPath);
        const files = [];
        
        for (const entry of entries) {
          const entryPath = join(dirPath, entry);
          if (isRestrictedPath(entryPath)) continue;
          
          const stats = await stat(entryPath);
          files.push({
            name: entry,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
          });
        }
        
        return JSON.stringify({ files, path: toolInput.path });
      }

      case 'search_files': {
        // Simple grep-like search implementation
        const searchPath = toolInput.path ? join(WORKSPACE_ROOT, toolInput.path) : WORKSPACE_ROOT;
        const results: Array<{ file: string; line: number; content: string }> = [];
        
        async function searchInDirectory(dir: string) {
          const entries = await readdir(dir);
          
          for (const entry of entries) {
            const entryPath = join(dir, entry);
            if (isRestrictedPath(entryPath)) continue;
            
            const stats = await stat(entryPath);
            
            if (stats.isDirectory()) {
              await searchInDirectory(entryPath);
            } else if (stats.isFile()) {
              try {
                const content = await readFile(entryPath, 'utf-8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                  if (line.toLowerCase().includes(toolInput.query.toLowerCase())) {
                    results.push({
                      file: entryPath.replace(WORKSPACE_ROOT, '').replace(/^[/\\]/, ''),
                      line: index + 1,
                      content: line.trim(),
                    });
                  }
                });
              } catch {
                // Skip files that can't be read as text
              }
            }
          }
        }
        
        await searchInDirectory(searchPath);
        return JSON.stringify({ results: results.slice(0, 50), query: toolInput.query });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Process a chat message with the Claude agent
 */
export async function processAgentMessage(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<AgentResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  const systemPrompt = `You are an expert coding assistant helping a developer work on their project. You have access to their workspace and can read, write, and search files.

Your capabilities:
- Read and analyze code files
- Write or modify files
- List directory contents
- Search for code patterns or text

Guidelines:
- Be concise and helpful
- When asked to make changes, use the tools to actually modify files
- Always explain what you're doing
- If you need more context, ask questions or read relevant files
- Suggest best practices and improvements
- Help debug issues by examining code

The workspace root is: ${WORKSPACE_ROOT}`;

  let response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages,
  });

  const toolsUsed: string[] = [];

  // Handle tool use loop
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    const toolResults: Anthropic.MessageParam = {
      role: 'user',
      content: await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          toolsUsed.push(toolUse.name);
          const result = await executeTool(toolUse.name, toolUse.input);
          
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: result,
          };
        })
      ),
    };

    messages.push(
      { role: 'assistant', content: response.content },
      toolResults
    );

    response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  // Extract text response
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );
  const message = textBlocks.map(block => block.text).join('\n');

  return {
    message,
    toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
  };
}

