import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';

interface FileContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  fileId: string;
  filePath: string;
  fileType: 'file' | 'folder';
  onClose: () => void;
  onCreateFile: (type: 'file' | 'folder') => void;
  onRename: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onMove: () => void;
}

export function FileContextMenu({
  isOpen,
  x,
  y,
  fileType,
  onClose,
  onCreateFile,
  onRename,
  onDelete,
  onCopy,
  onMove,
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedFiles = useEditorStore((state) => state.selectedFiles);
  const hasSelection = selectedFiles.size > 0;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    zIndex: 1000,
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-[#252526] border border-gray-700 rounded shadow-lg py-1 min-w-[180px]"
    >
      {fileType === 'folder' && (
        <>
          <button
            onClick={() => {
              onCreateFile('file');
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            New File
          </button>
          <button
            onClick={() => {
              onCreateFile('folder');
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            New Folder
          </button>
          <div className="border-t border-gray-700 my-1" />
        </>
      )}
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
      >
        Rename
      </button>
      <button
        onClick={() => {
          onCopy();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
      >
        Copy
      </button>
      <button
        onClick={() => {
          onMove();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
      >
        Move
      </button>
      <div className="border-t border-gray-700 my-1" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
      >
        {hasSelection ? `Delete (${selectedFiles.size})` : 'Delete'}
      </button>
    </div>
  );
}

