import simpleGit, { SimpleGit, StatusResult, DiffResult, LogResult } from 'simple-git';
import { WORKSPACE_ROOT } from '../config';
import { existsSync } from 'fs';
import { join } from 'path';

let gitInstance: SimpleGit | null = null;

/**
 * Get or create git instance
 */
export function getGit(): SimpleGit {
  if (!gitInstance) {
    gitInstance = simpleGit(WORKSPACE_ROOT);
  }
  return gitInstance;
}

/**
 * Check if the workspace is a git repository
 */
export async function isGitRepository(): Promise<boolean> {
  try {
    const git = getGit();
    await git.revparse(['--git-dir']);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize a new git repository
 */
export async function initRepository(): Promise<void> {
  const git = getGit();
  await git.init();
}

/**
 * Get git status
 */
export async function getStatus(): Promise<StatusResult> {
  const git = getGit();
  return await git.status();
}

/**
 * Get file diff
 */
export async function getDiff(filePath: string, cached: boolean = false): Promise<string> {
  const git = getGit();
  const options = cached ? ['--cached', filePath] : [filePath];
  return await git.diff(options);
}

/**
 * Stage files
 */
export async function stageFiles(filePaths: string[]): Promise<void> {
  const git = getGit();
  await git.add(filePaths);
}

/**
 * Unstage files
 */
export async function unstageFiles(filePaths: string[]): Promise<void> {
  const git = getGit();
  await git.reset(['HEAD', '--', ...filePaths]);
}

/**
 * Commit changes
 */
export async function commit(message: string): Promise<string> {
  const git = getGit();
  const result = await git.commit(message);
  return result.commit;
}

/**
 * Get commit history
 */
export async function getLog(maxCount: number = 50): Promise<LogResult> {
  const git = getGit();
  return await git.log({ maxCount });
}

/**
 * Get current branch
 */
export async function getCurrentBranch(): Promise<string> {
  const git = getGit();
  const branch = await git.branch();
  return branch.current;
}

/**
 * Get all branches
 */
export async function getBranches(): Promise<{ current: string; all: string[] }> {
  const git = getGit();
  const result = await git.branch();
  return {
    current: result.current,
    all: result.all,
  };
}

/**
 * Checkout branch
 */
export async function checkoutBranch(branchName: string): Promise<void> {
  const git = getGit();
  await git.checkout(branchName);
}

/**
 * Create new branch
 */
export async function createBranch(branchName: string, checkout: boolean = false): Promise<void> {
  const git = getGit();
  if (checkout) {
    await git.checkoutLocalBranch(branchName);
  } else {
    await git.branch([branchName]);
  }
}

/**
 * Pull changes
 */
export async function pull(): Promise<void> {
  const git = getGit();
  await git.pull();
}

/**
 * Push changes
 */
export async function push(branch?: string): Promise<void> {
  const git = getGit();
  if (branch) {
    await git.push('origin', branch);
  } else {
    await git.push();
  }
}

/**
 * Discard changes in file
 */
export async function discardChanges(filePaths: string[]): Promise<void> {
  const git = getGit();
  await git.checkout(['--', ...filePaths]);
}

