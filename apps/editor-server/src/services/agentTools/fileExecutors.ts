import { readFile, writeFile, readdir, stat, mkdir, unlink, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { WORKSPACE_ROOT } from '../../config';
import { isSafePath } from '../../utils/pathUtils';
import { isRestrictedPath } from '../../utils/restrictedFolders';
import { fileWatcher } from '../fileWatcher';

export interface ExecuteFileToolOptions {
  /**
   * Whether to notify file watcher of file changes
   */
  notifyFileWatcher?: boolean;
}

/**
 * Execute file system tool
 */
export async function executeFileTool(
  toolName: string,
  toolInput: any,
  options: ExecuteFileToolOptions = {}
): Promise<string> {
  const { notifyFileWatcher = false } = options;

  try {
    switch (toolName) {
      case 'file_read': {
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

      case 'file_write': {
        const filePath = join(WORKSPACE_ROOT, toolInput.path);

        console.log(`[file_write] Attempting to write file: ${filePath}`);
        console.log(`[file_write] Relative path: ${toolInput.path}`);
        console.log(`[file_write] Content length: ${toolInput.content?.length || 0} characters`);

        if (!isSafePath(filePath)) {
          const error = 'Access denied: path outside workspace';
          console.error(`[file_write] ${error}`);
          return JSON.stringify({ error });
        }

        if (isRestrictedPath(filePath)) {
          const error = 'Access denied: cannot write to restricted folders';
          console.error(`[file_write] ${error}`);
          return JSON.stringify({ error });
        }

        // Check if file exists
        let fileExists = false;
        try {
          await stat(filePath);
          fileExists = true;
          console.log(`[file_write] File exists, will be modified`);
        } catch {
          // File doesn't exist, will be created
          fileExists = false;
          console.log(`[file_write] File does not exist, will be created`);
        }

        // Ensure directory exists
        const dirPath = dirname(filePath);
        try {
          await mkdir(dirPath, { recursive: true });
          console.log(`[file_write] Directory ensured: ${dirPath}`);
        } catch (error) {
          // Directory might already exist, but log if there's an actual error
          if (error instanceof Error && error.message.includes('EEXIST') === false) {
            console.error(`[file_write] Error creating directory:`, error);
          }
        }

        try {
          await writeFile(filePath, toolInput.content, 'utf-8');
          console.log(`[file_write] Successfully wrote file: ${filePath}`);

          // Notify file watcher if enabled
          if (notifyFileWatcher) {
            if (fileExists) {
              fileWatcher.notifyFileModified(toolInput.path, toolInput.content);
            } else {
              fileWatcher.notifyFileCreated(toolInput.path, toolInput.content);
            }
            console.log(`[file_write] File watcher notified`);
          }

          return JSON.stringify({ success: true, path: toolInput.path });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[file_write] Error writing file:`, errorMessage, error);
          return JSON.stringify({ error: `Failed to write file: ${errorMessage}` });
        }
      }

      case 'file_list': {
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

      case 'file_search': {
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

      case 'file_delete': {
        const filePath = join(WORKSPACE_ROOT, toolInput.path);

        console.log(`[file_delete] Attempting to delete: ${filePath}`);
        console.log(`[file_delete] Relative path: ${toolInput.path}`);

        if (!isSafePath(filePath)) {
          const error = 'Access denied: path outside workspace';
          console.error(`[file_delete] ${error}`);
          return JSON.stringify({ error });
        }

        if (isRestrictedPath(filePath)) {
          const error = 'Access denied: cannot delete restricted folders';
          console.error(`[file_delete] ${error}`);
          return JSON.stringify({ error });
        }

        try {
          const stats = await stat(filePath);
          
          if (stats.isDirectory()) {
            // Remove directory recursively
            await rm(filePath, { recursive: true, force: true });
            console.log(`[file_delete] Successfully deleted directory: ${filePath}`);
          } else {
            // Remove file
            await unlink(filePath);
            console.log(`[file_delete] Successfully deleted file: ${filePath}`);
          }

          // Notify file watcher if enabled
          if (notifyFileWatcher) {
            fileWatcher.notifyFileDeleted(toolInput.path);
            console.log(`[file_delete] File watcher notified`);
          }

          return JSON.stringify({ success: true, path: toolInput.path });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[file_delete] Error deleting file:`, errorMessage, error);
          return JSON.stringify({ error: `Failed to delete file: ${errorMessage}` });
        }
      }

      default:
        return JSON.stringify({ error: `Unknown file tool: ${toolName}` });
    }
  } catch (error) {
    return JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
