import { useEffect, useState } from 'react';
import { useEditorStore, type FileNode } from '../store/useEditorStore';
import { FileContextMenu } from './FileContextMenu';
import { FileOperationDialogs } from './FileOperationDialogs';

interface FileTreeItemProps {
  file: FileNode;
  level: number;
}

function FileTreeItem({ file, level }: FileTreeItemProps) {
  const setActiveFile = useEditorStore((state) => state.setActiveFile);
  const toggleFolder = useEditorStore((state) => state.toggleFolder);
  const activeFileId = useEditorStore((state) => state.activeFileId);
  const selectedFiles = useEditorStore((state) => state.selectedFiles);
  const toggleFileSelection = useEditorStore((state) => state.toggleFileSelection);
  const selectFile = useEditorStore((state) => state.selectFile);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const gitStatus = useEditorStore((state) => state.gitStatus);
  
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [operation, setOperation] = useState<'create' | 'rename' | 'copy' | 'move' | null>(null);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      toggleFileSelection(file.id);
    } else if (e.shiftKey) {
      // Range select (simplified - just select this file)
      selectFile(file.id);
    } else {
      // Single select
      clearSelection();
      selectFile(file.id);
      
      if (file.type === 'folder') {
        toggleFolder(file.id);
      } else {
        setActiveFile(file.id, file.path);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedFiles.has(file.id)) {
      clearSelection();
      selectFile(file.id);
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const isActive = file.id === activeFileId;
  const isSelected = selectedFiles.has(file.id);
  const indent = level * 16;

  // Get git status for this file
  const getGitStatus = () => {
    if (!gitStatus) return null;
    
    const relativePath = file.path;
    
    if (gitStatus.staged.includes(relativePath)) {
      return { status: 'staged', color: 'text-green-400', icon: '●' };
    }
    if (gitStatus.modified.includes(relativePath)) {
      return { status: 'modified', color: 'text-yellow-400', icon: 'M' };
    }
    if (gitStatus.created.includes(relativePath) || gitStatus.not_added.includes(relativePath)) {
      return { status: 'new', color: 'text-green-400', icon: 'U' };
    }
    if (gitStatus.deleted.includes(relativePath)) {
      return { status: 'deleted', color: 'text-red-400', icon: 'D' };
    }
    if (gitStatus.conflicted.includes(relativePath)) {
      return { status: 'conflict', color: 'text-red-500', icon: 'C' };
    }
    
    return null;
  };

  const gitFileStatus = getGitStatus();

  const handleCreateFile = (type: 'file' | 'folder') => {
    setCreateType(type);
    setOperation('create');
    setContextMenu(null);
  };

  const handleRename = () => {
    setOperation('rename');
    setContextMenu(null);
  };

  const handleCopy = () => {
    setOperation('copy');
    setContextMenu(null);
  };

  const handleMove = () => {
    setOperation('move');
    setContextMenu(null);
  };

  const handleDelete = async () => {
    const deleteFile = useEditorStore.getState().deleteFile;
    const bulkDelete = useEditorStore.getState().bulkDelete;
    const selectedFiles = useEditorStore.getState().selectedFiles;
    const files = useEditorStore.getState().files;
    
    const findFileById = (id: string): FileNode | null => {
      const find = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = find(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      return find(files);
    };

    if (selectedFiles.size > 0) {
      const paths: string[] = [];
      const ids: string[] = [];
      selectedFiles.forEach((id) => {
        const f = findFileById(id);
        if (f) {
          paths.push(f.path);
          ids.push(id);
        }
      });
      if (paths.length > 0) {
        await bulkDelete(paths, ids);
      }
    } else {
      await deleteFile(file.path, file.id);
    }
    setContextMenu(null);
  };

  return (
    <>
      <div>
        <div
          className={`
            flex items-center px-2 py-1 cursor-pointer select-none
            hover:bg-gray-700/50 transition-colors
            ${isActive ? 'bg-blue-600/30 text-blue-300' : ''}
            ${isSelected ? 'bg-gray-700/70' : ''}
            ${!isActive && !isSelected ? 'text-gray-300' : ''}
          `}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >
          {file.type === 'folder' ? (
            <span className="mr-1 text-xs">
              {file.expanded ? '📂' : '📁'}
            </span>
          ) : (
            <span className="mr-1 text-xs">📄</span>
          )}
          <span className="text-sm truncate flex-1">{file.name}</span>
          {gitFileStatus && (
            <span className={`ml-2 text-xs ${gitFileStatus.color} font-semibold`} title={gitFileStatus.status}>
              {gitFileStatus.icon}
            </span>
          )}
        </div>
        {file.type === 'folder' && file.expanded && file.children && (
          <div>
            {file.children.map((child) => (
              <FileTreeItem key={child.id} file={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
      {contextMenu && (
        <FileContextMenu
          isOpen={true}
          x={contextMenu.x}
          y={contextMenu.y}
          fileId={file.id}
          filePath={file.path}
          fileType={file.type}
          onClose={() => setContextMenu(null)}
          onCreateFile={handleCreateFile}
          onRename={handleRename}
          onDelete={handleDelete}
          onCopy={handleCopy}
          onMove={handleMove}
        />
      )}
      {operation && (
        <FileOperationDialogs
          operation={operation}
          createType={createType}
          contextFile={file}
          onClose={() => {
            setOperation(null);
            setContextMenu(null);
          }}
        />
      )}
    </>
  );
}

export function FileTree() {
  const files = useEditorStore((state) => state.files);
  const isLoading = useEditorStore((state) => state.isLoading);
  const error = useEditorStore((state) => state.error);
  const loadFiles = useEditorStore((state) => state.loadFiles);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const [rootOperation, setRootOperation] = useState<'create' | null>(null);
  const [rootCreateType, setRootCreateType] = useState<'file' | 'folder'>('file');

  useEffect(() => {
    if (files.length === 0 && !isLoading) {
      loadFiles();
    }
  }, [files.length, isLoading, loadFiles]);

  const handleRootCreate = (type: 'file' | 'folder') => {
    setRootCreateType(type);
    setRootOperation('create');
  };

  return (
    <div className="h-full overflow-y-auto bg-[#252526] text-gray-300 flex flex-col">
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Explorer
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handleRootCreate('file')}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
            title="New File"
          >
            📄
          </button>
          <button
            onClick={() => handleRootCreate('folder')}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
            title="New Folder"
          >
            📁
          </button>
        </div>
      </div>
      {error && (
        <div className="px-3 py-2 text-red-400 text-sm bg-red-900/20 border-b border-red-700">
          {error}
        </div>
      )}
      <div className="flex-1 py-1" onClick={(e) => {
        if (e.target === e.currentTarget) {
          clearSelection();
        }
      }}>
        {isLoading && files.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            No files found
          </div>
        ) : (
          files.map((file) => (
            <FileTreeItem key={file.id} file={file} level={0} />
          ))
        )}
      </div>
      {rootOperation && (
        <FileOperationDialogs
          operation={rootOperation}
          createType={rootCreateType}
          contextFile={files[0]?.type === 'folder' ? {
            id: files[0].id,
            path: files[0].path,
            type: 'folder',
          } : null}
          onClose={() => setRootOperation(null)}
        />
      )}
    </div>
  );
}
