import { useState, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { FileDialog } from './FileDialog';

export function GitPanel() {
  const isGitRepository = useEditorStore((state) => state.isGitRepository);
  const gitStatus = useEditorStore((state) => state.gitStatus);
  const gitCommits = useEditorStore((state) => state.gitCommits);
  const isLoading = useEditorStore((state) => state.isLoading);
  const error = useEditorStore((state) => state.error);
  
  const stageFiles = useEditorStore((state) => state.stageFiles);
  const unstageFiles = useEditorStore((state) => state.unstageFiles);
  const commitChanges = useEditorStore((state) => state.commitChanges);
  const discardChanges = useEditorStore((state) => state.discardChanges);
  const refreshGit = useEditorStore((state) => state.refreshGit);
  const pullChanges = useEditorStore((state) => state.pullChanges);
  const pushChanges = useEditorStore((state) => state.pushChanges);
  const checkGitRepository = useEditorStore((state) => state.checkGitRepository);
  const initGitRepository = useEditorStore((state) => state.initGitRepository);
  
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [view, setView] = useState<'changes' | 'history'>('changes');

  useEffect(() => {
    checkGitRepository();
  }, [checkGitRepository]);

  const handleInitRepository = async () => {
    if (confirm('Initialize a new Git repository in this workspace?')) {
      try {
        await initGitRepository();
      } catch (error) {
        // Error handled by store
      }
    }
  };

  if (!isGitRepository) {
    return (
      <div className="h-full bg-[#252526] text-gray-300 flex flex-col items-center justify-center p-4">
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-4">📂</div>
          <div className="text-sm mb-4">Not a git repository</div>
          <button
            onClick={handleInitRepository}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Initializing...' : 'Initialize Repository'}
          </button>
        </div>
      </div>
    );
  }

  const handleStageFile = async (file: string) => {
    try {
      await stageFiles([file]);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleUnstageFile = async (file: string) => {
    try {
      await unstageFiles([file]);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDiscardFile = async (file: string) => {
    if (confirm(`Discard changes in ${file}?`)) {
      try {
        await discardChanges([file]);
      } catch (error) {
        // Error handled by store
      }
    }
  };

  const handleCommit = async (message: string) => {
    try {
      await commitChanges(message);
      setCommitDialogOpen(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const handlePull = async () => {
    try {
      await pullChanges();
    } catch (error) {
      // Error handled by store
    }
  };

  const handlePush = async () => {
    try {
      await pushChanges();
    } catch (error) {
      // Error handled by store
    }
  };

  const handleStageAll = async () => {
    if (changedFiles.length === 0) return;
    try {
      await stageFiles(changedFiles);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleUnstageAll = async () => {
    if (stagedFiles.length === 0) return;
    try {
      await unstageFiles(stagedFiles);
    } catch (error) {
      // Error handled by store
    }
  };

  const stagedFiles = gitStatus?.staged || [];
  
  // Changed files should exclude already staged files
  const allChangedFiles = [
    ...(gitStatus?.modified || []),
    ...(gitStatus?.created || []),
    ...(gitStatus?.deleted || []),
    ...(gitStatus?.not_added || []),
  ];
  
  const changedFiles = allChangedFiles.filter(file => !stagedFiles.includes(file));
  
  const hasChanges = changedFiles.length > 0;
  const hasStagedChanges = stagedFiles.length > 0;

  return (
    <div className="h-full bg-[#252526] text-gray-300 flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Source Control
          </div>
          <button
            onClick={() => refreshGit()}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
            title="Refresh"
          >
            🔄
          </button>
        </div>
        {gitStatus && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-blue-400">📍 {gitStatus.branch}</span>
            {gitStatus.ahead > 0 && (
              <span className="text-green-400">↑{gitStatus.ahead}</span>
            )}
            {gitStatus.behind > 0 && (
              <span className="text-orange-400">↓{gitStatus.behind}</span>
            )}
          </div>
        )}
      </div>

      {/* Tab selector */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setView('changes')}
          className={`flex-1 px-3 py-2 text-sm transition-colors ${
            view === 'changes'
              ? 'bg-gray-700 text-gray-200'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          Changes {hasChanges && `(${changedFiles.length})`}
        </button>
        <button
          onClick={() => setView('history')}
          className={`flex-1 px-3 py-2 text-sm transition-colors ${
            view === 'history'
              ? 'bg-gray-700 text-gray-200'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          History
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 text-red-400 text-xs bg-red-900/20 border-b border-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'changes' ? (
          <div>
            {/* Staged changes */}
            {hasStagedChanges && (
              <div className="mb-4">
                <div className="px-3 py-2 bg-gray-700/30 text-xs font-semibold text-gray-400 flex items-center justify-between">
                  <span>Staged Changes ({stagedFiles.length})</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUnstageAll}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded transition-colors"
                      title="Unstage All"
                    >
                      − All
                    </button>
                    <button
                      onClick={() => setCommitDialogOpen(true)}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Commit
                    </button>
                  </div>
                </div>
                <div>
                  {stagedFiles.map((file) => (
                    <div
                      key={file}
                      className="px-3 py-2 text-sm hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-green-400 text-xs">●</span>
                        <span className="truncate">{file}</span>
                      </div>
                      <button
                        onClick={() => handleUnstageFile(file)}
                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-opacity"
                        title="Unstage"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unstaged changes */}
            {hasChanges && (
              <div>
                <div className="px-3 py-2 bg-gray-700/30 text-xs font-semibold text-gray-400 flex items-center justify-between">
                  <span>Changes ({changedFiles.length})</span>
                  <button
                    onClick={handleStageAll}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded transition-colors"
                    title="Stage All"
                  >
                    + All
                  </button>
                </div>
                <div>
                  {changedFiles.map((file) => {
                    const isDeleted = gitStatus?.deleted.includes(file);
                    const isNew = gitStatus?.created.includes(file) || gitStatus?.not_added.includes(file);
                    
                    return (
                      <div
                        key={file}
                        className="px-3 py-2 text-sm hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`text-xs ${isDeleted ? 'text-red-400' : isNew ? 'text-green-400' : 'text-yellow-400'}`}>
                            {isDeleted ? '−' : isNew ? '+' : '●'}
                          </span>
                          <span className="truncate">{file}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStageFile(file)}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
                            title="Stage"
                          >
                            +
                          </button>
                          {!isNew && (
                            <button
                              onClick={() => handleDiscardFile(file)}
                              className="px-2 py-1 text-xs text-red-400 hover:text-red-300"
                              title="Discard"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!hasChanges && !hasStagedChanges && (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                No changes
              </div>
            )}
          </div>
        ) : (
          <div>
            {gitCommits.length === 0 ? (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                No commits yet
              </div>
            ) : (
              gitCommits.map((commit) => (
                <div
                  key={commit.hash}
                  className="px-3 py-2 border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                >
                  <div className="text-sm text-gray-200 mb-1">{commit.message}</div>
                  <div className="text-xs text-gray-500">
                    {commit.author_name} • {new Date(commit.date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600 font-mono mt-1">
                    {commit.hash.substring(0, 7)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-3 py-2 border-t border-gray-700 flex gap-2">
        <button
          onClick={handlePull}
          disabled={isLoading}
          className="flex-1 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors disabled:opacity-50"
          title="Pull"
        >
          ↓ Pull
        </button>
        <button
          onClick={handlePush}
          disabled={isLoading || !gitStatus || gitStatus.ahead === 0}
          className="flex-1 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors disabled:opacity-50"
          title="Push"
        >
          ↑ Push
        </button>
      </div>

      {/* Commit dialog */}
      {commitDialogOpen && (
        <FileDialog
          isOpen={true}
          onClose={() => setCommitDialogOpen(false)}
          onSubmit={handleCommit}
          title="Commit Changes"
          label="Commit message"
          placeholder="Enter commit message"
          type="textarea"
          validate={(value) => {
            if (!value.trim()) {
              return 'Commit message is required';
            }
            return null;
          }}
        />
      )}
    </div>
  );
}

