import { mkdir, rm } from 'fs/promises';
import { dirname } from 'path';

/**
 * Create a test directory and any parent directories
 */
export async function createDir(dir: string, mode?: number): Promise<void> {
  await mkdir(dir, { recursive: true, mode });
}

/**
 * Remove a directory and all its contents
 */
export async function removeDir(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.warn(`Warning: Could not remove ${dir}: ${error.message}`);
    }
  }
}

/**
 * Clean up test output directory before/after tests
 */
export async function cleanupTestDir(dir: string): Promise<void> {
  await removeDir(dir);
  await createDir(dir);
}
