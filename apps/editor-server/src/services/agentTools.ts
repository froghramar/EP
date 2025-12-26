import { readFile, writeFile, readdir, stat, mkdir, unlink, rm } from 'fs/promises';
import { join, dirname } from 'path';
import axios, { AxiosError } from 'axios';
import { WORKSPACE_ROOT, WORDPRESS_API_URL, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD } from '../config';
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
  {
    name: 'delete_file',
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
  {
    name: 'wp_list_posts',
    description: 'List WordPress posts with optional filtering. Returns an array of posts.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of posts per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        status: {
          type: 'string',
          description: 'Filter by post status',
          enum: ['publish', 'draft', 'pending', 'private', 'future'],
        },
        search: {
          type: 'string',
          description: 'Search posts by keyword',
        },
        author: {
          type: 'number',
          description: 'Filter by author ID',
        },
      },
    },
  },
  {
    name: 'wp_get_post',
    description: 'Get a specific WordPress post by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The post ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_create_post',
    description: 'Create a new WordPress post.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The post title',
        },
        content: {
          type: 'string',
          description: 'The post content (HTML allowed)',
        },
        status: {
          type: 'string',
          description: 'Post status (default: draft)',
          enum: ['publish', 'draft', 'pending', 'private', 'future'],
        },
        excerpt: {
          type: 'string',
          description: 'The post excerpt',
        },
        categories: {
          type: 'array',
          description: 'Array of category IDs',
          items: { type: 'number' },
        },
        tags: {
          type: 'array',
          description: 'Array of tag IDs',
          items: { type: 'number' },
        },
        featured_media: {
          type: 'number',
          description: 'Featured media ID',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'wp_update_post',
    description: 'Update an existing WordPress post.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The post ID to update',
        },
        title: {
          type: 'string',
          description: 'The post title',
        },
        content: {
          type: 'string',
          description: 'The post content (HTML allowed)',
        },
        status: {
          type: 'string',
          description: 'Post status',
          enum: ['publish', 'draft', 'pending', 'private', 'future'],
        },
        excerpt: {
          type: 'string',
          description: 'The post excerpt',
        },
        categories: {
          type: 'array',
          description: 'Array of category IDs',
          items: { type: 'number' },
        },
        tags: {
          type: 'array',
          description: 'Array of tag IDs',
          items: { type: 'number' },
        },
        featured_media: {
          type: 'number',
          description: 'Featured media ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_post',
    description: 'Delete a WordPress post by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The post ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass trash and force deletion (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_list_pages',
    description: 'List WordPress pages with optional filtering.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of pages per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        status: {
          type: 'string',
          description: 'Filter by page status',
          enum: ['publish', 'draft', 'pending', 'private'],
        },
        search: {
          type: 'string',
          description: 'Search pages by keyword',
        },
      },
    },
  },
  {
    name: 'wp_get_page',
    description: 'Get a specific WordPress page by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The page ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_create_page',
    description: 'Create a new WordPress page.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The page title',
        },
        content: {
          type: 'string',
          description: 'The page content (HTML allowed)',
        },
        status: {
          type: 'string',
          description: 'Page status (default: draft)',
          enum: ['publish', 'draft', 'pending', 'private'],
        },
        parent: {
          type: 'number',
          description: 'Parent page ID',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'wp_update_page',
    description: 'Update an existing WordPress page.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The page ID to update',
        },
        title: {
          type: 'string',
          description: 'The page title',
        },
        content: {
          type: 'string',
          description: 'The page content (HTML allowed)',
        },
        status: {
          type: 'string',
          description: 'Page status',
          enum: ['publish', 'draft', 'pending', 'private'],
        },
        parent: {
          type: 'number',
          description: 'Parent page ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_delete_page',
    description: 'Delete a WordPress page by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The page ID to delete',
        },
        force: {
          type: 'boolean',
          description: 'Whether to bypass trash and force deletion (default: false)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_list_media',
    description: 'List WordPress media items.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of items per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        media_type: {
          type: 'string',
          description: 'Filter by media type',
          enum: ['image', 'video', 'audio', 'application'],
        },
        search: {
          type: 'string',
          description: 'Search media by keyword',
        },
      },
    },
  },
  {
    name: 'wp_get_media',
    description: 'Get a specific WordPress media item by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The media ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'wp_list_categories',
    description: 'List WordPress categories.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of categories per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        search: {
          type: 'string',
          description: 'Search categories by keyword',
        },
        hide_empty: {
          type: 'boolean',
          description: 'Whether to hide categories with no posts (default: false)',
        },
      },
    },
  },
  {
    name: 'wp_create_category',
    description: 'Create a new WordPress category.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The category name',
        },
        description: {
          type: 'string',
          description: 'The category description',
        },
        parent: {
          type: 'number',
          description: 'Parent category ID',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'wp_list_tags',
    description: 'List WordPress tags.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of tags per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        search: {
          type: 'string',
          description: 'Search tags by keyword',
        },
        hide_empty: {
          type: 'boolean',
          description: 'Whether to hide tags with no posts (default: false)',
        },
      },
    },
  },
  {
    name: 'wp_create_tag',
    description: 'Create a new WordPress tag.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The tag name',
        },
        description: {
          type: 'string',
          description: 'The tag description',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'wp_list_comments',
    description: 'List WordPress comments.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of comments per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        post: {
          type: 'number',
          description: 'Filter by post ID',
        },
        status: {
          type: 'string',
          description: 'Filter by comment status',
          enum: ['approved', 'hold', 'spam', 'trash'],
        },
      },
    },
  },
  {
    name: 'wp_create_comment',
    description: 'Create a new WordPress comment.',
    input_schema: {
      type: 'object',
      properties: {
        post: {
          type: 'number',
          description: 'The post ID to comment on',
        },
        content: {
          type: 'string',
          description: 'The comment content',
        },
        author_name: {
          type: 'string',
          description: 'Comment author name',
        },
        author_email: {
          type: 'string',
          description: 'Comment author email',
        },
      },
      required: ['post', 'content'],
    },
  },
  {
    name: 'wp_list_users',
    description: 'List WordPress users.',
    input_schema: {
      type: 'object',
      properties: {
        per_page: {
          type: 'number',
          description: 'Number of users per page (default: 10, max: 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        search: {
          type: 'string',
          description: 'Search users by keyword',
        },
        roles: {
          type: 'array',
          description: 'Filter by user roles',
          items: { type: 'string' },
        },
      },
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

      case 'delete_file': {
        const filePath = join(WORKSPACE_ROOT, toolInput.path);

        console.log(`[delete_file] Attempting to delete: ${filePath}`);
        console.log(`[delete_file] Relative path: ${toolInput.path}`);

        if (!isSafePath(filePath)) {
          const error = 'Access denied: path outside workspace';
          console.error(`[delete_file] ${error}`);
          return JSON.stringify({ error });
        }

        if (isRestrictedPath(filePath)) {
          const error = 'Access denied: cannot delete restricted folders';
          console.error(`[delete_file] ${error}`);
          return JSON.stringify({ error });
        }

        try {
          const stats = await stat(filePath);
          
          if (stats.isDirectory()) {
            // Remove directory recursively
            await rm(filePath, { recursive: true, force: true });
            console.log(`[delete_file] Successfully deleted directory: ${filePath}`);
          } else {
            // Remove file
            await unlink(filePath);
            console.log(`[delete_file] Successfully deleted file: ${filePath}`);
          }

          // Notify file watcher if enabled
          if (notifyFileWatcher) {
            fileWatcher.notifyFileDeleted(toolInput.path);
            console.log(`[delete_file] File watcher notified`);
          }

          return JSON.stringify({ success: true, path: toolInput.path });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[delete_file] Error deleting file:`, errorMessage, error);
          return JSON.stringify({ error: `Failed to delete file: ${errorMessage}` });
        }
      }

      // WordPress REST API Tools
      case 'wp_list_posts':
      case 'wp_list_pages':
      case 'wp_list_media':
      case 'wp_list_categories':
      case 'wp_list_tags':
      case 'wp_list_comments':
      case 'wp_list_users': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        const endpointMap: Record<string, string> = {
          wp_list_posts: '/wp/v2/posts',
          wp_list_pages: '/wp/v2/pages',
          wp_list_media: '/wp/v2/media',
          wp_list_categories: '/wp/v2/categories',
          wp_list_tags: '/wp/v2/tags',
          wp_list_comments: '/wp/v2/comments',
          wp_list_users: '/wp/v2/users',
        };

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}`,
            params: toolInput,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data, total: response.headers['x-wp-total'], totalPages: response.headers['x-wp-totalpages'] });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_get_post':
      case 'wp_get_page':
      case 'wp_get_media': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        const endpointMap: Record<string, string> = {
          wp_get_post: '/wp/v2/posts',
          wp_get_page: '/wp/v2/pages',
          wp_get_media: '/wp/v2/media',
        };

        try {
          const config: any = {
            method: 'GET',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${toolInput.id}`,
            headers: { 'Content-Type': 'application/json' },
          };

          if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
            config.auth = { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD };
          }

          const response = await axios(config);
          return JSON.stringify({ success: true, data: response.data });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_create_post':
      case 'wp_create_page':
      case 'wp_create_category':
      case 'wp_create_tag':
      case 'wp_create_comment': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for creating content. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        const endpointMap: Record<string, string> = {
          wp_create_post: '/wp/v2/posts',
          wp_create_page: '/wp/v2/pages',
          wp_create_category: '/wp/v2/categories',
          wp_create_tag: '/wp/v2/tags',
          wp_create_comment: '/wp/v2/comments',
        };

        try {
          const response = await axios({
            method: 'POST',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}`,
            data: toolInput,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Created successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_update_post':
      case 'wp_update_page': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for updating content. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        const endpointMap: Record<string, string> = {
          wp_update_post: '/wp/v2/posts',
          wp_update_page: '/wp/v2/pages',
        };

        const { id, ...updateData } = toolInput;

        try {
          const response = await axios({
            method: 'PUT',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${id}`,
            data: updateData,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Updated successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      case 'wp_delete_post':
      case 'wp_delete_page': {
        if (!WORDPRESS_API_URL) {
          return JSON.stringify({ error: 'WordPress API is not configured. Set WORDPRESS_API_URL in your environment.' });
        }

        if (!WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
          return JSON.stringify({ error: 'WordPress authentication is required for deleting content. Set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD.' });
        }

        const endpointMap: Record<string, string> = {
          wp_delete_post: '/wp/v2/posts',
          wp_delete_page: '/wp/v2/pages',
        };

        try {
          const params: any = {};
          if (toolInput.force) {
            params.force = true;
          }

          const response = await axios({
            method: 'DELETE',
            url: `${WORDPRESS_API_URL}${endpointMap[toolName]}/${toolInput.id}`,
            params,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: WORDPRESS_USERNAME, password: WORDPRESS_APP_PASSWORD },
          });

          return JSON.stringify({ success: true, data: response.data, message: 'Deleted successfully' });
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return JSON.stringify({ error: error.message, status: error.response?.status, data: error.response?.data });
          }
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
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
- If you need more context, ask questions or read relevant files
- Suggest best practices and improvements
- Help debug issues by examining code${wpApiInfo ? '\n- For WordPress operations, use the wordpress_api tool with appropriate endpoints from https://developer.wordpress.org/rest-api/reference/' : ''}

The workspace root is: ${WORKSPACE_ROOT}`;
}

