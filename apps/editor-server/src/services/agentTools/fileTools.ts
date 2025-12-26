import Anthropic from '@anthropic-ai/sdk';

/**
 * File system tool definitions
 */
export const fileTools: Anthropic.Tool[] = [
  {
    name: 'file_read',
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
    name: 'file_write',
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
    name: 'file_list',
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
    name: 'file_search',
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
  {
    name: 'file_delete',
    description: 'Delete a file or directory from the workspace. Use this to remove files that are no longer needed. Be careful - this action cannot be undone.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The relative path to the file or directory from the workspace root',
        },
      },
      required: ['path'],
    },
  },
];
