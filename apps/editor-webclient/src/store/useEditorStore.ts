import { create } from 'zustand';
import { fileApi } from '../services/api';
import { debounce } from '../utils/debounce';
import { dirname, basename } from '../utils/path';

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
  selectedFiles: Set<string>;
  
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
  
  // File operations
  createFile: (path: string, type: 'file' | 'folder', content?: string) => Promise<void>;
  deleteFile: (path: string, fileId: string) => Promise<void>;
  renameFile: (path: string, fileId: string, newName: string) => Promise<void>;
  copyFile: (path: string, destination: string) => Promise<void>;
  moveFile: (path: string, fileId: string, destination: string) => Promise<void>;
  bulkDelete: (paths: string[], fileIds: string[]) => Promise<void>;
  bulkCopy: (paths: string[], destination: string) => Promise<void>;
  bulkMove: (paths: string[], fileIds: string[], destination: string) => Promise<void>;
  
  // Selection
  toggleFileSelection: (fileId: string) => void;
  clearSelection: () => void;
  selectFile: (fileId: string) => void;
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
  selectedFiles: new Set<string>(),

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

  createFile: async (path, type, content) => {
    set({ isLoading: true, error: null });
    try {
      await fileApi.createFile(path, type, content);
      
      // Reload the parent folder to show the new file
      const parentPath = dirname(path);
      const state = get();
      const parentFolder = findFileByPath(state.files, parentPath);
      
      if (parentFolder && parentFolder.type === 'folder') {
        await get().loadFolderChildren(parentPath, parentFolder.id);
      } else {
        // If parent not found, reload root
        await get().loadFiles();
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create file',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteFile: async (path, fileId) => {
    set({ isLoading: true, error: null });
    try {
      await fileApi.deleteFile(path);
      
      // Remove from file tree
      set((state) => ({
        files: removeFileFromTree(state.files, fileId),
        selectedFiles: new Set([...state.selectedFiles].filter(id => id !== fileId)),
      }));
      
      // If deleted file was active, clear it
      const state = get();
      if (state.activeFileId === fileId) {
        set({ activeFileId: null, activeFileContent: '', activeFilePath: null });
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete file',
        isLoading: false,
      });
      throw error;
    }
  },

  renameFile: async (path, fileId, newName) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileApi.renameFile(path, newName);
      
      // Update file tree
      set((state) => ({
        files: updateFileInTree(state.files, fileId, {
          name: newName,
          path: result.newPath,
        }),
      }));
      
      // Update active file path if it's the renamed file
      const state = get();
      if (state.activeFileId === fileId) {
        set({ activeFilePath: result.newPath });
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to rename file',
        isLoading: false,
      });
      throw error;
    }
  },

  copyFile: async (path, destination) => {
    set({ isLoading: true, error: null });
    try {
      await fileApi.copyFile(path, destination);
      
      // Reload destination folder to show copied file
      const destParentPath = dirname(destination);
      const state = get();
      const destParentFolder = findFileByPath(state.files, destParentPath);
      
      if (destParentFolder && destParentFolder.type === 'folder') {
        await get().loadFolderChildren(destParentPath, destParentFolder.id);
      } else {
        await get().loadFiles();
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to copy file',
        isLoading: false,
      });
      throw error;
    }
  },

  moveFile: async (path, fileId, destination) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileApi.moveFile(path, destination);
      
      // Update file tree
      set((state) => ({
        files: updateFileInTree(state.files, fileId, {
          path: result.destination,
          name: basename(result.destination),
        }),
      }));
      
      // Update active file path if it's the moved file
      const state = get();
      if (state.activeFileId === fileId) {
        set({ activeFilePath: result.destination });
      }
      
      // Reload both source and destination folders
      const sourceParentPath = dirname(path);
      const destParentPath = dirname(destination);
      
      const sourceParent = findFileByPath(state.files, sourceParentPath);
      const destParent = findFileByPath(state.files, destParentPath);
      
      if (sourceParent && sourceParent.type === 'folder') {
        await get().loadFolderChildren(sourceParentPath, sourceParent.id);
      }
      if (destParent && destParent.type === 'folder') {
        await get().loadFolderChildren(destParentPath, destParent.id);
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move file',
        isLoading: false,
      });
      throw error;
    }
  },

  bulkDelete: async (paths, fileIds) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileApi.bulkDelete(paths);
      
      // Remove successfully deleted files from tree
      const deletedIds = new Set<string>();
      result.results.forEach((r, index) => {
        if (r.success) {
          deletedIds.add(fileIds[index]);
        }
      });
      
      set((state) => ({
        files: removeFilesFromTree(state.files, deletedIds),
        selectedFiles: new Set([...state.selectedFiles].filter(id => !deletedIds.has(id))),
      }));
      
      // Clear active file if it was deleted
      const state = get();
      if (state.activeFileId && deletedIds.has(state.activeFileId)) {
        set({ activeFileId: null, activeFileContent: '', activeFilePath: null });
      }
      
      set({ isLoading: false });
      
      // Show errors for failed deletions
      const failed = result.results.filter(r => !r.success);
      if (failed.length > 0) {
        set({ error: `Failed to delete ${failed.length} file(s)` });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete files',
        isLoading: false,
      });
      throw error;
    }
  },

  bulkCopy: async (paths, destination) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileApi.bulkCopy(paths, destination);
      
      // Reload destination folder
      const destParentPath = dirname(destination);
      const state = get();
      const destParentFolder = findFileByPath(state.files, destParentPath);
      
      if (destParentFolder && destParentFolder.type === 'folder') {
        await get().loadFolderChildren(destParentPath, destParentFolder.id);
      } else {
        await get().loadFiles();
      }
      
      set({ isLoading: false });
      
      const failed = result.results.filter(r => !r.success);
      if (failed.length > 0) {
        set({ error: `Failed to copy ${failed.length} file(s)` });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to copy files',
        isLoading: false,
      });
      throw error;
    }
  },

  bulkMove: async (paths, fileIds, destination) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileApi.bulkMove(paths, destination);
      
      // Update file tree for successfully moved files
      const movedMap = new Map<string, string>();
      result.results.forEach((r, index) => {
        if (r.success && r.destination) {
          movedMap.set(fileIds[index], r.destination);
        }
      });
      
      set((state) => ({
        files: updateFilesInTree(state.files, movedMap),
      }));
      
      // Update active file path if it was moved
      const state = get();
      if (state.activeFileId && movedMap.has(state.activeFileId)) {
        set({ activeFilePath: movedMap.get(state.activeFileId)! });
      }
      
      // Reload source and destination folders
      const sourceParentPaths = new Set(paths.map(p => dirname(p)));
      const destParentPath = dirname(destination);
      
      for (const sourceParentPath of sourceParentPaths) {
        const sourceParent = findFileByPath(state.files, sourceParentPath);
        if (sourceParent && sourceParent.type === 'folder') {
          await get().loadFolderChildren(sourceParentPath, sourceParent.id);
        }
      }
      
      const destParent = findFileByPath(state.files, destParentPath);
      if (destParent && destParent.type === 'folder') {
        await get().loadFolderChildren(destParentPath, destParent.id);
      }
      
      set({ isLoading: false });
      
      const failed = result.results.filter(r => !r.success);
      if (failed.length > 0) {
        set({ error: `Failed to move ${failed.length} file(s)` });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move files',
        isLoading: false,
      });
      throw error;
    }
  },

  toggleFileSelection: (fileId) => {
    set((state) => {
      const newSelection = new Set(state.selectedFiles);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      return { selectedFiles: newSelection };
    });
  },

  clearSelection: () => set({ selectedFiles: new Set() }),

  selectFile: (fileId) => set({
    selectedFiles: new Set([fileId]),
  }),
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

