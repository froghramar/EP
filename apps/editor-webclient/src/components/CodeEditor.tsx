import { useMemo } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { FileTypeRegistry } from '../config/fileTypeRegistry';
import type { ViewMode } from '../types/fileTypes';

export function CodeEditor() {
  const activeFileContent = useEditorStore((state) => state.activeFileContent);
  const activeTabId = useEditorStore((state) => state.activeTabId);
  const openTabs = useEditorStore((state) => state.openTabs);
  const isLoading = useEditorStore((state) => state.isLoading);
  const updateFileContent = useEditorStore((state) => state.updateFileContent);
  const setFileViewMode = useEditorStore((state) => state.setFileViewMode);
  const getFileViewMode = useEditorStore((state) => state.getFileViewMode);

  const activeTab = activeTabId ? openTabs.find(t => t.id === activeTabId) : null;

  // Get file type configuration
  const fileTypeConfig = useMemo(() => {
    if (!activeTab) return null;
    return FileTypeRegistry.getFileTypeConfig(activeTab.fileName);
  }, [activeTab]);

  // Get Monaco language for code files
  const monacoLanguage = useMemo(() => {
    if (!activeTab) return 'plaintext';
    return FileTypeRegistry.getMonacoLanguage(activeTab.fileName);
  }, [activeTab]);

  // Determine current view mode
  const viewMode: ViewMode = useMemo(() => {
    if (!fileTypeConfig || !activeTabId) return 'editor';
    return getFileViewMode(activeTabId, fileTypeConfig.defaultMode);
  }, [fileTypeConfig, activeTabId, getFileViewMode]);

  const handleContentChange = (newContent: string) => {
    if (activeTabId) {
      updateFileContent(newContent, activeTabId);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (activeTabId) {
      setFileViewMode(activeTabId, mode);
    }
  };

  if (!activeTabId || !activeTab || !fileTypeConfig) {
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

  const ViewerComponent = fileTypeConfig.component;

  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col">
      {/* Toolbar - only show for files with multiple view modes */}
      {fileTypeConfig.supportedModes.length > 1 && (
        <div className="flex items-center border-b border-gray-700 bg-[#252526]" style={{padding: '4px 8px', gap: '4px'}}>
          {fileTypeConfig.supportedModes.includes('editor') && (
            <button
              onClick={() => handleViewModeChange('editor')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'editor'
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
          )}
          
          {fileTypeConfig.supportedModes.includes('split') && (
            <button
              onClick={() => handleViewModeChange('split')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'split'
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
          )}
          
          {fileTypeConfig.supportedModes.includes('preview') && (
            <button
              onClick={() => handleViewModeChange('preview')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'preview'
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
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ViewerComponent
          content={activeFileContent}
          fileName={activeTab.fileName}
          language={monacoLanguage}
          viewMode={viewMode}
          onContentChange={handleContentChange}
          onViewModeChange={handleViewModeChange}
        />
      </div>
    </div>
  );
}
