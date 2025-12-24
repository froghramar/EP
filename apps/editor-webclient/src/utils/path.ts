/**
 * Browser-compatible path utilities
 */

export function dirname(path: string): string {
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return lastSlash === -1 ? '.' : path.slice(0, lastSlash);
}

export function basename(path: string): string {
  const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return lastSlash === -1 ? path : path.slice(lastSlash + 1);
}

export function join(...paths: string[]): string {
  if (paths.length === 0) return '.';
  
  let result = paths[0];
  for (let i = 1; i < paths.length; i++) {
    const path = paths[i];
    if (path.startsWith('/') || path.startsWith('\\')) {
      result = path;
    } else if (result === '' || result.endsWith('/') || result.endsWith('\\')) {
      result += path;
    } else {
      result += '/' + path;
    }
  }
  
  // Normalize separators
  return result.replace(/\\/g, '/');
}

/**
 * Normalize a path for comparison (handles both relative and absolute paths)
 */
export function normalizePathForComparison(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
}

/**
 * Check if two paths match (handles both relative and absolute paths)
 */
export function pathsMatch(path1: string, path2: string): boolean {
  const normalized1 = normalizePathForComparison(path1);
  const normalized2 = normalizePathForComparison(path2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // Check if one ends with the other (for absolute vs relative comparison)
  return normalized1.endsWith('/' + normalized2) || normalized2.endsWith('/' + normalized1);
}

