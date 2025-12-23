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
  };
  return languageMap[ext || ''] || 'plaintext';
}

export function CodeEditor() {
  const activeFileContent = useEditorStore((state) => state.activeFileContent);
  const activeFileId = useEditorStore((state) => state.activeFileId);
  const files = useEditorStore((state) => state.files);
  const isLoading = useEditorStore((state) => state.isLoading);
  const updateFileContent = useEditorStore((state) => state.updateFileContent);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const language = useMemo(() => {
    if (!activeFileId) return 'plaintext';
    const file = findFileById(files, activeFileId);
    if (!file) return 'plaintext';
    return getLanguageFromFileName(file.name);
  }, [activeFileId, files]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateFileContent(value);
    }
  };

  if (!activeFileId) {
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

  if (isLoading && !activeFileContent) {
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
