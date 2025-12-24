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

