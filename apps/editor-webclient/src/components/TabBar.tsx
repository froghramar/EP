import { useEditorStore } from '../store/useEditorStore';

export function TabBar() {
  const openTabs = useEditorStore((state) => state.openTabs);
  const activeTabId = useEditorStore((state) => state.activeTabId);
  const setActiveTab = useEditorStore((state) => state.setActiveTab);
  const closeTab = useEditorStore((state) => state.closeTab);

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-[#2d2d30] border-b border-gray-700 overflow-x-auto">
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-gray-700
              transition-colors min-w-[150px] max-w-[250px]
              ${isActive 
                ? 'bg-[#1e1e1e] text-gray-200' 
                : 'bg-[#2d2d30] text-gray-400 hover:bg-[#37373d] hover:text-gray-300'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-xs truncate flex-1" title={tab.fileName}>
              {tab.fileName}
            </span>
            {tab.isDirty && (
              <span className="text-xs text-blue-400" title="Unsaved changes">
                ●
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={`
                ml-1 px-1 rounded hover:bg-gray-600 transition-colors
                ${isActive ? 'text-gray-300' : 'text-gray-500'}
              `}
              title="Close tab"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

