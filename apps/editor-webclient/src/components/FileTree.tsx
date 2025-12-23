import { useEditorStore, type FileNode } from '../store/useEditorStore';

interface FileTreeItemProps {
  file: FileNode;
  level: number;
}

function FileTreeItem({ file, level }: FileTreeItemProps) {
  const setActiveFile = useEditorStore((state) => state.setActiveFile);
  const toggleFolder = useEditorStore((state) => state.toggleFolder);
  const activeFileId = useEditorStore((state) => state.activeFileId);

  const handleClick = () => {
    if (file.type === 'folder') {
      toggleFolder(file.id);
    } else {
      setActiveFile(file.id);
    }
  };

  const isActive = file.id === activeFileId;
  const indent = level * 16;

  return (
    <div>
      <div
        className={`
          flex items-center px-2 py-1 cursor-pointer select-none
          hover:bg-gray-700/50 transition-colors
          ${isActive ? 'bg-blue-600/30 text-blue-300' : 'text-gray-300'}
        `}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleClick}
      >
        {file.type === 'folder' ? (
          <span className="mr-1 text-xs">
            {file.expanded ? '📂' : '📁'}
          </span>
        ) : (
          <span className="mr-1 text-xs">📄</span>
        )}
        <span className="text-sm truncate">{file.name}</span>
      </div>
      {file.type === 'folder' && file.expanded && file.children && (
        <div>
          {file.children.map((child) => (
            <FileTreeItem key={child.id} file={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  const files = useEditorStore((state) => state.files);

  return (
    <div className="h-full overflow-y-auto bg-[#252526] text-gray-300">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700">
        Explorer
      </div>
      <div className="py-1">
        {files.map((file) => (
          <FileTreeItem key={file.id} file={file} level={0} />
        ))}
      </div>
    </div>
  );
}
