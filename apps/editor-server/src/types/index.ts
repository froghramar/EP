export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}

export interface FileContentRequest {
  path: string;
  content?: string;
}

export interface FileContentResponse {
  content?: string;
  error?: string;
  success?: boolean;
}

