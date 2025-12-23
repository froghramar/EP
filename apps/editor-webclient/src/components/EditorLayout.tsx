import { FileTree } from './FileTree';
import { CodeEditor } from './CodeEditor';
import { ChatPanel } from './ChatPanel';
import { ResizablePanel } from './ResizablePanel';
import { useEditorStore } from '../store/useEditorStore';

export function EditorLayout() {
  const {
    sidebarWidth,
    chatWidth,
    sidebarVisible,
    chatVisible,
    setSidebarWidth,
    setChatWidth,
    toggleSidebar,
    toggleChat,
  } = useEditorStore();

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

      {/* Chat Panel */}
      {chatVisible && (
        <ResizablePanel
          width={chatWidth}
          onResize={setChatWidth}
          side="right"
          minWidth={200}
          maxWidth={600}
        >
          <ChatPanel />
        </ResizablePanel>
      )}
    </div>
  );
}
