import { cp, stat } from 'fs/promises';

/**
 * Recursively copy a file or directory
 */
export async function copyRecursive(src: string, dest: string): Promise<void> {
  const srcStats = await stat(src);
  
  if (srcStats.isDirectory()) {
    // Use cp with recursive option for directories
    await cp(src, dest, { recursive: true });
  } else {
    // For files, use cp (works for files too)
    await cp(src, dest);
  }
}

