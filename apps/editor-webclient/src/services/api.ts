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

export interface GitStatus {
  branch: string;
  modified: string[];
  created: string[];
  deleted: string[];
  renamed: Array<{ from: string; to: string }>;
  staged: string[];
  conflicted: string[];
  not_added: string[];
  isClean: boolean;
  ahead: number;
  behind: number;
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

export interface GitBranches {
  current: string;
  all: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  toolsUsed?: string[];
}

export const chatApi = {
  /**
   * Send a message to the AI agent
   */
  async sendMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
      }),
    });

    return handleResponse<ChatResponse>(response);
  },
};

export const gitApi = {
  /**
   * Check if workspace is a git repository
   */
  async checkGitRepository(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/git/check`);
      const data = await handleResponse<{ isGitRepository: boolean }>(response);
      return data.isGitRepository;
    } catch (error) {
      return false;
    }
  },

  /**
   * Initialize a new git repository
   */
  async initRepository(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/git/init`, {
      method: 'POST',
    });

    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Get git status
   */
  async getStatus(): Promise<GitStatus> {
    const response = await fetch(`${API_BASE_URL}/api/git/status`);
    return handleResponse<GitStatus>(response);
  },

  /**
   * Get file diff
   */
  async getDiff(filePath: string, cached: boolean = false): Promise<string> {
    const url = new URL(`${API_BASE_URL}/api/git/diff`);
    url.searchParams.set('path', filePath);
    if (cached) {
      url.searchParams.set('cached', 'true');
    }

    const response = await fetch(url.toString());
    const data = await handleResponse<{ diff: string }>(response);
    return data.diff;
  },

  /**
   * Stage files
   */
  async stageFiles(files: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/git/stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    });

    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Unstage files
   */
  async unstageFiles(files: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/git/unstage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    });

    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Commit changes
   */
  async commit(message: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/git/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await handleResponse<{ success: boolean; commit: string }>(response);
    return data.commit;
  },

  /**
   * Get commit log
   */
  async getLog(maxCount: number = 50): Promise<GitCommit[]> {
    const url = new URL(`${API_BASE_URL}/api/git/log`);
    url.searchParams.set('maxCount', maxCount.toString());

    const response = await fetch(url.toString());
    const data = await handleResponse<{ commits: GitCommit[] }>(response);
    return data.commits;
  },

  /**
   * Discard changes
   */
  async discardChanges(files: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/git/discard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    });

    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Get branches
   */
  async getBranches(): Promise<GitBranches> {
    const response = await fetch(`${API_BASE_URL}/api/git/branches`);
    return handleResponse<GitBranches>(response);
  },

  /**
   * Checkout branch
   */
  async checkoutBranch(branch: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/git/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ branch }),
    });

    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Create branch
   */
  async createBranch(name: string, checkout: boolean = false): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/git/branch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, checkout }),
    });

    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Pull changes
   */
  async pull(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/git/pull`, {
      method: 'POST',
    });

    await handleResponse<{ success: boolean }>(response);
  },

  /**
   * Push changes
   */
  async push(branch?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/git/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ branch }),
    });

    await handleResponse<{ success: boolean }>(response);
  },
};

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

