import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { WORKSPACE_ROOT } from '../config';
import { isSafePath, toRelativePath } from '../utils/pathUtils';
import { isRestrictedPath } from '../utils/restrictedFolders';
import { fileWatcher } from './fileWatcher';
import Anthropic from '@anthropic-ai/sdk';

/**
 * File system tools available to the agent
 */
export const tools: Anthropic.Tool[] = [
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

export interface ExecuteToolOptions {
  /**
   * Whether to notify file watcher of file changes
   */
  notifyFileWatcher?: boolean;
}

/**
 * Execute a tool call
 */
export async function executeTool(
  toolName: string,
  toolInput: any,
  options: ExecuteToolOptions = {}
): Promise<string> {
  const { notifyFileWatcher = false } = options;

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

        console.log(`[write_file] Attempting to write file: ${filePath}`);
        console.log(`[write_file] Relative path: ${toolInput.path}`);
        console.log(`[write_file] Content length: ${toolInput.content?.length || 0} characters`);

        if (!isSafePath(filePath)) {
          const error = 'Access denied: path outside workspace';
          console.error(`[write_file] ${error}`);
          return JSON.stringify({ error });
        }

        if (isRestrictedPath(filePath)) {
          const error = 'Access denied: cannot write to restricted folders';
          console.error(`[write_file] ${error}`);
          return JSON.stringify({ error });
        }

        // Check if file exists
        let fileExists = false;
        try {
          await stat(filePath);
          fileExists = true;
          console.log(`[write_file] File exists, will be modified`);
        } catch {
          // File doesn't exist, will be created
          fileExists = false;
          console.log(`[write_file] File does not exist, will be created`);
        }

        // Ensure directory exists
        const dirPath = dirname(filePath);
        try {
          await mkdir(dirPath, { recursive: true });
          console.log(`[write_file] Directory ensured: ${dirPath}`);
        } catch (error) {
          // Directory might already exist, but log if there's an actual error
          if (error instanceof Error && error.message.includes('EEXIST') === false) {
            console.error(`[write_file] Error creating directory:`, error);
          }
        }

        try {
          await writeFile(filePath, toolInput.content, 'utf-8');
          console.log(`[write_file] Successfully wrote file: ${filePath}`);

          // Notify file watcher if enabled
          if (notifyFileWatcher) {
            if (fileExists) {
              fileWatcher.notifyFileModified(toolInput.path, toolInput.content);
            } else {
              fileWatcher.notifyFileCreated(toolInput.path, toolInput.content);
            }
            console.log(`[write_file] File watcher notified`);
          }

          return JSON.stringify({ success: true, path: toolInput.path });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[write_file] Error writing file:`, errorMessage, error);
          return JSON.stringify({ error: `Failed to write file: ${errorMessage}` });
        }
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
 * System prompt for the Claude agent
 */
export function getSystemPrompt(): string {
  return `You are an expert coding assistant helping a developer work on their project. You have access to their workspace and can read, write, and search files.

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
}

