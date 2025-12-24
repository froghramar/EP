import { resolve, normalize } from 'path';
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

