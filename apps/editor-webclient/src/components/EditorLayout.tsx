import { useState } from 'react';
import { FileTree } from './FileTree';
import { CodeEditor } from './CodeEditor';
import { ChatPanel } from './ChatPanel';
import { GitPanel } from './GitPanel';
import { ResizablePanel } from './ResizablePanel';
import { useEditorStore } from '../store/useEditorStore';

export function EditorLayout() {
  const sidebarWidth = useEditorStore((state) => state.sidebarWidth);
  const chatWidth = useEditorStore((state) => state.chatWidth);
  const sidebarVisible = useEditorStore((state) => state.sidebarVisible);
  const chatVisible = useEditorStore((state) => state.chatVisible);
  const gitPanelVisible = useEditorStore((state) => state.gitPanelVisible);
  const setSidebarWidth = useEditorStore((state) => state.setSidebarWidth);
  const setChatWidth = useEditorStore((state) => state.setChatWidth);
  const toggleSidebar = useEditorStore((state) => state.toggleSidebar);
  const toggleChat = useEditorStore((state) => state.toggleChat);
  const toggleGitPanel = useEditorStore((state) => state.toggleGitPanel);
  
  const [rightPanelView, setRightPanelView] = useState<'chat' | 'git'>('chat');

  return (
    <div className="h-full w-full flex bg-[#1e1e1e]">
      {/* Sidebar */}
      {sidebarVisible && (
        <ResizablePanel
          width={sidebarWidth}
          onResize={setSidebarWidth}
          side="left"
          minWidth={150}
          maxWidth={500}
        >
          <FileTree />
        </ResizablePanel>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!sidebarVisible && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-700 hover:bg-blue-500 cursor-pointer z-10" />
        )}
        <div className="flex-1 overflow-hidden">
          <CodeEditor />
        </div>
      </div>

      {/* Right Panel (Chat/Git) */}
      {(chatVisible || gitPanelVisible) && (
        <ResizablePanel
          width={chatWidth}
          onResize={setChatWidth}
          side="right"
          minWidth={200}
          maxWidth={600}
        >
          <div className="h-full flex flex-col">
            {/* Tab selector */}
            <div className="flex border-b border-gray-700 bg-[#252526]">
              <button
                onClick={() => setRightPanelView('chat')}
                className={`flex-1 px-3 py-2 text-sm transition-colors ${
                  rightPanelView === 'chat'
                    ? 'bg-gray-700 text-gray-200'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setRightPanelView('git')}
                className={`flex-1 px-3 py-2 text-sm transition-colors ${
                  rightPanelView === 'git'
                    ? 'bg-gray-700 text-gray-200'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
              >
                🌿 Git
              </button>
            </div>
            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelView === 'git' ? <GitPanel /> : <ChatPanel />}
            </div>
          </div>
        </ResizablePanel>
      )}
    </div>
  );
}
