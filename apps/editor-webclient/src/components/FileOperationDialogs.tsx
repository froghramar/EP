import { FileDialog } from './FileDialog';
import { useEditorStore } from '../store/useEditorStore';
import { dirname, join, basename } from '../utils/path';

interface FileOperationDialogsProps {
  operation: 'create' | 'rename' | 'copy' | 'move' | null;
  createType?: 'file' | 'folder';
  contextFile: { id: string; path: string; type: 'file' | 'folder' } | null;
  onClose: () => void;
}

export function FileOperationDialogs({
  operation,
  createType = 'file',
  contextFile,
  onClose,
}: FileOperationDialogsProps) {
  const createFile = useEditorStore((state) => state.createFile);
  const renameFile = useEditorStore((state) => state.renameFile);
  const copyFile = useEditorStore((state) => state.copyFile);
  const moveFile = useEditorStore((state) => state.moveFile);

  const handleCreateSubmit = async (name: string) => {
    let newPath: string;
    
    if (contextFile && contextFile.type === 'folder') {
      newPath = join(contextFile.path, name);
    } else if (contextFile) {
      // If context file is a file, create in its parent directory
      newPath = join(dirname(contextFile.path), name);
    } else {
      // Fallback to current directory
      newPath = name;
    }
    
    try {
      await createFile(newPath, createType);
      onClose();
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleRenameSubmit = async (newName: string) => {
    if (!contextFile) return;
    
    try {
      await renameFile(contextFile.path, contextFile.id, newName);
      onClose();
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleCopySubmit = async (destination: string) => {
    if (!contextFile) return;
    
    // If destination doesn't end with the file name, join it
    const destPath = destination.endsWith(basename(contextFile.path))
      ? destination
      : join(destination, basename(contextFile.path));
    
    try {
      await copyFile(contextFile.path, destPath);
      onClose();
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleMoveSubmit = async (destination: string) => {
    if (!contextFile) return;
    
    // If destination doesn't end with the file name, join it
    const destPath = destination.endsWith(basename(contextFile.path))
      ? destination
      : join(destination, basename(contextFile.path));
    
    try {
      await moveFile(contextFile.path, contextFile.id, destPath);
      onClose();
    } catch (error) {
      // Error is handled by store
    }
  };

  if (operation === 'create') {
    return (
      <FileDialog
        isOpen={true}
        onClose={onClose}
        onSubmit={handleCreateSubmit}
        title={`New ${createType === 'file' ? 'File' : 'Folder'}`}
        label={`${createType === 'file' ? 'File' : 'Folder'} name`}
        placeholder={`Enter ${createType === 'file' ? 'file' : 'folder'} name`}
        validate={(value) => {
          if (!value.trim()) {
            return 'Name is required';
          }
          if (value.includes('/') || value.includes('\\')) {
            return 'Name cannot contain path separators';
          }
          return null;
        }}
      />
    );
  }

  if (!contextFile) return null;

  if (operation === 'rename') {
    return (
      <FileDialog
        isOpen={true}
        onClose={onClose}
        onSubmit={handleRenameSubmit}
        title="Rename"
        label="New name"
        placeholder="Enter new name"
        initialValue={basename(contextFile.path)}
        validate={(value) => {
          if (!value.trim()) {
            return 'Name is required';
          }
          if (value.includes('/') || value.includes('\\')) {
            return 'Name cannot contain path separators';
          }
          return null;
        }}
      />
    );
  }

  if (operation === 'copy') {
    return (
      <FileDialog
        isOpen={true}
        onClose={onClose}
        onSubmit={handleCopySubmit}
        title="Copy"
        label="Destination folder"
        placeholder="Enter destination folder path"
        initialValue={dirname(contextFile.path)}
        validate={(value) => {
          if (!value.trim()) {
            return 'Destination is required';
          }
          return null;
        }}
      />
    );
  }

  if (operation === 'move') {
    return (
      <FileDialog
        isOpen={true}
        onClose={onClose}
        onSubmit={handleMoveSubmit}
        title="Move"
        label="Destination folder"
        placeholder="Enter destination folder path"
        initialValue={dirname(contextFile.path)}
        validate={(value) => {
          if (!value.trim()) {
            return 'Destination is required';
          }
          return null;
        }}
      />
    );
  }

  return null;
}

