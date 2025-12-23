import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

export function useKeyboardShortcuts() {
  const { toggleSidebar, toggleChat } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B or Cmd+B - Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl+\ or Cmd+\ - Toggle chat (using backslash)
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleChat();
      }

      // Escape - Close panels (optional)
      if (e.key === 'Escape') {
        // Could add logic to close modals/dialogs here
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleChat]);
}
