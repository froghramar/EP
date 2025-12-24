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

export interface CreateFileRequest {
  path: string;
  type: 'file' | 'folder';
  content?: string;
}

export interface RenameFileRequest {
  path: string;
  newName: string;
}

export interface CopyFileRequest {
  path: string;
  destination: string;
}

export interface MoveFileRequest {
  path: string;
  destination: string;
}

export interface BulkDeleteRequest {
  paths: string[];
}

export interface BulkCopyRequest {
  paths: string[];
  destination: string;
}

export interface BulkMoveRequest {
  paths: string[];
  destination: string;
}

export interface BulkOperationResult {
  path: string;
  destination?: string;
  success: boolean;
  error?: string;
}

export interface BulkOperationResponse {
  results: BulkOperationResult[];
  success: boolean;
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

  /**
   * Create a file or folder
   */
  async createFile(path: string, type: 'file' | 'folder', content?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/files/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        type,
        content,
      } as CreateFileRequest),
    });
    
    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Delete a file or folder
   */
  async deleteFile(path: string): Promise<void> {
    const url = new URL(`${API_BASE_URL}/api/files`);
    url.searchParams.set('path', path);
    
    const response = await fetch(url.toString(), {
      method: 'DELETE',
    });
    
    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Rename a file or folder
   */
  async renameFile(path: string, newName: string): Promise<{ newPath: string }> {
    const response = await fetch(`${API_BASE_URL}/api/files/rename`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        newName,
      } as RenameFileRequest),
    });
    
    return handleResponse<{ success: boolean; newPath: string }>(response);
  },

  /**
   * Copy a file or folder
   */
  async copyFile(path: string, destination: string): Promise<{ destination: string }> {
    const response = await fetch(`${API_BASE_URL}/api/files/copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        destination,
      } as CopyFileRequest),
    });
    
    return handleResponse<{ success: boolean; destination: string }>(response);
  },

  /**
   * Move a file or folder
   */
  async moveFile(path: string, destination: string): Promise<{ destination: string }> {
    const response = await fetch(`${API_BASE_URL}/api/files/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        destination,
      } as MoveFileRequest),
    });
    
    return handleResponse<{ success: boolean; destination: string }>(response);
  },

  /**
   * Bulk delete files and folders
   */
  async bulkDelete(paths: string[]): Promise<BulkOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/files/bulk/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paths,
      } as BulkDeleteRequest),
    });
    
    return handleResponse<BulkOperationResponse>(response);
  },

  /**
   * Bulk copy files and folders
   */
  async bulkCopy(paths: string[], destination: string): Promise<BulkOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/files/bulk/copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paths,
        destination,
      } as BulkCopyRequest),
    });
    
    return handleResponse<BulkOperationResponse>(response);
  },

  /**
   * Bulk move files and folders
   */
  async bulkMove(paths: string[], destination: string): Promise<BulkOperationResponse> {
    const response = await fetch(`${API_BASE_URL}/api/files/bulk/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paths,
        destination,
      } as BulkMoveRequest),
    });
    
    return handleResponse<BulkOperationResponse>(response);
  },
};

