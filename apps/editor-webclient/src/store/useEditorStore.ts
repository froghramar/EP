import { create } from 'zustand';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  expanded?: boolean;
}

interface EditorState {
  files: FileNode[];
  activeFileId: string | null;
  activeFileContent: string;
  sidebarWidth: number;
  chatWidth: number;
  sidebarVisible: boolean;
  chatVisible: boolean;
  chatMessages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  
  setActiveFile: (fileId: string | null) => void;
  updateFileContent: (content: string) => void;
  setSidebarWidth: (width: number) => void;
  setChatWidth: (width: number) => void;
  toggleSidebar: () => void;
  toggleChat: () => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  toggleFolder: (folderId: string) => void;
  setFiles: (files: FileNode[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  files: [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      expanded: true,
      children: [
        {
          id: '2',
          name: 'App.tsx',
          type: 'file',
          content: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Hello World</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}

export default App
`,
        },
        {
          id: '3',
          name: 'main.tsx',
          type: 'file',
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`,
        },
      ],
    },
    {
      id: '4',
      name: 'package.json',
      type: 'file',
      content: `{
  "name": "editor-webclient",
  "version": "0.0.0",
  "type": "module"
}
`,
    },
  ],
  activeFileId: null,
  activeFileContent: '',
  sidebarWidth: 250,
  chatWidth: 350,
  sidebarVisible: true,
  chatVisible: true,
  chatMessages: [],

  setActiveFile: (fileId) =>
    set((state) => {
      const fileContent = fileId ? findFileContent(state.files, fileId) : '';
      return { activeFileId: fileId, activeFileContent: fileContent || '' };
    }),
  
  updateFileContent: (content) =>
    set({ activeFileContent: content }),
  
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
          id: Date.now().toString(),
          role,
          content,
          timestamp: new Date(),
        },
      ],
    })),
  
  toggleFolder: (folderId) =>
    set((state) => ({
      files: toggleFolderRecursive(state.files, folderId),
    })),
  
  setFiles: (files) => set({ files }),
}));

function toggleFolderRecursive(files: FileNode[], folderId: string): FileNode[] {
  return files.map((file) => {
    if (file.id === folderId && file.type === 'folder') {
      return { ...file, expanded: !file.expanded };
    }
    if (file.children) {
      return { ...file, children: toggleFolderRecursive(file.children, folderId) };
    }
    return file;
  });
}

function findFileContent(files: FileNode[], fileId: string): string | undefined {
  for (const file of files) {
    if (file.id === fileId) {
      return file.content || '';
    }
    if (file.children) {
      const found = findFileContent(file.children, fileId);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}
