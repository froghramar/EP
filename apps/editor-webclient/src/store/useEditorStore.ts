import { create } from 'zustand';
import { fileApi } from '../services/api';
import { debounce } from '../utils/debounce';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
  expanded?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EditorState {
  files: FileNode[];
  activeFileId: string | null;
  activeFileContent: string;
  activeFilePath: string | null;
  sidebarWidth: number;
  chatWidth: number;
  sidebarVisible: boolean;
  chatVisible: boolean;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadFiles: () => Promise<void>;
  setActiveFile: (fileId: string | null, filePath?: string | null) => Promise<void>;
  updateFileContent: (content: string) => void;
  toggleFolder: (folderId: string) => Promise<void>;
  loadFolderChildren: (folderPath: string, folderId: string) => Promise<void>;
  setSidebarWidth: (width: number) => void;
  setChatWidth: (width: number) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  setFiles: (files: FileNode[]) => void;
  setError: (error: string | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  files: [],
  activeFileId: null,
  activeFileContent: '',
  activeFilePath: null,
  sidebarWidth: 250,
  chatWidth: 350,
  sidebarVisible: true,
  chatVisible: true,
  chatMessages: [],
  isLoading: false,
  error: null,

  loadFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const tree = await fileApi.getFileTree(undefined, 2); // Load 2 levels deep initially
      if (tree) {
        // Convert single root node to array format
        set({ files: [tree], isLoading: false });
      } else {
        set({ files: [], isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load files',
        isLoading: false 
      });
    }
  },

  setActiveFile: async (fileId, filePath) => {
    if (!fileId || !filePath) {
      set({ activeFileId: null, activeFileContent: '', activeFilePath: null });
      return;
    }

    set({ isLoading: true, error: null, activeFileId: fileId, activeFilePath: filePath });
    
    try {
      const content = await fileApi.getFileContent(filePath);
      set({ activeFileContent: content, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load file content',
        isLoading: false,
        activeFileContent: '',
      });
    }
  },
  
  updateFileContent: (content) => {
    set({ activeFileContent: content });
    // Trigger debounced save
    const state = get();
    if (state.activeFilePath) {
      debouncedSave(state.activeFilePath, content);
    }
  },
  
  toggleFolder: async (folderId) => {
    const state = get();
    const folder = findFileById(state.files, folderId);
    
    if (!folder || folder.type !== 'folder') return;

    const newExpanded = !folder.expanded;
    
    // Update expanded state
    set((state) => ({
      files: toggleFolderExpanded(state.files, folderId, newExpanded),
    }));

    // If expanding and children are empty, load them
    if (newExpanded && (!folder.children || folder.children.length === 0)) {
      await get().loadFolderChildren(folder.path, folderId);
    }
  },

  loadFolderChildren: async (folderPath, folderId) => {
    set({ isLoading: true, error: null });
    try {
      const children = await fileApi.getFiles(folderPath);
      
      set((state) => ({
        files: updateFolderChildren(state.files, folderId, children),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load folder contents',
        isLoading: false,
      });
    }
  },

  setError: (error) => set({ error }),
  
  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.max(150, Math.min(500, width)) }),
  
  setChatWidth: (width) =>
    set({ chatWidth: Math.max(200, Math.min(600, width)) }),
  
  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  
  toggleChat: () =>
    set((state) => ({ chatVisible: !state.chatVisible })),
  
  addChatMessage: (role, content) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: crypto.randomUUID(),
          role,
          content,
          timestamp: new Date(),
        },
      ],
    })),
  
  setFiles: (files) => set({ files }),
  
  setError: (error) => set({ error }),
}));

// Debounced save function (1 second delay after user stops typing)
const debouncedSave = debounce(async (filePath: string, content: string) => {
  try {
    await fileApi.saveFileContent(filePath, content);
  } catch (error) {
    useEditorStore.getState().setError(
      error instanceof Error ? error.message : 'Failed to save file'
    );
  }
}, 1000);

function toggleFolderExpanded(files: FileNode[], folderId: string, expanded: boolean): FileNode[] {
  return files.map((file) => {
    if (file.id === folderId && file.type === 'folder') {
      return { ...file, expanded };
    }
    if (file.children) {
      return { ...file, children: toggleFolderExpanded(file.children, folderId, expanded) };
    }
    return file;
  });
}

function updateFolderChildren(files: FileNode[], folderId: string, children: FileNode[]): FileNode[] {
  return files.map((file) => {
    if (file.id === folderId && file.type === 'folder') {
      return { ...file, children };
    }
    if (file.children) {
      return { ...file, children: updateFolderChildren(file.children, folderId, children) };
    }
    return file;
  });
}

function findFileById(files: FileNode[], fileId: string): FileNode | null {
  for (const file of files) {
    if (file.id === fileId) {
      return file;
    }
    if (file.children) {
      const found = findFileById(file.children, fileId);
      if (found) return found;
    }
  }
  return null;
}
