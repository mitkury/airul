import * as fs from 'fs/promises';
import * as path from 'path';
import { TEST_BASE_DIR } from './constants';

/**
 * Safely clean up test directories
 * ONLY deletes contents within __test_outputs__ directory
 */
export async function cleanupTestOutputs() {
  try {
    // Extra safety check: ensure we're only deleting within test outputs
    const normalizedPath = path.normalize(TEST_BASE_DIR);
    if (!normalizedPath.includes('__test_outputs__')) {
      throw new Error('Refusing to delete directory not marked as test outputs');
    }

    await fs.rm(TEST_BASE_DIR, { recursive: true, force: true });
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Safely create test directory and ensure it's empty
 * @param testDir Directory to create
 */
export async function createTestDir(testDir: string) {
  // Extra safety check: ensure we're only creating within test outputs
  const normalizedPath = path.normalize(testDir);
  if (!normalizedPath.includes('__test_outputs__')) {
    throw new Error('Refusing to create directory not marked as test outputs');
  }

  // Remove existing directory if it exists
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Create directory and any necessary parent directories
  await fs.mkdir(testDir, { recursive: true });
}
