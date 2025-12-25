import type { FileViewerProps, FileTypeConfig } from '../../types/fileTypes';
import Editor from '@monaco-editor/react';
import { MarkdownPreview } from '../MarkdownPreview';
import { useRef } from 'react';
import type { editor } from 'monaco-editor';

export const markdownViewerConfig: FileTypeConfig = {
  id: 'markdown',
  extensions: ['.md', '.markdown'],
  monacoLanguage: 'markdown',
  supportedModes: ['editor', 'preview', 'split'],
  defaultMode: 'split',
  component: MarkdownViewer,
  getMonacoLanguage: () => 'markdown',
};

export function MarkdownViewer({ 
  content, 
  viewMode = 'split', 
  onContentChange 
}: FileViewerProps) {
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

  const showEditor = viewMode === 'editor' || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <div className="h-full w-full flex">
      {/* Editor View */}
      {showEditor && (
        <div className={viewMode === 'split' ? 'flex-1 border-r border-gray-700' : 'flex-1'}>
          <Editor
            height="100%"
            language="markdown"
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
      )}

      {/* Preview View */}
      {showPreview && (
        <div className="flex-1">
          <MarkdownPreview content={content} />
        </div>
      )}
    </div>
  );
}
