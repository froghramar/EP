import { create } from 'zustand';
import { fileApi, gitApi, chatApi, type GitStatus, type GitCommit } from '../services/api';
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

export interface OpenTab {
  id: string;
  fileId: string;
  filePath: string;
  fileName: string;
  content: string;
  isDirty: boolean; // Has unsaved changes
}

interface EditorState {
  files: FileNode[];
  activeFileId: string | null;
  activeFileContent: string;
  activeFilePath: string | null;
  openTabs: OpenTab[];
  activeTabId: string | null;
  sidebarWidth: number;
  chatWidth: number;
  sidebarVisible: boolean;
  chatVisible: boolean;
  chatMessages: ChatMessage[];
  conversationId: string | null;
  conversations: Array<{ id: string; createdAt: Date; updatedAt: Date; messageCount: number; preview: string }>;
  isLoading: boolean;
  isLoadingConversations: boolean;
  error: string | null;
  selectedFiles: Set<string>;
  
  // Git state
  isGitRepository: boolean;
  gitStatus: GitStatus | null;
  gitCommits: GitCommit[];
  gitPanelVisible: boolean;
  
  // Markdown preview
  markdownPreviewMode: 'editor' | 'preview' | 'split';
  
  // Actions
  loadFiles: () => Promise<void>;
  setActiveFile: (fileId: string | null, filePath?: string | null) => Promise<void>;
  openFileInTab: (fileId: string, filePath: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateFileContent: (content: string, tabId?: string) => void;
  refreshFileContent: (filePath: string) => Promise<void>;
  toggleFolder: (folderId: string) => Promise<void>;
  loadFolderChildren: (folderPath: string, folderId: string) => Promise<void>;
  setSidebarWidth: (width: number) => void;
  setChatWidth: (width: number) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  setConversationId: (id: string | null) => void;
  clearChat: () => void;
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createNewConversation: () => Promise<void>;
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
  
  // Git operations
  checkGitRepository: () => Promise<void>;
  initGitRepository: () => Promise<void>;
  loadGitStatus: () => Promise<void>;
  stageFiles: (files: string[]) => Promise<void>;
  unstageFiles: (files: string[]) => Promise<void>;
  commitChanges: (message: string) => Promise<void>;
  discardChanges: (files: string[]) => Promise<void>;
  loadGitCommits: (maxCount?: number) => Promise<void>;
  checkoutBranch: (branch: string) => Promise<void>;
  createBranch: (name: string, checkout?: boolean) => Promise<void>;
  pullChanges: () => Promise<void>;
  pushChanges: (branch?: string) => Promise<void>;
  toggleGitPanel: () => void;
  refreshGit: () => Promise<void>;
  
  // Markdown preview
  setMarkdownPreviewMode: (mode: 'editor' | 'preview' | 'split') => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  files: [],
  activeFileId: null,
  activeFileContent: '',
  activeFilePath: null,
  openTabs: [],
  activeTabId: null,
  sidebarWidth: 250,
  chatWidth: 350,
  sidebarVisible: true,
  chatVisible: true,
  chatMessages: [],
  conversationId: null,
  conversations: [],
  isLoading: false,
  isLoadingConversations: false,
  error: null,
  selectedFiles: new Set<string>(),
  
  // Git state
  isGitRepository: false,
  gitStatus: null,
  gitCommits: [],
  gitPanelVisible: false,
  
  // Markdown preview
  markdownPreviewMode: 'editor',

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
      
      // Also check git status if repo exists
      const state = get();
      if (state.isGitRepository) {
        await get().loadGitStatus();
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load files',
        isLoading: false 
      });
    }
  },

  setActiveFile: async (fileId, filePath) => {
    // Legacy method - now opens in tab
    if (fileId && filePath) {
      await get().openFileInTab(fileId, filePath);
    }
  },

  openFileInTab: async (fileId, filePath) => {
    if (!fileId || !filePath) return;

    const state = get();
    
    // Check if file is already open in a tab
    const existingTab = state.openTabs.find(tab => tab.filePath === filePath);
    if (existingTab) {
      // Switch to existing tab
      set({ activeTabId: existingTab.id, activeFileId: fileId, activeFilePath: filePath, activeFileContent: existingTab.content });
      return;
    }

    // Load file content
    set({ isLoading: true, error: null });
    
    try {
      const content = await fileApi.getFileContent(filePath);
      const fileName = basename(filePath);
      const newTab: OpenTab = {
        id: crypto.randomUUID(),
        fileId,
        filePath,
        fileName,
        content,
        isDirty: false,
      };

      set((state) => ({
        openTabs: [...state.openTabs, newTab],
        activeTabId: newTab.id,
        activeFileId: fileId,
        activeFilePath: filePath,
        activeFileContent: content,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load file content',
        isLoading: false,
      });
    }
  },

  closeTab: (tabId) => {
    const state = get();
    const tabIndex = state.openTabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;

    const newTabs = state.openTabs.filter(tab => tab.id !== tabId);
    
    // If closing the active tab, switch to another tab or clear
    let newActiveTabId: string | null = null;
    let newActiveFileId: string | null = null;
    let newActiveFilePath: string | null = null;
    let newActiveFileContent = '';

    if (state.activeTabId === tabId) {
      if (newTabs.length > 0) {
        // Switch to the tab that was before this one, or the first tab
        const targetIndex = Math.min(tabIndex, newTabs.length - 1);
        const targetTab = newTabs[targetIndex];
        newActiveTabId = targetTab.id;
        newActiveFileId = targetTab.fileId;
        newActiveFilePath = targetTab.filePath;
        newActiveFileContent = targetTab.content;
      }
    } else {
      // Keep current active tab
      newActiveTabId = state.activeTabId;
      const activeTab = state.openTabs.find(tab => tab.id === state.activeTabId);
      if (activeTab) {
        newActiveFileId = activeTab.fileId;
        newActiveFilePath = activeTab.filePath;
        newActiveFileContent = activeTab.content;
      }
    }

    set({
      openTabs: newTabs,
      activeTabId: newActiveTabId,
      activeFileId: newActiveFileId,
      activeFilePath: newActiveFilePath,
      activeFileContent: newActiveFileContent,
    });
  },

  setActiveTab: (tabId) => {
    const state = get();
    const tab = state.openTabs.find(t => t.id === tabId);
    if (!tab) return;

    set({
      activeTabId: tabId,
      activeFileId: tab.fileId,
      activeFilePath: tab.filePath,
      activeFileContent: tab.content,
    });
  },

  refreshFileContent: async (filePath) => {
    const state = get();
    const tab = state.openTabs.find(t => t.filePath === filePath);
    
    if (!tab) return;

    try {
      const content = await fileApi.getFileContent(filePath);
      
      set((state) => ({
        openTabs: state.openTabs.map(t => 
          t.id === tab.id 
            ? { ...t, content, isDirty: false }
            : t
        ),
        activeFileContent: state.activeTabId === tab.id ? content : state.activeFileContent,
      }));
    } catch (error) {
      console.error('Failed to refresh file content:', error);
    }
  },
  
  updateFileContent: (content, tabId) => {
    const state = get();
    const targetTabId = tabId || state.activeTabId;
    
    if (!targetTabId) {
      // Fallback to legacy behavior
      set({ activeFileContent: content });
      if (state.activeFilePath) {
        debouncedSave(state.activeFilePath, content);
      }
      return;
    }

    // Update tab content
    set((state) => {
      const updatedTabs = state.openTabs.map(tab => 
        tab.id === targetTabId 
          ? { ...tab, content, isDirty: true }
          : tab
      );
      
      return {
        openTabs: updatedTabs,
        activeFileContent: state.activeTabId === targetTabId ? content : state.activeFileContent,
      };
    });

    // Trigger debounced save
    const tab = state.openTabs.find(t => t.id === targetTabId);
    if (tab) {
      debouncedSave(tab.filePath, content);
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
  
  setConversationId: (id) => set({ conversationId: id }),
  
  clearChat: () => set({ chatMessages: [], conversationId: null }),

  loadConversations: async () => {
    set({ isLoadingConversations: true, error: null });
    try {
      const { conversations } = await chatApi.getConversations();
      set({ 
        conversations: conversations.map(c => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
        isLoadingConversations: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load conversations',
        isLoadingConversations: false 
      });
    }
  },

  loadConversation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { conversation } = await chatApi.getConversation(id);
      const chatMessages: ChatMessage[] = conversation.messages.map((msg, index) => ({
        id: `${id}-${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(conversation.createdAt),
      }));
      set({ 
        chatMessages,
        conversationId: id,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load conversation',
        isLoading: false 
      });
    }
  },

  createNewConversation: async () => {
    set({ isLoading: true, error: null });
    try {
      const { conversationId } = await chatApi.createConversation();
      set({ 
        chatMessages: [],
        conversationId,
        isLoading: false 
      });
      // Reload conversations list
      await get().loadConversations();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create conversation',
        isLoading: false 
      });
    }
  },
  
  setFiles: (files) => set({ files }),

  createFile: async (path, type, content) => {
    set({ isLoading: true, error: null });
    try {
      // If creating a BPMN file and no content provided, use template
      let fileContent = content;
      if (type === 'file' && path.toLowerCase().endsWith('.bpmn') && !content) {
        fileContent = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                   id="Definitions_1" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
      }
      
      await fileApi.createFile(path, type, fileContent);
      
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

  // Git operations
  checkGitRepository: async () => {
    try {
      const isRepo = await gitApi.checkGitRepository();
      set({ isGitRepository: isRepo });
      if (isRepo) {
        await get().loadGitStatus();
      }
    } catch (error) {
      set({ isGitRepository: false });
    }
  },

  initGitRepository: async () => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.initRepository();
      set({ isGitRepository: true, isLoading: false });
      await get().loadGitStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize repository',
        isLoading: false,
      });
      throw error;
    }
  },

  loadGitStatus: async () => {
    try {
      const status = await gitApi.getStatus();
      set({ gitStatus: status });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load git status',
      });
    }
  },

  stageFiles: async (files) => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.stageFiles(files);
      await get().loadGitStatus();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to stage files',
        isLoading: false,
      });
      throw error;
    }
  },

  unstageFiles: async (files) => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.unstageFiles(files);
      await get().loadGitStatus();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to unstage files',
        isLoading: false,
      });
      throw error;
    }
  },

  commitChanges: async (message) => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.commit(message);
      await get().loadGitStatus();
      await get().loadGitCommits();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to commit changes',
        isLoading: false,
      });
      throw error;
    }
  },

  discardChanges: async (files) => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.discardChanges(files);
      await get().loadGitStatus();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to discard changes',
        isLoading: false,
      });
      throw error;
    }
  },

  loadGitCommits: async (maxCount = 50) => {
    try {
      const commits = await gitApi.getLog(maxCount);
      set({ gitCommits: commits });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load commits',
      });
    }
  },

  checkoutBranch: async (branch) => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.checkoutBranch(branch);
      await get().loadGitStatus();
      await get().loadFiles(); // Reload files after branch change
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to checkout branch',
        isLoading: false,
      });
      throw error;
    }
  },

  createBranch: async (name, checkout = false) => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.createBranch(name, checkout);
      await get().loadGitStatus();
      if (checkout) {
        await get().loadFiles();
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create branch',
        isLoading: false,
      });
      throw error;
    }
  },

  pullChanges: async () => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.pull();
      await get().loadGitStatus();
      await get().loadFiles();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to pull changes',
        isLoading: false,
      });
      throw error;
    }
  },

  pushChanges: async (branch) => {
    set({ isLoading: true, error: null });
    try {
      await gitApi.push(branch);
      await get().loadGitStatus();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to push changes',
        isLoading: false,
      });
      throw error;
    }
  },

  toggleGitPanel: () => {
    set((state) => ({ gitPanelVisible: !state.gitPanelVisible }));
  },

  refreshGit: async () => {
    await get().loadGitStatus();
    await get().loadGitCommits();
  },
  
  // Markdown preview
  setMarkdownPreviewMode: (mode) => {
    set({ markdownPreviewMode: mode });
  },
}));

// Debounced save function (1 second delay after user stops typing)
const debouncedSave = debounce(async (filePath: string, content: string) => {
  try {
    await fileApi.saveFileContent(filePath, content);
    
    // Mark tab as not dirty after successful save
    const state = useEditorStore.getState();
    const tab = state.openTabs.find(t => t.filePath === filePath);
    if (tab) {
      useEditorStore.setState((state) => ({
        openTabs: state.openTabs.map(t => 
          t.id === tab.id 
            ? { ...t, isDirty: false }
            : t
        ),
      }));
    }
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
