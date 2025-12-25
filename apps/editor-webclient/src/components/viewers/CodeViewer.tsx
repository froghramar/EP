import type { FileViewerProps, FileTypeConfig } from '../../types/fileTypes';
import Editor from '@monaco-editor/react';
import { useRef } from 'react';
import type { editor } from 'monaco-editor';

const LANGUAGE_MAP: Record<string, string> = {
  tsx: 'typescript',
  ts: 'typescript',
  jsx: 'javascript',
  js: 'javascript',
  json: 'json',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'html',
  xml: 'xml',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rs: 'rust',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'shell',
  bash: 'shell',
  sql: 'sql',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  cs: 'csharp',
  r: 'r',
};

export const codeViewerConfig: FileTypeConfig = {
  id: 'code',
  extensions: [], // Fallback for all other extensions
  supportedModes: ['editor'],
  defaultMode: 'editor',
  component: CodeViewer,
  getMonacoLanguage: (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return LANGUAGE_MAP[ext || ''] || 'plaintext';
  },
};

export function CodeViewer({ content, language = 'plaintext', onContentChange }: FileViewerProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onContentChange(value);
    }
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={content}
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
