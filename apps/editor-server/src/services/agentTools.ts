import Anthropic from '@anthropic-ai/sdk';
import { fileTools } from './agentTools/fileTools';
import { wordpressTools } from './agentTools/wordpressTools';
import { executeFileTool } from './agentTools/fileExecutors';
import { executeWordpressTool } from './agentTools/wordpressExecutors';
import { WORDPRESS_API_URL } from '../config';

/**
 * All tools available to the agent
 */
export const tools: Anthropic.Tool[] = [
  ...fileTools,
  ...wordpressTools,
];

export interface ExecuteToolOptions {
  /**
   * Whether to notify file watcher of file changes
   */
  notifyFileWatcher?: boolean;
}

/**
 * Execute a tool call by routing to the appropriate executor
 */
export async function executeTool(
  toolName: string,
  toolInput: any,
  options: ExecuteToolOptions = {}
): Promise<string> {
  // Route to file system executor
  if (toolName.startsWith('read_') || toolName.startsWith('write_') || 
      toolName.startsWith('list_') || toolName.startsWith('search_') || 
      toolName.startsWith('delete_')) {
    return executeFileTool(toolName, toolInput, options);
  }
  
  // Route to WordPress executor
  if (toolName.startsWith('wp_')) {
    return executeWordpressTool(toolName, toolInput);
  }
  
  // Unknown tool
  return JSON.stringify({ error: `Unknown tool: ${toolName}` });
}

/**
 * System prompt for the Claude agent
 */
export function getSystemPrompt(): string {
  const wpApiInfo = WORDPRESS_API_URL 
    ? `\n- Manage WordPress content via REST API (posts, pages, media, users, comments, etc.)\n  WordPress API: ${WORDPRESS_API_URL}` 
    : '';

  return `You are an expert coding assistant helping a developer work on their project. You have access to their workspace and can read, write, and search files.

Your capabilities:
- Read and analyze code files
- Write or modify files
- Delete files or directories
- List directory contents
- Search for code patterns or text${wpApiInfo}

Guidelines:
- Be concise and helpful
- When asked to make changes, use the tools to actually modify files
- Always explain what you're doing
- Ask for clarification if the request is unclear
- Suggest best practices when appropriate

Remember: You're working with real files in the user's workspace. Be careful with destructive operations like deleting files.`;
}