function findFileByPath(files: FileNode[], filePath: string): FileNode | null {
  for (const file of files) {
    if (file.path === filePath) {
      return file;
    }
    if (file.children) {
      const found = findFileByPath(file.children, filePath);
      if (found) return found;
    }
  }
  return null;
}

function removeFileFromTree(files: FileNode[], fileId: string): FileNode[] {
  return files
    .filter(file => file.id !== fileId)
    .map(file => {
      if (file.children) {
        return {
          ...file,
          children: removeFileFromTree(file.children, fileId),
        };
      }
      return file;
    });
}

function removeFilesFromTree(files: FileNode[], fileIds: Set<string>): FileNode[] {
  return files
    .filter(file => !fileIds.has(file.id))
    .map(file => {
      if (file.children) {
        return {
          ...file,
          children: removeFilesFromTree(file.children, fileIds),
        };
      }
      return file;
    });
}

function updateFileInTree(
  files: FileNode[],
  fileId: string,
  updates: Partial<FileNode>
): FileNode[] {
  return files.map(file => {
    if (file.id === fileId) {
      return { ...file, ...updates };
    }
    if (file.children) {
      return {
        ...file,
        children: updateFileInTree(file.children, fileId, updates),
      };
    }
    return file;
  });
}

function updateFilesInTree(
  files: FileNode[],
  updates: Map<string, string>
): FileNode[] {
  return files.map(file => {
    const newPath = updates.get(file.id);
    if (newPath) {
      return {
        ...file,
        path: newPath,
        name: basename(newPath),
      };
    }
    if (file.children) {
      return {
        ...file,
        children: updateFilesInTree(file.children, updates),
      };
    }
    return file;
  });
}
