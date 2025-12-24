import { useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '../store/useEditorStore';
import { MarkdownPreview } from './MarkdownPreview';
import type { editor } from 'monaco-editor';

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
  const activeTabId = useEditorStore((state) => state.activeTabId);
  const openTabs = useEditorStore((state) => state.openTabs);
  const isLoading = useEditorStore((state) => state.isLoading);
  const updateFileContent = useEditorStore((state) => state.updateFileContent);
  const markdownPreviewMode = useEditorStore((state) => state.markdownPreviewMode);
  const setMarkdownPreviewMode = useEditorStore((state) => state.setMarkdownPreviewMode);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeTab = activeTabId ? openTabs.find(t => t.id === activeTabId) : null;

  const language = useMemo(() => {
    if (!activeTab) return 'plaintext';
    return getLanguageFromFileName(activeTab.fileName);
  }, [activeTab]);

  const isMarkdownFile = useMemo(() => {
    return language === 'markdown';
  }, [language]);

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
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col">
      {/* Markdown Toolbar - only show for markdown files */}
      {isMarkdownFile && (
        <div className="flex items-center border-b border-gray-700 bg-[#252526]" style={{padding: '4px 8px', gap: '4px'}}>
          <button
            onClick={() => setMarkdownPreviewMode('editor')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              markdownPreviewMode === 'editor'
                ? 'bg-[#094771] text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            style={{display: 'flex', alignItems: 'center', gap: '6px'}}
            title="Show Editor Only"
          >
            <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editor
          </button>
          
          <button
            onClick={() => setMarkdownPreviewMode('split')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              markdownPreviewMode === 'split'
                ? 'bg-[#094771] text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            style={{display: 'flex', alignItems: 'center', gap: '6px'}}
            title="Show Editor and Preview Side by Side"
          >
            <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h4m0-18v18m0-18h6m-6 18h6m6-18h-6v18m0-18a2 2 0 012-2h2a2 2 0 012 2m0 0v14a2 2 0 01-2 2h-2a2 2 0 01-2-2" />
            </svg>
            Split
          </button>
          
          <button
            onClick={() => setMarkdownPreviewMode('preview')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              markdownPreviewMode === 'preview'
                ? 'bg-[#094771] text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            style={{display: 'flex', alignItems: 'center', gap: '6px'}}
            title="Show Preview Only"
          >
            <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
        </div>
      )}
      
      {/* Editor/Preview Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor View */}
        {(!isMarkdownFile || markdownPreviewMode === 'editor' || markdownPreviewMode === 'split') && (
          <div className={isMarkdownFile && markdownPreviewMode === 'split' ? 'flex-1 border-r border-gray-700' : 'flex-1'}>
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
        )}
        
        {/* Preview View */}
        {isMarkdownFile && (markdownPreviewMode === 'preview' || markdownPreviewMode === 'split') && (
          <div className={markdownPreviewMode === 'split' ? 'flex-1' : 'flex-1'}>
            <MarkdownPreview content={activeFileContent} />
          </div>
        )}
      </div>
    </div>
  );
}
