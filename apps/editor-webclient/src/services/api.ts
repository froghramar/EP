import type { FileNode } from '../store/useEditorStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface FileContentResponse {
  content: string;
}

export interface FileSaveRequest {
  path: string;
  content: string;
}

export interface ApiError {
  error: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const fileApi = {
  /**
   * Get list of files in a directory
   */
  async getFiles(path?: string): Promise<FileNode[]> {
    const url = new URL(`${API_BASE_URL}/api/files`);
    if (path) {
      url.searchParams.set('path', path);
    }
    
    const response = await fetch(url.toString());
    return handleResponse<FileNode[]>(response);
  },

  /**
   * Get recursive file tree structure
   */
  async getFileTree(path?: string, maxDepth: number = 3): Promise<FileNode | null> {
    const url = new URL(`${API_BASE_URL}/api/files/tree`);
    if (path) {
      url.searchParams.set('path', path);
    }
    url.searchParams.set('maxDepth', maxDepth.toString());
    
    const response = await fetch(url.toString());
    return handleResponse<FileNode | null>(response);
  },

  /**
   * Get content of a file
   */
  async getFileContent(filePath: string): Promise<string> {
    const url = new URL(`${API_BASE_URL}/api/files/content`);
    url.searchParams.set('path', filePath);
    
    const response = await fetch(url.toString());
    const data = await handleResponse<FileContentResponse>(response);
    return data.content;
  },

  /**
   * Save content to a file
   */
  async saveFileContent(filePath: string, content: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/files/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: filePath,
        content,
      } as FileSaveRequest),
    });
    
    await handleResponse<{ success: boolean }>(response);
  },
};

