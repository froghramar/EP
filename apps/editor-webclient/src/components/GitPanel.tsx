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
  const loadGitCommits = useEditorStore((state) => state.loadGitCommits);
  
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [view, setView] = useState<'changes' | 'history'>('changes');

  useEffect(() => {
    checkGitRepository();
  }, [checkGitRepository]);

  // Load commits when switching to history view or when repo becomes available
  useEffect(() => {
    if (isGitRepository && view === 'history') {
      loadGitCommits();
    }
  }, [isGitRepository, view, loadGitCommits]);

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
      <div className="h-full bg-gradient-to-b from-[#1e1e1e] to-[#252526] text-gray-300 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-red-600/20 flex items-center justify-center">
            <svg style={{width: '48px', height: '48px'}} className="text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-gray-300 mb-2">Not a Git Repository</div>
          <div className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Initialize a git repository to start tracking your project changes
          </div>
          <button
            onClick={handleInitRepository}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Initializing...</span>
              </>
            ) : (
              <>
                <svg style={{width: '18px', height: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Initialize Repository</span>
              </>
            )}
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
    <div className="h-full bg-gradient-to-b from-[#1e1e1e] to-[#252526] text-gray-300 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-[#2d2d30] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <svg style={{width: '16px', height: '16px'}} className="text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-200">Source Control</span>
              {gitStatus && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg style={{width: '16px', height: '16px'}} className="text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span className="text-blue-400 font-medium">{gitStatus.branch}</span>
                  </span>
                  {gitStatus.ahead > 0 && (
                    <span className="flex items-center gap-0.5 text-green-400">
                      <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      {gitStatus.ahead}
                    </span>
                  )}
                  {gitStatus.behind > 0 && (
                    <span className="flex items-center gap-0.5 text-orange-400">
                      <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      {gitStatus.behind}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => refreshGit()}
            className="px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-all"
            title="Refresh git status"
          >
            <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex border-b border-gray-700 bg-[#252526]">
        <button
          onClick={() => setView('changes')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
            view === 'changes'
              ? 'text-blue-400 bg-[#1e1e1e]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg style={{width: '14px', height: '14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Changes
            {hasChanges && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                view === 'changes' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {changedFiles.length}
              </span>
            )}
          </span>
          {view === 'changes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          )}
        </button>
        <button
          onClick={() => setView('history')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
            view === 'history'
              ? 'text-blue-400 bg-[#1e1e1e]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg style={{width: '14px', height: '14px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </span>
          {view === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          )}
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
              <div className="mb-2">
                <div className="px-4 py-2 bg-gradient-to-r from-green-900/30 to-green-800/20 text-xs font-semibold text-green-300 flex items-center justify-between border-b border-green-700/50">
                  <span className="flex items-center gap-2">
                    <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Staged Changes
                    <span className="px-2 py-0.5 bg-green-500/20 rounded-full text-green-300 font-semibold">
                      {stagedFiles.length}
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUnstageAll}
                      className="px-2 py-1 text-xs text-green-300 hover:text-white hover:bg-green-600/30 rounded-md transition-all"
                      title="Unstage All"
                    >
                      <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCommitDialogOpen(true)}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-all font-medium shadow-md"
                    >
                      Commit
                    </button>
                  </div>
                </div>
                <div className="bg-[#1e1e1e]">
                  {stagedFiles.map((file) => (
                    <div
                      key={file}
                      className="px-4 py-2.5 text-sm hover:bg-gray-700/50 transition-all flex items-center justify-between group border-b border-gray-800/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <svg style={{width: '16px', height: '16px'}} className="text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate text-gray-200 font-medium">{file}</span>
                      </div>
                      <button
                        onClick={() => handleUnstageFile(file)}
                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                        title="Unstage file"
                      >
                        <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unstaged changes */}
            {hasChanges && (
              <div>
                <div className="px-4 py-2 bg-gradient-to-r from-yellow-900/30 to-orange-800/20 text-xs font-semibold text-yellow-300 flex items-center justify-between border-b border-yellow-700/50">
                  <span className="flex items-center gap-2">
                    <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Unstaged Changes
                    <span className="px-2 py-0.5 bg-yellow-500/20 rounded-full text-yellow-300 font-semibold">
                      {changedFiles.length}
                    </span>
                  </span>
                  <button
                    onClick={handleStageAll}
                    className="px-3 py-1 text-xs text-yellow-300 hover:text-white hover:bg-yellow-600/30 rounded-md transition-all font-medium"
                    title="Stage All Changes"
                  >
                    <span className="flex items-center gap-1">
                      <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Stage All
                    </span>
                  </button>
                </div>
                <div className="bg-[#1e1e1e]">
                  {changedFiles.map((file) => {
                    const isDeleted = gitStatus?.deleted.includes(file);
                    const isNew = gitStatus?.created.includes(file) || gitStatus?.not_added.includes(file);
                    
                    return (
                      <div
                        key={file}
                        className="px-4 py-2.5 text-sm hover:bg-gray-700/50 transition-all flex items-center justify-between group border-b border-gray-800/50"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isDeleted ? (
                            <svg style={{width: '16px', height: '16px'}} className="text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          ) : isNew ? (
                            <svg style={{width: '16px', height: '16px'}} className="text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          ) : (
                            <svg style={{width: '16px', height: '16px'}} className="text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={`truncate font-medium ${
                            isDeleted ? 'text-red-300 line-through' : isNew ? 'text-green-300' : 'text-gray-200'
                          }`}>{file}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            isDeleted ? 'bg-red-500/20 text-red-300' : 
                            isNew ? 'bg-green-500/20 text-green-300' : 
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {isDeleted ? 'D' : isNew ? 'A' : 'M'}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStageFile(file)}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-all"
                            title="Stage file"
                          >
                            <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          {!isNew && (
                            <button
                              onClick={() => handleDiscardFile(file)}
                              className="px-2 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                              title="Discard changes"
                            >
                              <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
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
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-blue-600/20 flex items-center justify-center mb-4">
                  <svg style={{width: '36px', height: '36px'}} className="text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-base font-semibold text-gray-300 mb-2">All Clean!</div>
                <div className="text-sm text-gray-500">No changes to commit</div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {gitCommits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-600/20 flex items-center justify-center mb-4">
                  <svg style={{width: '36px', height: '36px'}} className="text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-base font-semibold text-gray-300 mb-2">No Commits Yet</div>
                <div className="text-sm text-gray-500">Start making commits to see history</div>
              </div>
            ) : (
              gitCommits.map((commit, index) => (
                <div
                  key={commit.hash}
                  className="px-4 py-3 border-b border-gray-700 hover:bg-gray-700/30 transition-all group relative"
                >
                  {/* Timeline connector */}
                  {index !== gitCommits.length - 1 && (
                    <div className="absolute left-7 top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 to-purple-600/50"></div>
                  )}
                  
                  <div className="flex gap-3">
                    <div className="relative z-10">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <svg style={{width: '12px', height: '12px'}} className="text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 font-medium mb-1.5 leading-snug">
                        {commit.message}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {commit.author_name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(commit.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-1.5 bg-gray-800/50 px-2 py-1 rounded inline-block">
                        {commit.hash.substring(0, 7)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-gray-700 bg-[#2d2d30] flex gap-3 shadow-lg">
        <button
          onClick={handlePull}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          title="Pull changes from remote"
        >
          <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span>Pull</span>
        </button>
        <button
          onClick={handlePush}
          disabled={isLoading || !gitStatus || gitStatus.ahead === 0}
          className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          title="Push changes to remote"
        >
          <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span>Push</span>
          {gitStatus && gitStatus.ahead > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
              {gitStatus.ahead}
            </span>
          )}
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

