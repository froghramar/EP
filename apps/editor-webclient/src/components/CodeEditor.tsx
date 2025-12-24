import { useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore, type FileNode } from '../store/useEditorStore';
import type { editor } from 'monaco-editor';

function findFileById(files: FileNode[], fileId: string): FileNode | null {
  for (const file of files) {
    if (file.id === fileId) return file;
    if (file.children) {
      const found = findFileById(file.children, fileId);
      if (found) return found;
    }
  }
  return null;
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    tsx: 'typescript',
    ts: 'typescript',
    jsx: 'javascript',
    js: 'javascript',
    json: 'json',
    css: 'css',
    html: 'html',
    md: 'markdown',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rs: 'rust',
    yaml: 'yaml',
  };
  return languageMap[ext || ''] || 'plaintext';
}

export function CodeEditor() {
  const activeFileContent = useEditorStore((state) => state.activeFileContent);
  const activeFileId = useEditorStore((state) => state.activeFileId);
  const activeTabId = useEditorStore((state) => state.activeTabId);
  const openTabs = useEditorStore((state) => state.openTabs);
  const files = useEditorStore((state) => state.files);
  const isLoading = useEditorStore((state) => state.isLoading);
  const updateFileContent = useEditorStore((state) => state.updateFileContent);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeTab = activeTabId ? openTabs.find(t => t.id === activeTabId) : null;

  const language = useMemo(() => {
    if (!activeTab) return 'plaintext';
    return getLanguageFromFileName(activeTab.fileName);
  }, [activeTab]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeTabId) {
      updateFileContent(value, activeTabId);
    }
  };

  if (!activeTabId || !activeTab) {
    return (
      <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-lg mb-1">No file selected</div>
          <div className="text-sm">Select a file from the explorer to start editing</div>
        </div>
      </div>
    );
  }

  if (isLoading && !activeTab?.content) {
    return (
      <div className="h-full w-full bg-[#1e1e1e] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-1">Loading file...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={language}
        value={activeFileContent}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          cursorStyle: 'line',
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
        }}
      />
    </div>
  );
}
