import { useEffect } from 'react';
import { EditorLayout } from './components/EditorLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { websocketService } from './services/websocket';
import { useEditorStore } from './store/useEditorStore';
import { fileApi } from './services/api';
import { pathsMatch } from './utils/path';

function App() {
  useKeyboardShortcuts();
  const refreshFileContent = useEditorStore((state) => state.refreshFileContent);
  const loadFiles = useEditorStore((state) => state.loadFiles);
  const openTabs = useEditorStore((state) => state.openTabs);
  const openFileInTab = useEditorStore((state) => state.openFileInTab);

  useEffect(() => {
    // Small delay to ensure server is ready
    const connectTimeout = setTimeout(() => {
      websocketService.connect();
    }, 100);

    // Handle file change events
    const unsubscribe = websocketService.onFileChange(async (event) => {
      console.log('File change event:', event);

      switch (event.type) {
        case 'file_created':
        case 'file_modified':
          // Refresh file tree
          await loadFiles();
          
          // If file is open in a tab, refresh its content
          const state = useEditorStore.getState();
          const openTab = state.openTabs.find(tab => pathsMatch(tab.filePath, event.path));
          
          if (openTab) {
            await refreshFileContent(openTab.filePath);
          }
          break;

        case 'file_deleted':
          // Refresh file tree
          await loadFiles();
          
          // Close tab if file was deleted
          const currentState = useEditorStore.getState();
          const deletedTab = currentState.openTabs.find(tab => pathsMatch(tab.filePath, event.path));
          
          if (deletedTab) {
            currentState.closeTab(deletedTab.id);
          }
          break;

        case 'file_renamed':
          // Refresh file tree first to get updated file structure
          await loadFiles();
          
          // Update tab if file was renamed
          const updatedState = useEditorStore.getState();
          const renamedTab = event.oldPath 
            ? updatedState.openTabs.find(tab => pathsMatch(tab.filePath, event.oldPath!))
            : null;
          
          if (renamedTab && event.path) {
            // Close old tab and open new one
            updatedState.closeTab(renamedTab.id);
            // Find file ID for new path - need to search in updated file tree
            const findFileByPath = (nodes: typeof updatedState.files, path: string): { id: string; path: string } | null => {
              for (const node of nodes) {
                if (pathsMatch(node.path, path)) {
                  return { id: node.id, path: node.path };
                }
                if (node.children) {
                  const found = findFileByPath(node.children, path);
                  if (found) return found;
                }
              }
              return null;
            };
            const fileInfo = findFileByPath(updatedState.files, event.path);
            if (fileInfo) {
              await updatedState.openFileInTab(fileInfo.id, fileInfo.path);
            }
          }
          break;
      }
    });

    return () => {
      clearTimeout(connectTimeout);
      unsubscribe();
      websocketService.disconnect();
    };
  }, [loadFiles, refreshFileContent, openFileInTab]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <EditorLayout />
    </div>
  );
}

export default App;