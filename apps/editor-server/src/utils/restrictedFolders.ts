import { normalize, resolve, basename } from 'path';
import { WORKSPACE_ROOT } from '../config';

/**
 * List of restricted top-level folders that cannot be modified via file APIs
 * These folders are hidden from the file explorer and protected from all file operations
 * Users must use dedicated APIs for these folders (e.g., Git API for .git folder)
 */
const RESTRICTED_FOLDERS: string[] = [
  '.git',
  'node_modules',
  '.env',
];

/**
 * Get all restricted folders
 */
export function getRestrictedFolders(): string[] {
  return [...RESTRICTED_FOLDERS];
}

/**
 * Check if a path is within any restricted directory
 */
export function isRestrictedPath(filePath: string): boolean {
  const normalized = normalize(filePath);
  const resolved = resolve(WORKSPACE_ROOT, normalized);
  
  for (const folder of RESTRICTED_FOLDERS) {
    const restrictedDir = resolve(WORKSPACE_ROOT, folder);
    if (resolved === restrictedDir || 
        resolved.startsWith(restrictedDir + '/') || 
        resolved.startsWith(restrictedDir + '\\')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a filename is a restricted folder
 */
export function isRestrictedFolder(filename: string): boolean {
  return RESTRICTED_FOLDERS.includes(filename);
}

/**
 * Get the name of the restricted folder that contains the path (if any)
 */
export function getRestrictedFolderName(filePath: string): string | null {
  const normalized = normalize(filePath);
  const resolved = resolve(WORKSPACE_ROOT, normalized);
  
  for (const folder of RESTRICTED_FOLDERS) {
    const restrictedDir = resolve(WORKSPACE_ROOT, folder);
    if (resolved === restrictedDir || 
        resolved.startsWith(restrictedDir + '/') || 
        resolved.startsWith(restrictedDir + '\\')) {
      return folder;
    }
  }
  
  return null;
}

