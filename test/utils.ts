import { mkdir, rm, copyFile as fsCopyFile, readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';

/**
 * Create a test directory and any parent directories
 */
export async function createDir(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
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
 * Copy a file from source to destination
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await createDir(dirname(dest));
  try {
    const content = await readFile(src, 'utf8');
    await writeFile(dest, content, 'utf8');
  } catch (error: any) {
    console.warn(`Warning: Could not copy ${src} to ${dest}: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up test output directory before/after tests
 */
export async function cleanupTestDir(dir: string): Promise<void> {
  try {
    // First try to remove the directory and all its contents
    await rm(dir, { recursive: true, force: true });
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.warn(`Warning: Could not remove ${dir}: ${error.message}`);
    }
  }

  // Wait a bit to ensure the directory is fully removed
  await new Promise(resolve => setTimeout(resolve, 100));

  // Create a fresh directory
  await createDir(dir);

  // Wait a bit to ensure the directory is fully created
  await new Promise(resolve => setTimeout(resolve, 100));
}
