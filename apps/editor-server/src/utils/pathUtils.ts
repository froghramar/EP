import { resolve, normalize, relative } from 'path';
import { WORKSPACE_ROOT } from '../config';

// Helper function to generate a unique ID from path
export function pathToId(path: string): string {
  return Buffer.from(path).toString('base64url');
}

// Helper function to check if path is safe (within workspace)
export function isSafePath(filePath: string): boolean {
  const resolved = resolve(WORKSPACE_ROOT, normalize(filePath));
  return resolved.startsWith(resolve(WORKSPACE_ROOT));
}

// Convert absolute path to relative path from workspace root
export function toRelativePath(absolutePath: string): string {
  const resolved = resolve(WORKSPACE_ROOT, normalize(absolutePath));
  const relativePath = relative(WORKSPACE_ROOT, resolved);
  // Normalize to use forward slashes for consistency
  return relativePath.replace(/\\/g, '/');
}

